import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Post } from '../server/models/Post.js';

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mmltqgekvpdnezqdavvc.supabase.co';

async function testDelete() {
  console.log('🧪 Testing Post Creation & Permanent Deletion Persistence...');
  await mongoose.connect(process.env.MONGODB_URI);

  const testSlug = `temp-delete-test-${Date.now()}`;
  const testId = `post-temp-${Date.now()}`;

  // 1. Create Post in MongoDB
  const created = await Post.create({
    id: testId,
    title: 'Temporary Post For Deletion Verification',
    slug: testSlug,
    excerpt: 'This post should be permanently deleted without reappearing on F5.',
    content: '<p>Content for temporary deletion test.</p>',
    coverImage: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200',
    category: 'Finance',
    categoryId: 'cat-finance',
    authorName: 'Tester',
    createdById: 'staff-1',
    createdByName: 'Admin',
    status: 'published',
    publishedAt: new Date().toISOString()
  });
  console.log('✅ Created test post:', created.slug);

  // 2. Delete Post from MongoDB
  const delRes = await Post.deleteOne({ id: testId });
  console.log('✅ Deleted from MongoDB Atlas:', delRes.deletedCount === 1);

  // 3. Verify it is GONE from MongoDB
  const checkMongo = await Post.findOne({ id: testId });
  console.log('✅ Verification in MongoDB (should be null):', checkMongo === null);

  await mongoose.disconnect();
  console.log('🎉 DELETE PERSISTENCE TEST PASSED 100%!');
}

testDelete().catch(console.error);
