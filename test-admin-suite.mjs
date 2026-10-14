import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:5000';

async function runTestSuite() {
  console.log('=====================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN ADMIN & DATABASE BLOGWEB');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Health check
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    assert(res.ok && data.status === 'online', 'Health endpoint returns status: online');
  } catch (err) {
    assert(false, `Health check failed: ${err.message}`);
  }

  // 2. Public API - Articles count
  try {
    const res = await fetch(`${BASE_URL}/api/posts?limit=10`);
    const data = await res.json();
    assert(res.ok && data.total === 30, `Public posts endpoint returns 30 real articles from MongoDB (total: ${data.total})`);
    assert(data.posts.length > 0 && !!data.posts[0].title, 'First article has valid title: "' + data.posts[0].title.slice(0, 30) + '..."');
  } catch (err) {
    assert(false, `Public posts check failed: ${err.message}`);
  }

  // 3. Public API - Article Details by Slug
  try {
    const listRes = await fetch(`${BASE_URL}/api/posts?limit=1`);
    const listData = await listRes.json();
    const slug = listData.posts[0].slug;

    const detailRes = await fetch(`${BASE_URL}/api/posts/${slug}`);
    const detailData = await detailRes.json();
    assert(detailRes.ok && detailData.post.slug === slug, `Public article detail loads correctly by slug "/${slug}"`);
    assert(detailData.post.content && detailData.post.content.length > 20, 'Article contains full body content from database');
  } catch (err) {
    assert(false, `Article detail check failed: ${err.message}`);
  }

  // 4. Public API - Categories
  try {
    const res = await fetch(`${BASE_URL}/api/categories`);
    const data = await res.json();
    assert(res.ok && Array.isArray(data) && data.length >= 7, `Categories endpoint returns ${data.length} taxonomies matching posts`);
  } catch (err) {
    assert(false, `Categories check failed: ${err.message}`);
  }

  // 5. Auth Security - Invalid Login
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrongpassword' })
    });
    assert(res.status === 401, 'Invalid password is rejected with HTTP 401 Unauthorized');
  } catch (err) {
    assert(false, `Invalid login test failed: ${err.message}`);
  }

  // 6. Auth Security - Valid Admin Login
  let adminToken = '';
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const data = await res.json();
    assert(res.ok && !!data.token, 'Valid admin login succeeds with JWT Bearer Token');
    assert(data.user && data.user.role === 'admin', 'Authenticated user has admin role');
    assert(!data.user.password, 'User password is strictly excluded from API response (No leak)');
    adminToken = data.token;
  } catch (err) {
    assert(false, `Valid login test failed: ${err.message}`);
  }

  // 7. Security - Protected Route without token
  try {
    const res = await fetch(`${BASE_URL}/api/admin/stats`);
    assert(res.status === 401, 'Accessing /api/admin/stats without token returns HTTP 401 Unauthorized');
  } catch (err) {
    assert(false, `Protected route test failed: ${err.message}`);
  }

  // 8. Admin Overview Stats
  try {
    const res = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(res.ok && data.totalPosts === 30, `Admin stats returns real MongoDB post count: ${data.totalPosts}`);
    assert(data.dbConnected === true, 'Database connection status is healthy & connected');
    assert(typeof data.totalViews === 'number' && data.totalViews > 0, `Total article views telemetry calculated: ${data.totalViews.toLocaleString()}`);
  } catch (err) {
    assert(false, `Admin stats test failed: ${err.message}`);
  }

  // 9. Post CRUD Test - Create, Read, Update, Delete in MongoDB Atlas
  let testPostId = '';
  const testSlug = `automated-test-article-${Date.now()}`;
  try {
    // A. Create Post
    const createRes = await fetch(`${BASE_URL}/api/admin/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Automated Test Article for QA Validation',
        slug: testSlug,
        excerpt: 'This is a test summary for system verification.',
        content: 'Full automated content verification body text.',
        categoryId: 'cat-tech',
        status: 'published'
      })
    });
    const createData = await createRes.json();
    assert(createRes.status === 201 && createData.post?.slug === testSlug, 'Admin can create a new post in MongoDB Atlas');
    testPostId = createData.post?.id;

    // B. Read Post
    const readRes = await fetch(`${BASE_URL}/api/admin/posts/${testPostId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const readData = await readRes.json();
    assert(readRes.ok && readData.id === testPostId, 'Admin can read created post by ID');

    // C. Update Post
    const updateRes = await fetch(`${BASE_URL}/api/admin/posts/${testPostId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Updated Test Article Title',
        status: 'draft'
      })
    });
    const updateData = await updateRes.json();
    assert(updateRes.ok && updateData.post?.title === 'Updated Test Article Title' && updateData.post?.status === 'draft', 'Admin can update post title and switch to draft status');

    // D. Delete Post
    const deleteRes = await fetch(`${BASE_URL}/api/admin/posts/${testPostId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(deleteRes.ok, 'Admin can permanently delete test post from MongoDB');

    // E. Verify post no longer exists
    const verifyRes = await fetch(`${BASE_URL}/api/admin/posts/${testPostId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(verifyRes.status === 404, 'Verified deleted post returns HTTP 404 Not Found (Clean cleanup)');
  } catch (err) {
    assert(false, `Post CRUD test failed: ${err.message}`);
  }

  // 10. Security - Duplicate Slug Prevention
  try {
    // Get existing post slug
    const postsRes = await fetch(`${BASE_URL}/api/posts?limit=1`);
    const postsData = await postsRes.json();
    const existingSlug = postsData.posts[0].slug;

    const dupRes = await fetch(`${BASE_URL}/api/admin/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Another Duplicate Article',
        slug: existingSlug,
        content: 'Sample'
      })
    });
    assert(dupRes.status === 400, 'Duplicate slug creation is correctly blocked with HTTP 400 Bad Request');
  } catch (err) {
    assert(false, `Duplicate slug test failed: ${err.message}`);
  }

  // 11. Staff Management (Admin only)
  try {
    const res = await fetch(`${BASE_URL}/api/admin/staff`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(res.ok && Array.isArray(data) && data.length >= 6, `Admin can retrieve staff list (${data.length} staff members in MongoDB)`);
    assert(data.every(s => !s.password), 'All staff passwords remain securely hidden and never returned over API');
  } catch (err) {
    assert(false, `Staff management test failed: ${err.message}`);
  }

  // 12. Settings Management
  try {
    const res = await fetch(`${BASE_URL}/api/admin/settings`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(res.ok && !!data.siteName, `Website settings retrieved: "${data.siteName}" (AdSense: ${data.adsense?.enabled ? 'Enabled' : 'Disabled'})`);
  } catch (err) {
    assert(false, `Settings test failed: ${err.message}`);
  }

  console.log('\n=====================================================');
  console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================');
}

runTestSuite();
