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
// 2. POSTS ENDPOINTS (CRUD)
// ==========================================
router.get('/posts', async (req, res) => {
  try {
    if (isMongooseReady()) {
      const posts = await Post.find().sort({ publishedAt: -1 });
      return res.json(posts);
    }
    return res.json(memoryStore.posts);
  } catch (error) {
    return res.json(memoryStore.posts);
  }
});

router.get('/posts/published', async (req, res) => {
  try {
    if (isMongooseReady()) {
      const posts = await Post.find({ status: 'published' }).sort({ publishedAt: -1 });
      return res.json(posts);
    }
    const published = memoryStore.posts.filter(p => p.status === 'published');
    return res.json(published);
  } catch (error) {
    return res.json(memoryStore.posts.filter(p => p.status === 'published'));
  }
});

router.get('/posts/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    if (isMongooseReady()) {
      const post = await Post.findOne({ slug });
      if (post) return res.json(post);
    }
    const post = memoryStore.posts.find(p => p.slug === slug);
    if (!post) return res.status(404).json({ error: 'Article not found' });
    return res.json(post);
  } catch (error) {
    const post = memoryStore.posts.find(p => p.slug === slug);
    if (!post) return res.status(404).json({ error: 'Article not found' });
    return res.json(post);
  }
});

router.post('/posts/:slug/view', async (req, res) => {
  const { slug } = req.params;
  try {
    if (isMongooseReady()) {
      const updated = await Post.findOneAndUpdate(
        { slug },
        { $inc: { views: 1 } },
        { new: true }
      );
      if (updated) return res.json(updated);
    }
    const post = memoryStore.posts.find(p => p.slug === slug);
    if (post) {
      post.views = (post.views || 0) + 1;
      return res.json(post);
    }
    return res.status(404).json({ error: 'Article not found' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/posts', async (req, res) => {
  try {
    const rawTitle = req.body.title || 'Untitled Article';
    const autoSlug = (req.body.slug || rawTitle)
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s-]+/g, '-') || `post-${Date.now()}`;

    const newPostData = {
      id: req.body.id || `post-${Date.now()}`,
      title: rawTitle,
      slug: autoSlug,
      excerpt: req.body.excerpt || (req.body.content ? req.body.content.replace(/<[^>]*>/g, '').slice(0, 160) : ''),
      content: req.body.content || '',
      coverImage: req.body.coverImage || '',
      categoryId: req.body.categoryId || 'personal-finance',
      authorId: req.body.authorId || 'author-1',
      factCheckerId: req.body.factCheckerId || '',
      readTime: req.body.readTime || '5 min read',
      status: req.body.status || 'published',
      featured: Boolean(req.body.featured),
      trendingRank: Number(req.body.trendingRank || 0),
      views: Number(req.body.views || 0),
      tags: Array.isArray(req.body.tags) ? req.body.tags : (typeof req.body.tags === 'string' ? req.body.tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      metaTitle: req.body.metaTitle || rawTitle,
      metaDescription: req.body.metaDescription || req.body.excerpt || '',
      focusKeyword: req.body.focusKeyword || '',
      enableAds: req.body.enableAds !== false,
      publishedAt: req.body.publishedAt || new Date(),
      updatedAt: new Date()
    };

    if (isMongooseReady()) {
      // Find and update if existing by id or slug, otherwise create new
      const created = await Post.findOneAndUpdate(
        { $or: [{ id: newPostData.id }, { slug: newPostData.slug }] },
        newPostData,
        { new: true, upsert: true }
      );
      return res.status(201).json(created);
    }

    const existingIdx = memoryStore.posts.findIndex(p => p.id === newPostData.id || p.slug === newPostData.slug);
    if (existingIdx !== -1) {
      memoryStore.posts[existingIdx] = newPostData;
    } else {
      memoryStore.posts.unshift(newPostData);
    }
    return res.status(201).json(newPostData);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.put('/posts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updateData = {
      ...req.body,
      id,
      updatedAt: new Date()
    };

    if (isMongooseReady()) {
      const updated = await Post.findOneAndUpdate(
        { id },
        updateData,
        { new: true, upsert: true }
      );
      if (updated) return res.json(updated);
    }

    const idx = memoryStore.posts.findIndex(p => p.id === id);
    if (idx !== -1) {
      memoryStore.posts[idx] = { ...memoryStore.posts[idx], ...updateData };
      return res.json(memoryStore.posts[idx]);
    } else {
      memoryStore.posts.unshift(updateData);
      return res.json(updateData);
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete('/posts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongooseReady()) {
      await Post.deleteOne({ id });
    }
    memoryStore.posts = memoryStore.posts.filter(p => p.id !== id);
    return res.json({ success: true, message: 'Article deleted' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/posts/:slug/view', async (req, res) => {
  const { slug } = req.params;
  try {
    if (isMongooseReady()) {
      const post = await Post.findOneAndUpdate({ slug }, { $inc: { views: 1 } }, { new: true });
      if (post) return res.json({ views: post.views });
    }
    const post = memoryStore.posts.find(p => p.slug === slug);
    if (post) {
      post.views = (post.views || 0) + 1;
      return res.json({ views: post.views });
    }
    return res.json({ views: 1 });
  } catch (error) {
    return res.json({ views: 1 });
  }
});

// ==========================================
// 3. CATEGORIES ENDPOINTS
// ==========================================
router.get('/categories', async (req, res) => {
  try {
    if (isMongooseReady()) {
      const categories = await Category.find();
      return res.json(categories);
    }
    return res.json(memoryStore.categories);
  } catch (error) {
    return res.json(memoryStore.categories);
  }
});

router.post('/categories', async (req, res) => {
  try {
    const newCat = {
      ...req.body,
      id: req.body.id || `cat-${Date.now()}`
    };
    if (isMongooseReady()) {
      const created = await Category.create(newCat);
      return res.status(201).json(created);
    }
    memoryStore.categories.push(newCat);
    return res.status(201).json(newCat);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.put('/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updateData = { ...req.body, id };
    if (isMongooseReady()) {
      const updated = await Category.findOneAndUpdate({ id }, updateData, { new: true, upsert: true });
      if (updated) return res.json(updated);
    }
    const idx = memoryStore.categories.findIndex(c => c.id === id);
    if (idx !== -1) {
      memoryStore.categories[idx] = { ...memoryStore.categories[idx], ...updateData };
      return res.json(memoryStore.categories[idx]);
    } else {
      memoryStore.categories.push(updateData);
      return res.json(updateData);
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete('/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongooseReady()) {
      await Category.deleteOne({ id });
    }
    memoryStore.categories = memoryStore.categories.filter(c => c.id !== id);
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. AUTHORS ENDPOINTS
// ==========================================
router.get('/authors', async (req, res) => {
  try {
    if (isMongooseReady()) {
      const authors = await Author.find();
      return res.json(authors);
    }
    return res.json(memoryStore.authors);
  } catch (error) {
    return res.json(memoryStore.authors);
  }
});

router.post('/authors', async (req, res) => {
  try {
    const newAuthor = {
      ...req.body,
      id: req.body.id || `author-${Date.now()}`
    };
    if (isMongooseReady()) {
      const created = await Author.findOneAndUpdate(
        { id: newAuthor.id },
        newAuthor,
        { new: true, upsert: true }
      );
      return res.status(201).json(created);
    }
    memoryStore.authors.push(newAuthor);
    return res.status(201).json(newAuthor);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.put('/authors/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updateData = { ...req.body, id };
    if (isMongooseReady()) {
      const updated = await Author.findOneAndUpdate({ id }, updateData, { new: true, upsert: true });
      if (updated) return res.json(updated);
    }
    const idx = memoryStore.authors.findIndex(a => a.id === id);
    if (idx !== -1) {
      memoryStore.authors[idx] = { ...memoryStore.authors[idx], ...updateData };
      return res.json(memoryStore.authors[idx]);
    } else {
      memoryStore.authors.push(updateData);
      return res.json(updateData);
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete('/authors/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongooseReady()) {
      await Author.deleteOne({ id });
    }
    memoryStore.authors = memoryStore.authors.filter(a => a.id !== id);
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. SETTINGS & ADSENSE
// ==========================================
router.get('/settings', async (req, res) => {
  try {
    if (isMongooseReady()) {
      let settings = await Setting.findOne({ key: 'global_settings' });
      if (!settings) {
        settings = await Setting.create(initialSettings);
      }
      return res.json(settings);
    }
    return res.json(memoryStore.settings);
  } catch (error) {
    return res.json(memoryStore.settings);
  }
});

router.put('/settings', async (req, res) => {
  try {
    if (isMongooseReady()) {
      const updated = await Setting.findOneAndUpdate(
        { key: 'global_settings' },
        req.body,
        { new: true, upsert: true }
      );
      return res.json(updated);
    }
    memoryStore.settings = { ...memoryStore.settings, ...req.body };
    return res.json(memoryStore.settings);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.post('/settings/reset', async (req, res) => {
  try {
    if (isMongooseReady()) {
      await Post.deleteMany({});
      await Category.deleteMany({});
      await Author.deleteMany({});
      await Setting.deleteMany({});
      await Comment.deleteMany({});
      await Subscriber.deleteMany({});

      await Post.insertMany(initialPosts);
      await Category.insertMany(initialCategories);
      await Author.insertMany(initialAuthors);
      await Setting.create(initialSettings);
      await Comment.insertMany(initialComments);
      await Subscriber.insertMany(initialSubscribers);
    }

    memoryStore.posts = [...initialPosts];
    memoryStore.categories = [...initialCategories];
    memoryStore.authors = [...initialAuthors];
    memoryStore.settings = { ...initialSettings };
    memoryStore.comments = [...initialComments];
    memoryStore.subscribers = [...initialSubscribers];

    return res.json({ success: true, message: 'All collections reset to initial US Editorial dataset' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 6. COMMENTS MODERATION
// ==========================================
router.get('/comments', async (req, res) => {
  try {
    if (isMongooseReady()) {
      const comments = await Comment.find().sort({ createdAt: -1 });
      return res.json(comments);
    }
    return res.json(memoryStore.comments);
  } catch (error) {
    return res.json(memoryStore.comments);
  }
});

router.get('/comments/post/:postId', async (req, res) => {
  const { postId } = req.params;
  try {
    if (isMongooseReady()) {
      const comments = await Comment.find({ postId }).sort({ createdAt: -1 });
      return res.json(comments);
    }
    return res.json(memoryStore.comments.filter(c => c.postId === postId));
  } catch (error) {
    return res.json(memoryStore.comments.filter(c => c.postId === postId));
  }
});

router.post('/comments', async (req, res) => {
  try {
    const newComment = {
      ...req.body,
      id: req.body.id || `comm-${Date.now()}`,
      createdAt: new Date()
    };
    if (isMongooseReady()) {
      const created = await Comment.create(newComment);
      return res.status(201).json(created);
    }
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
    const c = memoryStore.comments.find(item => item.id === id);
    if (c) {
      c.likes = (c.likes || 1) + 1;
      return res.json({ likes: c.likes });
    }
    return res.json({ likes: 1 });
  } catch (error) {
    return res.json({ likes: 1 });
  }
});

router.delete('/comments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongooseReady()) {
      await Comment.deleteOne({ id });
    }
    memoryStore.comments = memoryStore.comments.filter(c => c.id !== id);
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 7. SUBSCRIBERS
// ==========================================
router.get('/subscribers', async (req, res) => {
  try {
    if (isMongooseReady()) {
      const subs = await Subscriber.find().sort({ date: -1 });
      return res.json(subs);
    }
    return res.json(memoryStore.subscribers);
  } catch (error) {
    return res.json(memoryStore.subscribers);
  }
});

router.post('/subscribers', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address required' });
    }

    const subData = {
      email,
      date: new Date(),
      source: req.body.source || 'Website Form'
    };

    if (isMongooseReady()) {
      const existing = await Subscriber.findOne({ email });
      if (!existing) {
        await Subscriber.create(subData);
      }
      return res.status(201).json({ success: true, email });
    }

    if (!memoryStore.subscribers.some(s => s.email === email)) {
      memoryStore.subscribers.unshift(subData);
    }
    return res.status(201).json({ success: true, email });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete('/subscribers/:email', async (req, res) => {
  const { email } = req.params;
  try {
    if (isMongooseReady()) {
      await Subscriber.deleteOne({ email });
    }
    memoryStore.subscribers = memoryStore.subscribers.filter(s => s.email !== email);
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 8. SEEDING / REFERRALS
// ==========================================
router.get('/referrals', async (req, res) => {
  try {
    if (isMongooseReady()) {
      const refs = await Referral.find();
      const refMap = {};
      refs.forEach(r => { refMap[r.refCode] = r.hits; });
      return res.json(refMap);
    }
    return res.json(memoryStore.referrals || {});
  } catch (error) {
    return res.json({});
  }
});

router.post('/referrals/hit/:refCode', async (req, res) => {
  const { refCode } = req.params;
  const cleanRef = refCode.toUpperCase().trim();
  try {
    if (isMongooseReady()) {
      const updated = await Referral.findOneAndUpdate(
        { refCode: cleanRef },
        { $inc: { hits: 1 }, lastHitAt: new Date() },
        { new: true, upsert: true }
      );
      
      const refs = await Referral.find();
      const refMap = {};
      refs.forEach(r => { refMap[r.refCode] = r.hits; });
      return res.json(refMap);
    }
    
    if (!memoryStore.referrals) memoryStore.referrals = {};
    memoryStore.referrals[cleanRef] = (memoryStore.referrals[cleanRef] || 0) + 1;
    return res.json(memoryStore.referrals);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 9. STAFF & AUTH
// ==========================================
router.get('/staff', async (req, res) => {
  try {
    if (isMongooseReady()) {
      const staff = await Staff.find().sort({ createdAt: -1 });
      return res.json(staff);
    }
    return res.json(memoryStore.staff || []);
  } catch (error) {
    return res.json(memoryStore.staff || []);
  }
});

router.post('/staff', async (req, res) => {
  try {
    const newStaff = {
      ...req.body,
      id: req.body.id || `staff-${Date.now()}`
    };
    if (isMongooseReady()) {
      const created = await Staff.create(newStaff);
      return res.status(201).json(created);
    }
    if (!memoryStore.staff) memoryStore.staff = [];
    memoryStore.staff.push(newStaff);
    return res.status(201).json(newStaff);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.put('/staff/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongooseReady()) {
      const updated = await Staff.findOneAndUpdate({ id }, req.body, { new: true });
      if (updated) return res.json(updated);
    }
    if (!memoryStore.staff) memoryStore.staff = [];
    const idx = memoryStore.staff.findIndex(s => s.id === id);
    if (idx !== -1) {
      memoryStore.staff[idx] = { ...memoryStore.staff[idx], ...req.body };
      return res.json(memoryStore.staff[idx]);
    }
    return res.status(404).json({ error: 'Staff not found' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete('/staff/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongooseReady()) {
      await Staff.findOneAndDelete({ id });
      return res.status(204).send();
    }
    if (!memoryStore.staff) memoryStore.staff = [];
    memoryStore.staff = memoryStore.staff.filter(s => s.id !== id);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/auth/login', async (req, res) => {
  const { identifier, password } = req.body;
  try {
    let staffMember = null;
    if (isMongooseReady()) {
      staffMember = await Staff.findOne({
        $or: [
          { username: identifier, password: password },
          { email: identifier, password: password }
        ]
      });
    } else {
      staffMember = (memoryStore.staff || []).find(
        s => (s.username === identifier || s.email === identifier) && s.password === password
      );
    }

    if (staffMember) {
      return res.json({ success: true, staff: staffMember });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 10. ACTIVITY LOGS
// ==========================================
router.get('/activity-logs', async (req, res) => {
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

router.post('/activity-logs', async (req, res) => {
  try {
    const newLog = {
      ...req.body,
      id: req.body.id || `act-${Date.now()}`
    };
    if (isMongooseReady()) {
      const created = await ActivityLog.create(newLog);
      return res.status(201).json(created);
    }
    if (!memoryStore.activityLogs) memoryStore.activityLogs = [];
    memoryStore.activityLogs.unshift(newLog);
    if (memoryStore.activityLogs.length > 100) memoryStore.activityLogs.length = 100;
    return res.status(201).json(newLog);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// ==========================================
// 10. SHORTLINKS ENDPOINTS (Seeding URL Shortener)
// ==========================================
router.get('/shortlinks', async (req, res) => {
  try {
    if (isMongooseReady()) {
      const links = await ShortLink.find().sort({ createdAt: -1 });
      return res.json(links);
    }
    return res.json(memoryStore.shortLinks || []);
  } catch (error) {
    return res.json(memoryStore.shortLinks || []);
  }
});

router.post('/shortlinks', async (req, res) => {
  try {
    const { originalUrl, postSlug, postTitle, coverImage, staffCode, staffName, customCode } = req.body;
    let code = (customCode || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!code) {
      code = Math.random().toString(36).substring(2, 7);
    }

    const newLink = {
      id: `sl-${Date.now()}`,
      code,
      originalUrl,
      postSlug: postSlug || '',
      postTitle: postTitle || '',
      coverImage: coverImage || '',
      staffCode: (staffCode || '').toUpperCase().trim(),
      staffName: staffName || '',
      clicks: 0,
      createdAt: new Date().toISOString()
    };

    if (isMongooseReady()) {
      // Upsert
      const saved = await ShortLink.findOneAndUpdate(
        { code },
        newLink,
        { upsert: true, new: true }
      );
      return res.status(201).json(saved);
    }

    if (!memoryStore.shortLinks) memoryStore.shortLinks = [];
    const existingIdx = memoryStore.shortLinks.findIndex(l => l.code === code);
    if (existingIdx >= 0) {
      memoryStore.shortLinks[existingIdx] = newLink;
    } else {
      memoryStore.shortLinks.unshift(newLink);
    }
    return res.status(201).json(newLink);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete('/shortlinks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongooseReady()) {
      await ShortLink.findOneAndDelete({ $or: [{ id }, { code: id }] });
      return res.status(204).send();
    }
    if (memoryStore.shortLinks) {
      memoryStore.shortLinks = memoryStore.shortLinks.filter(l => l.id !== id && l.code !== id);
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
