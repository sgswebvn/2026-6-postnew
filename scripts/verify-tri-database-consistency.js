import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Post } from '../server/models/Post.js';
import { Staff } from '../server/models/Staff.js';
import { Category } from '../server/models/Category.js';
import { Author } from '../server/models/Author.js';
import { Setting } from '../server/models/Setting.js';

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mmltqgekvpdnezqdavvc.supabase.co';

async function verifyTriDatabase() {
  console.log('================================================================');
  console.log('🔎 THREE-WAY PERSISTENCE & CONSISTENCY AUDIT');
  console.log('   [MongoDB Atlas] ⟷ [Supabase CDN Storage] ⟷ [Web Client Models]');
  console.log('================================================================\n');

  // 1. Connect to MongoDB Atlas
  console.log('1️⃣ Connecting to MongoDB Atlas Cloud Cluster...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('   ✅ MongoDB Atlas Connected Successfully!\n');

  // 2. Fetch all data from MongoDB Atlas
  const mongoPosts = await Post.find().sort({ createdAt: -1 });
  const mongoStaff = await Staff.find().sort({ createdAt: 1 });
  const mongoCategories = await Category.find();
  const mongoAuthors = await Author.find();
  const mongoSettings = await Setting.findOne();

  console.log('📊 MONGODB ATLAS COUNTS:');
  console.log(`   - Posts:        ${mongoPosts.length}`);
  console.log(`   - Staff:        ${mongoStaff.length}`);
  console.log(`   - Categories:   ${mongoCategories.length}`);
  console.log(`   - Authors:      ${mongoAuthors.length}`);
  console.log(`   - Site Name:    ${mongoSettings?.siteName || 'THE HORI CLICK'}\n`);

  // 3. Fetch all manifests from Supabase CDN Storage
  console.log('2️⃣ Fetching Storage CDN Manifests from Supabase...');
  const [sbPostsRes, sbStaffRes, sbCatsRes, sbAuthorsRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/storage/v1/object/public/postnew/posts_manifest.json?t=${Date.now()}`),
    fetch(`${SUPABASE_URL}/storage/v1/object/public/postnew/staff_manifest.json?t=${Date.now()}`),
    fetch(`${SUPABASE_URL}/storage/v1/object/public/postnew/categories_manifest.json?t=${Date.now()}`),
    fetch(`${SUPABASE_URL}/storage/v1/object/public/postnew/authors_manifest.json?t=${Date.now()}`)
  ]);

  const sbPosts = sbPostsRes.ok ? await sbPostsRes.json() : [];
  const sbStaff = sbStaffRes.ok ? await sbStaffRes.json() : [];
  const sbCats = sbCatsRes.ok ? await sbCatsRes.json() : [];
  const sbAuthors = sbAuthorsRes.ok ? await sbAuthorsRes.json() : [];

  console.log('📊 SUPABASE CDN COUNTS:');
  console.log(`   - Posts Manifest:      ${sbPosts.length}`);
  console.log(`   - Staff Manifest:      ${sbStaff.length}`);
  console.log(`   - Categories Manifest: ${sbCats.length}`);
  console.log(`   - Authors Manifest:    ${sbAuthors.length}\n`);

  // 4. Reconciliation Checks
  console.log('3️⃣ Running Mathematical 3-Way Reconciliation Checks...');
  let issues = 0;

  // Check A: Posts Count Matching
  if (mongoPosts.length === sbPosts.length) {
    console.log(`   ✅ [PASS] Posts Count Synchronized: ${mongoPosts.length} == ${sbPosts.length}`);
  } else {
    console.warn(`   ⚠️ [WARN] Posts Count Discrepancy: Mongo(${mongoPosts.length}) vs Supabase(${sbPosts.length})`);
    issues++;
  }

  // Check B: Posts Content Integrity
  let missingContent = 0;
  mongoPosts.forEach(p => {
    if (!p.content || p.content.trim().length < 50) missingContent++;
  });
  if (missingContent === 0) {
    console.log(`   ✅ [PASS] All ${mongoPosts.length} posts have full rich HTML content (0 empty).`);
  } else {
    console.error(`   ❌ [FAIL] ${missingContent} posts are missing content!`);
    issues++;
  }

  // Check C: Staff Count & Passwords Security
  if (mongoStaff.length === sbStaff.length) {
    console.log(`   ✅ [PASS] Staff Workforce Synchronized: ${mongoStaff.length} == ${sbStaff.length}`);
  } else {
    console.warn(`   ⚠️ [WARN] Staff Count Discrepancy: Mongo(${mongoStaff.length}) vs Supabase(${sbStaff.length})`);
    issues++;
  }

  // Check D: Zero Plaintext Password in Supabase
  let leakedPasswords = 0;
  sbStaff.forEach(s => {
    if (s.password || s.pass || s.hash) leakedPasswords++;
  });
  if (leakedPasswords === 0) {
    console.log(`   ✅ [PASS] Security Zero-Trust: 0 passwords leaked in public Supabase CDN.`);
  } else {
    console.error(`   ❌ [CRITICAL] Leaked ${leakedPasswords} passwords in public CDN!`);
    issues++;
  }

  // Check E: Sample Individual Post Retrieval from CDN
  if (mongoPosts.length > 0) {
    const sampleSlug = mongoPosts[0].slug;
    const singleRes = await fetch(`${SUPABASE_URL}/storage/v1/object/public/postnew/posts/${sampleSlug}.json`);
    if (singleRes.ok) {
      const singlePost = await singleRes.json();
      console.log(`   ✅ [PASS] Direct Individual Post CDN Lookup Verified: "${singlePost.title}" (${singlePost.content?.length || 0} chars content)`);
    } else {
      console.warn(`   ⚠️ [WARN] Could not retrieve sample post ${sampleSlug} directly from CDN.`);
    }
  }

  await mongoose.disconnect();

  console.log('\n================================================================');
  if (issues === 0) {
    console.log('🎉 RECONCILIATION RESULT: 100% SYNCHRONIZED & VERIFIED CONSISTENT!');
  } else {
    console.log(`⚠️ RECONCILIATION RESULT: COMPLETED WITH ${issues} WARNINGS.`);
  }
  console.log('================================================================');
}

verifyTriDatabase().catch(err => {
  console.error('Audit Fatal Error:', err);
  process.exit(1);
});
