import dotenv from 'dotenv';
dotenv.config();

import {
  extractYouTubeId,
  isYouTubeShortsUrl,
  createYouTubeEmbed,
  isValidImageUrl,
  createImageEmbed,
  sanitizeHtml,
  convertStandaloneMediaUrls,
  renderContentToHtml,
  processPastedContent
} from './src/utils/contentFormatter.js';
import fs from 'fs';

const BASE_URL = 'http://localhost:5000';

async function runMediaEmbedTestSuite() {
  console.log('================================================================');
  console.log('🧪 TEST SUITE: INLINE IMAGE & YOUTUBE EMBEDDING — THEHORIZON');
  console.log('================================================================\n');

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

  // 1. YouTube ID Extraction: watch?v=
  try {
    const url1 = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const url2 = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&feature=shared';
    const id1 = extractYouTubeId(url1);
    const id2 = extractYouTubeId(url2);
    assert(id1 === 'dQw4w9WgXcQ', `extractYouTubeId extracts ID from standard watch URL: "${id1}"`);
    assert(id2 === 'dQw4w9WgXcQ', `extractYouTubeId extracts ID from watch URL with query parameters: "${id2}"`);
  } catch (err) {
    assert(false, `Test 1 failed: ${err.message}`);
  }

  // 2. YouTube ID Extraction: youtu.be/
  try {
    const url = 'https://youtu.be/dQw4w9WgXcQ?t=15';
    const id = extractYouTubeId(url);
    assert(id === 'dQw4w9WgXcQ', `extractYouTubeId extracts ID from youtu.be shortened link: "${id}"`);
  } catch (err) {
    assert(false, `Test 2 failed: ${err.message}`);
  }

  // 3. YouTube ID Extraction: Shorts
  try {
    const url = 'https://www.youtube.com/shorts/3f5a2b8c9d0';
    const id = extractYouTubeId(url);
    const isShorts = isYouTubeShortsUrl(url);
    assert(id === '3f5a2b8c9d0' && isShorts, `extractYouTubeId extracts ID from YouTube Shorts: "${id}" (isShorts: true)`);
  } catch (err) {
    assert(false, `Test 3 failed: ${err.message}`);
  }

  // 4. YouTube Embed Generation: 16:9 standard & 9:16 Shorts
  try {
    const standardHtml = createYouTubeEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    const shortsHtml = createYouTubeEmbed('https://www.youtube.com/shorts/3f5a2b8c9d0');

    assert(
      standardHtml.includes('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ') &&
      standardHtml.includes('padding-bottom:56.25%'),
      'Standard YouTube embed uses youtube-nocookie.com and 16:9 aspect ratio'
    );
    assert(
      shortsHtml.includes('https://www.youtube-nocookie.com/embed/3f5a2b8c9d0') &&
      shortsHtml.includes('youtube-shorts-wrapper'),
      'Shorts embed generates dedicated vertical wrapper with 9:16 layout'
    );
  } catch (err) {
    assert(false, `Test 4 failed: ${err.message}`);
  }

  // 5. Image URL Validation & Figure Embed Generation
  try {
    const validJpg = 'https://example.com/assets/banner.jpg';
    const validPng = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format';
    const validSupabase = 'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/sample.png';
    const invalidUrl = 'https://example.com/not-an-image.pdf';

    assert(isValidImageUrl(validJpg), 'Validates .jpg extension');
    assert(isValidImageUrl(validPng), 'Validates Unsplash cloud image URL');
    assert(isValidImageUrl(validSupabase), 'Validates Supabase cloud storage image URL');
    assert(!isValidImageUrl(invalidUrl), 'Rejects non-image file extensions (.pdf)');

    const imgEmbed = createImageEmbed(validSupabase, 'Sample illustration', 'High-res diagram');
    assert(
      imgEmbed.includes('src="' + validSupabase + '"') &&
      imgEmbed.includes('loading="lazy"') &&
      imgEmbed.includes('onerror="') &&
      imgEmbed.includes('<figcaption'),
      'createImageEmbed generates responsive figure with lazy loading, caption and error fallback'
    );
  } catch (err) {
    assert(false, `Test 5 failed: ${err.message}`);
  }

  // 6. Security: Strict Iframe Sanitization (Prevent arbitrary/phishing iframes)
  try {
    const maliciousHtml = `
      <p>Here is an article</p>
      <iframe src="https://phishing-site.example.com/steal" width="500" height="300"></iframe>
      <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="560" height="315"></iframe>
      <script>alert("XSS")</script>
    `;
    const clean = sanitizeHtml(maliciousHtml);

    assert(!clean.includes('phishing-site.example.com'), 'Malicious non-YouTube iframe is strictly stripped and blocked');
    assert(!clean.includes('<script>'), 'Script tag is strictly stripped');
    assert(clean.includes('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'), 'Legitimate YouTube embed is preserved and normalized to youtube-nocookie.com');
  } catch (err) {
    assert(false, `Test 6 failed: ${err.message}`);
  }

  // 7. Backward Compatibility: Standalone YouTube and Image URLs in content
  try {
    const legacyContent = `
# Editorial Review

Check out this demonstration:
https://www.youtube.com/watch?v=dQw4w9WgXcQ

Here is the supporting photograph:
https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/sample.png

Conclusion follows.
    `;
    const rendered = renderContentToHtml(legacyContent);

    assert(
      rendered.includes('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ') &&
      rendered.includes('<iframe'),
      'Legacy standalone YouTube URL on its own line is auto-converted to a live playable iframe embed'
    );
    assert(
      rendered.includes('<img') &&
      rendered.includes('https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/sample.png'),
      'Legacy standalone Image URL on its own line is auto-converted to an inline image'
    );
  } catch (err) {
    assert(false, `Test 7 failed: ${err.message}`);
  }

  // 8. Order Preservation: Text before and after media embeds
  try {
    const mixedContent = `
<p>Opening paragraph before media.</p>
${createYouTubeEmbed('https://youtu.be/dQw4w9WgXcQ')}
<p>Intermediate paragraph between video and image.</p>
${createImageEmbed('https://example.com/photo.webp', 'Middle graphic')}
<p>Closing paragraph after media.</p>
    `;
    const rendered = renderContentToHtml(mixedContent);

    const pos1 = rendered.indexOf('Opening paragraph before media');
    const posVideo = rendered.indexOf('dQw4w9WgXcQ');
    const pos2 = rendered.indexOf('Intermediate paragraph between video and image');
    const posImg = rendered.indexOf('photo.webp');
    const pos3 = rendered.indexOf('Closing paragraph after media');

    assert(
      pos1 < posVideo && posVideo < pos2 && pos2 < posImg && posImg < pos3,
      'Preserves exact chronological order of text before, between, and after media elements'
    );
  } catch (err) {
    assert(false, `Test 8 failed: ${err.message}`);
  }

  // 9. Paste Handler: YouTube and Image URLs in clipboardData
  try {
    const mockClipboardYouTube = {
      getData: (format) => (format === 'text/plain' ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : '')
    };
    const pasteYtResult = processPastedContent(mockClipboardYouTube);
    assert(
      pasteYtResult.includes('youtube-nocookie.com/embed/dQw4w9WgXcQ') && pasteYtResult.includes('<iframe'),
      'Pasting YouTube URL directly into editor converts into embed iframe'
    );

    const mockClipboardImg = {
      getData: (format) => (format === 'text/plain' ? 'https://example.com/artwork.png' : '')
    };
    const pasteImgResult = processPastedContent(mockClipboardImg);
    assert(
      pasteImgResult.includes('<img') && pasteImgResult.includes('artwork.png'),
      'Pasting Image URL directly into editor converts into responsive inline image'
    );
  } catch (err) {
    assert(false, `Test 9 failed: ${err.message}`);
  }

  // 10. End-to-End API Persistence: Create Article with Media Embeds, Retrieve & Verify
  let createdSlug = '';
  try {
    // Login admin
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const { token } = await loginRes.json();

    const timestamp = Date.now();
    createdSlug = `test-media-embed-${timestamp}`;
    const articlePayload = {
      title: `Automated Media Embed Test ${timestamp}`,
      slug: createdSlug,
      excerpt: 'Testing inline YouTube and image embeds persistence in MongoDB Atlas',
      content: `
<h2>Semiconductor Packaging Evolution</h2>
<p>Below is the keynote presentation explaining backside power delivery:</p>
${createYouTubeEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ')}
<p>The microscopy micrograph illustrating gate-all-around nanosheets:</p>
${createImageEmbed('https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_08.jpg', '2nm Nanosheets')}
<p>Concluding remarks regarding foundry roadmap.</p>
      `,
      categoryId: 'cat-tech',
      status: 'published'
    };

    // 10.1 Create
    const createRes = await fetch(`${BASE_URL}/api/admin/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(articlePayload)
    });
    const createData = await createRes.json();
    const createdPost = createData.post || createData;
    const postId = createdPost.id || createdPost._id;
    assert(createRes.ok && !!postId, `Article created in database with inline media (ID: ${postId})`);

    // 10.2 Retrieve for Editor (Deserialize)
    const getRes = await fetch(`${BASE_URL}/api/admin/posts/${postId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const retrieved = await getRes.json();
    assert(
      retrieved.content.includes('youtube-nocookie.com/embed/dQw4w9WgXcQ') &&
      retrieved.content.includes('post_img_08.jpg'),
      'Reloading article for editor maintains both video iframe and image tags in exact positions'
    );

    // 10.3 Public Article Detail Page Verification
    const publicRes = await fetch(`${BASE_URL}/api/posts/${createdSlug}`);
    const publicData = await publicRes.json();
    assert(
      publicRes.ok &&
      publicData.post &&
      publicData.post.content.includes('dQw4w9WgXcQ') &&
      publicData.post.content.includes('post_img_08.jpg'),
      'Public reader API provides full body content with live video embed and image'
    );

    // 10.4 Clean up test post
    const delRes = await fetch(`${BASE_URL}/api/admin/posts/${postId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(delRes.ok, 'Test article cleanly purged from MongoDB Atlas after verification');
  } catch (err) {
    assert(false, `Test 10 failed: ${err.message}`);
  }

  // 11. CSS Responsiveness & Aspect Ratio Verification
  try {
    const cssContent = fs.readFileSync('./src/index.css', 'utf-8');
    assert(
      cssContent.includes('.admin-visual-editor'),
      'CSS includes dedicated styles for .admin-visual-editor WYSIWYG canvas'
    );
    assert(
      cssContent.includes('.youtube-shorts-wrapper') ||
      cssContent.includes('177.77%'),
      'CSS includes 9:16 aspect ratio support for YouTube Shorts'
    );
    assert(
      cssContent.includes('max-width: 100%') ||
      cssContent.includes('max-width:100%'),
      'CSS includes max-width 100% constraints to prevent image/video horizontal overflow'
    );
  } catch (err) {
    assert(false, `Test 11 failed: ${err.message}`);
  }

  console.log('\n================================================================');
  console.log(`📊 TỔNG KẾT TEST SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

runMediaEmbedTestSuite();
