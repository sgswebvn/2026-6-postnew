const CMS_WRITE_ROLES = ['admin', 'editor', 'author'];
const CMS_DRAFT_ROLES = ['admin', 'editor', 'author'];

export function isCmsWriter(role) {
  return CMS_WRITE_ROLES.includes(role);
}

export function canSeeDrafts(role) {
  return CMS_DRAFT_ROLES.includes(role);
}

export function canMutatePost(actor, post) {
  if (!actor || !isCmsWriter(actor.role)) return false;
  if (actor.role === 'admin' || actor.role === 'editor') return true;
  if (!post) return true;
  const actorId = String(actor.id || '').trim();
  const createdBy = String(post.createdById || '').trim();
  return Boolean(actorId && createdBy && createdBy === actorId);
}

export function staffPutAuthorization(actor, paramId) {
  if (!actor || !actor.id) {
    return { error: 401, message: 'Unauthorized' };
  }
  const targetId = String(paramId || '').trim();
  if (!targetId) {
    return { error: 400, message: 'Staff id is required' };
  }
  if (actor.role === 'admin') {
    return { filter: { id: targetId }, upsert: false };
  }
  if (actor.id !== targetId) {
    return { error: 403, message: 'Forbidden: You can only update your own profile' };
  }
  return { filter: { id: actor.id }, upsert: false };
}

export function extractPasswordUpdate(body) {
  if (!body || typeof body !== 'object') {
    return { change: false };
  }
  if (!Object.prototype.hasOwnProperty.call(body, 'password')) {
    return { change: false };
  }
  const raw = body.password;
  if (raw === undefined || raw === null) {
    return { change: false };
  }
  if (typeof raw !== 'string') {
    return { error: 400, message: 'Password must be a string' };
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return { change: false };
  }
  if (trimmed.length < 6) {
    return { error: 400, message: 'Password must be at least 6 characters' };
  }
  return { change: true, password: trimmed };
}

export function publicPostProjection(post, options = {}) {
  if (!post) return null;
  const obj = post.toObject ? post.toObject() : { ...post };
  const includeContent = options.includeContent !== false;
  return {
    id: obj.id,
    title: obj.title,
    slug: obj.slug,
    excerpt: obj.excerpt || '',
    content: includeContent ? (obj.content || '') : '',
    coverImage: obj.coverImage || '',
    categoryId: obj.categoryId,
    authorId: obj.authorId,
    authorName: obj.authorName || '',
    readTime: obj.readTime || '',
    status: obj.status,
    featured: Boolean(obj.featured),
    trendingRank: obj.trendingRank || 0,
    views: obj.views || 0,
    tags: Array.isArray(obj.tags) ? obj.tags : [],
    metaTitle: obj.metaTitle || '',
    metaDescription: obj.metaDescription || '',
    enableAds: obj.enableAds !== false,
    publishedAt: obj.publishedAt,
    updatedAt: obj.updatedAt
  };
}

export const POST_WRITABLE_FIELDS = [
  'title', 'slug', 'excerpt', 'content', 'coverImage', 'categoryId', 'authorId',
  'authorName', 'factCheckerId', 'readTime', 'status', 'featured', 'trendingRank',
  'tags', 'metaTitle', 'metaDescription', 'focusKeyword', 'enableAds', 'publishedAt'
];

export function pickPostFields(body) {
  const out = {};
  if (!body || typeof body !== 'object') return out;
  for (const key of POST_WRITABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      out[key] = body[key];
    }
  }
  return out;
}

export function slugifyPost(input) {
  const clean = String(input || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/https?:\/\/[^\s]+/gi, '')
    .replace(/www\.[^\s]+/gi, '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return clean;
}

export function stripEmptyContentOverwrite(fields, existingContent) {
  if (!fields || typeof fields !== 'object') return fields || {};
  if (!Object.prototype.hasOwnProperty.call(fields, 'content')) return fields;
  const incoming = String(fields.content || '').trim();
  const existing = String(existingContent || '').trim();
  if (!incoming && existing) {
    const next = { ...fields };
    delete next.content;
    return next;
  }
  return fields;
}
