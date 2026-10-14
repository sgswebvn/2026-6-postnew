import express from 'express';
import { Post } from '../models/Post.js';
import { Category } from '../models/Category.js';
import { Setting } from '../models/Setting.js';

const router = express.Router();

// GET /api/posts
router.get('/posts', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;

    const { search, categoryId } = req.query;
    const query = { status: 'published' };

    if (search && typeof search === 'string' && search.trim()) {
      const cleanSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: cleanSearch, $options: 'i' } },
        { excerpt: { $regex: cleanSearch, $options: 'i' } },
        { slug: { $regex: cleanSearch, $options: 'i' } }
      ];
    }

    if (categoryId && typeof categoryId === 'string' && categoryId.trim()) {
      query.categoryId = categoryId.trim();
    }

    const [posts, total] = await Promise.all([
      Post.find(query)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('id title slug excerpt coverImage categoryId authorName publishedAt views tags'),
      Post.countDocuments(query)
    ]);

    return res.json({
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('[Public Posts Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve articles.' });
  }
});

// GET /api/posts/:slug
router.get('/posts/:slug', async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate(
      { slug: req.params.slug, status: 'published' },
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    let category = null;
    if (post.categoryId) {
      category = await Category.findOne({ id: post.categoryId });
    }

    return res.json({
      post,
      category
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve article details.' });
  }
});

// GET /api/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    const result = await Promise.all(categories.map(async (cat) => {
      const count = await Post.countDocuments({ categoryId: cat.id, status: 'published' });
      return {
        ...cat.toObject(),
        postCount: count
      };
    }));
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve categories.' });
  }
});

// GET /api/settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await Setting.findOne({ key: 'global_settings' }).select('-__v -_id');
    return res.json(settings || {});
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve settings.' });
  }
});

export default router;
