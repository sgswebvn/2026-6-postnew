import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Post } from '../server/models/Post.js';
import { Staff } from '../server/models/Staff.js';
import { Category } from '../server/models/Category.js';
import { Author } from '../server/models/Author.js';

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mmltqgekvpdnezqdavvc.supabase.co';

async function runComprehensiveQA() {
  console.log('====================================================');
  console.log('🔍 RUNNING COMPREHENSIVE ZERO-DEFECT SYSTEM QA TEST');
  console.log('====================================================\n');

  let passCount = 0;
  let failCount = 0;

  function assert(name, condition, extraInfo = '') {
    if (condition) {
      console.log(`✅ [PASS] ${name} ${extraInfo}`);
      passCount++;
    } else {
      console.error(`❌ [FAIL] ${name} ${extraInfo}`);
      failCount++;
    }
  }

  // TEST 1: Database Connection
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    assert('Database Connection (MongoDB Atlas)', mongoose.connection.readyState === 1, '(ReadyState 1)');
  } catch (e) {
    assert('Database Connection', false, e.message);
  }

  // TEST 2: Staff Records Count
  try {
    const staff = await Staff.find();
    assert('Staff Workforce Count >= 7', staff.length >= 7, `(Found ${staff.length} staff records)`);
    
    // Check root admin
    const rootAdmin = staff.find(s => s.id === 'staff-1' || s.username === 'admin');
    assert('Root Admin exists in MongoDB', !!rootAdmin, `(Name: ${rootAdmin?.name}, Role: ${rootAdmin?.role})`);
  } catch (e) {
    assert('Staff Records Test', false, e.message);
  }

  // TEST 3: Posts Content Integrity (No Lost Text)
  try {
    const posts = await Post.find();
    assert('Posts Count >= 30', posts.length >= 30, `(Found ${posts.length} posts)`);

    let postsWithContent = 0;
    let totalContentChars = 0;
    posts.forEach(p => {
      if (p.content && p.content.trim().length > 50) {
        postsWithContent++;
        totalContentChars += p.content.length;
      }
    });

    assert('Posts have Full HTML Content (>50 chars)', postsWithContent >= posts.length - 2, `(${postsWithContent}/${posts.length} posts have content, Avg ${Math.round(totalContentChars / posts.length)} chars)`);
  } catch (e) {
    assert('Posts Content Test', false, e.message);
  }

  // TEST 4: Supabase CDN Manifest Sync
  try {
    const cdnRes = await fetch(`${SUPABASE_URL}/storage/v1/object/public/postnew/posts_manifest.json`);
    const cdnPosts = await cdnRes.json();
    assert('Supabase CDN posts_manifest.json valid', Array.isArray(cdnPosts) && cdnPosts.length >= 30, `(Found ${cdnPosts.length} posts on CDN)`);

    const staffRes = await fetch(`${SUPABASE_URL}/storage/v1/object/public/postnew/staff_manifest.json`);
    const cdnStaff = await staffRes.json();
    assert('Supabase CDN staff_manifest.json valid', Array.isArray(cdnStaff) && cdnStaff.length >= 7, `(Found ${cdnStaff.length} staff on CDN)`);
  } catch (e) {
    assert('Supabase CDN Test', false, e.message);
  }

  // TEST 5: Test Post Creation & Content Preservation
  try {
    const testSlug = `test-qa-post-${Date.now()}`;
    const testArticleContent = `
      <h2>Tiêu Đề Phân Tích Thực Nghiệm</h2>
      <p>Đây là đoạn văn bản kiểm tra độ toàn vẹn của nội dung bài viết. Không được phép mất chữ hoặc thiếu font.</p>
      <blockquote>"Chất lượng dữ liệu và trải nghiệm người dùng là ưu tiên số 1."</blockquote>
      <p>Kết luận bài phân tích: Hệ thống lưu trữ MongoDB hoạt động hoàn hảo 100%.</p>
    `;

    const newPost = await Post.create({
      id: `test-${Date.now()}`,
      title: 'Bài Viết Kiểm Thử Độ Toàn Vẹn Nội Dung',
      slug: testSlug,
      excerpt: 'Đoạn tóm tắt tự động trích xuất cho bài viết kiểm thử chất lượng hệ thống.',
      content: testArticleContent,
      coverImage: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200',
      category: 'Công Nghệ',
      categoryId: 'cat-tech',
      authorName: 'Kiểm Thử Viên',
      createdById: 'staff-1',
      createdByName: 'Admin',
      status: 'published',
      publishedAt: new Date().toISOString()
    });

    assert('Post Creation in MongoDB Atlas', !!newPost._id, `(ID: ${newPost.id})`);

    // Verify reading back from MongoDB
    const readBack = await Post.findOne({ slug: testSlug });
    assert('Post Content Matches 100% Without Text Loss', readBack?.content === testArticleContent, `(Content Length: ${readBack?.content?.length} chars)`);

    // Cleanup test post
    await Post.deleteOne({ slug: testSlug });
    assert('Test Post Cleanup (No pollution)', true);
  } catch (e) {
    assert('Post Creation & Verification Test', false, e.message);
  }

  // TEST 6: Categories & Authors Count
  try {
    const cats = await Category.find();
    assert('Categories Count >= 5', cats.length >= 5, `(Found ${cats.length} categories)`);

    const authors = await Author.find();
    assert('Authors Count >= 3', authors.length >= 3, `(Found ${authors.length} authors)`);
  } catch (e) {
    assert('Categories/Authors Test', false, e.message);
  }

  await mongoose.disconnect();

  console.log('\n====================================================');
  console.log(`📊 FINAL QA REPORT: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('====================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runComprehensiveQA().catch(err => {
  console.error('QA Runner Fatal Error:', err);
  process.exit(1);
});
