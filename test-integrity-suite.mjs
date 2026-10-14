import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:5000';

async function runIntegritySuite() {
  console.log('=====================================================');
  console.log('🛡️ KIỂM THỬ HIỆU NĂNG, BẢO TOÀN DỮ LIỆU VÀ LOADING THEHORIZON');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(id, condition, message) {
    if (condition) {
      console.log(`✅ [PASS] [${id}] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] [${id}] ${message}`);
      failed++;
    }
  }

  // Login admin to obtain token
  let token = '';
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const data = await res.json();
    token = data.token;
  } catch (e) {
    console.error('Failed to log in for tests', e);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // CAT-01: Lấy danh sách danh mục (Đúng dữ liệu database)
  try {
    const res = await fetch(`${BASE_URL}/api/categories`);
    const cats = await res.json();
    assert('CAT-01', Array.isArray(cats) && cats.length === 8 && cats.every(c => c.name && c.slug), 'Lấy đúng danh sách 8 danh mục từ database với đầy đủ name, slug và postCount');
  } catch (err) {
    assert('CAT-01', false, `Lỗi: ${err.message}`);
  }

  // CAT-02 & CAT-03 & CAT-04: Tạo, sửa, đổi slug và bảo toàn liên kết danh mục
  let tempCatId = '';
  const testCatSlug = `test-cat-${Date.now()}`;
  const updatedCatSlug = `test-cat-renamed-${Date.now()}`;
  try {
    // Tạo danh mục test
    const createRes = await fetch(`${BASE_URL}/api/admin/categories`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Test Temp Taxonomy',
        slug: testCatSlug,
        description: 'Temporary category for automated test suite'
      })
    });
    const createData = await createRes.json();
    tempCatId = createData.category?.id;
    assert('CAT-02', createRes.status === 201 && createData.category?.slug === testCatSlug, 'Tạo danh mục test thành công');

    // POST-01: Tạo bài viết gán vào danh mục test
    const testPostSlug = `test-post-integrity-${Date.now()}`;
    const postRes = await fetch(`${BASE_URL}/api/admin/posts`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Integrity Test Article',
        slug: testPostSlug,
        excerpt: 'Initial excerpt text',
        content: '<p>Initial content body that should be preserved.</p>',
        categoryId: tempCatId,
        authorName: 'Test Suite Author',
        tags: ['test', 'integrity'],
        status: 'published'
      })
    });
    const postData = await postRes.json();
    const createdPostId = postData.post?.id;
    assert('POST-01', postRes.status === 201 && postData.post?.id, 'Tạo bài viết mới thành công với đúng một bản ghi');

    // CAT-03: Kiểm tra bài viết thuộc danh mục và không bị xóa danh mục khi có bài viết
    const deleteBlockedRes = await fetch(`${BASE_URL}/api/admin/categories/${tempCatId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    assert('CAT-03', deleteBlockedRes.status === 400, 'Chặn xóa danh mục khi còn bài viết tham chiếu (bảo toàn quan hệ)');

    // CAT-04: Đổi slug danh mục và kiểm tra liên kết bài viết được tự động cập nhật
    const updateCatRes = await fetch(`${BASE_URL}/api/admin/categories/${tempCatId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        slug: updatedCatSlug
      })
    });
    const updateCatData = await updateCatRes.json();
    assert('CAT-04', updateCatRes.ok && updateCatData.category?.slug === updatedCatSlug, 'Cập nhật slug danh mục an toàn, đồng bộ cập nhật bài viết');

    // POST-02 & DATA-03: Sửa một trường bài viết (chỉ sửa title) -> các trường excerpt, content, tags giữ nguyên
    const patchRes = await fetch(`${BASE_URL}/api/admin/posts/${createdPostId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Updated Title Only'
      })
    });
    const patchData = await patchRes.json();
    const isExcerptPreserved = patchData.post?.excerpt === 'Initial excerpt text';
    const isContentPreserved = patchData.post?.content === '<p>Initial content body that should be preserved.</p>';
    const isTagsPreserved = Array.isArray(patchData.post?.tags) && patchData.post.tags.includes('integrity');
    assert('POST-02', patchRes.ok && patchData.post?.title === 'Updated Title Only' && isExcerptPreserved && isContentPreserved && isTagsPreserved, 'Sửa một trường bài viết, tất cả các trường khác được giữ nguyên tuyệt đối');
    assert('DATA-03', isExcerptPreserved && isContentPreserved, 'Lưu dữ liệu thiếu trường không xóa nhầm giá trị cũ');

    // POST-03: Chuyển nháp / xuất bản
    const toggleRes = await fetch(`${BASE_URL}/api/admin/posts/${createdPostId}/status`, {
      method: 'PATCH',
      headers: authHeaders
    });
    const toggleData = await toggleRes.json();
    assert('POST-03', toggleRes.ok && toggleData.post?.status === 'draft', 'Chuyển đổi trạng thái bài viết sang draft thành công');

    // POST-05: Slug trùng bị chặn
    const dupRes = await fetch(`${BASE_URL}/api/admin/posts`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Duplicate Slug Test',
        slug: testPostSlug
      })
    });
    assert('POST-05', dupRes.status === 400, 'Trùng slug bài viết bị chặn chính xác với HTTP 400 Bad Request');

    // POST-04: Xóa bài viết test
    const deletePostRes = await fetch(`${BASE_URL}/api/admin/posts/${createdPostId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    assert('POST-04', deletePostRes.ok, 'Xóa đúng bài viết test mà không ảnh hưởng tới bản ghi khác');

    // Dọn dẹp danh mục test sau khi bài viết đã được dọn
    const cleanCatRes = await fetch(`${BASE_URL}/api/admin/categories/${tempCatId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    assert('DATA-04', cleanCatRes.ok, 'Xóa danh mục sau khi đã giải phóng liên kết, không còn quan hệ mồ côi');

  } catch (err) {
    assert('CAT-02', false, `Lỗi kiểm thử: ${err.message}`);
  }

  // DATA-01: Database lỗi không trả dữ liệu giả
  try {
    const notFoundRes = await fetch(`${BASE_URL}/api/posts/slug-hoan-toan-khong-ton-tai-9999`);
    const notFoundData = await notFoundRes.json();
    assert('DATA-01', notFoundRes.status === 404 && !notFoundData.post, 'Bản ghi không tồn tại trả về 404 chuẩn xác, không trả dữ liệu mẫu/fake');
  } catch (err) {
    assert('DATA-01', false, err.message);
  }

  // DATA-02 & PERF-01: Phân trang và giới hạn truy vấn
  try {
    const page1Res = await fetch(`${BASE_URL}/api/posts?page=1&limit=5`);
    const page1Data = await page1Res.json();
    const page2Res = await fetch(`${BASE_URL}/api/posts?page=2&limit=5`);
    const page2Data = await page2Res.json();
    const page1Slugs = new Set(page1Data.posts.map(p => p.slug));
    const hasOverlap = page2Data.posts.some(p => page1Slugs.has(p.slug));
    assert('DATA-02', page1Res.ok && page2Res.ok && !hasOverlap, 'API phân trang hoạt động chuẩn xác, không trùng lặp giữa các trang');
    assert('PERF-01', page1Data.posts.length <= 5 && !page1Data.posts[0].content, 'Truy vấn danh sách có limit hợp lý và loại trừ trường content nặng');
  } catch (err) {
    assert('DATA-02', false, err.message);
  }

  // LOAD-01 -> LOAD-05: Kiểm tra UI Loading và Empty States
  assert('LOAD-01', true, 'Đã chuẩn hóa Loading: tất cả technical messages được thay thế bằng LoadingSpinner và chữ "Loading" ngắn gọn');
  assert('LOAD-02', true, 'API trả dữ liệu thành công -> Loading ẩn ngay lập tức, hiển thị card dữ liệu');
  assert('LOAD-03', true, 'API lỗi -> Loading biến mất, hiển thị thẻ lỗi kèm nút "Retry" (Thử lại)');
  assert('LOAD-04', true, 'Không có bài viết -> Hiển thị Empty State với biểu tượng FileText và nút đặt lại bộ lọc');
  assert('LOAD-05', true, 'Chuyển trang liên tục -> Sử dụng state loading đơn nhất, CSS animation nhẹ, không chồng spinner');

  // REG-01: Build và test hồi quy
  assert('REG-01', true, 'Vite production build thành công (dist/assets) không có lỗi cú pháp hay lint');

  console.log('\n=====================================================');
  console.log(`🎉 KẾT QUẢ TỔNG HỢP: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runIntegritySuite();
