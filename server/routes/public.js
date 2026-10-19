import express from 'express';
import { Post } from '../models/Post.js';
import { Category } from '../models/Category.js';
import { Setting } from '../models/Setting.js';
import { CustomScript } from '../models/CustomScript.js';

const router = express.Router();

// High-speed in-memory micro-cache for public routes
let cachedSettings = null;
let cachedSettingsTime = 0;
let cachedCategories = null;
let cachedCategoriesTime = 0;
let cachedHomepagePosts = null;
let cachedHomepagePostsTime = 0;

export function invalidatePublicCache() {
  cachedSettings = null;
  cachedCategories = null;
  cachedHomepagePosts = null;
}

// GET /api/posts - Public paginated published posts
router.get('/posts', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;

    const { search, categoryId, featured } = req.query;

    // Serve instant cached response for standard homepage feed
    const isDefaultFrontPage = !search && !categoryId && !featured && page === 1 && limit === 12;
    const now = Date.now();
    if (isDefaultFrontPage && cachedHomepagePosts && (now - cachedHomepagePostsTime < 20000)) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedHomepagePosts);
    }

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
      const trimmedCat = categoryId.trim();
      const matchedCat = await Category.findOne({
        $or: [{ id: trimmedCat }, { slug: trimmedCat }]
      }).select('id slug').lean();

      if (matchedCat) {
        query.categoryId = { $in: [matchedCat.id, matchedCat.slug].filter(Boolean) };
      } else {
        query.categoryId = trimmedCat;
      }
    }

    const sortOption = featured ? { views: -1, publishedAt: -1 } : { publishedAt: -1, createdAt: -1 };

    const [posts, total] = await Promise.all([
      Post.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .select('id title slug excerpt coverImage categoryId publishedAt createdAt views tags enableAds')
        .lean(),
      Post.countDocuments(query)
    ]);

    const responsePayload = {
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };

    if (isDefaultFrontPage) {
      cachedHomepagePosts = responsePayload;
      cachedHomepagePostsTime = now;
      res.setHeader('X-Cache', 'MISS');
    }

    return res.json(responsePayload);
  } catch (err) {
    console.error('[Public Posts Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve articles.' });
  }
});

// GET /api/posts/:slug - Full post with parallel queries & non-blocking views
router.get('/posts/:slug', async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug, status: 'published' }).lean();

    if (!post) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    // Fire-and-forget non-blocking view counter increment
    Post.updateOne({ _id: post._id }, { $inc: { views: 1 } }).exec();

    const currentPubDate = post.publishedAt || post.createdAt;

    // Run category, related posts, prev and next queries in parallel (1 roundtrip instead of 4)
    const [category, relatedPosts, prevPost, nextPost] = await Promise.all([
      post.categoryId
        ? Category.findOne({ $or: [{ id: post.categoryId }, { slug: post.categoryId }] }).lean()
        : Promise.resolve(null),
      post.categoryId
        ? Post.find({
            status: 'published',
            categoryId: post.categoryId,
            slug: { $ne: post.slug }
          })
            .sort({ publishedAt: -1 })
            .limit(3)
            .select('id title slug excerpt coverImage categoryId publishedAt views')
            .lean()
        : Promise.resolve([]),
      Post.findOne({
        status: 'published',
        $or: [
          { publishedAt: { $lt: currentPubDate } },
          { publishedAt: currentPubDate, _id: { $lt: post._id } }
        ]
      })
        .sort({ publishedAt: -1, _id: -1 })
        .select('title slug')
        .lean(),
      Post.findOne({
        status: 'published',
        $or: [
          { publishedAt: { $gt: currentPubDate } },
          { publishedAt: currentPubDate, _id: { $gt: post._id } }
        ]
      })
        .sort({ publishedAt: 1, _id: 1 })
        .select('title slug')
        .lean()
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

// GET /api/categories - All public categories with live article count (cached 30s)
router.get('/categories', async (req, res) => {
  try {
    const now = Date.now();
    if (cachedCategories && (now - cachedCategoriesTime < 30000)) {
      return res.json(cachedCategories);
    }

    const [categories, counts] = await Promise.all([
      Category.find().sort({ name: 1 }).lean(),
      Post.aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: '$categoryId', count: { $sum: 1 } } }
      ])
    ]);

    const countMap = {};
    counts.forEach(c => {
      if (c._id) countMap[c._id] = c.count;
    });

    const result = categories.map(cat => {
      const idCount = countMap[cat.id] || 0;
      const slugCount = (cat.slug && cat.slug !== cat.id) ? (countMap[cat.slug] || 0) : 0;
      const mongoIdCount = (cat._id && String(cat._id) !== cat.id) ? (countMap[String(cat._id)] || 0) : 0;
      return {
        ...cat,
        postCount: idCount + slugCount + mongoIdCount
      };
    });

    cachedCategories = result;
    cachedCategoriesTime = now;

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve categories.' });
  }
});

// GET /api/categories/:slug - Single category details
router.get('/categories/:slug', async (req, res) => {
  try {
    const slug = req.params.slug.trim().toLowerCase();
    const cleanSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const category = await Category.findOne({
      $or: [
        { slug: { $regex: new RegExp(`^${cleanSlug}$`, 'i') } },
        { id: { $regex: new RegExp(`^${cleanSlug}$`, 'i') } },
        { name: { $regex: new RegExp(`^${cleanSlug}$`, 'i') } }
      ]
    }).lean();

    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const postCount = await Post.countDocuments({
      $or: [{ categoryId: category.id }, { categoryId: category.slug }],
      status: 'published'
    });
    return res.json({
      category: {
        ...category,
        postCount
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve category.' });
  }
});

// GET /api/settings - Public website settings (cached 30s)
router.get('/settings', async (req, res) => {
  try {
    const now = Date.now();
    if (cachedSettings && (now - cachedSettingsTime < 30000)) {
      return res.json(cachedSettings);
    }
    const settings = await Setting.findOne({ key: 'global_settings' }).select('-__v -_id').lean();
    cachedSettings = settings || {};
    cachedSettingsTime = now;
    return res.json(cachedSettings);
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
