/**
 * Paste-an-article-URL → short seeding link.
 * Staff ref is always taken from the logged-in account, never from the pasted URL
 * and never from a client-supplied staffCode.
 */

export const CANONICAL_ORIGIN = 'https://www.thehori.click';

export const SHORTLINK_ERRORS = Object.freeze({
  EMPTY: 'empty',
  UNSAFE_PROTOCOL: 'unsafe_protocol',
  ALREADY_SHORT: 'already_short',
  NOT_ARTICLE: 'not_article',
  INVALID_URL: 'invalid_url',
  NO_STAFF: 'no_staff',
  SLUG_TOO_LONG: 'slug_too_long'
});

const SLUG_PATTERN = '([a-z0-9]+(?:-[a-z0-9]+)*)';
const SLUG_ONLY_RE = new RegExp(`^${SLUG_PATTERN}$`, 'i');
const POST_PATH_RE = new RegExp(`^/post/${SLUG_PATTERN}/?$`, 'i');
const POST_ANYWHERE_RE = new RegExp(`(?:^|/)post/${SLUG_PATTERN}(?:/|$|[?#])`, 'i');
const MAX_SLUG_LENGTH = 180;
const MAX_CODE_LENGTH = 32;
const MAX_STAFF_CODE_LENGTH = 16;
const MAX_INPUT_LENGTH = 4000;

const BLOCKED_PROTOCOLS = /^(javascript|data|vbscript|file|blob|about|mailto|tel|ftp|ws|wss):/i;

const WRAPPER_PARAM_KEYS = ['u', 'url', 'q', 'target', 'dest', 'redirect', 'redirect_uri', 'return', 'next'];

export function shortLinkErrorMessage(code) {
  switch (code) {
    case SHORTLINK_ERRORS.EMPTY:
      return 'Vui lòng dán link bài viết hiện tại';
    case SHORTLINK_ERRORS.UNSAFE_PROTOCOL:
      return 'Link không an toàn hoặc không hợp lệ';
    case SHORTLINK_ERRORS.ALREADY_SHORT:
      return 'Đây đã là link rút gọn. Hãy dán link bài viết gốc (/post/...)';
    case SHORTLINK_ERRORS.NOT_ARTICLE:
      return 'Link không phải bài viết. Hãy dán URL dạng https://www.thehori.click/post/ten-bai-viet';
    case SHORTLINK_ERRORS.INVALID_URL:
      return 'Không đọc được link. Hãy dán URL bài viết hiện tại';
    case SHORTLINK_ERRORS.NO_STAFF:
      return 'Tài khoản chưa có mã seeding. Cập nhật mã ref trong hồ sơ';
    case SHORTLINK_ERRORS.SLUG_TOO_LONG:
      return 'Đường dẫn bài viết quá dài';
    default:
      return 'Không tạo được link rút gọn';
  }
}

export function stripPasteNoise(raw) {
  let s = raw == null ? '' : String(raw);
  if (s.length > MAX_INPUT_LENGTH) s = s.slice(0, MAX_INPUT_LENGTH);
  s = s.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ');
  s = s.replace(/\r\n/g, '\n').trim();

  const md = s.match(/\((https?:\/\/[^)\s]+)\)/i);
  if (md) s = md[1];

  s = s.replace(/^<+|>+$/g, '').trim();
  s = s.replace(/^['"`“”‘’]+|['"`“”‘’]+$/g, '').trim();

  const firstHttp = s.match(/https?:\/\/[^\s<>"']+/i);
  if (firstHttp) {
    s = firstHttp[0].replace(/[),.;!?]+$/g, '');
  } else {
    const www = s.match(/(?:www\.)?thehori\.click\/[^\s<>"']+/i);
    if (www) s = www[0].replace(/[),.;!?]+$/g, '');
  }

  return s.trim();
}

function fail(error) {
  return { ok: false, error, slug: '' };
}

function okSlug(slug) {
  const normalized = String(slug || '').toLowerCase().trim();
  if (!normalized) return fail(SHORTLINK_ERRORS.INVALID_URL);
  if (normalized.length > MAX_SLUG_LENGTH) return fail(SHORTLINK_ERRORS.SLUG_TOO_LONG);
  if (!SLUG_ONLY_RE.test(normalized)) return fail(SHORTLINK_ERRORS.NOT_ARTICLE);
  return { ok: true, error: '', slug: normalized };
}

function tryParseAbsolute(input) {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

function unwrapRedirect(urlObj) {
  if (!urlObj || typeof urlObj.searchParams?.get !== 'function') return urlObj;
  const host = String(urlObj.hostname || '').toLowerCase();
  const isOwnHost = host === 'www.thehori.click' || host === 'thehori.click' || host === 'localhost' || host === '127.0.0.1';
  if (isOwnHost) return urlObj;

  for (const key of WRAPPER_PARAM_KEYS) {
    const val = urlObj.searchParams.get(key);
    if (!val) continue;
    let decoded = val;
    try {
      decoded = decodeURIComponent(val);
    } catch {
      decoded = val;
    }
    const inner = tryParseAbsolute(decoded);
    if (!inner) continue;
    if (POST_PATH_RE.test(inner.pathname) || /thehori\.click$/i.test(inner.hostname)) {
      return inner;
    }
  }
  return urlObj;
}

function isOwnishHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  return host === 'www.thehori.click' || host === 'thehori.click' || host === 'localhost' || host === '127.0.0.1';
}

/**
 * Parse a pasted article URL (or messy clipboard text) into a post slug.
 */
export function extractPostSlugFromInput(raw) {
  const original = raw == null ? '' : String(raw).replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  if (BLOCKED_PROTOCOLS.test(original)) {
    return fail(SHORTLINK_ERRORS.UNSAFE_PROTOCOL);
  }

  const cleaned = stripPasteNoise(raw);
  if (!cleaned) return fail(SHORTLINK_ERRORS.EMPTY);

  if (BLOCKED_PROTOCOLS.test(cleaned)) {
    return fail(SHORTLINK_ERRORS.UNSAFE_PROTOCOL);
  }

  if (/^\/s\/[a-z0-9_-]+/i.test(cleaned) || /\/s\/[a-z0-9_-]+\/?(\?|$)/i.test(cleaned)) {
    const shortOnOwnHost = /(?:thehori\.click|localhost|127\.0\.0\.1)(?::\d+)?\/s\//i.test(cleaned)
      || cleaned.startsWith('/s/');
    if (shortOnOwnHost) return fail(SHORTLINK_ERRORS.ALREADY_SHORT);
  }

  if (SLUG_ONLY_RE.test(cleaned) && !cleaned.includes('/') && !cleaned.includes('.')) {
    return okSlug(cleaned);
  }

  let candidate = cleaned;
  if (candidate.startsWith('//')) candidate = `https:${candidate}`;
  if (candidate.startsWith('/')) candidate = `${CANONICAL_ORIGIN}${candidate}`;
  if (/^(www\.)?thehori\.click\//i.test(candidate)) candidate = `https://${candidate.replace(/^https?:\/\//i, '')}`;

  if (!/^[a-z][a-z0-9+.-]*:/i.test(candidate) && candidate.includes('/post/')) {
    candidate = `${CANONICAL_ORIGIN}${candidate.startsWith('/') ? '' : '/'}${candidate.replace(/^\/+/, '/')}`;
    if (!candidate.startsWith('http')) {
      const idx = candidate.toLowerCase().indexOf('/post/');
      if (idx >= 0) candidate = `${CANONICAL_ORIGIN}${candidate.slice(idx)}`;
    }
  }

  let urlObj = tryParseAbsolute(candidate);
  if (urlObj) {
    if (urlObj.protocol && urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return fail(SHORTLINK_ERRORS.UNSAFE_PROTOCOL);
    }
    urlObj = unwrapRedirect(urlObj);
    const pathname = urlObj.pathname || '';
    if (/^\/s\//i.test(pathname) && isOwnishHost(urlObj.hostname)) {
      return fail(SHORTLINK_ERRORS.ALREADY_SHORT);
    }
    const pathMatch = pathname.match(POST_PATH_RE);
    if (pathMatch) return okSlug(pathMatch[1]);
    return fail(SHORTLINK_ERRORS.NOT_ARTICLE);
  }

  const anywhere = cleaned.match(POST_ANYWHERE_RE) || candidate.match(POST_ANYWHERE_RE);
  if (anywhere) return okSlug(anywhere[1]);

  if (/\/post\/\s*$/i.test(cleaned) || /\/post\/?$/i.test(cleaned)) {
    return fail(SHORTLINK_ERRORS.NOT_ARTICLE);
  }

  return fail(SHORTLINK_ERRORS.INVALID_URL);
}

export function resolveLoggedInStaffCode(user, staffList = []) {
  if (!user || typeof user !== 'object') return '';

  const fromUser = String(user.refCode || '').trim().toUpperCase();
  if (fromUser) return fromUser.replace(/[^A-Z0-9_-]/g, '').slice(0, MAX_STAFF_CODE_LENGTH);

  if (Array.isArray(staffList)) {
    const uid = String(user.id || '').trim();
    const uname = String(user.username || '').toLowerCase().trim();
    const found = staffList.find((s) => {
      if (!s) return false;
      if (uid && String(s.id || '').trim() === uid) return true;
      if (uname && String(s.username || '').toLowerCase().trim() === uname) return true;
      return false;
    });
    const fromList = String(found?.refCode || '').trim().toUpperCase();
    if (fromList) return fromList.replace(/[^A-Z0-9_-]/g, '').slice(0, MAX_STAFF_CODE_LENGTH);
  }

  if (user.role === 'admin') return 'QB';
  return '';
}

export function buildCanonicalPostUrl(slug, staffRefCode) {
  const parsed = okSlug(slug);
  if (!parsed.ok) return '';
  const ref = String(staffRefCode || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, MAX_STAFF_CODE_LENGTH);
  const base = `${CANONICAL_ORIGIN}/post/${parsed.slug}`;
  return ref ? `${base}?ref=${encodeURIComponent(ref)}` : base;
}

export function sanitizeCustomCode(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, MAX_CODE_LENGTH);
}

export function generateShortCode() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(6);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').replace(/[^a-z0-9]/g, '').slice(0, 8);
    }
  } catch {
    // fall through
  }
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Client-side prepare: paste URL + logged-in user → payload.
 * Staff code always comes from the session, never from the pasted ?ref= or a picker.
 */
export function prepareShortLinkFromPaste({
  pastedUrl,
  currentUser,
  staffList = [],
  posts = [],
  customCode = ''
} = {}) {
  const staffCode = resolveLoggedInStaffCode(currentUser, staffList);
  if (!staffCode) return fail(SHORTLINK_ERRORS.NO_STAFF);

  const parsed = extractPostSlugFromInput(pastedUrl);
  if (!parsed.ok) return parsed;

  const post = Array.isArray(posts)
    ? posts.find((p) => p && String(p.slug || '').toLowerCase() === parsed.slug)
    : null;

  return {
    ok: true,
    error: '',
    slug: parsed.slug,
    staffCode,
    staffName: String(currentUser?.name || '').trim(),
    originalUrl: buildCanonicalPostUrl(parsed.slug, staffCode),
    post: post || null,
    customCode: sanitizeCustomCode(customCode)
  };
}

/**
 * Server-side override: ignore client staffCode / originalUrl host.
 * Always rebuild the canonical article URL with the authenticated staff ref.
 */
export function applyServerStaffOverride(body, authenticatedUser, staffList = []) {
  const sourceUrl = body && (body.originalUrl || body.url || body.link || body.pastedUrl);
  const parsed = extractPostSlugFromInput(sourceUrl);
  if (!parsed.ok) return parsed;

  const staffCode = resolveLoggedInStaffCode(authenticatedUser, staffList);
  if (!staffCode) return fail(SHORTLINK_ERRORS.NO_STAFF);

  const clientStaff = String(body?.staffCode || '').trim().toUpperCase();
  return {
    ok: true,
    error: '',
    originalUrl: buildCanonicalPostUrl(parsed.slug, staffCode),
    postSlug: parsed.slug,
    staffCode,
    staffName: String(authenticatedUser?.name || '').trim(),
    customCode: sanitizeCustomCode(body?.customCode || body?.code),
    ignoredClientStaffCode: clientStaff && clientStaff !== staffCode ? clientStaff : null
  };
}

export function findPostBySlug(posts, slug) {
  const target = String(slug || '').toLowerCase().trim();
  if (!target || !Array.isArray(posts)) return null;
  return posts.find((p) => p && String(p.slug || '').toLowerCase() === target) || null;
}
