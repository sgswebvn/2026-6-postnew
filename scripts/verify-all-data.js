import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Staff } from '../server/models/Staff.js';
import { Post } from '../server/models/Post.js';

dotenv.config();

async function verifyAll() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('--- 1. STAFF MANAGEMENT VERIFICATION ---');
  const allStaff = await Staff.find().sort({ createdAt: 1 });
  console.log(`Found ${allStaff.length} staff members in MongoDB Atlas:`);
  allStaff.forEach((s, idx) => {
    console.log(`  [${idx + 1}] ID: ${s.id} | Name: ${s.name} | Role: ${s.role} | Ref: ${s.refCode || 'N/A'} | Email: ${s.email}`);
  });

  console.log('\n--- 2. POST PUBLISH DATES VERIFICATION ---');
  const samplePosts = await Post.find().limit(5);
  samplePosts.forEach((p, idx) => {
    console.log(`  [${idx + 1}] Title: ${p.title.slice(0, 30)}... | Date: ${p.publishedAt || p.createdAt || p.date}`);
  });

  await mongoose.disconnect();
  console.log('\n✅ Verification Completed.');
}

verifyAll().catch(console.error);
