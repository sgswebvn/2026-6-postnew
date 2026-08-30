import express from 'express';
import mongoose from 'mongoose';
import { Post } from '../models/Post.js';
import { Category } from '../models/Category.js';
import { Author } from '../models/Author.js';
import { Setting } from '../models/Setting.js';
import { Comment } from '../models/Comment.js';
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
  sanitizeStaffForAdmin 
} from '../auth.js';
import { 
  initialPosts, 
  initialCategories, 
  initialAuthors, 
  initialSettings, 
  initialComments, 
  initialSubscribers,
  initialStaffList,
  initialActivityLogs
} from '../seedData.js';

const router = express.Router();

const isMongooseReady = () => mongoose.connection.readyState === 1;

// Server-side only Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mmltqgekvpdnezqdavvc.supabase.co';
const SUPABASE_SERVICE_ROLE = process.env.NEXT_ROLE || process.env.SUPABASE_SERVICE_ROLE || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tbHRxZ2VrdnBkbmV6cWRhdnZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzkzMDY3NywiZXhwIjoyMTAzNTA2Njc3fQ.q_cgtmcVGrBeD8eCuov4xHzl4Lahy5bJIAlsZ8Y_ZUo';
const BUCKET_NAME = 'postnew';

// ==========================================
// 🔐 AUTH & RBAC MIDDLEWARE
// ==========================================
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['x-auth-token'];
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (authHeader) {
    token = authHeader.trim();
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Authentication token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }

  req.user = decoded;
  next();
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
  const authHeader = req.headers.authorization || req.headers['x-auth-token'];
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
    const decoded = verifyToken(token);
    if (decoded) req.user = decoded;
  }
  next();
}

// ==========================================
// ☁️ SERVER-SIDE SUPABASE CDN SYNC HELPERS
// ==========================================
async function syncPostToSupabase(post) {
  try {
    const cleanSlug = (post.slug || post.id || '').toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/posts/${cleanSlug}.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
        'apikey': SUPABASE_SERVICE_ROLE,
        'Content-Type': 'application/json',
        'x-upsert': 'true'
      },
      body: JSON.stringify(post)
    });

    let currentManifest = [];
    try {
      const manRes = await fetch(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/posts_manifest.json`);
      if (manRes.ok) currentManifest = await manRes.json();
    } catch (e) {}

    const updatedManifest = [post, ...(Array.isArray(currentManifest) ? currentManifest.filter(p => p.id !== post.id && p.slug !== post.slug) : [])];
    await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/posts_manifest.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
        'apikey': SUPABASE_SERVICE_ROLE,
        'Content-Type': 'application/json',
        'x-upsert': 'true'
      },
      body: JSON.stringify(updatedManifest)
    });
  } catch (err) {
    console.warn('[Supabase Sync Warning]', err.message);
  }
}

async function getSupabasePostsManifest() {
  try {
    const manRes = await fetch(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/posts_manifest.json`);
    if (manRes.ok) {
      const data = await manRes.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {}
  return [];
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

    const updated = manifest.filter(p => p.id !== id && (!slug || p.slug !== slug));
    await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/posts_manifest.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
        'apikey': SUPABASE_SERVICE_ROLE,
        'Content-Type': 'application/json',
        'x-upsert': 'true'
      },
      body: JSON.stringify(updated)
    });

    if (slug) {
      const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
      await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/posts/${cleanSlug}.json`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
          'apikey': SUPABASE_SERVICE_ROLE
        }
      });
    }
  } catch (err) {
    console.warn('[Supabase Delete Warning]', err.message);
  }
}

// ⚠️ ZERO PLAINTEXT PASSWORDS: Sync only sanitized staff data to Supabase public CDN
async function syncStaffToSupabase(staffList) {
  try {
    const sanitized = (Array.isArray(staffList) ? staffList : []).map(s => sanitizeStaffForPublic(s));
    await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/staff_manifest.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
        'apikey': SUPABASE_SERVICE_ROLE,
        'Content-Type': 'application/json',
        'x-upsert': 'true'
      },
      body: JSON.stringify(sanitized)
    });
  } catch (e) {}
}

async function getSupabaseStaffManifest() {
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/staff_manifest.json`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {}
  return [];
}

// ==========================================
// 1. SYSTEM HEALTH & MONGODB STATUS
// ==========================================
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: getDbStatus()
  });
});

// ==========================================
// 2. FILE UPLOAD (SERVER-SIDE SECURED)
// ==========================================
router.post('/upload', requireAuth, async (req, res) => {
  try {
    const { imageBase64, fileName, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 payload is required' });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const ext = (fileName && fileName.includes('.')) ? fileName.split('.').pop() : 'webp';
    const cleanName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = `uploads/${cleanName}`;

    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filePath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
        'apikey': SUPABASE_SERVICE_ROLE,
        'Content-Type': mimeType || 'image/webp',
        'x-upsert': 'true'
      },
      body: buffer
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return res.status(500).json({ error: `Upload to storage failed: ${err}` });
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;
    return res.json({ url: publicUrl, path: filePath });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. AUTHENTICATION & SESSION MANAGEMENT
// ==========================================
router.post('/auth/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Tên đăng nhập và mật khẩu là bắt buộc' });
  }

  try {
    let staffMember = null;
    if (isMongooseReady()) {
      staffMember = await Staff.findOne({
        $or: [
          { username: identifier.trim() },
          { email: identifier.trim() }
        ]
      });
    }

    if (!staffMember) {
      staffMember = (memoryStore.staff || []).find(
        s => s.username === identifier.trim() || s.email === identifier.trim()
      );
    }

    if (!staffMember) {
      return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác' });
    }

    const { valid, needsUpgrade } = verifyPassword(password, staffMember.password);
    if (!valid) {
      return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác' });
    }

    // Auto-upgrade legacy plaintext password to secure Scrypt hash in MongoDB
    if (needsUpgrade && isMongooseReady()) {
      const hashed = hashPassword(password);
      staffMember.password = hashed;
      await Staff.updateOne({ id: staffMember.id }, { $set: { password: hashed } });
    }

    const token = generateToken({
      id: staffMember.id,
      username: staffMember.username,
      name: staffMember.name,
      role: staffMember.role || 'editor'
    });

    return res.json({
      success: true,
      token,
      user: sanitizeStaffForAdmin(staffMember)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/auth/me', requireAuth, async (req, res) => {
  try {
    if (isMongooseReady()) {
      const staffMember = await Staff.findOne({ id: req.user.id });
      if (staffMember) {
        return res.json(sanitizeStaffForAdmin(staffMember));
      }
    }
    return res.json(req.user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/auth/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Vui lòng điền mật khẩu hiện tại và mật khẩu mới' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
  }

  try {
    let staffMember = null;
    if (isMongooseReady()) {
      staffMember = await Staff.findOne({ id: req.user.id });
    } else {
      staffMember = (memoryStore.staff || []).find(s => s.id === req.user.id);
    }

    if (!staffMember) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin tài khoản' });
    }

    const { valid } = verifyPassword(currentPassword, staffMember.password);
    if (!valid) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
    }

    const newHash = hashPassword(newPassword);
    if (isMongooseReady()) {
      await Staff.updateOne({ id: req.user.id }, { $set: { password: newHash } });
    }
    if (memoryStore.staff) {
      const idx = memoryStore.staff.findIndex(s => s.id === req.user.id);
      if (idx !== -1) memoryStore.staff[idx].password = newHash;
    }

    return res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// ==========================================
// 4. POSTS ENDPOINTS (CRUD with RBAC)
// ==========================================
router.get('/posts', async (req, res) => {
  try {
    if (isMongooseReady()) {
      const posts = await Post.find().sort({ publishedAt: -1 });
      if (posts && posts.length > 0) return res.json(posts);
    }

    const cloudPosts = await getSupabasePostsManifest();
    const memoryPosts = memoryStore.posts || [];
    const merged = [...cloudPosts];
    for (const p of memoryPosts) {
      if (!merged.some(m => m.id === p.id || m.slug === p.slug)) {
        merged.push(p);
      }
    }
    return res.json(merged.length > 0 ? merged : initialPosts);
  } catch (error) {
    return res.json(memoryStore.posts || initialPosts);
  }
});

router.get('/posts/published', async (req, res) => {
  try {
    if (isMongooseReady()) {
      const posts = await Post.find({ status: 'published' }).sort({ publishedAt: -1 });
      if (posts && posts.length > 0) return res.json(posts);
    }
    const cloudPosts = await getSupabasePostsManifest();
    const memoryPosts = memoryStore.posts || [];
    const merged = [...cloudPosts];
    for (const p of memoryPosts) {
      if (!merged.some(m => m.id === p.id || m.slug === p.slug)) {
        merged.push(p);
      }
    }
    const published = (merged.length > 0 ? merged : initialPosts).filter(p => p.status === 'published');
    return res.json(published);
  } catch (error) {
    const published = (memoryStore.posts || initialPosts).filter(p => p.status === 'published');
    return res.json(published);
  }
});

router.get('/posts/:slug', async (req, res) => {
  const rawSlug = req.params.slug;
  const clean = (rawSlug || '').trim().replace(/-+$/, '');
  try {
    if (isMongooseReady()) {
      const post = await Post.findOne({ 
        $or: [
          { slug: rawSlug }, 
          { slug: clean }, 
          { id: rawSlug },
          { slug: { $regex: `^${clean}$`, $options: 'i' } }
        ] 
      });
      if (post) return res.json(post);
    }

    let post = (memoryStore.posts || []).find(p => 
      p.slug === rawSlug || 
      p.slug === clean || 
      p.id === rawSlug || 
      (p.slug && clean && p.slug.toLowerCase() === clean.toLowerCase())
    );

    if (post) return res.json(post);

    const cloudPosts = await getSupabasePostsManifest();
    post = cloudPosts.find(p => 
      p.slug === rawSlug || 
      p.slug === clean || 
      p.id === rawSlug ||
      (p.slug && clean && p.slug.toLowerCase() === clean.toLowerCase())
    );
    if (post) return res.json(post);

    // Fetch individual post json from Supabase CDN
    try {
      const singleRes = await fetch(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/posts/${encodeURIComponent(clean)}.json`);
      if (singleRes.ok) {
        const singleData = await singleRes.json();
        if (singleData && singleData.slug) return res.json(singleData);
      }
    } catch (e) {}

    const seed = initialPosts.find(p => p.slug === rawSlug || p.slug === clean || p.id === rawSlug);
    if (seed) return res.json(seed);

    return res.status(404).json({ error: 'Post not found' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Protected: Create Post (Requires Auth & Role)
router.post('/posts', requireAuth, requireRole(['admin', 'editor', 'author']), async (req, res) => {
  try {
    const rawPost = req.body;
    let baseSlug = (rawPost.slug || rawPost.title || `post-${Date.now()}`)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const newPost = {
      ...rawPost,
      id: rawPost.id && !rawPost.id.startsWith('new-') ? rawPost.id : `post-${Date.now()}`,
      slug: baseSlug,
      createdById: req.user.id,
      createdByName: req.user.name,
      publishedAt: rawPost.publishedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 1. Primary write to MongoDB Atlas
    let savedPost = newPost;
    if (isMongooseReady()) {
      savedPost = await Post.create(newPost);
    } else {
      if (!memoryStore.posts) memoryStore.posts = [];
      memoryStore.posts.unshift(newPost);
    }

    // 2. Server-side mirror to Supabase CDN
    syncPostToSupabase(newPost).catch(() => {});

    return res.status(201).json(savedPost);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// Protected: Update Post (Requires Auth & Role)
router.put('/posts/:id', requireAuth, requireRole(['admin', 'editor', 'author']), async (req, res) => {
  const { id } = req.params;
  try {
    const updateData = { ...req.body, updatedAt: new Date().toISOString() };
    delete updateData._id;

    let updatedPost = null;
    if (isMongooseReady()) {
      updatedPost = await Post.findOneAndUpdate(
        { $or: [{ id }, { slug: id }] },
        updateData,
        { new: true, upsert: true }
      );
    }

    if (!memoryStore.posts) memoryStore.posts = [];
    const idx = memoryStore.posts.findIndex(p => p.id === id || p.slug === id);
    if (idx !== -1) {
      memoryStore.posts[idx] = { ...memoryStore.posts[idx], ...updateData };
    } else {
      memoryStore.posts.unshift(updateData);
    }

    syncPostToSupabase(updatedPost || updateData).catch(() => {});

    return res.json(updatedPost || updateData);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// Protected: Delete Post (Requires Auth & Role)
router.delete('/posts/:id', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  const { id } = req.params;
  try {
    let postSlug = '';
    if (isMongooseReady()) {
      const found = await Post.findOne({ $or: [{ id }, { slug: id }] });
      if (found) postSlug = found.slug;
      await Post.deleteOne({ $or: [{ id }, { slug: id }] });
    }

    if (!memoryStore.posts) memoryStore.posts = [];
    const memPost = memoryStore.posts.find(p => p.id === id || p.slug === id);
    if (memPost && !postSlug) postSlug = memPost.slug;
    memoryStore.posts = memoryStore.posts.filter(p => p.id !== id && p.slug !== id);

    deletePostFromSupabase(id, postSlug).catch(() => {});

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/posts/:slug/view', async (req, res) => {
  const { slug } = req.params;
  try {
    if (isMongooseReady()) {
      const post = await Post.findOneAndUpdate(
        { $or: [{ slug }, { id: slug }] },
        { $inc: { views: 1 } },
        { new: true }
      );
      if (post) return res.json({ views: post.views });
    }

    const post = (memoryStore.posts || []).find(p => p.slug === slug || p.id === slug);
    if (post) {
      post.views = (post.views || 0) + 1;
      return res.json({ views: post.views });
    }
    return res.json({ views: 1 });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. CATEGORIES ENDPOINTS
// ==========================================
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
    const newCat = { ...req.body, id: req.body.id || req.body.slug || `cat-${Date.now()}` };
    if (isMongooseReady()) {
      const created = await Category.create(newCat);
      return res.status(201).json(created);
    }
    if (!memoryStore.categories) memoryStore.categories = [];
    memoryStore.categories.push(newCat);
    return res.status(201).json(newCat);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.put('/categories/:id', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongooseReady()) {
      const updated = await Category.findOneAndUpdate({ id }, req.body, { new: true, upsert: true });
      return res.json(updated);
    }
    if (!memoryStore.categories) memoryStore.categories = [];
    const idx = memoryStore.categories.findIndex(c => c.id === id);
    if (idx !== -1) memoryStore.categories[idx] = { ...memoryStore.categories[idx], ...req.body };
    return res.json(req.body);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete('/categories/:id', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongooseReady()) {
      await Category.deleteOne({ id });
    }
    if (!memoryStore.categories) memoryStore.categories = [];
    memoryStore.categories = memoryStore.categories.filter(c => c.id !== id);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 6. AUTHORS ENDPOINTS
// ==========================================
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
    if (isMongooseReady()) {
      const created = await Author.create(newAuthor);
      return res.status(201).json(created);
    }
    if (!memoryStore.authors) memoryStore.authors = [];
    memoryStore.authors.push(newAuthor);
    return res.status(201).json(newAuthor);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.put('/authors/:id', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongooseReady()) {
      const updated = await Author.findOneAndUpdate({ id }, req.body, { new: true, upsert: true });
      return res.json(updated);
    }
    if (!memoryStore.authors) memoryStore.authors = [];
    const idx = memoryStore.authors.findIndex(a => a.id === id);
    if (idx !== -1) memoryStore.authors[idx] = { ...memoryStore.authors[idx], ...req.body };
    return res.json(req.body);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete('/authors/:id', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongooseReady()) {
      await Author.deleteOne({ id });
    }
    if (!memoryStore.authors) memoryStore.authors = [];
    memoryStore.authors = memoryStore.authors.filter(a => a.id !== id);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 7. SETTINGS ENDPOINTS
// ==========================================
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
    if (isMongooseReady()) {
      const updated = await Setting.findOneAndUpdate({}, req.body, { new: true, upsert: true });
      return res.json(updated);
    }
    memoryStore.settings = { ...memoryStore.settings, ...req.body };
    return res.json(memoryStore.settings);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.post('/settings/reset', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    if (isMongooseReady()) {
      await Setting.deleteMany({});
      const reset = await Setting.create(initialSettings);
      return res.json(reset);
    }
    memoryStore.settings = { ...initialSettings };
    return res.json(memoryStore.settings);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 8. COMMENTS ENDPOINTS
// ==========================================
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
    if (!memoryStore.comments) memoryStore.comments = [];
    memoryStore.comments.unshift(newComment);
    return res.status(201).json(newComment);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.post('/comments/:id/like', async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongooseReady()) {
      const comment = await Comment.findOneAndUpdate({ id }, { $inc: { likes: 1 } }, { new: true });
      if (comment) return res.json({ likes: comment.likes });
    }
    const c = (memoryStore.comments || []).find(item => item.id === id);
    if (c) {
      c.likes = (c.likes || 0) + 1;
      return res.json({ likes: c.likes });
    }
    return res.json({ likes: 1 });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/comments/:id', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongooseReady()) {
      await Comment.deleteOne({ id });
    }
    if (!memoryStore.comments) memoryStore.comments = [];
    memoryStore.comments = memoryStore.comments.filter(c => c.id !== id);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 9. SUBSCRIBERS ENDPOINTS
// ==========================================
router.get('/subscribers', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    if (isMongooseReady()) {
      const subs = await Subscriber.find().sort({ subscribedAt: -1 });
      return res.json(subs);
    }
    return res.json(memoryStore.subscribers || initialSubscribers);
  } catch (error) {
    return res.json(memoryStore.subscribers || initialSubscribers);
  }
});

router.post('/subscribers', async (req, res) => {
  const { email, source } = req.body;
  if (!email || !email.includes('@')) {
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
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/subscribers/:email', requireAuth, requireRole(['admin']), async (req, res) => {
  const { email } = req.params;
  try {
    if (isMongooseReady()) {
      await Subscriber.deleteOne({ email: email.toLowerCase() });
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 10. STAFF MANAGEMENT (SECURED & SANITIZED)
// ==========================================
router.get('/staff', optionalAuth, async (req, res) => {
  try {
    let rawList = [];
    if (isMongooseReady()) {
      rawList = await Staff.find().sort({ createdAt: -1 });
    }
    if (!rawList || rawList.length === 0) {
      const cloudStaff = await getSupabaseStaffManifest();
      rawList = cloudStaff.length > 0 ? cloudStaff : (memoryStore.staff || initialStaffList);
    }

    // Role-based filtering: Admin/Accountant sees salary, others get public sanitized view
    const isAdminUser = req.user && (req.user.role === 'admin' || req.user.role === 'accountant');
    const sanitizedList = rawList.map(s => isAdminUser ? sanitizeStaffForAdmin(s) : sanitizeStaffForPublic(s));
    return res.json(sanitizedList);
  } catch (error) {
    return res.json((memoryStore.staff || initialStaffList).map(s => sanitizeStaffForPublic(s)));
  }
});

router.post('/staff', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const rawPassword = req.body.password || '123456';
    const newStaff = {
      ...req.body,
      id: req.body.id || `staff-${Date.now()}`,
      password: hashPassword(rawPassword) // Scrypt hashed
    };

    let created = newStaff;
    if (isMongooseReady()) {
      created = await Staff.create(newStaff);
    }

    // Update memory & Supabase with sanitized records
    if (!memoryStore.staff) memoryStore.staff = [];
    memoryStore.staff.unshift(newStaff);

    const allStaff = isMongooseReady() ? await Staff.find() : memoryStore.staff;
    syncStaffToSupabase(allStaff).catch(() => {});

    return res.status(201).json(sanitizeStaffForAdmin(created));
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.put('/staff/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  // Non-admin can only update their own profile
  if (req.user.role !== 'admin' && req.user.id !== id) {
    return res.status(403).json({ error: 'Forbidden: You can only update your own profile' });
  }

  try {
    const updatedData = { ...req.body, id };
    // If password provided, hash it with Scrypt
    if (updatedData.password) {
      updatedData.password = hashPassword(updatedData.password);
    } else {
      delete updatedData.password; // Do not overwrite existing password with undefined
    }

    let updated = updatedData;
    if (isMongooseReady()) {
      const query = { $or: [{ id }] };
      if (updatedData.username) query.$or.push({ username: updatedData.username });
      updated = await Staff.findOneAndUpdate(query, updatedData, { new: true, upsert: true });
    }

    if (!memoryStore.staff) memoryStore.staff = [];
    const idx = memoryStore.staff.findIndex(s => s.id === id || (s.username && updatedData.username && s.username === updatedData.username));
    if (idx !== -1) {
      memoryStore.staff[idx] = { ...memoryStore.staff[idx], ...updatedData };
    } else {
      memoryStore.staff.unshift(updatedData);
    }

    const allStaff = isMongooseReady() ? await Staff.find() : memoryStore.staff;
    syncStaffToSupabase(allStaff).catch(() => {});

    return res.json(sanitizeStaffForAdmin(updated));
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete('/staff/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongooseReady()) {
      await Staff.findOneAndDelete({ id });
    }
    if (!memoryStore.staff) memoryStore.staff = [];
    memoryStore.staff = memoryStore.staff.filter(s => s.id !== id);

    const allStaff = isMongooseReady() ? await Staff.find() : memoryStore.staff;
    syncStaffToSupabase(allStaff).catch(() => {});

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 11. ACTIVITY LOGS
// ==========================================
router.get('/activity-logs', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    if (isMongooseReady()) {
      const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(100);
      return res.json(logs);
    }
    return res.json(memoryStore.activityLogs || []);
  } catch (error) {
    return res.json(memoryStore.activityLogs || []);
  }
});

router.post('/activity-logs', optionalAuth, async (req, res) => {
  try {
    const newLog = {
      ...req.body,
      id: req.body.id || `log-${Date.now()}`,
      userId: req.user ? req.user.id : req.body.userId || 'system',
      userName: req.user ? req.user.name : req.body.userName || 'System',
      timestamp: new Date().toISOString()
    };
    if (isMongooseReady()) {
      const created = await ActivityLog.create(newLog);
      return res.status(201).json(created);
    }
    if (!memoryStore.activityLogs) memoryStore.activityLogs = [];
    memoryStore.activityLogs.unshift(newLog);
    return res.status(201).json(newLog);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// ==========================================
// 12. REFERRALS & SHORTLINKS
// ==========================================
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
    return res.status(500).json({ error: error.message });
  }
});

export default router;
