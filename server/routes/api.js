import express from 'express';
import mongoose from 'mongoose';
import { Post } from '../models/Post.js';
import { Category } from '../models/Category.js';
import { Author } from '../models/Author.js';
import { Setting } from '../models/Setting.js';
import { Comment } from '../models/Comment.js';
import { Subscriber } from '../models/Subscriber.js';
import { Referral } from '../models/Referral.js';
import { Staff } from '../models/Staff.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { ShortLink } from '../models/ShortLink.js';
import { memoryStore, getDbStatus } from '../db.js';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  sanitizeStaffForPublic,
  sanitizeStaffForAdmin,
  actorFromStaff,
  getStaffId
} from '../auth.js';
import { getSupabaseServiceRoleKey, getSupabaseUrl } from '../env.js';
import {
  canSeeDrafts,
  canMutatePost,
  staffPutAuthorization,
  extractPasswordUpdate,
  publicPostProjection,
  pickPostFields
} from '../staffRules.js';
import {
  initialPosts,
  initialCategories,
  initialAuthors,
  initialSettings,
  initialComments,
  initialSubscribers
} from '../seedData.js';

const router = express.Router();

const isMongooseReady = () => mongoose.connection.readyState === 1;

const SUPABASE_URL = getSupabaseUrl();
const BUCKET_NAME = 'postnew';

function mongoUnavailable(res) {
  return res.status(503).json({ error: 'Service temporarily unavailable' });
}

function supabaseAuthHeaders(extra = {}) {
  const key = getSupabaseServiceRoleKey();
  return {
    Authorization: `Bearer ${key}`,
    apikey: key,
    ...extra
  };
}

function isHexObjectId(value) {
  return typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value);
}

function asObjectBody(body) {
  if (Buffer.isBuffer(body)) {
    try { return JSON.parse(body.toString('utf8')); } catch { return {}; }
  }
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return {}; }
  }
  if (body && typeof body === 'object' && !Array.isArray(body)) return body;
  return {};
}

function slugifyCategory(input) {
  return String(input || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function pickCategoryFields(body) {
  const src = asObjectBody(body);
  const out = {};
  if (typeof src.name === 'string') out.name = src.name.trim();
  if (typeof src.slug === 'string') out.slug = slugifyCategory(src.slug);
  else if (typeof src.name === 'string') out.slug = slugifyCategory(src.name);
  if (typeof src.description === 'string') out.description = src.description.trim();
  if (typeof src.color === 'string' && src.color.trim()) out.color = src.color.trim().slice(0, 32);
  if (typeof src.icon === 'string' && src.icon.trim()) out.icon = src.icon.trim().slice(0, 64);
  if (typeof src.featured === 'boolean') out.featured = src.featured;
  if (typeof src.id === 'string') {
    const id = src.id.trim();
    if (id && !id.startsWith('new-')) out.id = id;
  }
  return out;
}

async function allocateUniqueCategorySlug(baseSlug, excludeId = null) {
  const base = slugifyCategory(baseSlug) || `cat-${Date.now()}`;
  for (let n = 0; n < 50; n++) {
    const slug = n === 0 ? base : `${base}-${n + 1}`;
    const query = { slug };
    if (excludeId) query.id = { $ne: excludeId };
    const taken = await Category.exists(query);
    if (!taken) return slug;
  }
  return `${base}-${Date.now()}`;
}

function mapCategoryWriteError(error, fallback) {
  if (error?.code === 11000) {
    const key = Object.keys(error.keyPattern || error.keyValue || {})[0] || 'slug';
    return { status: 409, error: `Category ${key} already exists` };
  }
  if (error?.name === 'ValidationError') {
    const msg = Object.values(error.errors || {}).map((e) => e.message).join('; ') || error.message;
    return { status: 400, error: msg };
  }
  if (error?.name === 'CastError') {
    return { status: 400, error: `Invalid ${error.path || 'field'}` };
  }
  return { status: 400, error: fallback };
}

export async function resolveActorFromToken(token) {
  const decoded = verifyToken(token);
  if (!decoded || !decoded.id) return { error: 401 };
  if (!isMongooseReady()) return { error: 503 };

  const decodedId = String(decoded.id).trim();
  const lookup = [{ id: decodedId }];
  if (isHexObjectId(decodedId)) {
    lookup.push({ _id: decodedId });
  }

  const staffMember = await Staff.findOne({ $or: lookup });
  if (!staffMember) return { error: 401 };
  if ((staffMember.status || 'active') !== 'active') return { error: 401 };
  const dbVersion = staffMember.tokenVersion || 0;
  const tokenVersion = decoded.tokenVersion || 0;
  if (dbVersion !== tokenVersion) return { error: 401 };
  return { actor: actorFromStaff(staffMember), staff: staffMember };
}

function readBearer(req) {
  const authHeader = req.headers.authorization || req.headers['x-auth-token'];
  if (!authHeader) return '';
  if (typeof authHeader !== 'string') return '';
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7).trim();
  return authHeader.trim();
}

export function requireAuth(req, res, next) {
  const token = readBearer(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Authentication token required' });
  }
  resolveActorFromToken(token).then((result) => {
    if (result.error === 503) return mongoUnavailable(res);
    if (result.error) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
    req.user = result.actor;
    req.staffRecord = result.staff;
    next();
  }).catch(() => {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  });
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: Requires one of roles: [${allowedRoles.join(', ')}]` });
    }
    next();
  };
}

export function optionalAuth(req, res, next) {
  const token = readBearer(req);
  if (!token) return next();
  resolveActorFromToken(token).then((result) => {
    if (result.actor) req.user = result.actor;
    next();
  }).catch(() => next());
}

async function syncPostToSupabase(post) {
  try {
    const status = post.status || 'draft';
    const cleanSlug = (post.slug || post.id || '').toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    if (status !== 'published') {
      await deletePostFromSupabase(post.id, post.slug);
      return;
    }
    const publicPost = publicPostProjection(post);
    await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/posts/${cleanSlug}.json`, {
      method: 'POST',
      headers: supabaseAuthHeaders({
        'Content-Type': 'application/json',
        'x-upsert': 'true'
      }),
      body: JSON.stringify(publicPost)
    });

    let currentManifest = [];
    try {
      const manRes = await fetch(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/posts_manifest.json`);
      if (manRes.ok) currentManifest = await manRes.json();
    } catch (e) {}

    const publishedOnly = (Array.isArray(currentManifest) ? currentManifest : [])
      .filter((p) => p && p.status === 'published' && p.id !== publicPost.id && p.slug !== publicPost.slug);
    const updatedManifest = [publicPost, ...publishedOnly];
    await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/posts_manifest.json`, {
      method: 'POST',
      headers: supabaseAuthHeaders({
        'Content-Type': 'application/json',
        'x-upsert': 'true'
      }),
      body: JSON.stringify(updatedManifest)
    });
  } catch (err) {
    console.warn('[Supabase Sync Warning]', err.message);
  }
}

async function deletePostFromSupabase(id, slug = '') {
  try {
    let manifest = [];
    try {
      const manRes = await fetch(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/posts_manifest.json`);
      if (manRes.ok) {
        const data = await manRes.json();
        if (Array.isArray(data)) manifest = data;
      }
    } catch (e) {}

    const updated = manifest.filter((p) => p.id !== id && (!slug || p.slug !== slug));
    await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/posts_manifest.json`, {
      method: 'POST',
      headers: supabaseAuthHeaders({
        'Content-Type': 'application/json',
        'x-upsert': 'true'
      }),
      body: JSON.stringify(updated)
    });

    if (slug) {
      const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
      await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/posts/${cleanSlug}.json`, {
        method: 'DELETE',
        headers: supabaseAuthHeaders()
      });
    }
  } catch (err) {
    console.warn('[Supabase Delete Warning]', err.message);
  }
}

async function syncStaffToSupabase(staffList) {
  try {
    const sanitized = (Array.isArray(staffList) ? staffList : []).map((s) => sanitizeStaffForPublic(s));
    await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/staff_manifest.json`, {
      method: 'POST',
      headers: supabaseAuthHeaders({
        'Content-Type': 'application/json',
        'x-upsert': 'true'
      }),
      body: JSON.stringify(sanitized)
    });
  } catch (e) {}
}

router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: getDbStatus()
  });
});

router.post('/upload', requireAuth, async (req, res) => {
  try {
    const { imageBase64, fileName, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 payload is required' });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const ext = (fileName && fileName.includes('.')) ? fileName.split('.').pop().replace(/[^a-zA-Z0-9]/g, '') : 'webp';
    const cleanName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext || 'webp'}`;
    const filePath = `uploads/${cleanName}`;

    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filePath}`, {
      method: 'POST',
      headers: supabaseAuthHeaders({
        'Content-Type': mimeType || 'image/webp',
        'x-upsert': 'true'
      }),
      body: buffer
    });

    if (!uploadRes.ok) {
      return res.status(500).json({ error: 'Upload to storage failed' });
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;
    return res.json({ url: publicUrl, path: filePath });
  } catch (err) {
    if (err && err.message && err.message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return mongoUnavailable(res);
    }
    return res.status(500).json({ error: 'Upload failed' });
  }
});

router.post('/auth/login', async (req, res) => {
  const rawId = req.body?.identifier;
  const rawPass = req.body?.password;

  if (typeof rawId !== 'string' || typeof rawPass !== 'string' || !rawId.trim() || !rawPass.trim()) {
    return res.status(400).json({ error: 'Tên đăng nhập và mật khẩu là bắt buộc và phải là chuỗi hợp lệ' });
  }

  if (!isMongooseReady()) {
    return mongoUnavailable(res);
  }

  const identifier = rawId.trim();
  const password = rawPass.trim();

  try {
    const staffMember = await Staff.findOne({
      $or: [
        { username: identifier },
        { email: identifier }
      ]
    });

    if (!staffMember) {
      return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác' });
    }

    if ((staffMember.status || 'active') !== 'active') {
      return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác' });
    }

    const { valid, needsUpgrade } = verifyPassword(password, staffMember.password);
    if (!valid) {
      return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác' });
    }

    const staffId = getStaffId(staffMember);
    if (needsUpgrade) {
      const hashed = hashPassword(password);
      staffMember.password = hashed;
      await Staff.updateOne({ id: staffId }, { $set: { password: hashed } });
    }

    const token = generateToken({
      id: staffId,
      tokenVersion: staffMember.tokenVersion || 0
    });

    return res.json({
      success: true,
      token,
      user: sanitizeStaffForAdmin(staffMember)
    });
  } catch (error) {
    if (error && error.message && error.message.includes('JWT_SECRET')) {
      return mongoUnavailable(res);
    }
    return res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/auth/me', requireAuth, async (req, res) => {
  try {
    return res.json(sanitizeStaffForAdmin(req.staffRecord));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load profile' });
  }
});

router.post('/auth/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Vui lòng điền mật khẩu hiện tại và mật khẩu mới' });
  }
  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
  }

  try {
    const staffMember = req.staffRecord;
    const { valid } = verifyPassword(currentPassword, staffMember.password);
    if (!valid) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
    }

    const newHash = hashPassword(newPassword);
    const nextVersion = (staffMember.tokenVersion || 0) + 1;
    await Staff.updateOne(
      { id: getStaffId(staffMember) || req.user.id },
      { $set: { password: newHash, tokenVersion: nextVersion, passwordChangedAt: new Date() } }
    );

    const token = generateToken({ id: getStaffId(staffMember) || req.user.id, tokenVersion: nextVersion });
    return res.json({ success: true, message: 'Đổi mật khẩu thành công!', token });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

router.post('/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/posts', optionalAuth, async (req, res) => {
  try {
    if (!isMongooseReady()) {
      return mongoUnavailable(res);
    }

    const allowDrafts = req.user && canSeeDrafts(req.user.role);
    const query = allowDrafts ? {} : { status: 'published' };
    const posts = await Post.find(query).sort({ publishedAt: -1 });
    if (allowDrafts) {
      return res.json(posts);
    }
    return res.json(posts.map(publicPostProjection));
  } catch (error) {
    return mongoUnavailable(res);
  }
});

router.get('/posts/published', async (req, res) => {
  try {
    if (!isMongooseReady()) {
      return mongoUnavailable(res);
    }
    const posts = await Post.find({ status: 'published' }).sort({ publishedAt: -1 });
    return res.json(posts.map(publicPostProjection));
  } catch (error) {
    return mongoUnavailable(res);
  }
});

router.get('/posts/:slug', optionalAuth, async (req, res) => {
  const rawSlug = req.params.slug;
  const clean = (rawSlug || '').trim().replace(/[^a-z0-9-]/g, '-').replace(/-+$/, '');
  try {
    if (!isMongooseReady()) {
      return mongoUnavailable(res);
    }

    const post = await Post.findOne({
      $or: [
        { slug: rawSlug },
        { slug: clean },
        { id: rawSlug }
      ]
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const allowDrafts = req.user && canSeeDrafts(req.user.role);
    if (post.status !== 'published' && !allowDrafts) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (!allowDrafts) {
      return res.json(publicPostProjection(post));
    }
    return res.json(post);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load post' });
  }
});

router.post('/posts', requireAuth, requireRole(['admin', 'editor', 'author']), async (req, res) => {
  try {
    const fields = pickPostFields(req.body);
    let baseSlug = (fields.slug || fields.title || `post-${Date.now()}`)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const newPost = {
      ...fields,
      id: `post-${Date.now()}`,
      slug: baseSlug,
      createdById: req.user.id,
      createdByName: req.user.name,
      status: fields.status === 'published' ? 'published' : (fields.status || 'draft'),
      publishedAt: fields.publishedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const savedPost = await Post.create(newPost);
    syncPostToSupabase(savedPost).catch(() => {});
    return res.status(201).json(savedPost);
  } catch (error) {
    return res.status(400).json({ error: 'Failed to create post' });
  }
});

router.put('/posts/:id', requireAuth, requireRole(['admin', 'editor', 'author']), async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await Post.findOne({ $or: [{ id }, { slug: id }] });
    if (!existing) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (!canMutatePost(req.user, existing)) {
      return res.status(403).json({ error: 'Forbidden: You can only modify your own posts' });
    }

    const fields = pickPostFields(req.body);
    const updateData = { ...fields, updatedAt: new Date().toISOString() };
    delete updateData.id;
    delete updateData.createdById;

    const updatedPost = await Post.findOneAndUpdate(
      { id: existing.id },
      { $set: updateData },
      { new: true, upsert: false }
    );

    syncPostToSupabase(updatedPost).catch(() => {});
    return res.json(updatedPost);
  } catch (error) {
    return res.status(400).json({ error: 'Failed to update post' });
  }
});

router.delete('/posts/:id', requireAuth, requireRole(['admin', 'editor', 'author']), async (req, res) => {
  const { id } = req.params;
  try {
    if (!isMongooseReady()) {
      return mongoUnavailable(res);
    }

    const found = await Post.findOne({ $or: [{ id }, { slug: id }] });
    if (!found) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (!canMutatePost(req.user, found)) {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own posts' });
    }

    await Post.deleteOne({ _id: found._id });
    await deletePostFromSupabase(found.id, found.slug).catch(() => {});
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete post' });
  }
});

router.post('/posts/:slug/view', async (req, res) => {
  const { slug } = req.params;
  try {
    if (!isMongooseReady()) {
      return res.json({ views: 1 });
    }
    const post = await Post.findOneAndUpdate(
      { $or: [{ slug }, { id: slug }], status: 'published' },
      { $inc: { views: 1 } },
      { new: true }
    );
    if (post) return res.json({ views: post.views });
    return res.json({ views: 1 });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to record view' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    if (isMongooseReady()) {
      const cats = await Category.find().sort({ order: 1, name: 1 });
      if (cats && cats.length > 0) return res.json(cats);
    }
    return res.json(memoryStore.categories || initialCategories);
  } catch (error) {
    return res.json(memoryStore.categories || initialCategories);
  }
});

router.post('/categories', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    if (!isMongooseReady()) return mongoUnavailable(res);

    const fields = pickCategoryFields(req.body);
    if (!fields.name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const slug = await allocateUniqueCategorySlug(fields.slug || fields.name);
    let id = fields.id || `cat-${Date.now()}`;
    if (await Category.exists({ id })) {
      id = `cat-${Date.now()}`;
    }

    const created = await Category.create({
      id,
      name: fields.name,
      slug,
      description: fields.description || 'Chuyên mục phân tích chuyên sâu về chủ đề này.',
      color: fields.color || 'blue',
      icon: fields.icon || 'Layers',
      featured: fields.featured === true,
      postCount: 0
    });
    return res.status(201).json(created);
  } catch (error) {
    console.error('[POST /categories]', error);
    const mapped = mapCategoryWriteError(error, 'Failed to create category');
    return res.status(mapped.status).json({ error: mapped.error });
  }
});

router.put('/categories/:id', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  const { id } = req.params;
  try {
    if (!isMongooseReady()) return mongoUnavailable(res);

    const fields = pickCategoryFields(req.body);
    const update = {};
    if (fields.name) update.name = fields.name;
    if (fields.slug) update.slug = await allocateUniqueCategorySlug(fields.slug, id);
    if (Object.prototype.hasOwnProperty.call(fields, 'description')) update.description = fields.description;
    if (fields.color) update.color = fields.color;
    if (fields.icon) update.icon = fields.icon;
    if (Object.prototype.hasOwnProperty.call(fields, 'featured')) update.featured = fields.featured;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'No valid category fields to update' });
    }

    const updated = await Category.findOneAndUpdate(
      { id },
      { $set: update },
      { new: true, upsert: false, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Category not found' });
    return res.json(updated);
  } catch (error) {
    console.error('[PUT /categories]', error);
    const mapped = mapCategoryWriteError(error, 'Failed to update category');
    return res.status(mapped.status).json({ error: mapped.error });
  }
});

router.delete('/categories/:id', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  const { id } = req.params;
  try {
    await Category.deleteOne({ id });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete category' });
  }
});

router.get('/authors', async (req, res) => {
  try {
    if (isMongooseReady()) {
      const authors = await Author.find();
      if (authors && authors.length > 0) return res.json(authors);
    }
    return res.json(memoryStore.authors || initialAuthors);
  } catch (error) {
    return res.json(memoryStore.authors || initialAuthors);
  }
});

router.post('/authors', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const newAuthor = { ...req.body, id: req.body.id || `author-${Date.now()}` };
    const created = await Author.create(newAuthor);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(400).json({ error: 'Failed to create author' });
  }
});

router.put('/authors/:id', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await Author.findOneAndUpdate({ id }, req.body, { new: true, upsert: false });
    if (!updated) return res.status(404).json({ error: 'Author not found' });
    return res.json(updated);
  } catch (error) {
    return res.status(400).json({ error: 'Failed to update author' });
  }
});

router.delete('/authors/:id', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  const { id } = req.params;
  try {
    await Author.deleteOne({ id });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete author' });
  }
});

router.get('/settings', async (req, res) => {
  try {
    if (isMongooseReady()) {
      const settings = await Setting.findOne();
      if (settings) return res.json(settings);
    }
    return res.json(memoryStore.settings || initialSettings);
  } catch (error) {
    return res.json(memoryStore.settings || initialSettings);
  }
});

router.put('/settings', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const updated = await Setting.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    return res.json(updated);
  } catch (error) {
    return res.status(400).json({ error: 'Failed to update settings' });
  }
});

router.post('/settings/reset', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    await Setting.deleteMany({});
    const reset = await Setting.create(initialSettings);
    return res.json(reset);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to reset settings' });
  }
});

router.get('/comments', async (req, res) => {
  try {
    if (isMongooseReady()) {
      const comments = await Comment.find().sort({ createdAt: -1 });
      return res.json(comments);
    }
    return res.json(memoryStore.comments || initialComments);
  } catch (error) {
    return res.json(memoryStore.comments || initialComments);
  }
});

router.post('/comments', async (req, res) => {
  try {
    const newComment = {
      ...req.body,
      id: req.body.id || `comment-${Date.now()}`,
      createdAt: new Date().toISOString(),
      likes: 0
    };
    if (isMongooseReady()) {
      const created = await Comment.create(newComment);
      return res.status(201).json(created);
    }
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  } catch (error) {
    return res.status(400).json({ error: 'Failed to post comment' });
  }
});

router.post('/comments/:id/like', async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongooseReady()) {
      const comment = await Comment.findOneAndUpdate({ id }, { $inc: { likes: 1 } }, { new: true });
      if (comment) return res.json({ likes: comment.likes });
    }
    return res.json({ likes: 1 });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to like comment' });
  }
});

router.delete('/comments/:id', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  const { id } = req.params;
  try {
    await Comment.deleteOne({ id });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete comment' });
  }
});

router.get('/subscribers', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const subs = await Subscriber.find().sort({ subscribedAt: -1 });
    return res.json(subs);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load subscribers' });
  }
});

router.post('/subscribers', async (req, res) => {
  const { email, source } = req.body;
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  try {
    const newSub = {
      id: `sub-${Date.now()}`,
      email: email.trim().toLowerCase(),
      source: source || 'footer',
      subscribedAt: new Date().toISOString()
    };
    if (isMongooseReady()) {
      const exists = await Subscriber.findOne({ email: newSub.email });
      if (!exists) await Subscriber.create(newSub);
    }
    return res.status(201).json({ success: true, email: newSub.email });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to subscribe' });
  }
});

router.delete('/subscribers/:email', requireAuth, requireRole(['admin']), async (req, res) => {
  const { email } = req.params;
  try {
    await Subscriber.deleteOne({ email: email.toLowerCase() });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete subscriber' });
  }
});

router.get('/staff', optionalAuth, async (req, res) => {
  try {
    if (!isMongooseReady()) {
      return mongoUnavailable(res);
    }
    const rawList = await Staff.find().sort({ createdAt: -1 });
    const isAdminUser = req.user && (req.user.role === 'admin' || req.user.role === 'accountant');
    const sanitizedList = rawList.map((s) => (isAdminUser ? sanitizeStaffForAdmin(s) : sanitizeStaffForPublic(s)));
    return res.json(sanitizedList);
  } catch (error) {
    return mongoUnavailable(res);
  }
});

router.post('/staff', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const rawPassword = req.body.password;
    if (typeof rawPassword !== 'string' || rawPassword.trim().length < 6) {
      return res.status(400).json({ error: 'Password is required (minimum 6 characters)' });
    }
    const username = String(req.body.username || '').trim();
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    const existing = await Staff.findOne({ username });
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const newStaff = {
      name: req.body.name,
      username,
      email: req.body.email,
      phone: req.body.phone,
      refCode: req.body.refCode,
      role: req.body.role || 'editor',
      roleName: req.body.roleName,
      joinDate: req.body.joinDate,
      status: req.body.status || 'active',
      avatar: req.body.avatar,
      permissions: req.body.permissions || {},
      salary: req.body.salary || {},
      id: `staff-${Date.now()}`,
      password: hashPassword(rawPassword.trim()),
      tokenVersion: 0
    };

    const created = await Staff.create(newStaff);
    const allStaff = await Staff.find();
    syncStaffToSupabase(allStaff).catch(() => {});
    return res.status(201).json(sanitizeStaffForAdmin(created));
  } catch (error) {
    return res.status(400).json({ error: 'Failed to create staff' });
  }
});

router.put('/staff/:id', requireAuth, async (req, res) => {
  const decision = staffPutAuthorization(req.user, req.params.id);
  if (decision.error) {
    return res.status(decision.error).json({ error: decision.message });
  }

  try {
    const existing = await Staff.findOne(decision.filter);
    if (!existing) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    const passwordDecision = extractPasswordUpdate(req.body);
    if (passwordDecision.error) {
      return res.status(passwordDecision.error).json({ error: passwordDecision.message });
    }

    const updatedData = {};
    const allowed = ['name', 'email', 'phone', 'refCode', 'avatar', 'joinDate'];
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updatedData[key] = req.body[key];
      }
    }

    if (req.user.role === 'admin') {
      for (const key of ['role', 'roleName', 'permissions', 'salary', 'status']) {
        if (Object.prototype.hasOwnProperty.call(req.body, key)) {
          updatedData[key] = req.body[key];
        }
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'username')) {
      const nextUsername = String(req.body.username || '').trim();
      if (!nextUsername) {
        return res.status(400).json({ error: 'Username is required' });
      }
      if (nextUsername !== existing.username) {
        const collision = await Staff.findOne({ username: nextUsername, id: { $ne: existing.id } });
        if (collision) {
          return res.status(409).json({ error: 'Username already exists' });
        }
        updatedData.username = nextUsername;
      }
    }

    if (passwordDecision.change) {
      updatedData.password = hashPassword(passwordDecision.password);
      updatedData.tokenVersion = (existing.tokenVersion || 0) + 1;
      updatedData.passwordChangedAt = new Date();
    }

    const updated = await Staff.findOneAndUpdate(
      { id: existing.id },
      { $set: updatedData },
      { returnDocument: 'after', upsert: false }
    );

    const allStaff = await Staff.find();
    syncStaffToSupabase(allStaff).catch(() => {});
    return res.json(sanitizeStaffForAdmin(updated));
  } catch (error) {
    return res.status(400).json({ error: 'Failed to update staff' });
  }
});

router.delete('/staff/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    await Staff.findOneAndDelete({ id });
    const allStaff = await Staff.find();
    syncStaffToSupabase(allStaff).catch(() => {});
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete staff' });
  }
});

router.get('/activity-logs', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(100);
    return res.json(logs);
  } catch (error) {
    return res.json([]);
  }
});

router.post('/activity-logs', optionalAuth, async (req, res) => {
  try {
    const newLog = {
      ...req.body,
      id: req.body.id || `log-${Date.now()}`,
      userId: req.user ? req.user.id : 'system',
      userName: req.user ? req.user.name : 'System',
      timestamp: new Date().toISOString()
    };
    if (isMongooseReady()) {
      const created = await ActivityLog.create(newLog);
      return res.status(201).json(created);
    }
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  } catch (error) {
    return res.status(400).json({ error: 'Failed to write log' });
  }
});

router.get('/referrals', optionalAuth, async (req, res) => {
  try {
    if (isMongooseReady()) {
      const refs = await Referral.find().sort({ totalClicks: -1 });
      return res.json(refs);
    }
    return res.json([]);
  } catch (error) {
    return res.json([]);
  }
});

router.get('/shortlinks', requireAuth, requireRole(['admin', 'editor', 'author']), async (req, res) => {
  try {
    if (!isMongooseReady()) {
      return mongoUnavailable(res);
    }
    const links = await ShortLink.find().sort({ createdAt: -1 }).limit(200);
    return res.json(links);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load short links' });
  }
});

router.post('/shortlinks', requireAuth, requireRole(['admin', 'editor', 'author']), async (req, res) => {
  try {
    if (!isMongooseReady()) {
      return mongoUnavailable(res);
    }
    const body = req.body || {};
    const originalUrl = String(body.originalUrl || '').trim();
    if (!originalUrl) {
      return res.status(400).json({ error: 'originalUrl is required' });
    }

    const rawCode = String(body.customCode || body.code || '').trim().toLowerCase();
    const code = (rawCode || Math.random().toString(36).slice(2, 8))
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 32);
    if (!code) {
      return res.status(400).json({ error: 'Invalid short link code' });
    }

    const existing = await ShortLink.findOne({ code });
    if (existing) {
      return res.status(409).json({ error: 'Short link code already exists' });
    }

    const saved = await ShortLink.create({
      id: `sl-${Date.now()}`,
      code,
      originalUrl,
      postSlug: String(body.postSlug || '').trim(),
      postTitle: String(body.postTitle || '').trim(),
      coverImage: String(body.coverImage || '').trim(),
      staffCode: String(body.staffCode || '').trim().toUpperCase().slice(0, 16),
      staffName: String(body.staffName || req.user?.name || '').trim(),
      clicks: 0
    });
    return res.status(201).json(saved);
  } catch (error) {
    return res.status(400).json({ error: 'Failed to create short link' });
  }
});

router.delete('/shortlinks/:id', requireAuth, requireRole(['admin', 'editor', 'author']), async (req, res) => {
  const { id } = req.params;
  try {
    if (!isMongooseReady()) {
      return mongoUnavailable(res);
    }
    const found = await ShortLink.findOne({ $or: [{ id }, { code: id }] });
    if (!found) {
      return res.status(404).json({ error: 'Short link not found' });
    }
    await ShortLink.deleteOne({ _id: found._id });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete short link' });
  }
});

router.post('/referrals/hit/:refCode', async (req, res) => {
  const { refCode } = req.params;
  try {
    if (isMongooseReady()) {
      const updated = await Referral.findOneAndUpdate(
        { refCode },
        {
          $inc: { totalClicks: 1 },
          $set: { lastActive: new Date() }
        },
        { upsert: true, new: true }
      );
      return res.json(updated);
    }
    return res.json({ refCode, totalClicks: 1 });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to record referral' });
  }
});

export default router;
