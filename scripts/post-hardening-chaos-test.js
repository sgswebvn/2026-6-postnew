import dotenv from 'dotenv';
import mongoose from 'mongoose';
import express from 'express';
import apiRouter from '../server/routes/api.js';
import { Staff } from '../server/models/Staff.js';
import { Post } from '../server/models/Post.js';
import { hashPassword, verifyPassword, generateToken, verifyToken } from '../server/auth.js';
import fs from 'fs';
import path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mmltqgekvpdnezqdavvc.supabase.co';
const BUCKET_NAME = 'postnew';
const MONGODB_URI = process.env.MONGODB_URI;

const timestamp = Date.now();
const TEST_SLUG = `hardened-chaos-test-${timestamp}`;
const TEST_TITLE = `HARDENED_CHAOS_TEST_${timestamp}`;

const results = [];

function logResult(id, name, result, details) {
  results.push({ id, name, result, details });
  const icon = result === 'PASS' ? '✅' : '❌';
  console.log(`${icon} [${result}] ${id}: ${name} -> ${details}`);
}

async function runPostHardeningAudit() {
  console.log('====================================================');
  console.log('🛡️ POST-HARDENING RUNTIME CHAOS & SECURITY AUDIT');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('====================================================\n');

  // 1. Connect MongoDB
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected to MongoDB Atlas.\n');

  // 2. Start local test express server with apiRouter
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);
  const server = app.listen(4999);
  const LOCAL_API = 'http://localhost:4999/api';

  try {
    // ----------------------------------------------------
    // TEST 1: UNAUTHORIZED API MUTATIONS BLOCKED (401)
    // ----------------------------------------------------
    console.log('--- TEST 1: Attack Test - Anonymous Mutations ---');
    const anonPostRes = await fetch(`${LOCAL_API}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Hacked Post', content: 'Should fail' })
    });
    const anonPostOk = anonPostRes.status === 401;

    const anonStaffRes = await fetch(`${LOCAL_API}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacked Staff', username: 'hacked' })
    });
    const anonStaffOk = anonStaffRes.status === 401;

    const anonDelRes = await fetch(`${LOCAL_API}/posts/some-id`, { method: 'DELETE' });
    const anonDelOk = anonDelRes.status === 401;

    if (anonPostOk && anonStaffOk && anonDelOk) {
      logResult('SEC-01', 'Anonymous API Access Control', 'PASS', 'All anonymous mutation attempts rejected with 401 Unauthorized.');
    } else {
      logResult('SEC-01', 'Anonymous API Access Control', 'FAIL', `Anonymous requests accepted! Statuses: POST post=${anonPostRes.status}, POST staff=${anonStaffRes.status}, DEL=${anonDelRes.status}`);
    }

    // ----------------------------------------------------
    // TEST 2: AUTHENTICATED LOGIN & JWT ISSUANCE
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Scrypt Auth & JWT Token Issuance ---');
    const loginRes = await fetch(`${LOCAL_API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    const adminToken = loginData.token;
    const hasValidToken = Boolean(adminToken && verifyToken(adminToken));

    if (loginRes.ok && hasValidToken && loginData.user && !loginData.user.password && !loginData.user.passwordHash) {
      logResult('SEC-02', 'Scrypt Authentication & JWT Issuance', 'PASS', `Token generated successfully. User data sanitized (role: ${loginData.user.role}).`);
    } else {
      logResult('SEC-02', 'Scrypt Authentication & JWT Issuance', 'FAIL', `Login failed or token invalid: ${JSON.stringify(loginData)}`);
    }

    // ----------------------------------------------------
    // TEST 3: RBAC FORBIDDEN CHECK (403)
    // ----------------------------------------------------
    console.log('\n--- TEST 3: RBAC Role-Based Access Control ---');
    const editorToken = generateToken({ id: 'editor-1', username: 'minh', name: 'Minh', role: 'editor' });
    
    // Editor attempting to delete staff (Admin only)
    const editorDelStaffRes = await fetch(`${LOCAL_API}/staff/some-staff`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${editorToken}` }
    });

    // Editor attempting to update site settings (Admin only)
    const editorUpdateSettingsRes = await fetch(`${LOCAL_API}/settings`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${editorToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteName: 'Hacked Site' })
    });

    if (editorDelStaffRes.status === 403 && editorUpdateSettingsRes.status === 403) {
      logResult('SEC-03', 'RBAC Privilege Enforcement', 'PASS', 'Editor forbidden from Admin-only endpoints with 403 Forbidden.');
    } else {
      logResult('SEC-03', 'RBAC Privilege Enforcement', 'FAIL', `Privilege escalation possible! Statuses: DelStaff=${editorDelStaffRes.status}, Settings=${editorUpdateSettingsRes.status}`);
    }

    // ----------------------------------------------------
    // TEST 4: AUTHENTICATED CREATE POST (MONGODB + CDN)
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Authenticated Post Creation ---');
    const createPostRes = await fetch(`${LOCAL_API}/posts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `post-${timestamp}`,
        title: TEST_TITLE,
        slug: TEST_SLUG,
        excerpt: 'Hardened chaos test excerpt',
        content: '<p>Hardened post content</p>',
        status: 'published'
      })
    });
    const createdPost = await createPostRes.json();

    // Verify directly in MongoDB Atlas
    const postInMongo = await Post.findOne({ slug: TEST_SLUG });
    
    // Verify on Supabase CDN
    const cdnCheck = await fetch(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/posts/${TEST_SLUG}.json?t=${Date.now()}`);

    if (createPostRes.status === 201 && postInMongo && postInMongo.slug === TEST_SLUG && cdnCheck.ok) {
      logResult('DB-01', 'Authenticated Create Post Persistence', 'PASS', `Post ${TEST_SLUG} verified in MongoDB Atlas and Supabase CDN.`);
    } else {
      logResult('DB-01', 'Authenticated Create Post Persistence', 'FAIL', `Create failed. Status: ${createPostRes.status}, Mongo: ${Boolean(postInMongo)}, CDN: ${cdnCheck.status}`);
    }

    // ----------------------------------------------------
    // TEST 5: AUTHENTICATED UPDATE POST
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Authenticated Post Update ---');
    const updateTitle = `${TEST_TITLE}_MODIFIED`;
    const updateRes = await fetch(`${LOCAL_API}/posts/${TEST_SLUG}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: updateTitle })
    });

    const updatedInMongo = await Post.findOne({ slug: TEST_SLUG });
    if (updateRes.ok && updatedInMongo && updatedInMongo.title === updateTitle) {
      logResult('DB-02', 'Authenticated Update Post Persistence', 'PASS', `Post updated to "${updateTitle}" in MongoDB Atlas.`);
    } else {
      logResult('DB-02', 'Authenticated Update Post Persistence', 'FAIL', 'Update failed in MongoDB.');
    }

    // ----------------------------------------------------
    // TEST 6: AUTHENTICATED DELETE POST
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Authenticated Post Delete ---');
    const deleteRes = await fetch(`${LOCAL_API}/posts/${TEST_SLUG}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const deletedInMongo = await Post.findOne({ slug: TEST_SLUG });
    if (deleteRes.status === 204 && !deletedInMongo) {
      logResult('DB-03', 'Authenticated Delete Post Persistence', 'PASS', 'Post cleanly deleted from MongoDB (null returned).');
    } else {
      logResult('DB-03', 'Authenticated Delete Post Persistence', 'FAIL', 'Delete failed in MongoDB.');
    }

    // ----------------------------------------------------
    // TEST 7: PUBLIC STAFF MANIFEST SANITIZATION
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Public CDN Credential Audit ---');
    const cdnStaffRes = await fetch(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/staff_manifest.json?t=${Date.now()}`);
    const cdnStaffList = await cdnStaffRes.json();
    let hasLeakedPasswords = false;
    let hasLeakedSalary = false;

    if (Array.isArray(cdnStaffList)) {
      for (const s of cdnStaffList) {
        if (s.password || s.passwordHash || s.salt) hasLeakedPasswords = true;
        if (s.salary) hasLeakedSalary = true;
      }
    }

    if (!hasLeakedPasswords && !hasLeakedSalary && cdnStaffList.length > 0) {
      logResult('SEC-04', 'Public CDN Credential Sanitization', 'PASS', `Scanned ${cdnStaffList.length} staff records on public CDN: Zero passwords, zero password hashes, zero salaries found.`);
    } else {
      logResult('SEC-04', 'Public CDN Credential Sanitization', 'FAIL', `Sensitive data still on public CDN! hasPass: ${hasLeakedPasswords}, hasSalary: ${hasLeakedSalary}`);
    }

    // ----------------------------------------------------
    // TEST 8: FRONTEND JS BUNDLE SECRET SCAN
    // ----------------------------------------------------
    console.log('\n--- TEST 8: Production JS Bundle Secret Scan ---');
    const distFiles = fs.readdirSync(path.resolve('dist/assets')).filter(f => f.endsWith('.js'));
    let foundSecretInBundle = false;

    for (const f of distFiles) {
      const content = fs.readFileSync(path.resolve('dist/assets', f), 'utf-8');
      if (content.includes('service_role') || content.includes('sb_secret') || content.includes('q_cgtmcVGrBeD8eCuov4xHzl4Lahy5bJIAlsZ8Y_ZUo')) {
        foundSecretInBundle = true;
        console.error(`Found secret in file: ${f}`);
      }
    }

    if (!foundSecretInBundle) {
      logResult('SEC-05', 'Frontend Bundle Secret Scan', 'PASS', `Scanned ${distFiles.length} JS bundle files in dist/assets: ZERO secrets, tokens, or Service Role keys.`);
    } else {
      logResult('SEC-05', 'Frontend Bundle Secret Scan', 'FAIL', 'Found hardcoded secret in production bundle!');
    }

  } finally {
    server.close();
    await mongoose.disconnect();
  }

  console.log('\n====================================================');
  console.log('🏆 ALL POST-HARDENING TESTS FINISHED');
  console.log('====================================================');
  return results;
}

runPostHardeningAudit().catch(console.error);
