import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Staff } from '../server/models/Staff.js';
import { hashPassword, sanitizeStaffForPublic } from '../server/auth.js';
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mmltqgekvpdnezqdavvc.supabase.co';
const SUPABASE_SERVICE_ROLE = process.env.NEXT_ROLE || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tbHRxZ2VrdnBkbmV6cWRhdnZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzkzMDY3NywiZXhwIjoyMTAzNTA2Njc3fQ.q_cgtmcVGrBeD8eCuov4xHzl4Lahy5bJIAlsZ8Y_ZUo';

async function sanitizeDatabaseAndCdn() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  const allStaff = await Staff.find();
  console.log('Found', allStaff.length, 'staff in MongoDB.');

  // Hash any plaintext passwords in MongoDB
  for (const s of allStaff) {
    if (s.password && !s.password.includes(':')) {
      const hashed = hashPassword(s.password);
      await Staff.updateOne({ id: s.id }, { $set: { password: hashed } });
      console.log('Upgraded password to Scrypt hash for:', s.username);
    }
  }

  // Push 100% sanitized staff manifest to Supabase CDN
  const refreshedStaff = await Staff.find();
  const sanitizedForPublic = refreshedStaff.map(s => sanitizeStaffForPublic(s));

  const uploadRes = await fetch(SUPABASE_URL + '/storage/v1/object/postnew/staff_manifest.json', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + SUPABASE_SERVICE_ROLE,
      'apikey': SUPABASE_SERVICE_ROLE,
      'Content-Type': 'application/json',
      'x-upsert': 'true'
    },
    body: JSON.stringify(sanitizedForPublic)
  });

  console.log('Supabase staff_manifest.json upload status:', uploadRes.status);
  
  // Verify public endpoint
  const checkRes = await fetch(SUPABASE_URL + '/storage/v1/object/public/postnew/staff_manifest.json?t=' + Date.now());
  const publicData = await checkRes.json();
  console.log('Public manifest entries:', publicData.length);
  const sample = publicData[0];
  console.log('Sample public staff record keys:', Object.keys(sample));
  console.log('Has password field?:', 'password' in sample);
  console.log('Has passwordHash field?:', 'passwordHash' in sample);
  console.log('Has salary field?:', 'salary' in sample);

  await mongoose.disconnect();
}
sanitizeDatabaseAndCdn().catch(console.error);
