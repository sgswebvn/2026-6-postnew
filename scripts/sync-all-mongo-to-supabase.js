import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Post } from '../server/models/Post.js';
import { Staff } from '../server/models/Staff.js';
import { Category } from '../server/models/Category.js';
import { Author } from '../server/models/Author.js';
import { sanitizeStaffForPublic } from '../server/auth.js';

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mmltqgekvpdnezqdavvc.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}
const BUCKET_NAME = 'postnew';

async function uploadToSupabase(filePath, contentObj) {
  const fileBuffer = Buffer.from(JSON.stringify(contentObj, null, 2), 'utf-8');
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filePath}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Content-Type': 'application/json',
      'x-upsert': 'true'
    },
    body: fileBuffer
  });
  return res.ok;
}

async function syncAll() {
  console.log('🚀 Starting Full MongoDB to Supabase CDN Synchronization...');
  await mongoose.connect(process.env.MONGODB_URI);

  // 1. Posts
  const allPosts = await Post.find().sort({ createdAt: -1 });
  console.log(`Found ${allPosts.length} posts in MongoDB Atlas.`);
  
  // Upload manifest
  const manifest = allPosts.map(p => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    categoryId: p.categoryId,
    category: p.category,
    authorName: p.authorName,
    createdByName: p.createdByName,
    createdById: p.createdById,
    publishedAt: p.publishedAt || p.createdAt || p.date,
    status: p.status || 'published',
    views: p.views || 0,
    enableAds: p.enableAds !== false
  }));
  await uploadToSupabase('posts_manifest.json', manifest);
  console.log('✅ Uploaded posts_manifest.json to Supabase CDN.');

  // Upload individual posts
  let uploadedCount = 0;
  for (const post of allPosts) {
    const ok = await uploadToSupabase(`posts/${post.slug}.json`, post);
    if (ok) uploadedCount++;
  }
  console.log(`✅ Uploaded ${uploadedCount}/${allPosts.length} individual post JSON files to Supabase CDN.`);

  // 2. Staff
  const allStaff = await Staff.find().sort({ createdAt: 1 });
  const sanitizedStaff = allStaff.map(s => sanitizeStaffForPublic(s));
  await uploadToSupabase('staff_manifest.json', sanitizedStaff);
  console.log(`✅ Uploaded ${sanitizedStaff.length} sanitized staff records to staff_manifest.json.`);

  // 3. Categories
  const allCategories = await Category.find();
  if (allCategories && allCategories.length > 0) {
    await uploadToSupabase('categories_manifest.json', allCategories);
    console.log(`✅ Uploaded ${allCategories.length} categories to categories_manifest.json.`);
  }

  // 4. Authors
  const allAuthors = await Author.find();
  if (allAuthors && allAuthors.length > 0) {
    await uploadToSupabase('authors_manifest.json', allAuthors);
    console.log(`✅ Uploaded ${allAuthors.length} authors to authors_manifest.json.`);
  }

  await mongoose.disconnect();
  console.log('\n🎉 FULL MONGODB TO SUPABASE SYNC COMPLETED 100%!');
}

syncAll().catch(console.error);
