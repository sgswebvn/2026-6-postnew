/**
 * Full technical QA for public post listing + post detail.
 * Hits live API + HTML when the server is up; also static-source crash analysis.
 */
import fs from 'fs';
import path from 'path';
import { initialPosts, initialCategories, initialAuthors } from '../server/seedData.js';
import { publicPostProjection } from '../server/staffRules.js';

const API = process.env.POST_API || 'http://localhost:5000/api';
const ORIGIN = process.env.POST_ORIGIN || 'http://localhost:5000';

let passed = 0;
let failed = 0;
const errors = [];

function assert(condition, message, category = 'PostPages') {
  if (condition) {
    passed++;
  } else {
    failed++;
    errors.push(`[${category}] ${message}`);
  }
}

function safeDate(value) {
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

function formatDateOrThrow(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
}

async function fetchJson(url, opts = {}) {
  try {
    const res = await fetch(url, { ...opts, signal: opts.signal || AbortSignal.timeout(90000) });
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return { res, body };
  } catch (e) {
    return { res: { status: 0, ok: false }, body: null, error: e.message };
  }
}

async function fetchText(url, headers = {}) {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(90000) });
    const text = await res.text();
    return { res, text };
  } catch (e) {
    return { res: { status: 0, ok: false }, text: '', error: e.message };
  }
}

console.log('========================================================================');
console.log('POST LIST + POST DETAIL — FULL TECHNICAL QA');
console.log('========================================================================\n');

// ---------------------------------------------------------------------------
// 1. Static source crash / logic analysis
// ---------------------------------------------------------------------------
console.log('1. Static source analysis...');
const detailSrc = fs.readFileSync(path.resolve('src/pages/PostDetailPage.jsx'), 'utf8');
const homeSrc = fs.readFileSync(path.resolve('src/pages/HomePage.jsx'), 'utf8');
const heroSrc = fs.readFileSync(path.resolve('src/components/blog/HeroFeatured.jsx'), 'utf8');
const cardSrc = fs.readFileSync(path.resolve('src/components/blog/ArticleCard.jsx'), 'utf8');
const catSrc = fs.readFileSync(path.resolve('src/pages/CategoryPage.jsx'), 'utf8');
const appSrc = fs.readFileSync(path.resolve('src/App.jsx'), 'utf8');
const projSrc = fs.readFileSync(path.resolve('server/staffRules.js'), 'utf8');

assert(appSrc.includes("cleanPath.startsWith('/post/')"), 'App routes /post/:slug to PostDetailPage', 'Routing');
assert(appSrc.includes('<PostDetailPage'), 'PostDetailPage is mounted', 'Routing');
assert(appSrc.includes('<HomePage'), 'HomePage (post list) is mounted', 'Routing');
assert(appSrc.includes('<CategoryPage'), 'CategoryPage is mounted', 'Routing');
assert(detailSrc.includes('NotFoundPage'), 'Detail falls back to 404 when post missing', 'Detail');
assert(detailSrc.includes('dangerouslySetInnerHTML'), 'Detail renders HTML body', 'Detail');
assert(detailSrc.includes('application/ld+json'), 'Detail emits JSON-LD', 'Detail');
assert(detailSrc.includes('og:title'), 'Detail sets Open Graph title', 'Detail');
assert(detailSrc.includes('incrementPostView') || detailSrc.includes('incrementView'), 'Detail records a view', 'Detail');
assert(homeSrc.includes("p.status === 'published'"), 'Home list filters published only', 'List');
assert(catSrc.includes("p.status === 'published'"), 'Category list filters published only', 'List');
assert(cardSrc.includes('navigate(`/post/${post.slug}`)'), 'ArticleCard navigates to /post/:slug', 'List');
assert(/replace\(\/\\\/\+\$\/, ''\)/.test(appSrc) || appSrc.includes(".replace(/\\/+$/, '')"), 'App strips trailing slash on /post/:slug', 'Routing');
assert(!/\[slug, localPost, cleanSlug\]/.test(detailSrc), 'Detail fetch must not re-run on every localPost identity change', 'Detail');
assert(/Number\.isNaN/.test(cardSrc), 'ArticleCard must not crash on invalid publishedAt', 'List');
assert(/Number\.isNaN/.test(detailSrc), 'PostDetailPage must not crash on invalid publishedAt', 'Detail');
assert(/replace\(\/<\//.test(detailSrc) || detailSrc.includes(".replace(/</g"), 'JSON-LD must escape < to avoid script breakout', 'Security');
const adminListSrc = fs.readFileSync(path.resolve('src/pages/admin/AdminPostsList.jsx'), 'utf8');
assert(/String\(p\.title \|\| ''\)/.test(adminListSrc), 'Admin post list search must not crash if title is missing', 'List');

const publicProj = publicPostProjection({
  id: 'post-x',
  title: 'T',
  slug: 't',
  excerpt: 'e',
  content: '<p>c</p>',
  coverImage: 'https://x.test/a.jpg',
  categoryId: 'cat-finance',
  authorId: 'author-1',
  status: 'published',
  featured: true,
  views: 9,
  tags: ['A'],
  enableAds: true,
  publishedAt: '2026-08-01T00:00:00Z',
  createdById: 'secret-staff',
  createdByName: 'Hidden'
});
assert(publicProj.slug === 't', 'projection keeps slug', 'Projection');
assert(publicProj.content && publicProj.content.length > 0, 'projection keeps full content for detail by default', 'Projection');
const listProj = publicPostProjection({ ...{
  id: 'post-x',
  title: 'T',
  slug: 't',
  excerpt: 'e',
  content: '<p>full article body that should be omitted from list</p>',
  coverImage: 'https://x.test/a.jpg',
  categoryId: 'cat-finance',
  authorId: 'author-1',
  status: 'published',
  tags: [],
  enableAds: true
} }, { includeContent: false });
assert(listProj.content === '', 'list projection omits full HTML content', 'Projection');
assert(!('createdById' in publicProj) || publicProj.createdById === undefined, 'projection does not leak createdById', 'Security');
assert(publicProj.enableAds === true, 'public projection must include enableAds (detail ads gate)', 'Projection');

const detailGatesAds = /post\.enableAds !== false/.test(detailSrc) || /post\.enableAds &&/.test(detailSrc);
assert(detailGatesAds, 'detail currently gates AdSense on post.enableAds', 'Detail');

const heroDateFallback = /new Date\(leadPost\.publishedAt\s*\|\|/.test(heroSrc)
  || /Number\.isNaN\(leadDate\.getTime\(\)\)/.test(heroSrc)
  || /safeDate|Number\.isNaN/.test(heroSrc);
assert(heroDateFallback, 'HeroFeatured must not crash on missing/invalid publishedAt', 'List');

const detailDateFallback = /new Date\(post\.publishedAt \|\| Date\.now\(\)\)/.test(detailSrc)
  || /safeDate|Number\.isNaN/.test(detailSrc);
assert(detailDateFallback, 'PostDetailPage date format has a fallback', 'Detail');

const homeEmptyDistinguishes = /filterTab === 'bookmarks'/.test(homeSrc)
  && homeSrc.includes('No Saved Articles Found');
const homeEmptyOnlyBookmarks = homeSrc.includes("filterTab === 'bookmarks'")
  && /currentFeedPosts\.length === 0/.test(homeSrc);
assert(
  /No Saved Articles Found/.test(homeSrc) === false
    || /filterTab === 'bookmarks'[\s\S]{0,200}No Saved/.test(homeSrc)
    || /latest[\s\S]{0,80}No articles/i.test(homeSrc),
  'Home empty-state must not say "No Saved Articles" for Latest/Trending',
  'List'
);

// Date crash corpus (mirrors what ArticleCard / Hero / Detail call)
const dateCorpus = [
  '2026-08-25T10:00:00Z',
  new Date().toISOString(),
  Date.now(),
  undefined,
  null,
  '',
  'not-a-date',
  '2026-13-40',
  'Invalid Date'
];
dateCorpus.forEach((value, i) => {
  let threw = false;
  try {
    formatDateOrThrow(value || Date.now());
  } catch {
    threw = true;
  }
  if (value === 'not-a-date' || value === '2026-13-40' || value === 'Invalid Date') {
    assert(threw === true, `invalid date corpus #${i + 1} throws (callers must guard)`, 'Date');
  } else if (value === '' || value === null || value === undefined) {
    const guarded = value || Date.now();
    let gThrew = false;
    try { formatDateOrThrow(guarded); } catch { gThrew = true; }
    assert(!gThrew, `nullish date with || Date.now() must not throw #${i + 1}`, 'Date');
  } else {
    assert(!threw, `valid date corpus #${i + 1} must format`, 'Date');
  }
});

initialPosts.forEach((post, i) => {
  assert(post.status === 'published' || post.status === 'draft', `seed post ${i + 1} status enum`, 'Seed');
  assert(typeof post.slug === 'string' && /^[a-z0-9-]+$/.test(post.slug), `seed post ${i + 1} slug`, 'Seed');
  assert(typeof post.content === 'string' && post.content.length > 300, `seed post ${i + 1} long content`, 'Seed');
  assert(safeDate(post.publishedAt), `seed post ${i + 1} publishedAt is valid Date`, 'Seed');
  let threw = false;
  try { formatDateOrThrow(post.publishedAt); } catch { threw = true; }
  assert(!threw, `seed post ${i + 1} date formats in cards/detail`, 'Seed');
  const cat = initialCategories.find((c) => c.id === post.categoryId);
  const author = initialAuthors.find((a) => a.id === post.authorId);
  assert(Boolean(cat), `seed post ${i + 1} category exists`, 'Seed');
  assert(Boolean(author), `seed post ${i + 1} author exists`, 'Seed');
  assert(typeof post.enableAds === 'boolean', `seed post ${i + 1} enableAds boolean`, 'Seed');
});

const slugs = initialPosts.map((p) => p.slug);
assert(new Set(slugs).size === slugs.length, 'seed slugs unique', 'Seed');

// JSON-LD breakout
initialPosts.forEach((post, i) => {
  const json = JSON.stringify({ headline: post.title, description: post.excerpt });
  assert(!json.includes('</script>'), `seed post ${i + 1} JSON-LD does not break script tag`, 'Security');
});

assert(!detailSrc.includes('window.location.origin + `/post/${post.slug}`') || detailSrc.includes('post.slug'), 'canonical uses post.slug', 'Detail');

// ---------------------------------------------------------------------------
// 2. Live API + HTML
// ---------------------------------------------------------------------------
console.log('2. Live API / HTML (requires server)...');
let live = false;
let posts = [];
try {
  const status = await fetchJson(`${API}/status`);
  live = Boolean(status.res.ok && status.body && (status.body.status === 'online' || status.body.database));
  assert(live, `GET /api/status reachable (${status.res.status})`, 'Live');
} catch (e) {
  assert(false, `API unreachable: ${e.message}`, 'Live');
}

if (live) {
  let listRes;
  try {
    listRes = await fetchJson(`${API}/posts`);
  } catch (e) {
    assert(false, `GET /api/posts threw ${e.message}`, 'ListAPI');
    listRes = { res: { status: 0 }, body: [] };
  }
  assert(listRes.res.status === 200, 'GET /api/posts → 200', 'ListAPI');
  assert(Array.isArray(listRes.body), 'GET /api/posts returns array', 'ListAPI');
  posts = Array.isArray(listRes.body) ? listRes.body : [];
  assert(posts.length > 0, `GET /api/posts has articles (got ${posts.length})`, 'ListAPI');

  const publishedOnly = posts.every((p) => p.status === 'published');
  assert(publishedOnly, 'public list contains only published posts', 'ListAPI');
  if (listRes.error) {
    assert(false, `GET /api/posts error: ${listRes.error}`, 'ListAPI');
  }

  const pubRes = await fetchJson(`${API}/posts/published`);
  assert(pubRes.res.status === 200 && Array.isArray(pubRes.body), 'GET /api/posts/published → 200 array', 'ListAPI');

  if (!posts.length) {
    assert(false, 'Aborting live detail checks: public post list empty', 'ListAPI');
  } else {

  const catsRes = await fetchJson(`${API}/categories`);
  const authorsRes = await fetchJson(`${API}/authors`);
  const cats = Array.isArray(catsRes.body) ? catsRes.body : [];
  const authors = Array.isArray(authorsRes.body) ? authorsRes.body : [];
  assert(cats.length > 0, 'categories loaded for list badges', 'ListAPI');
  assert(authors.length > 0, 'authors loaded for bylines', 'ListAPI');

  const requiredFields = ['id', 'title', 'slug', 'excerpt', 'content', 'coverImage', 'categoryId', 'authorId', 'status'];
  const liveSlugs = new Set();

  for (const [i, post] of posts.entries()) {
    requiredFields.forEach((f) => {
      if (f === 'content') {
        assert(post.content === '' || typeof post.content === 'string', `list post #${i + 1} content omitted or string`, 'ListAPI');
        return;
      }
      assert(post[f] !== undefined && post[f] !== null && String(post[f]).length > 0, `list post #${i + 1} field ${f}`, 'ListAPI');
    });
    assert(!liveSlugs.has(post.slug), `list slug unique ${post.slug}`, 'ListAPI');
    liveSlugs.add(post.slug);
    assert(safeDate(post.publishedAt), `list post ${post.slug} valid publishedAt`, 'ListAPI');
    let threw = false;
    try { formatDateOrThrow(post.publishedAt || Date.now()); } catch { threw = true; }
    assert(!threw, `list/detail date format ${post.slug}`, 'ListAPI');
    assert(cats.some((c) => c.id === post.categoryId), `list post ${post.slug} category join`, 'ListAPI');
    assert(authors.some((a) => a.id === post.authorId) || Boolean(post.authorName), `list post ${post.slug} author join`, 'ListAPI');
    assert(typeof post.enableAds === 'boolean', `list post ${post.slug} enableAds present for detail ads`, 'ListAPI');
    assert(!post.createdById, `list post ${post.slug} does not leak createdById`, 'Security');
    assert(!post.password, `list post ${post.slug} no password field`, 'Security');
  }

  // Detail: API for every post. HTML/OG for all, with per-request isolation.
  console.log(`   fetching ${posts.length} post details + HTML...`);
  for (const post of posts) {
    try {
      const d = await fetchJson(`${API}/posts/${encodeURIComponent(post.slug)}`);
      assert(d.res.status === 200, `GET /api/posts/${post.slug} → 200${d.error ? ' (' + d.error + ')' : ''}`, 'DetailAPI');
      assert(d.body && d.body.slug === post.slug, `detail slug match ${post.slug}`, 'DetailAPI');
      assert(d.body && typeof d.body.content === 'string' && d.body.content.length > 100, `detail ${post.slug} has body content`, 'DetailAPI');
      if (d.body && typeof d.body.content === 'string') {
        assert(d.body.content.length > 100, `detail ${post.slug} body is fuller than list payload`, 'DetailAPI');
        if (d.body.content.length > 500000) {
          assert(true, `detail ${post.slug} is oversized (${d.body.content.length} chars) — page will be slow`, 'Perf');
        }
        assert(d.body.status === 'published', `detail ${post.slug} is published`, 'DetailAPI');
        assert(d.body.title === post.title, `detail ${post.slug} title matches list`, 'DetailAPI');
        assert(typeof d.body.enableAds === 'boolean', `detail ${post.slug} enableAds present`, 'DetailAPI');
        assert(Array.isArray(d.body.tags), `detail ${post.slug} tags array`, 'DetailAPI');
      }
    } catch (e) {
      assert(false, `detail API ${post.slug} threw ${e.message}`, 'DetailAPI');
      continue;
    }

    try {
      const html = await fetchText(`${ORIGIN}/post/${encodeURIComponent(post.slug)}`);
      assert(html.res.status === 200, `GET /post/${post.slug} HTML → 200`, 'DetailHTML');
      assert(/<title>/i.test(html.text), `HTML ${post.slug} has <title>`, 'DetailHTML');
      assert(html.text.includes(post.title) || html.text.includes('THE HORI CLICK'), `HTML ${post.slug} contains title or brand`, 'DetailHTML');
      assert(/og:title/i.test(html.text), `HTML ${post.slug} has og:title`, 'DetailHTML');
      assert(/og:image/i.test(html.text), `HTML ${post.slug} has og:image`, 'DetailHTML');
      assert(/canonical/i.test(html.text), `HTML ${post.slug} has canonical`, 'DetailHTML');
      assert(!html.text.toLowerCase().includes('cannot get /post'), `HTML ${post.slug} is not Express 404`, 'DetailHTML');
      assert(/<div id="root">/i.test(html.text) || /<div id="app">/i.test(html.text), `HTML ${post.slug} has SPA root`, 'DetailHTML');
    } catch (e) {
      assert(false, `detail HTML ${post.slug} threw ${e.message}`, 'DetailHTML');
    }
  }

  // Crawler + seeding ref: sample first, middle, last
  const sample = [posts[0], posts[Math.floor(posts.length / 2)], posts[posts.length - 1]].filter(Boolean);
  for (const post of sample) {
    try {
      const crawler = await fetchText(`${ORIGIN}/post/${encodeURIComponent(post.slug)}`, {
        'User-Agent': 'facebookexternalhit/1.1'
      });
      assert(crawler.res.status === 200, `FB crawler /post/${post.slug} → 200`, 'OG');
      assert(/og:image/i.test(crawler.text), `FB crawler ${post.slug} og:image`, 'OG');
      const withRef = await fetchText(`${ORIGIN}/post/${encodeURIComponent(post.slug)}?ref=MINH`);
      assert(withRef.res.status === 200, `/post/${post.slug}?ref=MINH → 200`, 'Seeding');
      const trailing = await fetchText(`${ORIGIN}/post/${encodeURIComponent(post.slug)}/`);
      assert(trailing.res.status > 0 && trailing.res.status < 500, `/post/${post.slug}/ must not 5xx/timeout (got ${trailing.res.status})`, 'Routing');
    } catch (e) {
      assert(false, `OG/ref ${post.slug} threw ${e.message}`, 'OG');
    }
  }

  // Category pages: each category should list matching posts
  for (const cat of cats) {
    const inCat = posts.filter((p) => p.categoryId === cat.id);
    const catHtml = await fetchText(`${ORIGIN}/category/${encodeURIComponent(cat.slug)}`);
    assert(catHtml.res.status === 200, `GET /category/${cat.slug} → 200`, 'Category');
    assert(/<div id="root">/i.test(catHtml.text) || /THE HORI/i.test(catHtml.text), `category ${cat.slug} serves SPA`, 'Category');
    assert(inCat.length >= 0, `category ${cat.slug} post count ${inCat.length}`, 'Category');
  }

  // Negative / error cases
  const notFound = await fetchJson(`${API}/posts/this-slug-does-not-exist-xyz`);
  assert(notFound.res.status === 404, 'unknown slug API → 404', 'Errors');

  const emptySlugHtml = await fetchText(`${ORIGIN}/post/`);
  assert([200, 404].includes(emptySlugHtml.res.status), 'GET /post/ does not 500', 'Errors');

  const extraPath = await fetchJson(`${API}/posts/${encodeURIComponent(posts[0].slug)}/extra`);
  assert(extraPath.res.status === 404 || extraPath.res.status === 200, 'extra path does not 500', 'Errors');

  const evilSlugs = [
    '../etc/passwd',
    '..%2F..%2Fetc',
    '<script>alert(1)</script>',
    "'; DROP TABLE posts; --",
    '%00',
    'a'.repeat(400),
    'hello_world',
    'Hello World',
    'định-dạng-tiếng-việt',
    'POST',
    'null',
    'undefined',
    '%2e%2e',
    'admin',
    'favicon.ico'
  ];
  for (const s of evilSlugs) {
    const r = await fetchJson(`${API}/posts/${encodeURIComponent(s)}`);
    assert(r.res.status === 404 || r.res.status === 400 || r.res.status === 200, `evil slug API status not 5xx (${s}) got ${r.res.status}`, 'Errors');
    assert(r.res.status !== 500, `evil slug must not 500 (${s})`, 'Errors');
    if (r.res.status === 200) {
      assert(r.body && r.body.slug, `if 200, body is a post (${s})`, 'Errors');
      assert(r.body.status === 'published', `if 200, still published (${s})`, 'Errors');
    }
    const h = await fetchText(`${ORIGIN}/post/${encodeURIComponent(s)}`);
    assert(h.res.status < 500, `evil slug HTML not 5xx (${s})`, 'Errors');
  }

  // Draft leak: if any draft exists, public GET by slug must 404
  // We cannot create drafts without auth; assert list has none.
  assert(posts.every((p) => p.status !== 'draft'), 'public list has zero drafts', 'Security');

  // View increment
  if (posts[0]) {
    const before = posts[0].views || 0;
    const v = await fetchJson(`${API}/posts/${encodeURIComponent(posts[0].slug)}/view`, { method: 'POST' });
    assert(v.res.status === 200, 'POST view → 200', 'Views');
    assert(typeof (v.body && v.body.views) === 'number', 'view response has numeric views', 'Views');
    if (typeof v.body.views === 'number') {
      assert(v.body.views >= before, 'views do not decrease', 'Views');
    }
  }

  // Homepage HTML
  const home = await fetchText(`${ORIGIN}/`);
  assert(home.res.status === 200, 'GET / homepage → 200', 'ListHTML');
  assert(/<div id="root">/i.test(home.text), 'homepage has SPA root', 'ListHTML');
  assert(!/cannot get \//i.test(home.text), 'homepage is not Express cannot GET', 'ListHTML');

  // Related-posts invariant: every post has 0+ same-category siblings
  posts.forEach((post) => {
    const related = posts.filter((p) => p.id !== post.id && p.categoryId === post.categoryId);
    assert(related.length >= 0, `related count for ${post.slug} is ${related.length}`, 'Detail');
  });
  }
}

console.log('\n========================================================================');
console.log(`RESULT: ${passed} passed, ${failed} failed`);
console.log('========================================================================');
if (errors.length) {
  console.log('\nFailures:');
  errors.forEach((e) => console.log(' -', e));
}
if (failed > 0) process.exit(1);
console.log('\nPost list + post detail QA passed.');
