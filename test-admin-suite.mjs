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
    assert(res.ok && data.total > 0, `Public posts endpoint returns real articles from MongoDB (total: ${data.total})`);
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

  // 8. Admin Overview Stats & Time Presets
  try {
    const res30d = await fetch(`${BASE_URL}/api/admin/stats?range=30d`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data30d = await res30d.json();
    assert(res30d.ok && data30d.totalPosts > 0, `Admin stats 30d returns MongoDB post count: ${data30d.totalPosts}`);
    assert(data30d.dbConnected === true, 'Database connection status is healthy & connected');
    assert(typeof data30d.totalViews === 'number' && data30d.totalViews > 0, `Total article views telemetry calculated: ${data30d.totalViews.toLocaleString()}`);

    // Test different range preset (7d, this_year)
    const res7d = await fetch(`${BASE_URL}/api/admin/stats?range=7d`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data7d = await res7d.json();
    assert(res7d.ok && data7d.range === '7d' && !!data7d.dateRange, 'Stats supports 7d time range filter with exact start and end dates');

    const resYear = await fetch(`${BASE_URL}/api/admin/stats?range=this_year`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const dataYear = await resYear.json();
    assert(resYear.ok && dataYear.range === 'this_year', 'Stats supports this_year range filter');
  } catch (err) {
    assert(false, `Admin stats test failed: ${err.message}`);
  }

  // 9. Admin Analytics Endpoint & GA4 Telemetry
  try {
    const res = await fetch(`${BASE_URL}/api/admin/analytics?range=30d`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(res.ok && data.gaStatus && typeof data.gaStatus.measurementId === 'string', `GA4 status verified (Measurement ID: ${data.gaStatus?.measurementId})`);
    assert(Array.isArray(data.categoryStats) && data.categoryStats.length > 0, `Analytics category stats aggregated (${data.categoryStats.length} taxonomies)`);
    assert(Array.isArray(data.topLandingPages) && data.topLandingPages.length > 0, `Analytics top landing articles aggregated (${data.topLandingPages.length} articles)`);
  } catch (err) {
    assert(false, `Admin analytics test failed: ${err.message}`);
  }

  // 10. Custom Scripts (Header/Footer Injection) CRUD
  let testScriptId = '';
  try {
    // A. Create Script
    const createRes = await fetch(`${BASE_URL}/api/admin/scripts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Automated Test Verification Tag',
        description: 'Test meta tag injection',
        location: 'header',
        scope: 'all',
        code: '<meta name="qa-verification-test" content="blogweb-2026" />',
        enabled: true
      })
    });
    const createData = await createRes.json();
    assert(createRes.status === 201 && !!createData.script?.id, 'Admin can register a new Header/Footer script');
    testScriptId = createData.script.id;

    // B. List scripts via admin
    const listRes = await fetch(`${BASE_URL}/api/admin/scripts`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const listData = await listRes.json();
    assert(listRes.ok && listData.some(s => s.id === testScriptId), 'Admin can list registered scripts');

    // C. Verify public API returns enabled script
    const publicRes = await fetch(`${BASE_URL}/api/scripts`);
    const publicData = await publicRes.json();
    assert(publicRes.ok && publicData.some(s => s.id === testScriptId), 'Public /api/scripts includes active script for browser injection');

    // D. Toggle script to disabled
    const toggleRes = await fetch(`${BASE_URL}/api/admin/scripts/${testScriptId}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const toggleData = await toggleRes.json();
    assert(toggleRes.ok && toggleData.script?.enabled === false, 'Admin can toggle script off');

    // E. Verify public API no longer returns disabled script
    const publicRes2 = await fetch(`${BASE_URL}/api/scripts`);
    const publicData2 = await publicRes2.json();
    assert(publicRes2.ok && !publicData2.some(s => s.id === testScriptId), 'Public /api/scripts excludes disabled scripts');

    // F. Clean up test script
    const delRes = await fetch(`${BASE_URL}/api/admin/scripts/${testScriptId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(delRes.ok, 'Admin can delete custom script');
  } catch (err) {
    assert(false, `Custom scripts test failed: ${err.message}`);
  }

  // 11. Post CRUD & Bulk Actions Test
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

    // B. Bulk Action: Move to draft
    const bulkDraftRes = await fetch(`${BASE_URL}/api/admin/posts/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        action: 'draft',
        ids: [testPostId]
      })
    });
    assert(bulkDraftRes.ok, 'Admin can perform bulk "draft" action on selected posts');

    // Verify status changed
    const verifyDraftRes = await fetch(`${BASE_URL}/api/admin/posts/${testPostId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const verifyDraftData = await verifyDraftRes.json();
    assert(verifyDraftData.status === 'draft', 'Post status correctly updated to draft via bulk operation');

    // C. Bulk Action: Publish
    const bulkPubRes = await fetch(`${BASE_URL}/api/admin/posts/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        action: 'publish',
        ids: [testPostId]
      })
    });
    assert(bulkPubRes.ok, 'Admin can perform bulk "publish" action on selected posts');

    // D. Clean delete test post
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
    assert(false, `Post CRUD & Bulk test failed: ${err.message}`);
  }

  // 12. Danger Zone Safety: Delete All Posts Protection
  try {
    // A. Calling without confirmationPhrase must be blocked
    const noPhraseRes = await fetch(`${BASE_URL}/api/admin/posts/delete-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({})
    });
    assert(noPhraseRes.status === 400, 'Delete-all without confirmation phrase is strictly blocked (400 Bad Request)');

    // B. Calling with wrong phrase must be blocked
    const wrongPhraseRes = await fetch(`${BASE_URL}/api/admin/posts/delete-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ confirmationPhrase: 'DELETE' })
    });
    assert(wrongPhraseRes.status === 400, 'Delete-all with incorrect phrase is strictly blocked (400 Bad Request)');

    // C. Calling without auth token must be blocked
    const unauthRes = await fetch(`${BASE_URL}/api/admin/posts/delete-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmationPhrase: 'DELETE ALL POSTS' })
    });
    assert(unauthRes.status === 401, 'Delete-all without auth token is strictly blocked (401 Unauthorized)');
  } catch (err) {
    assert(false, `Delete all protection test failed: ${err.message}`);
  }

  // 13. Security - Duplicate Slug Prevention
  try {
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

  // 14. Staff Management (Admin only)
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

  // 15. Settings Management
  try {
    const res = await fetch(`${BASE_URL}/api/admin/settings`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(res.ok && !!data.siteName, `Website settings retrieved: "${data.siteName}" (GA Tracking ID: ${data.gaTrackingId || 'Configured'})`);

    // 16. Dynamic Settings Real Application Verification
    const updateRes = await fetch(`${BASE_URL}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        siteName: 'TheHorizon',
        siteUrl: 'https://www.thehori.click',
        tagline: 'Definitive Intelligence for Modern Wealth & Technology',
        gaTrackingId: 'G-HORIZON2026',
        gtmId: 'GTM-TEST999',
        metaVerification: {
          google: 'google-verify-test-token-12345',
          bing: 'bing-verify-67890'
        },
        seo: {
          metaTitle: 'TheHorizon - AI & Wealth',
          metaDescription: 'Authoritative analysis on semiconductors and global economy.'
        },
        adsense: {
          enabled: true,
          publisherId: 'ca-pub-6469608148906900',
          autoAds: true,
          headerAd: { enabled: true, slotId: '9876543210' },
          inArticleAd: { enabled: true, slotId: '8765432109' }
        }
      })
    });
    const updateData = await updateRes.json();
    assert(updateRes.ok, 'Admin can update website settings dynamically');

    // 17. Public Settings Endpoint Verification (Must return updated dynamic values)
    const publicSettingsRes = await fetch(`${BASE_URL}/api/settings`);
    const publicSettings = await publicSettingsRes.json();
    assert(
      publicSettings.gtmId === 'GTM-TEST999' &&
      publicSettings.metaVerification?.google === 'google-verify-test-token-12345' &&
      publicSettings.adsense?.headerAd?.slotId === '9876543210',
      'Public settings endpoint reflects dynamic changes in real time'
    );

    // 18. Authorless Post Creation & Public Display Verification
    const authorlessPostRes = await fetch(`${BASE_URL}/api/admin/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Authorless Clean Article Test',
        slug: 'authorless-clean-article-test',
        excerpt: 'Testing post creation without any author fields',
        content: '<h2>Introduction</h2><p>This article has no author byline anywhere.</p>',
        categoryId: 'technology',
        status: 'published'
      })
    });
    const authorlessPost = await authorlessPostRes.json();
    assert(authorlessPostRes.ok && authorlessPost.post?.slug === 'authorless-clean-article-test', 'Post created cleanly without author requirement');

    // Verify public fetch
    const publicPostRes = await fetch(`${BASE_URL}/api/posts/authorless-clean-article-test`);
    const publicPostData = await publicPostRes.json();
    assert(publicPostRes.ok && publicPostData.post?.title === 'Authorless Clean Article Test', 'Public reader loads authorless article successfully');

    // Cleanup authorless test post
    if (authorlessPost.post?.id || authorlessPost.post?._id) {
      const cleanupId = authorlessPost.post.id || authorlessPost.post._id;
      await fetch(`${BASE_URL}/api/admin/posts/${cleanupId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    }

    // 19. Dynamic Sitemap.xml Verification
    const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
    const sitemapText = await sitemapRes.text();
    assert(
      sitemapRes.ok &&
      sitemapRes.headers.get('content-type')?.includes('xml') &&
      sitemapText.includes('<urlset') &&
      sitemapText.includes('/post/'),
      'Dynamic XML Sitemap generated with published articles and categories'
    );

    // 20. Dynamic Robots.txt Verification
    const robotsRes = await fetch(`${BASE_URL}/robots.txt`);
    const robotsText = await robotsRes.text();
    assert(
      robotsRes.ok &&
      robotsText.includes('Allow: /') &&
      robotsText.includes('Disallow: /admin'),
      'Robots.txt blocks crawler access to /admin while permitting public reader indexing'
    );

    // 21. Dynamic Ads.txt Verification (Google AdSense Authorized Digital Sellers)
    const adsTxtRes = await fetch(`${BASE_URL}/ads.txt`);
    const adsTxtText = await adsTxtRes.text();
    assert(
      adsTxtRes.ok &&
      adsTxtText.includes('google.com') &&
      adsTxtText.includes('DIRECT'),
      'Ads.txt dynamically served with verified Google AdSense Publisher ID'
    );

    // 22. Public Category By Slug Verification
    const catSlugRes = await fetch(`${BASE_URL}/api/categories/ai-frontier-tech`);
    const catSlugData = await catSlugRes.json();
    assert(
      catSlugRes.ok &&
      catSlugData.category?.slug === 'ai-frontier-tech' &&
      typeof catSlugData.category?.postCount === 'number',
      'Public category detail endpoint resolves category by slug with post count'
    );

    // 23. Public Post Detail Related Articles & Prev/Next Links
    const testPostRes = await fetch(`${BASE_URL}/api/posts/2nm-silicon-gaafet-nanosheets-backside-power`);
    const testPostData = await testPostRes.json();
    assert(
      testPostRes.ok &&
      Array.isArray(testPostData.relatedPosts) &&
      testPostData.post?.title.includes('2nm Silicon'),
      'Article detail endpoint enriches response with related articles for internal linking'
    );

    // 24. Public Contact Form Submission
    const contactRes = await fetch(`${BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Editorial Inquirer',
        email: 'reader@example.com',
        subject: 'Research inquiry on semiconductors',
        message: 'Hello, I loved your in-depth article on 2nm GAAFET nodes.'
      })
    });
    const contactData = await contactRes.json();
    assert(
      contactRes.ok &&
      contactData.success === true,
      'Public contact form submits inquiries safely to editorial desk'
    );

    // 25. TheHorizon Brand Name Verification
    assert(
      publicSettings.siteName === 'TheHorizon',
      'Website settings dynamically confirms brand name is strictly "TheHorizon"'
    );

    // 26. Verification of Zero Admin in Public UI
    const fs = await import('fs');
    const navbarCode = fs.readFileSync('./src/components/public/PublicNavbar.jsx', 'utf8');
    assert(
      !navbarCode.includes('/admin') &&
      !navbarCode.includes('onAdminClick') &&
      !navbarCode.includes('<span>Admin</span>'),
      'Public navbar has zero Admin links, buttons, or props'
    );

    // 27. Verification of Table of Contents Removal
    const postDetailCode = fs.readFileSync('./src/components/public/PostDetailPage.jsx', 'utf8');
    assert(
      !postDetailCode.includes('toc-box') &&
      !postDetailCode.includes('tocItems') &&
      !postDetailCode.includes('Table of Contents'),
      'Post detail page has completely eliminated Table of Contents (TOC)'
    );

    // 28. About and Contact Relocated Exclusively to Footer
    const footerCode = fs.readFileSync('./src/components/public/PublicFooter.jsx', 'utf8');
    assert(
      !navbarCode.includes("onNavigate('/about')") &&
      !navbarCode.includes("onNavigate('/contact')") &&
      footerCode.includes("onNavigate('/about')") &&
      footerCode.includes("onNavigate('/contact')"),
      'About and Contact links relocated exclusively to Footer, removed from Navbar'
    );

    // 29. Category Slug vs Category ID Resolution in Public Posts API
    const postsBySlugRes = await fetch(`${BASE_URL}/api/posts?categoryId=ai-frontier-tech`);
    const postsBySlugData = await postsBySlugRes.json();
    const postsByIdRes = await fetch(`${BASE_URL}/api/posts?categoryId=cat-tech`);
    const postsByIdData = await postsByIdRes.json();
    assert(
      postsBySlugRes.ok &&
      postsByIdRes.ok &&
      postsBySlugData.total === 4 &&
      postsByIdData.total === 4,
      'Public posts endpoint resolves category filter identically by slug or by ID (4 posts)'
    );

    // 30. Boundary Test: Non-existent Category Slug Returns HTTP 404
    const nonExistentCatRes = await fetch(`${BASE_URL}/api/categories/non-existent-taxonomy-9999`);
    assert(
      nonExistentCatRes.status === 404,
      'Requesting non-existent category slug returns HTTP 404 Not Found'
    );

    // 31. Security Test: Regex Injection Protection in Category Slug Route
    const regexCatRes = await fetch(`${BASE_URL}/api/categories/test[brackets(*+`);
    assert(
      regexCatRes.status === 404,
      'Regex special characters in category slug are safely escaped and handled with 404 without crashing'
    );

    // 32. Boundary Test: Search with Regex Special Characters
    const regexSearchRes = await fetch(`${BASE_URL}/api/posts?search=${encodeURIComponent('GAAFET (nanosheets)')}`);
    const regexSearchData = await regexSearchRes.json();
    assert(
      regexSearchRes.ok && Array.isArray(regexSearchData.posts),
      'Search endpoint handles regex special characters without crash or unhandled error'
    );

    // 33. Security & Validation Test: Contact Form Rejects Malformed Email
    const badEmailRes = await fetch(`${BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Tester',
        email: 'invalid-email-address',
        message: 'Hello'
      })
    });
    assert(
      badEmailRes.status === 400,
      'Contact form rejects invalid email addresses with HTTP 400 Bad Request'
    );

    // 34. Boundary Test: Contact Form Rejects Missing Message
    const missingMsgRes = await fetch(`${BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Tester',
        email: 'valid@example.com',
        message: ''
      })
    });
    assert(
      missingMsgRes.status === 400,
      'Contact form rejects empty message payload with HTTP 400 Bad Request'
    );

    // 35. Dynamic Ads.txt Handles Both ca-pub- and pub- Formats
    const adsTxtFormatRes = await fetch(`${BASE_URL}/ads.txt`);
    const adsTxtFormatText = await adsTxtFormatRes.text();
    assert(
      adsTxtFormatRes.ok &&
      adsTxtFormatText.includes('google.com, pub-6469608148906900, DIRECT, f08c47fec0942fa0'),
      'Dynamic ads.txt correctly formats publisher record with verified pub- prefix'
    );

    // 36. HTML Document Metadata & Internationalization Verification
    const indexHtml = fs.readFileSync('./index.html', 'utf8');
    assert(
      indexHtml.includes('<html lang="en">') &&
      indexHtml.includes('<title>TheHorizon — Modern Intelligence & Technology Journal</title>'),
      'index.html configured with English language attribute and TheHorizon default title'
    );

    // 37. Responsive CSS Media Styles for Rich Articles
    const cssCode = fs.readFileSync('./src/index.css', 'utf8');
    assert(
      cssCode.includes('.article-rich-body img') &&
      cssCode.includes('.article-rich-body iframe') &&
      cssCode.includes('aspect-ratio: 16 / 9'),
      'CSS includes responsive 16:9 media rules and max-width image constraints for articles'
    );

    // 38. Rich Content Renderer Sanitization Verification
    const rendererCode = fs.readFileSync('./src/components/common/RichContentRenderer.jsx', 'utf8');
    assert(
      rendererCode.includes('sanitizeContent') &&
      rendererCode.includes('replace(/<script\\b'),
      'RichContentRenderer incorporates HTML sanitization against XSS script injection'
    );
  } catch (err) {
    assert(false, `Settings test failed: ${err.message}`);
  }

  console.log('\n=====================================================');
  console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
