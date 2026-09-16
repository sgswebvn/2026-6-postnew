import { telemetryService } from '../src/services/telemetryService.js';

async function runGA4Verification() {
  console.log('====================================================');
  console.log('🔍 GA4 & TELEMETRY COMPREHENSIVE RUNTIME VERIFICATION');
  console.log('====================================================\n');

  const results = {
    checks: [],
    dataLayerSnapshots: []
  };

  function recordCheck(name, passed, detail) {
    results.checks.push({ name, passed, detail });
    console.log(`${passed ? '✅' : '❌'} [${name}]: ${detail}`);
  }

  // 1. Dev Server Check
  try {
    const devRes = await fetch('http://localhost:5173/');
    const devHtml = await devRes.text();
    const hasScript = devHtml.includes('https://www.googletagmanager.com/gtag/js?id=G-MZ34K70519');
    const hasConfig = devHtml.includes("gtag('config', 'G-MZ34K70519',");
    const hasSendPageViewFalse = devHtml.includes("send_page_view: false");
    recordCheck('Dev Server GTag Script', hasScript, hasScript ? 'gtag.js script tag found in HTML' : 'Missing script tag');
    recordCheck('Dev Server GTag Config', hasConfig, hasConfig ? 'gtag config found in HTML' : 'Missing gtag config');
    recordCheck('Dev Server send_page_view: false', hasSendPageViewFalse, hasSendPageViewFalse ? 'send_page_view disabled for accurate SPA routing' : 'Default auto pageview enabled');
  } catch (err) {
    recordCheck('Dev Server Response', false, err.message);
  }

  // 2. Production / SSR Backend Check
  try {
    const ssrRes = await fetch('http://localhost:5000/post/2026-sovereign-liquidity-playbook-treasuries-yields?ref=QB');
    const ssrHtml = await ssrRes.text();
    const hasSsrScript = ssrHtml.includes('https://www.googletagmanager.com/gtag/js?id=G-MZ34K70519');
    const hasRefEvent = ssrHtml.includes('seeding_referral_click') && ssrHtml.includes('QB');
    recordCheck('SSR Backend HTML Delivery', ssrRes.ok, `Status: ${ssrRes.status}`);
    recordCheck('SSR GA4 Script', hasSsrScript, hasSsrScript ? 'gtag.js present in SSR output' : 'Missing in SSR');
    recordCheck('SSR Seeding Referral Event', hasRefEvent, hasRefEvent ? 'gtag seeding_referral_click injected for ?ref=QB' : 'Missing referral event in SSR');
  } catch (err) {
    recordCheck('SSR Backend Check', false, err.message);
  }

  // 3. Google CDN & Collect Endpoints
  try {
    const cdnRes = await fetch('https://www.googletagmanager.com/gtag/js?id=G-MZ34K70519');
    recordCheck('Google Tag CDN Reachability', cdnRes.status === 200, `CDN status: ${cdnRes.status} ${cdnRes.statusText}`);
  } catch (err) {
    recordCheck('Google Tag CDN Reachability', false, err.message);
  }

  try {
    const collectRes = await fetch('https://www.google-analytics.com/g/collect?v=2&tid=G-MZ34K70519&cid=test.12345&en=page_view', {
      method: 'POST',
      body: ''
    });
    recordCheck('GA4 Collect Endpoint', collectRes.status === 204, `Collect status: ${collectRes.status} (204 No Content is standard GA4 success)`);
  } catch (err) {
    recordCheck('GA4 Collect Endpoint', false, err.message);
  }

  // 4. Runtime Browser Environment Emulation
  console.log('\n--- Emulating Client Browser Runtime Environment ---');

  // Set up mock window and document
  const mockStorage = {};
  globalThis.localStorage = {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: (k) => { delete mockStorage[k]; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
  };

  const dataLayer = [];
  globalThis.window = {
    dataLayer,
    location: {
      href: 'https://www.thehori.click/post/us-debt-gdp-ratio-risk-investors-2026?ref=QB',
      pathname: '/post/us-debt-gdp-ratio-risk-investors-2026',
      search: '?ref=QB',
      hash: ''
    },
    gtag: function() {
      dataLayer.push(Array.from(arguments));
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    scrollTo: () => {},
    innerHeight: 800
  };

  globalThis.document = {
    visibilityState: 'visible',
    documentElement: { scrollHeight: 2000 },
    addEventListener: () => {},
    removeEventListener: () => {},
    title: 'The Horizon Post'
  };

  // Run gtag initialization like index.html
  window.gtag('js', new Date());
  window.gtag('config', 'G-MZ34K70519');

  recordCheck('Initial GTag dataLayer Push', dataLayer.length === 2, `dataLayer has ${dataLayer.length} entries`);

  // Test telemetryService referral code
  const refCode = telemetryService.getReferralCode();
  recordCheck('Referral Code Extractor', refCode === 'QB', `Extracted ref code: "${refCode}"`);

  // Test article telemetry
  const cleanup = telemetryService.initArticleTelemetry(
    'us-debt-gdp-ratio-risk-investors-2026',
    'US Debt-to-GDP Ratio Risk Analysis'
  );

  console.log('\n--- Events Captured in window.dataLayer ---');
  dataLayer.forEach((entry, idx) => {
    console.log(`[${idx}]`, JSON.stringify(entry));
  });

  const pageViewEntry = dataLayer.find(e => e[0] === 'event' && e[1] === 'page_view');
  recordCheck('GA4 page_view Event Fired', Boolean(pageViewEntry), pageViewEntry ? `Parameters: ${JSON.stringify(pageViewEntry[2])}` : 'Not found');

  const referralClickEntry = dataLayer.find(e => e[0] === 'event' && e[1] === 'seeding_referral_click');
  recordCheck('GA4 seeding_referral_click Fired', Boolean(referralClickEntry), referralClickEntry ? `Parameters: ${JSON.stringify(referralClickEntry[2])}` : 'Not found');

  const userPropEntry = dataLayer.find(e => e[0] === 'set' && e[1] === 'user_properties');
  recordCheck('GA4 user_properties Set', Boolean(userPropEntry), userPropEntry ? `Properties: ${JSON.stringify(userPropEntry[2])}` : 'Not found');

  // Test custom event tracking
  telemetryService.trackEvent('affiliate_recommendation_clicked', {
    partner: 'Ledger',
    boxType: 'crypto_security',
    postSlug: 'us-debt-gdp-ratio-risk-investors-2026'
  });

  const affiliateEntry = dataLayer.find(e => e[0] === 'event' && e[1] === 'affiliate_recommendation_clicked');
  recordCheck('Custom Event Forwarded to GA4', Boolean(affiliateEntry), affiliateEntry ? `Forwarded: ${JSON.stringify(affiliateEntry[2])}` : 'Not found');

  // Test cleanup
  if (cleanup) cleanup();
  const endEvent = dataLayer.find(e => e[0] === 'event' && e[1] === 'article_view_end');
  recordCheck('Article View End Cleanup Event', Boolean(endEvent), endEvent ? `Dwell: ${JSON.stringify(endEvent[2])}` : 'Not found');

  // 5. Test SPA Route Navigation Tracking
  console.log('\n--- Testing SPA Multi-Route Navigation Page Views ---');
  const spaRoutes = [
    { path: '/', title: 'THE HORIZON POST | Independent US Finance, Tech & Modern Lifestyle Journal' },
    { path: '/category/wealth-management', title: 'Wealth Management Desk | THE HORIZON POST' },
    { path: '/tag/artificial-intelligence', title: '#artificial-intelligence Archive | THE HORIZON POST' },
    { path: '/about', title: 'About Us | THE HORIZON POST' },
    { path: '/contact', title: 'Contact Editorial Desk | THE HORIZON POST' },
    { path: '/privacy-policy', title: 'Privacy Policy | THE HORIZON POST' },
    { path: '/admin', title: 'CMS Editorial Portal | THE HORIZON POST' }
  ];

  let initialPageViews = dataLayer.filter(e => e[0] === 'event' && e[1] === 'page_view').length;
  spaRoutes.forEach(r => {
    telemetryService.trackPageView(r.path, r.title);
  });
  let afterPageViews = dataLayer.filter(e => e[0] === 'event' && e[1] === 'page_view').length;

  recordCheck(
    'SPA Multi-Route Page Views',
    afterPageViews - initialPageViews === spaRoutes.length,
    `Fired ${afterPageViews - initialPageViews}/${spaRoutes.length} page_view events across SPA routes`
  );

  console.log('\n====================================================');
  console.log('📊 VERIFICATION SUMMARY');
  const allPassed = results.checks.every(c => c.passed);
  console.log(`Result: ${allPassed ? 'ALL PASSED' : 'SOME CHECKS FAILED'}`);
  console.log('====================================================\n');
}

runGA4Verification().catch(console.error);
