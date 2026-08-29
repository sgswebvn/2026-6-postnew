import express from 'express';
import mongoose from 'mongoose';
import { Post } from '../models/Post.js';
import { Category } from '../models/Category.js';
import { Author } from '../models/Author.js';
import { Setting } from '../models/Setting.js';
import { Comment } from '../models/Comment.js';
import { Subscriber } from '../models/Subscriber.js';
import { Referral } from '../models/Referral.js';
import { memoryStore, getDbStatus } from '../db.js';
import { initialPosts, initialCategories, initialAuthors, initialSettings, initialComments, initialSubscribers } from '../seedData.js';

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

router.post('/posts', async (req, res) => {
  try {
    const newPostData = {
      ...req.body,
      id: req.body.id || `post-${Date.now()}`,
      publishedAt: req.body.publishedAt || new Date(),
      views: req.body.views || 0,
    };

    if (isMongooseReady()) {
      const created = await Post.create(newPostData);
      return res.status(201).json(created);
    }

    memoryStore.posts.unshift(newPostData);
    return res.status(201).json(newPostData);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.put('/posts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongooseReady()) {
      const updated = await Post.findOneAndUpdate({ id }, req.body, { new: true });
      if (updated) return res.json(updated);
    }

    const idx = memoryStore.posts.findIndex(p => p.id === id);
    if (idx !== -1) {
      memoryStore.posts[idx] = { ...memoryStore.posts[idx], ...req.body, updatedAt: new Date() };
      return res.json(memoryStore.posts[idx]);
    }
    return res.status(404).json({ error: 'Article not found to update' });
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
    if (isMongooseReady()) {
      const updated = await Category.findOneAndUpdate({ id }, req.body, { new: true });
      if (updated) return res.json(updated);
    }
    const idx = memoryStore.categories.findIndex(c => c.id === id);
    if (idx !== -1) {
      memoryStore.categories[idx] = { ...memoryStore.categories[idx], ...req.body };
      return res.json(memoryStore.categories[idx]);
    }
    return res.status(404).json({ error: 'Category not found' });
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
      const created = await Author.create(newAuthor);
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
    if (isMongooseReady()) {
      const updated = await Author.findOneAndUpdate({ id }, req.body, { new: true });
      if (updated) return res.json(updated);
    }
    const idx = memoryStore.authors.findIndex(a => a.id === id);
    if (idx !== -1) {
      memoryStore.authors[idx] = { ...memoryStore.authors[idx], ...req.body };
      return res.json(memoryStore.authors[idx]);
    }
    return res.status(404).json({ error: 'Author not found' });
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

export default router;
