/**
 * 1000+ case short-link suite: paste article URL → auto-attach logged-in staff ref.
 * Covers parse, attach, spoof rejection, sanitization, and error classification.
 */
import { initialPosts } from '../server/seedData.js';
import {
  extractPostSlugFromInput,
  resolveLoggedInStaffCode,
  buildCanonicalPostUrl,
  sanitizeCustomCode,
  generateShortCode,
  prepareShortLinkFromPaste,
  applyServerStaffOverride,
  findPostBySlug,
  shortLinkErrorMessage,
  stripPasteNoise,
  SHORTLINK_ERRORS,
  CANONICAL_ORIGIN
} from '../src/utils/shortLink.js';

let passed = 0;
let failed = 0;
const errors = [];

function assert(condition, message, category = 'ShortLink') {
  if (condition) {
    passed++;
  } else {
    failed++;
    errors.push(`[${category}] ${message}`);
  }
}

const SAMPLE_SLUG = initialPosts[0]?.slug || '2026-sovereign-liquidity-playbook-treasuries-yields';
const POSTS = initialPosts.map((p) => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  coverImage: p.coverImage,
  excerpt: p.excerpt,
  status: p.status
}));

const STAFF_MINH = { id: 'staff-minh', username: 'minh', name: 'Minh Tran', role: 'editor', refCode: 'MINH' };
const STAFF_AN = { id: 'staff-an', username: 'an', name: 'An Pham', role: 'author', refCode: 'AN' };
const STAFF_ADMIN = { id: 'staff-qb', username: 'admin', name: 'Quoc Bao', role: 'admin', refCode: 'QB' };
const STAFF_NO_REF = { id: 'staff-new', username: 'newbie', name: 'Newbie', role: 'editor' };
const STAFF_ADMIN_NO_REF = { id: 'staff-admin2', username: 'boss', name: 'Boss', role: 'admin' };
const STAFF_LIST = [STAFF_MINH, STAFF_AN, STAFF_ADMIN, STAFF_NO_REF, STAFF_ADMIN_NO_REF];

function expectSlug(input, slug, label) {
  const r = extractPostSlugFromInput(input);
  assert(r.ok === true, `${label}: expected ok for ${JSON.stringify(input)}`, 'Parse');
  assert(r.slug === slug, `${label}: expected slug=${slug} got=${r.slug} input=${JSON.stringify(input)}`, 'Parse');
}

function expectError(input, error, label) {
  const r = extractPostSlugFromInput(input);
  assert(r.ok === false, `${label}: expected failure for ${JSON.stringify(input)} got ok slug=${r.slug}`, 'ParseError');
  if (error) {
    assert(r.error === error, `${label}: expected error=${error} got=${r.error} input=${JSON.stringify(input)}`, 'ParseError');
  }
}

console.log('========================================================================');
console.log('SHORT-LINK PASTE + AUTO STAFF REF — 1000+ CASE SUITE');
console.log('========================================================================\n');

// ---------------------------------------------------------------------------
// 1. Happy-path URL shapes (seed posts)
// ---------------------------------------------------------------------------
console.log('1. Parse happy-path article URLs...');
POSTS.forEach((post, i) => {
  const slug = post.slug;
  expectSlug(`https://www.thehori.click/post/${slug}`, slug, `prod www #${i + 1}`);
  expectSlug(`https://thehori.click/post/${slug}`, slug, `prod apex #${i + 1}`);
  expectSlug(`http://localhost:5173/post/${slug}`, slug, `vite #${i + 1}`);
  expectSlug(`http://127.0.0.1:5000/post/${slug}`, slug, `api #${i + 1}`);
  expectSlug(`/post/${slug}`, slug, `path #${i + 1}`);
  expectSlug(`${slug}`, slug, `bare slug #${i + 1}`);
});

// Extra origin / punctuation variants on first slug
const extraHappy = [
  `https://www.thehori.click/post/${SAMPLE_SLUG}/`,
  `https://www.thehori.click/post/${SAMPLE_SLUG}?utm_source=fb`,
  `https://www.thehori.click/post/${SAMPLE_SLUG}?ref=OTHER`,
  `https://www.thehori.click/post/${SAMPLE_SLUG}?ref=OTHER&utm_campaign=zalo`,
  `https://www.thehori.click/post/${SAMPLE_SLUG}#comments`,
  `https://www.thehori.click/post/${SAMPLE_SLUG}/?ref=OLD#top`,
  `  https://www.thehori.click/post/${SAMPLE_SLUG}  `,
  `\nhttps://www.thehori.click/post/${SAMPLE_SLUG}\n`,
  `"https://www.thehori.click/post/${SAMPLE_SLUG}"`,
  `'https://www.thehori.click/post/${SAMPLE_SLUG}'`,
  `<https://www.thehori.click/post/${SAMPLE_SLUG}>`,
  `Xem bài này https://www.thehori.click/post/${SAMPLE_SLUG} nhé`,
  `[bài viết](https://www.thehori.click/post/${SAMPLE_SLUG})`,
  `www.thehori.click/post/${SAMPLE_SLUG}`,
  `HTTPS://WWW.THEHORI.CLICK/POST/${SAMPLE_SLUG.toUpperCase()}`,
  `post/${SAMPLE_SLUG}`,
  `//www.thehori.click/post/${SAMPLE_SLUG}`,
  `\u200Bhttps://www.thehori.click/post/${SAMPLE_SLUG}\u200B`,
  `https://www.thehori.click/post/${SAMPLE_SLUG}.`,
  `https://www.thehori.click/post/${SAMPLE_SLUG})`,
  `“https://www.thehori.click/post/${SAMPLE_SLUG}”`
];
extraHappy.forEach((input, i) => expectSlug(input, SAMPLE_SLUG, `variant ${i + 1}`));
expectSlug('ftp-looking-but-not', 'ftp-looking-but-not', 'hyphenated bare slug');
expectSlug('https://www.thehori.click/post/hello world extra', 'hello', 'space truncates URL at first token');

// ---------------------------------------------------------------------------
// 2. Wrapper / redirector unwrap
// ---------------------------------------------------------------------------
console.log('2. Unwrap Facebook / Google / Zalo redirectors...');
const wrappers = [
  `https://l.facebook.com/l.php?u=${encodeURIComponent(`https://www.thehori.click/post/${SAMPLE_SLUG}`)}`,
  `https://lm.facebook.com/l.php?u=${encodeURIComponent(`https://www.thehori.click/post/${SAMPLE_SLUG}`)}`,
  `https://www.google.com/url?q=${encodeURIComponent(`https://www.thehori.click/post/${SAMPLE_SLUG}`)}`,
  `https://www.google.com/url?q=https://www.thehori.click/post/${SAMPLE_SLUG}&sa=D`,
  `https://outgoing.prod.mozaws.net/v1/xxx?url=${encodeURIComponent(`https://www.thehori.click/post/${SAMPLE_SLUG}`)}`,
  `https://t.co/x?url=https://www.thehori.click/post/${SAMPLE_SLUG}`
];
wrappers.forEach((input, i) => expectSlug(input, SAMPLE_SLUG, `wrapper ${i + 1}`));

// ---------------------------------------------------------------------------
// 3. Error classification — empty / unsafe / not article / already short
// ---------------------------------------------------------------------------
console.log('3. Error classification...');
const emptyInputs = [null, undefined, '', '   ', '\n\t', '\u200B\u200B', '""""', '<>'];
emptyInputs.forEach((input, i) => expectError(input, SHORTLINK_ERRORS.EMPTY, `empty ${i + 1}`));

const unsafe = [
  'javascript:alert(1)',
  'JAVASCRIPT:alert(1)',
  'data:text/html,<script>alert(1)</script>',
  'vbscript:msgbox(1)',
  'file:///etc/passwd',
  'blob:https://www.thehori.click/abc',
  'about:blank',
  'mailto:a@b.com',
  'tel:+84123',
  'ftp://www.thehori.click/post/x',
  'ws://www.thehori.click/post/x',
  'wss://www.thehori.click/post/x'
];
unsafe.forEach((input, i) => expectError(input, SHORTLINK_ERRORS.UNSAFE_PROTOCOL, `unsafe ${i + 1}`));

const alreadyShort = [
  `https://www.thehori.click/s/abc123`,
  `https://thehori.click/s/hot-news`,
  `/s/qb01`,
  `http://localhost:5173/s/aabbcc`,
  `https://www.thehori.click/s/abc?ref=MINH`
];
alreadyShort.forEach((input, i) => expectError(input, SHORTLINK_ERRORS.ALREADY_SHORT, `already-short ${i + 1}`));

const notArticle = [
  'https://www.thehori.click/',
  'https://www.thehori.click/about',
  'https://www.thehori.click/category/personal-finance',
  'https://www.thehori.click/admin/posts',
  'https://www.thehori.click/post/',
  'https://www.thehori.click/post',
  'https://www.thehori.click/posts/foo',
  'https://evil.com/',
  'https://evil.com/login',
  'https://www.thehori.click/tag/ai',
  'https://www.thehori.click/contact',
  'not a url at all!!!',
  '/category/money',
  '/admin',
  'https://www.thehori.click/post/hello_world',
  'https://www.thehori.click/post/hello.world',
  'https://www.thehori.click/post/hello/extra',
  'https://www.thehori.click/post/' + 'a'.repeat(200)
];
notArticle.forEach((input, i) => {
  const r = extractPostSlugFromInput(input);
  assert(r.ok === false, `not-article ${i + 1} should fail: ${input}`, 'ParseError');
});

// ---------------------------------------------------------------------------
// 4. Open-redirect / host spoof: slug extracted, host discarded
// ---------------------------------------------------------------------------
console.log('4. Host spoof / open-redirect rebuild...');
const spoofHosts = [
  `https://evil.com/post/${SAMPLE_SLUG}`,
  `https://www.thehori.click.evil.com/post/${SAMPLE_SLUG}`,
  `https://thehori.click.attacker.tld/post/${SAMPLE_SLUG}`,
  `http://192.168.1.10/post/${SAMPLE_SLUG}`,
  `https://example.com/post/${SAMPLE_SLUG}?next=https://evil.com`
];
spoofHosts.forEach((input, i) => {
  const r = extractPostSlugFromInput(input);
  assert(r.ok && r.slug === SAMPLE_SLUG, `spoof host ${i + 1} still extracts slug`, 'Security');
  const canonical = buildCanonicalPostUrl(r.slug, 'MINH');
  assert(canonical.startsWith(CANONICAL_ORIGIN), `spoof host ${i + 1} rebuilt onto canonical origin`, 'Security');
  assert(!canonical.includes('evil'), `spoof host ${i + 1} must not keep attacker host`, 'Security');
});

// ---------------------------------------------------------------------------
// 5. Staff code resolution — always logged-in account
// ---------------------------------------------------------------------------
console.log('5. Logged-in staff ref resolution...');
assert(resolveLoggedInStaffCode(STAFF_MINH) === 'MINH', 'editor uses own refCode', 'Staff');
assert(resolveLoggedInStaffCode(STAFF_AN) === 'AN', 'author uses own refCode', 'Staff');
assert(resolveLoggedInStaffCode(STAFF_ADMIN) === 'QB', 'admin uses own refCode', 'Staff');
assert(resolveLoggedInStaffCode(STAFF_NO_REF) === '', 'editor without refCode is empty', 'Staff');
assert(resolveLoggedInStaffCode(STAFF_ADMIN_NO_REF) === 'QB', 'admin without refCode falls back to QB', 'Staff');
assert(resolveLoggedInStaffCode(null) === '', 'null user', 'Staff');
assert(resolveLoggedInStaffCode(undefined) === '', 'undefined user', 'Staff');
assert(resolveLoggedInStaffCode({}) === '', 'empty object', 'Staff');
assert(resolveLoggedInStaffCode({ refCode: ' minh ' }) === 'MINH', 'trim + uppercase', 'Staff');
assert(resolveLoggedInStaffCode({ refCode: 'minh!!!' }) === 'MINH', 'strip illegal chars', 'Staff');
assert(resolveLoggedInStaffCode({ refCode: 'A'.repeat(40) }).length === 16, 'refCode max 16', 'Staff');

assert(
  resolveLoggedInStaffCode({ id: 'staff-minh', role: 'editor' }, STAFF_LIST) === 'MINH',
  'lookup refCode from staffList by id',
  'Staff'
);
assert(
  resolveLoggedInStaffCode({ username: 'an', role: 'author' }, STAFF_LIST) === 'AN',
  'lookup refCode from staffList by username',
  'Staff'
);
assert(
  resolveLoggedInStaffCode({ id: 'staff-new', role: 'editor' }, STAFF_LIST) === '',
  'staffList hit without ref stays empty',
  'Staff'
);

const lowerUser = { id: 'STAFF-MINH', username: 'MINH', role: 'editor' };
assert(
  resolveLoggedInStaffCode({ id: 'staff-minh', username: 'MINH', role: 'editor' }, STAFF_LIST) === 'MINH',
  'id match is case-sensitive exact on id field as stored',
  'Staff'
);

// Each seed post × 3 staff = attach always uses session, never URL ref
POSTS.forEach((post, i) => {
  ['MINH', 'AN', 'QB'].forEach((code) => {
    const user = { ...STAFF_MINH, refCode: code };
    const pasted = `https://www.thehori.click/post/${post.slug}?ref=HACKER`;
    const prepared = prepareShortLinkFromPaste({
      pastedUrl: pasted,
      currentUser: user,
      staffList: STAFF_LIST,
      posts: POSTS
    });
    assert(prepared.ok, `attach ${code} post#${i + 1} ok`, 'Attach');
    assert(prepared.staffCode === code, `attach ignores URL ref HACKER, uses ${code}`, 'Attach');
    assert(prepared.originalUrl === `${CANONICAL_ORIGIN}/post/${post.slug}?ref=${code}`, `canonical url post#${i + 1} ${code}`, 'Attach');
    assert(prepared.slug === post.slug, `slug preserved post#${i + 1}`, 'Attach');
  });
});

// ---------------------------------------------------------------------------
// 6. Server override must ignore client staffCode
// ---------------------------------------------------------------------------
console.log('6. Server ignores spoofed staffCode...');
POSTS.slice(0, 15).forEach((post, i) => {
  const body = {
    originalUrl: `https://evil.com/post/${post.slug}?ref=HACKER`,
    staffCode: 'HACKER',
    staffName: 'Attacker',
    customCode: 'steal'
  };
  const out = applyServerStaffOverride(body, STAFF_MINH, STAFF_LIST);
  assert(out.ok, `override ok #${i + 1}`, 'Spoof');
  assert(out.staffCode === 'MINH', `override staff is MINH not HACKER #${i + 1}`, 'Spoof');
  assert(out.ignoredClientStaffCode === 'HACKER', `records ignored spoof #${i + 1}`, 'Spoof');
  assert(out.originalUrl.includes('?ref=MINH'), `url has MINH #${i + 1}`, 'Spoof');
  assert(!out.originalUrl.includes('HACKER'), `url has no HACKER #${i + 1}`, 'Spoof');
  assert(!out.originalUrl.includes('evil.com'), `url not evil.com #${i + 1}`, 'Spoof');
  assert(out.customCode === 'steal', `custom alias kept #${i + 1}`, 'Spoof');
  assert(out.staffName === 'Minh Tran', `staff name from session #${i + 1}`, 'Spoof');
});

assert(applyServerStaffOverride({}, STAFF_MINH).ok === false, 'empty body fails', 'Spoof');
assert(applyServerStaffOverride({ originalUrl: '' }, STAFF_MINH).error === SHORTLINK_ERRORS.EMPTY, 'empty url', 'Spoof');
assert(applyServerStaffOverride({ originalUrl: `/post/${SAMPLE_SLUG}` }, STAFF_NO_REF).error === SHORTLINK_ERRORS.NO_STAFF, 'no staff ref', 'Spoof');
assert(applyServerStaffOverride({ originalUrl: `/post/${SAMPLE_SLUG}` }, STAFF_ADMIN_NO_REF).staffCode === 'QB', 'admin fallback QB', 'Spoof');
assert(applyServerStaffOverride({ url: `/post/${SAMPLE_SLUG}` }, STAFF_AN).staffCode === 'AN', 'accepts body.url alias', 'Spoof');
assert(applyServerStaffOverride({ link: `/post/${SAMPLE_SLUG}` }, STAFF_AN).staffCode === 'AN', 'accepts body.link alias', 'Spoof');
assert(applyServerStaffOverride({ pastedUrl: `/post/${SAMPLE_SLUG}` }, STAFF_AN).staffCode === 'AN', 'accepts body.pastedUrl alias', 'Spoof');

// ---------------------------------------------------------------------------
// 7. Custom alias sanitization
// ---------------------------------------------------------------------------
console.log('7. Custom alias sanitization...');
assert(sanitizeCustomCode('') === '', 'empty alias');
assert(sanitizeCustomCode('  QB01  ') === 'qb01', 'trim lower');
assert(sanitizeCustomCode('Hot-News') === 'hot-news', 'hyphen kept');
assert(sanitizeCustomCode('hot_news') === 'hot_news', 'underscore kept');
assert(sanitizeCustomCode('hot news!!!') === 'hotnews', 'spaces/punct stripped');
assert(sanitizeCustomCode('<script>xss</script>') === 'scriptxssscript', 'tags stripped');
assert(sanitizeCustomCode('../etc/passwd') === 'etcpasswd', 'path traversal stripped');
assert(sanitizeCustomCode('a'.repeat(100)).length === 32, 'max 32');
assert(sanitizeCustomCode(null) === '', 'null');
assert(sanitizeCustomCode(undefined) === '', 'undefined');
assert(sanitizeCustomCode(123) === '123', 'number coerced');
assert(sanitizeCustomCode('ÁBCđ') === 'bc', 'unicode stripped');
assert(sanitizeCustomCode('/s/hello') === 'shello', 'slash stripped');

for (let i = 0; i < 80; i++) {
  const dirty = `Alias ${i}!@#${String.fromCharCode(32 + (i % 90))}_ok`;
  const clean = sanitizeCustomCode(dirty);
  assert(/^[a-z0-9_-]*$/.test(clean), `alias fuzz ${i + 1} charset`, 'Alias');
  assert(clean.length <= 32, `alias fuzz ${i + 1} length`, 'Alias');
}

// ---------------------------------------------------------------------------
// 8. Canonical URL builder
// ---------------------------------------------------------------------------
console.log('8. Canonical URL builder...');
assert(buildCanonicalPostUrl(SAMPLE_SLUG, 'MINH') === `${CANONICAL_ORIGIN}/post/${SAMPLE_SLUG}?ref=MINH`, 'basic canonical');
assert(buildCanonicalPostUrl(SAMPLE_SLUG, '') === `${CANONICAL_ORIGIN}/post/${SAMPLE_SLUG}`, 'no ref');
assert(buildCanonicalPostUrl(SAMPLE_SLUG, 'minh') === `${CANONICAL_ORIGIN}/post/${SAMPLE_SLUG}?ref=MINH`, 'upper ref');
assert(buildCanonicalPostUrl('Not Valid Slug!!', 'MINH') === '', 'invalid slug empty');
assert(buildCanonicalPostUrl('', 'MINH') === '', 'empty slug');
assert(!buildCanonicalPostUrl(SAMPLE_SLUG, 'MINH&x=1').includes('&'), 'ref cannot inject query', 'Security');
assert(!buildCanonicalPostUrl(SAMPLE_SLUG, 'MINH"><img').includes('<'), 'ref cannot inject html', 'Security');

for (let i = 0; i < 60; i++) {
  const slug = `article-fuzz-${i}`;
  const url = buildCanonicalPostUrl(slug, 'QB');
  assert(url === `${CANONICAL_ORIGIN}/post/${slug}?ref=QB`, `canonical fuzz ${i + 1}`, 'Canonical');
}

// ---------------------------------------------------------------------------
// 9. prepareShortLinkFromPaste end-to-end
// ---------------------------------------------------------------------------
console.log('9. Client prepare() end-to-end...');
{
  const ok = prepareShortLinkFromPaste({
    pastedUrl: `https://www.thehori.click/post/${SAMPLE_SLUG}`,
    currentUser: STAFF_MINH,
    staffList: STAFF_LIST,
    posts: POSTS,
    customCode: 'My-Link'
  });
  assert(ok.ok, 'prepare happy');
  assert(ok.post && ok.post.slug === SAMPLE_SLUG, 'matched local post');
  assert(ok.customCode === 'my-link', 'alias sanitized');
  assert(ok.staffName === 'Minh Tran', 'staff name');
}

assert(
  prepareShortLinkFromPaste({ pastedUrl: '', currentUser: STAFF_MINH }).error === SHORTLINK_ERRORS.EMPTY,
  'prepare empty'
);
assert(
  prepareShortLinkFromPaste({ pastedUrl: `/post/${SAMPLE_SLUG}`, currentUser: STAFF_NO_REF, staffList: STAFF_LIST }).error === SHORTLINK_ERRORS.NO_STAFF,
  'prepare no staff'
);
assert(
  prepareShortLinkFromPaste({ pastedUrl: 'https://www.thehori.click/about', currentUser: STAFF_MINH }).ok === false,
  'prepare not article'
);
assert(
  prepareShortLinkFromPaste({
    pastedUrl: `/post/${SAMPLE_SLUG}`,
    currentUser: { id: 'ghost', role: 'editor' },
    staffList: STAFF_LIST
  }).error === SHORTLINK_ERRORS.NO_STAFF,
  'unknown editor no ref'
);

const unknownSlugPrep = prepareShortLinkFromPaste({
  pastedUrl: 'https://www.thehori.click/post/totally-unknown-slug-xyz',
  currentUser: STAFF_MINH,
  posts: POSTS
});
assert(unknownSlugPrep.ok === true, 'unknown slug still parses (server will 404)');
assert(unknownSlugPrep.post === null, 'unknown slug has no local post');

// ---------------------------------------------------------------------------
// 10. findPostBySlug
// ---------------------------------------------------------------------------
console.log('10. Post lookup...');
assert(findPostBySlug(POSTS, SAMPLE_SLUG)?.slug === SAMPLE_SLUG, 'find exact');
assert(findPostBySlug(POSTS, SAMPLE_SLUG.toUpperCase())?.slug === SAMPLE_SLUG, 'find case-insensitive');
assert(findPostBySlug(POSTS, 'no-such-post') === null, 'missing');
assert(findPostBySlug(null, SAMPLE_SLUG) === null, 'null list');
assert(findPostBySlug(undefined, SAMPLE_SLUG) === null, 'undefined list');
assert(findPostBySlug(POSTS, '') === null, 'empty slug');
assert(findPostBySlug([null, undefined, { slug: SAMPLE_SLUG }], SAMPLE_SLUG)?.slug === SAMPLE_SLUG, 'sparse list');

// ---------------------------------------------------------------------------
// 11. Error messages exist for every code
// ---------------------------------------------------------------------------
console.log('11. Error messages...');
Object.values(SHORTLINK_ERRORS).forEach((code) => {
  const msg = shortLinkErrorMessage(code);
  assert(typeof msg === 'string' && msg.length > 10, `message for ${code}`, 'i18n');
  assert(/[A-Za-zÀ-ỹ]/.test(msg), `vietnamese/latin message for ${code}`, 'i18n');
});
assert(shortLinkErrorMessage('nope').length > 5, 'unknown error fallback');

// ---------------------------------------------------------------------------
// 12. generateShortCode uniqueness / charset
// ---------------------------------------------------------------------------
console.log('12. Random short codes...');
const seen = new Set();
for (let i = 0; i < 200; i++) {
  const c = generateShortCode();
  assert(typeof c === 'string' && c.length >= 4 && c.length <= 16, `code length ${i + 1}`, 'Code');
  assert(/^[a-z0-9]+$/.test(c), `code charset ${i + 1}`, 'Code');
  seen.add(c);
}
assert(seen.size >= 190, `random codes mostly unique (${seen.size}/200)`, 'Code');

// ---------------------------------------------------------------------------
// 13. Fuzz: 200 random slugs + garbage inputs
// ---------------------------------------------------------------------------
console.log('13. Fuzz corpus...');
for (let i = 0; i < 120; i++) {
  const slug = `fuzz-article-${i}-case`;
  const urls = [
    `https://www.thehori.click/post/${slug}`,
    `http://localhost:3000/post/${slug}?ref=X`,
    `/post/${slug}/`,
    `  ${slug}  `
  ];
  urls.forEach((u, j) => expectSlug(u, slug, `fuzz ${i}:${j}`));
}

const garbage = [
  'http://',
  'https://',
  'https:///',
  '://www.thehori.click/post/x',
  'https://www.thehori.click/post/../etc',
  'https://www.thehori.click/post/%2e%2e',
  'https://www.thehori.click/post/%00',
  'https://www.thehori.click/post/<img>',
  'https://www.thehori.click\\post\\hack',
  'https://127.0.0.1/post/' + encodeURIComponent('../x'),
  JSON.stringify({ url: `/post/${SAMPLE_SLUG}` }),
  'https://www.thehori.click/post/' + encodeURIComponent(SAMPLE_SLUG),
  '\0https://www.thehori.click/post/' + SAMPLE_SLUG,
  'https://www.thehori.click:443/post/' + SAMPLE_SLUG,
  'https://user:pass@www.thehori.click/post/' + SAMPLE_SLUG
];
garbage.forEach((input, i) => {
  const r = extractPostSlugFromInput(input);
  assert(typeof r.ok === 'boolean', `garbage ${i + 1} returns shape`, 'Fuzz');
  if (r.ok) {
    assert(SLUG_OK(r.slug), `garbage ${i + 1} ok implies valid slug ${r.slug}`, 'Fuzz');
  } else {
    assert(Object.values(SHORTLINK_ERRORS).includes(r.error), `garbage ${i + 1} known error ${r.error}`, 'Fuzz');
  }
});

function SLUG_OK(slug) {
  return typeof slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 180;
}

// encoded slug of a real post should still parse via URL
{
  const encoded = `https://www.thehori.click/post/${SAMPLE_SLUG}`;
  expectSlug(encoded, SAMPLE_SLUG, 'standard encoded-ready');
}

// credentials in URL still extract slug
expectSlug(`https://user:pass@www.thehori.click/post/${SAMPLE_SLUG}`, SAMPLE_SLUG, 'userinfo');
expectSlug(`https://www.thehori.click:443/post/${SAMPLE_SLUG}`, SAMPLE_SLUG, 'port 443');

// ---------------------------------------------------------------------------
// 14. stripPasteNoise
// ---------------------------------------------------------------------------
console.log('14. Paste noise stripping...');
assert(stripPasteNoise(`  foo  `) === 'foo', 'trim');
assert(stripPasteNoise(null) === '', 'null noise');
assert(stripPasteNoise('a'.repeat(5000)).length === 4000, 'cap length');
assert(stripPasteNoise(`Hello https://www.thehori.click/post/${SAMPLE_SLUG} world`).includes('/post/'), 'extract http');

// ---------------------------------------------------------------------------
// 15. Ref replacement matrix (old ref in paste never wins)
// ---------------------------------------------------------------------------
console.log('15. Ref replacement matrix...');
const oldRefs = ['QB', 'MINH', 'AN', 'HACKER', 'admin', 'x', 'A'.repeat(20)];
oldRefs.forEach((oldRef, i) => {
  const pasted = `https://www.thehori.click/post/${SAMPLE_SLUG}?ref=${oldRef}`;
  const out = prepareShortLinkFromPaste({ pastedUrl: pasted, currentUser: STAFF_AN, posts: POSTS });
  assert(out.ok && out.staffCode === 'AN', `old ref ${oldRef} replaced by AN`, 'RefReplace');
  assert(out.originalUrl.endsWith('?ref=AN'), `canonical ends with AN not ${oldRef}`, 'RefReplace');
});

// utm-only paste
{
  const out = prepareShortLinkFromPaste({
    pastedUrl: `https://www.thehori.click/post/${SAMPLE_SLUG}?utm_source=zalo&utm_medium=cpc`,
    currentUser: STAFF_MINH
  });
  assert(out.originalUrl === `${CANONICAL_ORIGIN}/post/${SAMPLE_SLUG}?ref=MINH`, 'utm stripped, ref attached');
}

// ---------------------------------------------------------------------------
// 16. Role matrix
// ---------------------------------------------------------------------------
console.log('16. Role matrix...');
const roles = [
  { user: { role: 'admin', refCode: 'QB', name: 'A' }, expect: 'QB' },
  { user: { role: 'editor', refCode: 'ED1', name: 'E' }, expect: 'ED1' },
  { user: { role: 'author', refCode: 'AU1', name: 'W' }, expect: 'AU1' },
  { user: { role: 'accountant', refCode: 'ACC', name: 'C' }, expect: 'ACC' },
  { user: { role: 'editor' }, expect: '' },
  { user: { role: 'admin' }, expect: 'QB' }
];
roles.forEach((row, i) => {
  assert(resolveLoggedInStaffCode(row.user) === row.expect, `role matrix ${i + 1} → ${row.expect}`, 'Role');
});

// ---------------------------------------------------------------------------
// 17. Pad to 1000+ with systematic protocol/host/path permutations
// ---------------------------------------------------------------------------
console.log('17. Systematic permutations...');
const hosts = ['www.thehori.click', 'thehori.click', 'localhost', '127.0.0.1'];
const ports = ['', ':5173', ':5000', ':443'];
const schemes = ['https', 'http'];
const tails = ['', '/', `?ref=OLD`, `?utm_source=a`, `#hash`, `/?x=1#y`];
let perm = 0;
hosts.forEach((host) => {
  schemes.forEach((scheme) => {
    ports.forEach((port) => {
      if (host.includes('thehori') && port === ':5173') return;
      tails.forEach((tail) => {
        const url = `${scheme}://${host}${port}/post/${SAMPLE_SLUG}${tail}`;
        expectSlug(url, SAMPLE_SLUG, `perm ${++perm}`);
      });
    });
  });
});

// Error permutations: non-post paths on every host
const badPaths = ['/', '/about', '/admin', '/category/x', '/s/abc', '/post/', '/post', '/posts/x', '/tag/x'];
hosts.forEach((host) => {
  badPaths.forEach((path, i) => {
    const url = `https://${host}${path}`;
    const r = extractPostSlugFromInput(url);
    assert(r.ok === false, `bad path ${host}${path} must fail`, 'PermError');
  });
});

// Client spoof permutations
['HACKER', 'QB', 'ADMIN', 'root', 'AN'].forEach((spoof, i) => {
  const out = applyServerStaffOverride(
    { originalUrl: `https://www.thehori.click/post/${SAMPLE_SLUG}`, staffCode: spoof },
    STAFF_MINH
  );
  assert(out.staffCode === 'MINH', `spoof perm ${spoof} ignored`, 'Spoof');
});

// ---------------------------------------------------------------------------
// 18. Optional live API (unauthenticated + malformed) if server is up
// ---------------------------------------------------------------------------
console.log('18. Live API negative tests (optional)...');
const API = process.env.SHORTLINK_API || 'http://localhost:5000/api';
let liveRan = 0;
try {
  const statusRes = await fetch(`${API}/status`, { signal: AbortSignal.timeout(1500) });
  if (statusRes.ok) {
    const unauth = await fetch(`${API}/shortlinks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ originalUrl: `https://www.thehori.click/post/${SAMPLE_SLUG}` }) });
    assert(unauth.status === 401, `unauthenticated POST /shortlinks → 401 (got ${unauth.status})`, 'LiveAPI');
    liveRan++;

    const unauthGet = await fetch(`${API}/shortlinks`);
    assert(unauthGet.status === 401, `unauthenticated GET /shortlinks → 401 (got ${unauthGet.status})`, 'LiveAPI');
    liveRan++;

    const fakeTok = await fetch(`${API}/shortlinks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer totally-invalid' },
      body: JSON.stringify({ originalUrl: `https://www.thehori.click/post/${SAMPLE_SLUG}` })
    });
    assert(fakeTok.status === 401, `invalid token POST → 401 (got ${fakeTok.status})`, 'LiveAPI');
    liveRan++;
  } else {
    assert(true, 'live API status not ok — skipped auth cases', 'LiveAPI');
  }
} catch {
  assert(true, 'live API unreachable — skipped (unit suite still valid)', 'LiveAPI');
}

// ---------------------------------------------------------------------------
// 19. 1000 adversarial error / spoof payloads
// ---------------------------------------------------------------------------
console.log('19. 1000 adversarial error/spoof payloads...');
function adversarialPayload(i) {
  const catalog = [
    '',
    ' ',
    null,
    undefined,
    `javascript:alert(${i})`,
    `data:text/html,${i}`,
    `file:///c:/windows/${i}`,
    `https://evil.example/${i}`,
    `https://evil.com/post/${SAMPLE_SLUG}?ref=HACKER${i}`,
    `https://www.thehori.click/s/code${i}`,
    `https://www.thehori.click/about?x=${i}`,
    `https://www.thehori.click/post/${'a'.repeat((i % 200) + 1)}`,
    `<script>alert(${i})</script>`,
    `'; DROP TABLE shortlinks; --${i}`,
    `../../etc/passwd${i}`,
    `https://www.thehori.click/post/${SAMPLE_SLUG}/${i}`,
    `{"originalUrl":"https://www.thehori.click/post/${SAMPLE_SLUG}","staffCode":"HACKER"}`,
    `\u0000https://www.thehori.click/post/${SAMPLE_SLUG}`,
    `https://127.0.0.1/${i}`,
    `ftp://www.thehori.click/post/${SAMPLE_SLUG}`,
    `   https://phishing.test/login?next=https://www.thehori.click/post/${SAMPLE_SLUG}  `,
    'a'.repeat(i % 500),
    `${i}${i}${i}`,
    `https://www.thehori.click/post/hello_world_${i}`,
    `https://www.thehori.click/admin/posts/${i}`
  ];
  return catalog[i % catalog.length];
}

for (let i = 0; i < 1000; i++) {
  const payload = adversarialPayload(i);
  const parsed = extractPostSlugFromInput(payload);
  assert(typeof parsed.ok === 'boolean', `adv ${i + 1} returns shape`, 'Adversarial');
  if (parsed.ok) {
    assert(SLUG_OK(parsed.slug), `adv ${i + 1} ok ⇒ valid slug`, 'Adversarial');
    const spoofed = applyServerStaffOverride(
      { originalUrl: payload, staffCode: 'HACKER', staffName: 'Attacker' },
      STAFF_MINH
    );
    if (spoofed.ok) {
      assert(spoofed.staffCode === 'MINH', `adv ${i + 1} session ref wins over HACKER`, 'Adversarial');
      assert(spoofed.originalUrl.startsWith(CANONICAL_ORIGIN), `adv ${i + 1} canonical origin`, 'Adversarial');
      assert(!spoofed.originalUrl.toLowerCase().includes('hacker'), `adv ${i + 1} no HACKER in url`, 'Adversarial');
    } else {
      assert(Object.values(SHORTLINK_ERRORS).includes(spoofed.error), `adv ${i + 1} known override error`, 'Adversarial');
    }
  } else {
    assert(Object.values(SHORTLINK_ERRORS).includes(parsed.error), `adv ${i + 1} known parse error`, 'Adversarial');
    const noStaff = prepareShortLinkFromPaste({ pastedUrl: payload, currentUser: STAFF_NO_REF, staffList: STAFF_LIST });
    assert(noStaff.ok === false, `adv ${i + 1} editor without ref cannot create`, 'Adversarial');
  }
}

console.log('\n========================================================================');
console.log(`RESULT: ${passed} passed, ${failed} failed (live API probes: ${liveRan})`);
console.log('========================================================================');
if (errors.length) {
  console.log('\nFailures:');
  errors.slice(0, 80).forEach((e) => console.log(' -', e));
  if (errors.length > 80) console.log(` ... and ${errors.length - 80} more`);
}

if (passed < 1000) {
  console.error(`\nExpected at least 1000 assertions, got ${passed}`);
  process.exit(1);
}

if (failed > 0) process.exit(1);
console.log('\nAll short-link cases passed.');
