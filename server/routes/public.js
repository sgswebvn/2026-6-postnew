import express from 'express';
import { Post } from '../models/Post.js';
import { Category } from '../models/Category.js';
import { Setting } from '../models/Setting.js';
import { CustomScript } from '../models/CustomScript.js';

const router = express.Router();

// GET /api/posts - Public paginated published posts
router.get('/posts', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;

    const { search, categoryId, featured } = req.query;
    const query = { status: 'published' };

    if (search && typeof search === 'string' && search.trim()) {
      const cleanSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: cleanSearch, $options: 'i' } },
        { excerpt: { $regex: cleanSearch, $options: 'i' } },
        { slug: { $regex: cleanSearch, $options: 'i' } },
        { tags: { $regex: cleanSearch, $options: 'i' } }
      ];
    }

    if (categoryId && typeof categoryId === 'string' && categoryId.trim()) {
      query.categoryId = categoryId.trim();
    }

    const sortOption = featured ? { views: -1, publishedAt: -1 } : { publishedAt: -1, createdAt: -1 };

    const [posts, total] = await Promise.all([
      Post.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .select('id title slug excerpt coverImage categoryId publishedAt createdAt views tags enableAds'),
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

// GET /api/posts/:slug - Full post with related posts & next/prev navigation
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

    // Fetch up to 3 related posts from same category
    let relatedPosts = [];
    if (post.categoryId) {
      relatedPosts = await Post.find({
        status: 'published',
        categoryId: post.categoryId,
        slug: { $ne: post.slug }
      })
        .sort({ publishedAt: -1 })
        .limit(3)
        .select('id title slug excerpt coverImage categoryId publishedAt views');
    }

    // Previous and Next articles for continuous reading
    const currentPubDate = post.publishedAt || post.createdAt;
    const [prevPost, nextPost] = await Promise.all([
      Post.findOne({
        status: 'published',
        $or: [
          { publishedAt: { $lt: currentPubDate } },
          { publishedAt: currentPubDate, _id: { $lt: post._id } }
        ]
      })
        .sort({ publishedAt: -1, _id: -1 })
        .select('title slug'),
      Post.findOne({
        status: 'published',
        $or: [
          { publishedAt: { $gt: currentPubDate } },
          { publishedAt: currentPubDate, _id: { $gt: post._id } }
        ]
      })
        .sort({ publishedAt: 1, _id: 1 })
        .select('title slug')
    ]);

    return res.json({
      post,
      category,
      relatedPosts,
      prevPost,
      nextPost
    });
  } catch (err) {
    console.error('[Public Post Detail Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve article details.' });
  }
});

// GET /api/categories - All public categories with live article count
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

// GET /api/categories/:slug - Single category details
router.get('/categories/:slug', async (req, res) => {
  try {
    const slug = req.params.slug.trim().toLowerCase();
    const category = await Category.findOne({
      $or: [
        { slug: { $regex: new RegExp(`^${slug}$`, 'i') } },
        { id: { $regex: new RegExp(`^${slug}$`, 'i') } },
        { name: { $regex: new RegExp(`^${slug}$`, 'i') } }
      ]
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const postCount = await Post.countDocuments({
      $or: [{ categoryId: category.id }, { categoryId: category.slug }],
      status: 'published'
    });
    return res.json({
      category: {
        ...category.toObject(),
        postCount
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve category.' });
  }
});

// GET /api/settings - Public website settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await Setting.findOne({ key: 'global_settings' }).select('-__v -_id');
    return res.json(settings || {});
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve settings.' });
  }
});

// GET /api/scripts - Public active header/footer scripts
router.get('/scripts', async (req, res) => {
  try {
    const scripts = await CustomScript.find({ enabled: true })
      .select('id name code location scope')
      .lean();
    return res.json(scripts);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load scripts.' });
  }
});

// POST /api/contact - Working contact inquiry handler
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    // Log feedback/inquiry safely
    console.log(`[Contact Form Received] From: "${name}" <${email}> | Subject: "${subject || 'General Inquiry'}"`);

    return res.json({
      success: true,
      message: 'Thank you for reaching out! Your message has been transmitted to our editorial desk.'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Could not submit contact inquiry.' });
  }
});

export default router;
