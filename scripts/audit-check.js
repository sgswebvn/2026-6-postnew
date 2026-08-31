
async function checkEndpoints() {
  console.log('--- 1. AUDITING LOCAL DEV SERVER ---');
  const t0 = Date.now();
  const resHome = await fetch('http://localhost:5173/');
  const htmlHome = await resHome.text();
  const tHome = Date.now() - t0;
  console.log('Local Dev Server Home HTTP:', resHome.status, 'Time:', tHome + 'ms', 'Length:', htmlHome.length);

  console.log('\n--- 2. AUDITING PRODUCTION WEBSITE (https://www.thehori.click) ---');
  const t1 = Date.now();
  const resProd = await fetch('https://www.thehori.click/');
  const htmlProd = await resProd.text();
  const tProd = Date.now() - t1;
  console.log('Production Home HTTP:', resProd.status, 'Time:', tProd + 'ms', 'Length:', htmlProd.length);

  console.log('\n--- 3. AUDITING SOCIAL BOT CRAWLER (Facebook User-Agent) ---');
  const t2 = Date.now();
  const resPost = await fetch('https://www.thehori.click/post/where-americans-are-parking-cash-in-2026', {
    headers: { 'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.html)' }
  });
  const htmlPost = await resPost.text();
  const tPost = Date.now() - t2;
  console.log('Production Post Crawler HTTP:', resPost.status, 'Time:', tPost + 'ms', 'Length:', htmlPost.length);
  console.log('Has OG Image:', htmlPost.includes('property="og:image"'));
  console.log('Has OG Title:', htmlPost.includes('property="og:title"'));
  console.log('Has Canonical:', htmlPost.includes('rel="canonical"'));
  console.log('Has Full Content:', htmlPost.includes('class="article-content"'));

  console.log('\n--- 4. AUDITING ASSET PERFORMANCE ---');
  const t3 = Date.now();
  const resCdn = await fetch('https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/posts_manifest.json');
  const cdnData = await resCdn.json();
  const tCdn = Date.now() - t3;
  console.log('Supabase CDN Response:', resCdn.status, 'Time:', tCdn + 'ms', 'Total Posts in CDN:', cdnData.length);
}

checkEndpoints().catch(console.error);
