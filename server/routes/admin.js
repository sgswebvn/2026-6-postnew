import express from 'express';
import mongoose from 'mongoose';
import { Post } from '../models/Post.js';
import { Category } from '../models/Category.js';
import { Staff } from '../models/Staff.js';
import { Setting } from '../models/Setting.js';
import { CustomScript } from '../models/CustomScript.js';
import { requireAuth, requireAdmin, sanitizeStaff, hashPassword } from '../auth.js';
import { isDbConnected } from '../db.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Apply auth to all admin routes
router.use(requireAuth);

// Helper to synchronize postCount across all categories
export async function refreshAllCategoryPostCounts() {
  try {
    const counts = await Post.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach(c => {
      if (c._id) countMap[c._id] = c.count;
    });

    const categories = await Category.find();
    for (const cat of categories) {
      const idCount = countMap[cat.id] || 0;
      const slugCount = (cat.slug && cat.slug !== cat.id) ? (countMap[cat.slug] || 0) : 0;
      const mongoIdCount = (cat._id && String(cat._id) !== cat.id) ? (countMap[String(cat._id)] || 0) : 0;
      const newCount = idCount + slugCount + mongoIdCount;
      if (cat.postCount !== newCount) {
        cat.postCount = newCount;
        await cat.save();
      }
    }
  } catch (e) {
    console.warn('[refreshAllCategoryPostCounts Error]', e.message);
  }
}

// Helper to slugify text safely supporting Unicode / Vietnamese
export function generateSlug(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

// Helper to calculate exact date ranges and equivalent previous period for comparison
export function getDateRange(rangeKey, customStart, customEnd) {
  const now = new Date();
  let start = new Date();
  let end = new Date();
  let prevStart = new Date();
  let prevEnd = new Date();

  end.setHours(23, 59, 59, 999);

  switch (rangeKey) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 1);
      prevEnd = new Date(start);
      prevEnd.setMilliseconds(-1);
      break;
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 1);
      prevEnd = new Date(start);
      prevEnd.setMilliseconds(-1);
      break;
    case '7d':
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 7);
      prevEnd = new Date(start);
      prevEnd.setMilliseconds(-1);
      break;
    case '30d':
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 30);
      prevEnd = new Date(start);
      prevEnd.setMilliseconds(-1);
      break;
    case '90d':
      start.setDate(now.getDate() - 89);
      start.setHours(0, 0, 0, 0);
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 90);
      prevEnd = new Date(start);
      prevEnd.setMilliseconds(-1);
      break;
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
      break;
    case 'this_quarter': {
      const q = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), q * 3, 1, 0, 0, 0, 0);
      prevStart = new Date(now.getFullYear(), (q - 1) * 3, 1, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), q * 3, 0, 23, 59, 59, 999);
      break;
    }
    case 'last_quarter': {
      const q = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), (q - 1) * 3, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), q * 3, 0, 23, 59, 59, 999);
      prevStart = new Date(now.getFullYear(), (q - 2) * 3, 1, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), (q - 1) * 3, 0, 23, 59, 59, 999);
      break;
    }
    case 'this_year':
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      prevStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      break;
    case 'last_year':
      start = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      prevStart = new Date(now.getFullYear() - 2, 0, 1, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear() - 2, 11, 31, 23, 59, 59, 999);
      break;
    case 'custom':
      if (customStart) {
        start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
      }
      if (customEnd) {
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
      }
      const diffMs = Math.max(86400000, end - start);
      prevEnd = new Date(start.getTime() - 1);
      prevStart = new Date(start.getTime() - diffMs);
      break;
    default:
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 30);
      prevEnd = new Date(start);
      prevEnd.setMilliseconds(-1);
      break;
  }

  return { start, end, prevStart, prevEnd };
}

// ==========================================
// 1. DASHBOARD OVERVIEW & ADVANCED ANALYTICS
// ==========================================
router.get('/stats', async (req, res) => {
  try {
    const { range = '30d', startDate, endDate, categoryId, status } = req.query;
    const { start, end, prevStart, prevEnd } = getDateRange(range, startDate, endDate);

    // Build base query
    const baseQuery = {};
    if (categoryId && typeof categoryId === 'string' && categoryId.trim()) {
      baseQuery.categoryId = categoryId.trim();
    }
    if (status && ['published', 'draft'].includes(status)) {
      baseQuery.status = status;
    }

    // Cumulative stats
    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      totalCategories,
      totalStaff,
      viewsAggregation,
      recentPosts
    ] = await Promise.all([
      Post.countDocuments(baseQuery),
      Post.countDocuments({ ...baseQuery, status: 'published' }),
      Post.countDocuments({ ...baseQuery, status: 'draft' }),
      Category.countDocuments(),
      Staff.countDocuments(),
      Post.aggregate([
        { $match: baseQuery },
        { $group: { _id: null, totalViews: { $sum: '$views' } } }
      ]),
      Post.find(baseQuery)
        .sort({ createdAt: -1 })
        .limit(6)
        .select('id title slug status views categoryId publishedAt createdAt')
    ]);

    const totalViews = viewsAggregation[0]?.totalViews || 0;

    // Period-specific queries
    const periodFilter = {
      ...baseQuery,
      createdAt: { $gte: start, $lte: end }
    };
    const prevPeriodFilter = {
      ...baseQuery,
      createdAt: { $gte: prevStart, $lte: prevEnd }
    };

    const [periodPostsCount, prevPeriodPostsCount] = await Promise.all([
      Post.countDocuments(periodFilter),
      Post.countDocuments(prevPeriodFilter)
    ]);

    // Top performing posts by views in scope
    const topPosts = await Post.find(baseQuery)
      .sort({ views: -1 })
      .limit(6)
      .select('id title slug views categoryId status publishedAt');

    // Daily distribution timeline for visual chart
    const timelineData = await Post.aggregate([
      {
        $match: {
          ...baseQuery,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          views: { $sum: '$views' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return res.json({
      range,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      totalPosts,
      publishedPosts,
      draftPosts,
      totalCategories,
      totalStaff,
      totalViews,
      periodPostsCount,
      prevPeriodPostsCount,
      dbConnected: isDbConnected(),
      recentPosts,
      topPosts,
      timelineData
    });
  } catch (err) {
    console.error('[Admin Stats Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve system statistics.' });
  }
});

// Analytics View Data
router.get('/analytics', async (req, res) => {
  try {
    const { range = '30d', startDate, endDate } = req.query;
    const { start, end, prevStart, prevEnd } = getDateRange(range, startDate, endDate);

    const setting = await Setting.findOne({ key: 'global_settings' });
    const gaMeasurementId = setting?.gaTrackingId || process.env.VITE_GA_MEASUREMENT_ID || '';

    // Aggregate category performance
    const categoryStats = await Post.aggregate([
      {
        $group: {
          _id: '$categoryId',
          count: { $sum: 1 },
          totalViews: { $sum: '$views' },
          avgViews: { $avg: '$views' }
        }
      },
      { $sort: { totalViews: -1 } }
    ]);

    // Match category names
    const allCategories = await Category.find();
    const categoriesMap = {};
    allCategories.forEach(c => { categoriesMap[c.id] = c.name; });

    const enrichedCategoryStats = categoryStats.map(c => ({
      categoryId: c._id || 'general',
      categoryName: categoriesMap[c._id] || c._id || 'General',
      count: c.count,
      totalViews: c.totalViews,
      avgViews: Math.round(c.avgViews || 0)
    }));

    // Top 10 landing pages
    const topLandingPages = await Post.find({ status: 'published' })
      .sort({ views: -1 })
      .limit(10)
      .select('id title slug views categoryId publishedAt');

    // First-party Views Timeline
    const timeline = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          posts: { $sum: 1 },
          views: { $sum: '$views' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Check GA4 Data API credentials status
    const hasGa4ApiCredentials = Boolean(
      process.env.GA4_PROPERTY_ID &&
      (process.env.GOOGLE_APPLICATION_CREDENTIALS || (process.env.GA4_CLIENT_EMAIL && process.env.GA4_PRIVATE_KEY))
    );

    return res.json({
      range,
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      gaMeasurementId,
      gaStatus: {
        connected: hasGa4ApiCredentials,
        measurementId: gaMeasurementId,
        status: hasGa4ApiCredentials ? 'connected' : 'tracking_only'
      },
      ga4Status: hasGa4ApiCredentials ? 'connected' : 'tracking_only',
      hasGa4ApiCredentials,
      categoryStats: enrichedCategoryStats,
      topLandingPages,
      timeline
    });
  } catch (err) {
    console.error('[Analytics Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve analytics data.' });
  }
});

// ==========================================
// 2. POSTS MANAGEMENT (CRUD + BULK ACTIONS + MULTI-PAGE SELECT + PURGE ALL)
// ==========================================
router.get('/posts', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const { search, status, categoryId, startDate, endDate } = req.query;
    const query = {};

    if (search && typeof search === 'string' && search.trim()) {
      const cleanSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: cleanSearch, $options: 'i' } },
        { slug: { $regex: cleanSearch, $options: 'i' } },
        { excerpt: { $regex: cleanSearch, $options: 'i' } }
      ];
    }

    if (status && ['published', 'draft'].includes(status)) {
      query.status = status;
    }

    if (categoryId && typeof categoryId === 'string' && categoryId.trim()) {
      query.categoryId = categoryId.trim();
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const endD = new Date(endDate);
        endD.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endD;
      }
    }

    const [posts, total] = await Promise.all([
      Post.find(query).sort({ publishedAt: -1, createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments(query)
    ]);

    return res.json({
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('[Admin Get Posts Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve posts.' });
  }
});

// Bulk Post Actions (Select multiple -> Publish / Draft / Delete)
router.post('/posts/bulk', async (req, res) => {
  try {
    const { action, ids, selectAllMatching, filterQuery } = req.body;

    if (!['publish', 'draft', 'delete'].includes(action)) {
      return res.status(400).json({ error: 'Invalid bulk action. Allowed: publish, draft, delete.' });
    }

    let targetQuery = {};
    if (selectAllMatching) {
      // Build query from filters
      if (filterQuery?.search) {
        const clean = String(filterQuery.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        targetQuery.$or = [{ title: { $regex: clean, $options: 'i' } }, { slug: { $regex: clean, $options: 'i' } }];
      }
      if (filterQuery?.status && ['published', 'draft'].includes(filterQuery.status)) {
        targetQuery.status = filterQuery.status;
      }
      if (filterQuery?.categoryId) {
        targetQuery.categoryId = filterQuery.categoryId;
      }
    } else {
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'No article IDs provided for bulk action.' });
      }
      const validObjectIds = ids.filter(id => mongoose.isValidObjectId(id));
      const queryOr = [{ id: { $in: ids } }];
      if (validObjectIds.length > 0) {
        queryOr.push({ _id: { $in: validObjectIds } });
      }
      targetQuery = { $or: queryOr };
    }

    if (action === 'publish') {
      const result = await Post.updateMany(targetQuery, {
        $set: { status: 'published', updatedAt: new Date() }
      });
      // Recalculate categories post counts
      await refreshAllCategoryPostCounts();
      return res.json({ message: `Successfully published ${result.modifiedCount} articles.` });
    }

    if (action === 'draft') {
      const result = await Post.updateMany(targetQuery, {
        $set: { status: 'draft', updatedAt: new Date() }
      });
      await refreshAllCategoryPostCounts();
      return res.json({ message: `Successfully changed ${result.modifiedCount} articles to draft.` });
    }

    if (action === 'delete') {
      if (selectAllMatching && Object.keys(targetQuery).length === 0) {
        return res.status(400).json({
          error: 'Bulk deletion across all articles without filters is blocked for safety. Please specify filters or use the Danger Zone.'
        });
      }
      const result = await Post.deleteMany(targetQuery);
      await refreshAllCategoryPostCounts();
      return res.json({ message: `Successfully deleted ${result.deletedCount} articles.` });
    }
  } catch (err) {
    console.error('[Bulk Action Error]', err);
    return res.status(500).json({ error: 'Failed to execute bulk action.' });
  }
});

// Danger Zone: Delete ALL Posts from database with exact confirmation phrase
router.post('/posts/delete-all', requireAdmin, async (req, res) => {
  try {
    const { confirmationPhrase } = req.body;

    if (confirmationPhrase !== 'DELETE ALL POSTS') {
      return res.status(400).json({
        error: 'Confirmation phrase mismatch. You must type "DELETE ALL POSTS" exactly to proceed.'
      });
    }

    // Safety: Create automated local JSON snapshot before deletion so nothing is lost
    const countBefore = await Post.countDocuments();
    if (countBefore > 0) {
      const allPosts = await Post.find().lean();
      const backupDir = 'c:/DevWeb/backup_pre_reset_2026';
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      fs.writeFileSync(
        path.join(backupDir, `safety_snapshot_before_delete_all_${Date.now()}.json`),
        JSON.stringify(allPosts, null, 2)
      );
    }

    // Delete all posts
    const result = await Post.deleteMany({});

    // Reset category post counts to 0
    await Category.updateMany({}, { $set: { postCount: 0 } });

    console.log(`[Admin Action] Purged all ${result.deletedCount} posts by admin: ${req.user.username}`);
    return res.json({
      message: `Successfully deleted all ${result.deletedCount} articles from MongoDB Atlas. Categories and settings remain preserved.`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('[Delete All Posts Error]', err);
    return res.status(500).json({ error: 'Failed to delete all posts.' });
  }
});

router.get('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findOne({
      $or: [{ id: req.params.id }, { slug: req.params.id }]
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    return res.json(post);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve post details.' });
  }
});

router.post('/posts', async (req, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      coverImage,
      categoryId,
      authorName,
      status,
      tags,
      metaTitle,
      metaDescription,
      focusKeyword,
      enableAds
    } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Post title is required.' });
    }

    const cleanTitle = title.trim();
    const finalSlug = (slug && typeof slug === 'string' && slug.trim())
      ? generateSlug(slug)
      : generateSlug(cleanTitle);

    if (!finalSlug) {
      return res.status(400).json({ error: 'Invalid post slug.' });
    }

    const existingSlug = await Post.findOne({ slug: finalSlug });
    if (existingSlug) {
      return res.status(400).json({ error: `Slug "${finalSlug}" is already in use by another post.` });
    }

    const newPost = new Post({
      id: `post-${Date.now()}`,
      title: cleanTitle,
      slug: finalSlug,
      excerpt: typeof excerpt === 'string' ? excerpt.trim() : '',
      content: typeof content === 'string' ? content : '',
      coverImage: typeof coverImage === 'string' ? coverImage.trim() : '',
      categoryId: typeof categoryId === 'string' ? categoryId.trim() : '',
      status: status === 'draft' ? 'draft' : 'published',
      tags: Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : [],
      metaTitle: typeof metaTitle === 'string' ? metaTitle.trim() : '',
      metaDescription: typeof metaDescription === 'string' ? metaDescription.trim() : '',
      focusKeyword: typeof focusKeyword === 'string' ? focusKeyword.trim() : '',
      enableAds: enableAds !== false,
      publishedAt: status === 'draft' ? null : new Date()
    });

    await newPost.save();

    if (newPost.categoryId) {
      const count = await Post.countDocuments({ categoryId: newPost.categoryId, status: 'published' });
      await Category.updateOne({ id: newPost.categoryId }, { postCount: count });
    }

    return res.status(201).json({ message: 'Post created successfully', post: newPost });
  } catch (err) {
    console.error('[Admin Create Post Error]', err);
    return res.status(500).json({ error: 'Failed to create post.' });
  }
});

router.put('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findOne({
      $or: [{ id: req.params.id }, { slug: req.params.id }]
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const {
      title,
      slug,
      excerpt,
      content,
      coverImage,
      categoryId,
      authorName,
      status,
      tags,
      metaTitle,
      metaDescription,
      focusKeyword,
      enableAds
    } = req.body;

    if (title && typeof title === 'string' && title.trim()) {
      post.title = title.trim();
    }

    if (slug && typeof slug === 'string' && slug.trim()) {
      const newSlug = generateSlug(slug);
      if (newSlug !== post.slug) {
        const existing = await Post.findOne({ slug: newSlug, id: { $ne: post.id } });
        if (existing) {
          return res.status(400).json({ error: `Slug "${newSlug}" is already taken.` });
        }
        post.slug = newSlug;
      }
    }

    if (excerpt !== undefined) post.excerpt = String(excerpt).trim();
    if (content !== undefined) post.content = String(content);
    if (coverImage !== undefined) post.coverImage = String(coverImage).trim();
    if (authorName !== undefined) post.authorName = String(authorName).trim();
    if (metaTitle !== undefined) post.metaTitle = String(metaTitle).trim();
    if (metaDescription !== undefined) post.metaDescription = String(metaDescription).trim();
    if (focusKeyword !== undefined) post.focusKeyword = String(focusKeyword).trim();
    if (enableAds !== undefined) post.enableAds = Boolean(enableAds);
    if (Array.isArray(tags)) post.tags = tags.map(t => String(t).trim()).filter(Boolean);

    if (categoryId !== undefined) {
      post.categoryId = String(categoryId).trim();
    }

    if (status && ['published', 'draft'].includes(status)) {
      if (status === 'published' && post.status !== 'published') {
        post.publishedAt = post.publishedAt || new Date();
      }
      post.status = status;
    }

    await post.save();
    await refreshAllCategoryPostCounts();

    return res.json({ message: 'Post updated successfully', post });
  } catch (err) {
    console.error('[Admin Update Post Error]', err);
    return res.status(500).json({ error: 'Failed to update post.' });
  }
});

router.delete('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      $or: [{ id: req.params.id }, { slug: req.params.id }]
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (post.categoryId) {
      const count = await Post.countDocuments({ categoryId: post.categoryId, status: 'published' });
      await Category.updateOne({ id: post.categoryId }, { postCount: count });
    }

    return res.json({ message: 'Post deleted successfully.' });
  } catch (err) {
    console.error('[Admin Delete Post Error]', err);
    return res.status(500).json({ error: 'Failed to delete post.' });
  }
});

router.patch('/posts/:id/status', async (req, res) => {
  try {
    const post = await Post.findOne({
      $or: [{ id: req.params.id }, { slug: req.params.id }]
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    post.status = post.status === 'published' ? 'draft' : 'published';
    if (post.status === 'published' && !post.publishedAt) {
      post.publishedAt = new Date();
    }
    await post.save();

    if (post.categoryId) {
      const count = await Post.countDocuments({ categoryId: post.categoryId, status: 'published' });
      await Category.updateOne({ id: post.categoryId }, { postCount: count });
    }

    return res.json({ message: `Post status changed to ${post.status}`, post });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to toggle status.' });
  }
});

// ==========================================
// 3. CATEGORIES MANAGEMENT (CRUD)
// ==========================================
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    const categoriesWithCount = await Promise.all(categories.map(async (cat) => {
      const count = await Post.countDocuments({ categoryId: cat.id, status: 'published' });
      return {
        ...cat.toObject(),
        postCount: count
      };
    }));

    return res.json(categoriesWithCount);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve categories.' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const { name, slug, description, color, icon } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const cleanName = name.trim();
    const finalSlug = (slug && typeof slug === 'string' && slug.trim())
      ? generateSlug(slug)
      : generateSlug(cleanName);

    const existing = await Category.findOne({ slug: finalSlug });
    if (existing) {
      return res.status(400).json({ error: `Category slug "${finalSlug}" already exists.` });
    }

    const newCategory = new Category({
      id: `cat-${Date.now()}`,
      name: cleanName,
      slug: finalSlug,
      description: typeof description === 'string' ? description.trim() : '',
      color: typeof color === 'string' ? color.trim() : 'blue',
      icon: typeof icon === 'string' ? icon.trim() : 'Layers',
      postCount: 0
    });

    await newCategory.save();
    return res.status(201).json({ message: 'Category created successfully', category: newCategory });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create category.' });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findOne({
      $or: [{ id: req.params.id }, { slug: req.params.id }]
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const { name, slug, description, color, icon } = req.body;
    if (name) category.name = String(name).trim();
    if (slug) {
      const newSlug = generateSlug(slug);
      if (newSlug !== category.slug) {
        const existing = await Category.findOne({ slug: newSlug, id: { $ne: category.id } });
        if (existing) {
          return res.status(400).json({ error: `Slug "${newSlug}" already in use.` });
        }
        const oldSlug = category.slug;
        category.slug = newSlug;
        // Keep articles referencing oldSlug linked without data loss
        await Post.updateMany(
          { categoryId: oldSlug },
          { $set: { categoryId: category.id || newSlug } }
        );
      }
    }
    if (description !== undefined) category.description = String(description).trim();
    if (color !== undefined) category.color = String(color).trim();
    if (icon !== undefined) category.icon = String(icon).trim();

    await category.save();
    await refreshAllCategoryPostCounts();
    return res.json({ message: 'Category updated successfully', category });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update category.' });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findOne({
      $or: [{ id: req.params.id }, { slug: req.params.id }]
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const postCount = await Post.countDocuments({
      $or: [
        { categoryId: category.id },
        { categoryId: category.slug },
        ...(category._id ? [{ categoryId: String(category._id) }] : [])
      ]
    });
    if (postCount > 0) {
      return res.status(400).json({
        error: `Cannot delete category: ${postCount} posts are currently assigned to this category. Please reassign them first.`
      });
    }

    await Category.deleteOne({ _id: category._id });
    await refreshAllCategoryPostCounts();
    return res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete category.' });
  }
});

// ==========================================
// 4. HEADER / FOOTER CUSTOM SCRIPTS (Like WordPress)
// ==========================================
router.get('/scripts', requireAdmin, async (req, res) => {
  try {
    const scripts = await CustomScript.find().sort({ createdAt: -1 });
    return res.json(scripts);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve scripts.' });
  }
});

router.post('/scripts', requireAdmin, async (req, res) => {
  try {
    const { name, description, code, location, scope, enabled } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Script name is required.' });
    }
    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ error: 'Script code content is required.' });
    }

    const validLocations = ['header', 'body_start', 'footer'];
    const validScopes = ['all', 'home_only', 'posts_only'];

    const script = new CustomScript({
      id: `script-${Date.now()}`,
      name: name.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      code: code.trim(),
      location: validLocations.includes(location) ? location : 'header',
      scope: validScopes.includes(scope) ? scope : 'all',
      enabled: enabled !== false,
      createdBy: req.user.username
    });

    await script.save();
    return res.status(201).json({ message: 'Script added successfully.', script });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create script.' });
  }
});

router.put('/scripts/:id', requireAdmin, async (req, res) => {
  try {
    const validObjectIds = mongoose.isValidObjectId(req.params.id) ? [{ _id: req.params.id }] : [];
    const script = await CustomScript.findOne({
      $or: [{ id: req.params.id }, ...validObjectIds]
    });

    if (!script) {
      return res.status(404).json({ error: 'Script not found.' });
    }

    const { name, description, code, location, scope, enabled } = req.body;

    if (name) script.name = String(name).trim();
    if (description !== undefined) script.description = String(description).trim();
    if (code) script.code = String(code).trim();
    if (location && ['header', 'body_start', 'footer'].includes(location)) {
      script.location = location;
    }
    if (scope && ['all', 'home_only', 'posts_only'].includes(scope)) {
      script.scope = scope;
    }
    if (enabled !== undefined) script.enabled = Boolean(enabled);

    await script.save();
    return res.json({ message: 'Script updated successfully.', script });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update script.' });
  }
});

router.delete('/scripts/:id', requireAdmin, async (req, res) => {
  try {
    const validObjectIds = mongoose.isValidObjectId(req.params.id) ? [{ _id: req.params.id }] : [];
    const script = await CustomScript.findOneAndDelete({
      $or: [{ id: req.params.id }, ...validObjectIds]
    });

    if (!script) {
      return res.status(404).json({ error: 'Script not found.' });
    }

    return res.json({ message: 'Script removed successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete script.' });
  }
});

router.patch('/scripts/:id/toggle', requireAdmin, async (req, res) => {
  try {
    const validObjectIds = mongoose.isValidObjectId(req.params.id) ? [{ _id: req.params.id }] : [];
    const script = await CustomScript.findOne({
      $or: [{ id: req.params.id }, ...validObjectIds]
    });

    if (!script) {
      return res.status(404).json({ error: 'Script not found.' });
    }

    script.enabled = !script.enabled;
    await script.save();
    return res.json({ message: `Script ${script.enabled ? 'enabled' : 'disabled'}.`, script });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to toggle script status.' });
  }
});

// ==========================================
// 5. WEBSITE SETTINGS
// ==========================================
router.get('/settings', async (req, res) => {
  try {
    let settings = await Setting.findOne({ key: 'global_settings' });
    if (!settings) {
      settings = await Setting.create({ key: 'global_settings' });
    }
    return res.json(settings);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve website settings.' });
  }
});

router.put('/settings', requireAdmin, async (req, res) => {
  try {
    const {
      siteName,
      siteUrl,
      tagline,
      description,
      contactEmail,
      businessAddress,
      phone,
      gaTrackingId,
      gtmId,
      metaVerification,
      seo,
      adsense
    } = req.body;

    const updateFields = {
      updatedAt: new Date()
    };

    if (siteName !== undefined) updateFields.siteName = String(siteName).trim();
    if (siteUrl !== undefined) updateFields.siteUrl = String(siteUrl).trim();
    if (tagline !== undefined) updateFields.tagline = String(tagline).trim();
    if (description !== undefined) updateFields.description = String(description).trim();
    if (contactEmail !== undefined) updateFields.contactEmail = String(contactEmail).trim();
    if (businessAddress !== undefined) updateFields.businessAddress = String(businessAddress).trim();
    if (phone !== undefined) updateFields.phone = String(phone).trim();
    if (gaTrackingId !== undefined) updateFields.gaTrackingId = String(gaTrackingId).trim();
    if (gtmId !== undefined) updateFields.gtmId = String(gtmId).trim();

    if (metaVerification && typeof metaVerification === 'object') {
      updateFields.metaVerification = {
        google: typeof metaVerification.google === 'string' ? metaVerification.google.trim() : '',
        bing: typeof metaVerification.bing === 'string' ? metaVerification.bing.trim() : '',
        pinterest: typeof metaVerification.pinterest === 'string' ? metaVerification.pinterest.trim() : ''
      };
    }

    if (seo && typeof seo === 'object') {
      updateFields.seo = {
        metaTitle: typeof seo.metaTitle === 'string' ? seo.metaTitle.trim() : '',
        metaDescription: typeof seo.metaDescription === 'string' ? seo.metaDescription.trim() : '',
        defaultKeywords: typeof seo.defaultKeywords === 'string' ? seo.defaultKeywords.trim() : '',
        ogImage: typeof seo.ogImage === 'string' ? seo.ogImage.trim() : ''
      };
    }

    if (adsense && typeof adsense === 'object') {
      updateFields.adsense = {
        enabled: Boolean(adsense.enabled),
        publisherId: typeof adsense.publisherId === 'string' ? adsense.publisherId.trim() : '',
        autoAds: Boolean(adsense.autoAds),
        headerAd: {
          enabled: Boolean(adsense.headerAd?.enabled),
          slotId: typeof adsense.headerAd?.slotId === 'string' ? adsense.headerAd.slotId.trim() : ''
        },
        inArticleAd: {
          enabled: Boolean(adsense.inArticleAd?.enabled),
          slotId: typeof adsense.inArticleAd?.slotId === 'string' ? adsense.inArticleAd.slotId.trim() : ''
        },
        sidebarAd: {
          enabled: Boolean(adsense.sidebarAd?.enabled),
          slotId: typeof adsense.sidebarAd?.slotId === 'string' ? adsense.sidebarAd.slotId.trim() : ''
        },
        footerAd: {
          enabled: Boolean(adsense.footerAd?.enabled),
          slotId: typeof adsense.footerAd?.slotId === 'string' ? adsense.footerAd.slotId.trim() : ''
        }
      };
    }

    const settings = await Setting.findOneAndUpdate(
      { key: 'global_settings' },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    console.log(`[Admin Settings] Configuration updated by admin: ${req.user.username}`);
    return res.json({ message: 'Website configuration updated and applied successfully.', settings });
  } catch (err) {
    console.error('[Update Settings Error]', err);
    return res.status(500).json({ error: 'Failed to update website settings.' });
  }
});

// ==========================================
// 6. STAFF MANAGEMENT (Admin only)
// ==========================================
router.get('/staff', requireAdmin, async (req, res) => {
  try {
    const staffList = await Staff.find().sort({ createdAt: -1 });
    return res.json(staffList.map(sanitizeStaff));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve staff list.' });
  }
});

router.post('/staff', requireAdmin, async (req, res) => {
  try {
    const { username, password, name, email, role, phone } = req.body;

    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ error: 'Username is required.' });
    }
    if (!password || typeof password !== 'string' || password.trim().length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await Staff.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    const newStaff = new Staff({
      id: `staff-${Date.now()}`,
      username: cleanUsername,
      password: hashPassword(password.trim()),
      name: name.trim(),
      email: typeof email === 'string' ? email.trim().toLowerCase() : '',
      phone: typeof phone === 'string' ? phone.trim() : '',
      role: ['admin', 'editor', 'author', 'accountant'].includes(role) ? role : 'editor',
      status: 'active'
    });

    await newStaff.save();
    return res.status(201).json({ message: 'Staff member added successfully', staff: sanitizeStaff(newStaff) });
  } catch (err) {
    console.error('[Create Staff Error]', err);
    return res.status(500).json({ error: 'Failed to create staff member.' });
  }
});

router.put('/staff/:id', requireAdmin, async (req, res) => {
  try {
    const staff = await Staff.findOne({
      $or: [{ id: req.params.id }, { username: req.params.id }]
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    const { name, email, role, status, phone, password } = req.body;
    if (name) staff.name = String(name).trim();
    if (email !== undefined) staff.email = String(email).trim().toLowerCase();
    if (phone !== undefined) staff.phone = String(phone).trim();
    if (role && ['admin', 'editor', 'author', 'accountant'].includes(role)) {
      staff.role = role;
    }
    if (status && ['active', 'inactive'].includes(status)) {
      if (staff.id === req.user.id && status === 'inactive') {
        return res.status(400).json({ error: 'You cannot deactivate your own account.' });
      }
      staff.status = status;
    }
    if (password && typeof password === 'string' && password.trim().length >= 6) {
      staff.password = hashPassword(password.trim());
      staff.tokenVersion = (staff.tokenVersion || 0) + 1;
    }

    await staff.save();
    return res.json({ message: 'Staff updated successfully', staff: sanitizeStaff(staff) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update staff member.' });
  }
});

router.delete('/staff/:id', requireAdmin, async (req, res) => {
  try {
    const staff = await Staff.findOne({
      $or: [{ id: req.params.id }, { username: req.params.id }]
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    if (staff.id === req.user.id || staff.username === req.user.username) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    await Staff.deleteOne({ _id: staff._id });
    return res.json({ message: 'Staff member deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete staff member.' });
  }
});

// ==========================================
// 7. IMAGE UPLOAD VIA SUPABASE STORAGE
// ==========================================
router.post('/upload', async (req, res) => {
  try {
    const { imageBase64, fileName, mimeType } = req.body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Image base64 data is required.' });
    }

    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const type = mimeType || 'image/webp';
    if (!allowedMime.includes(type)) {
      return res.status(400).json({ error: 'Invalid file format. Allowed: JPG, PNG, WEBP, GIF.' });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image size exceeds maximum limit of 5MB.' });
    }

    const ext = type.split('/')[1] || 'webp';
    const cleanName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = `uploads/${cleanName}`;

    const supabaseUrl = process.env.SUPABASE_URL || 'https://mmltqgekvpdnezqdavvc.supabase.co';
    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

    if (!serviceKey) {
      return res.status(500).json({ error: 'Supabase storage key is not configured.' });
    }

    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/postnew/${filePath}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        'Content-Type': type,
        'x-upsert': 'true'
      },
      body: buffer
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error('[Supabase Upload Error]', uploadRes.status, errText);
      return res.status(500).json({ error: 'Failed to upload image to cloud storage.' });
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/postnew/${filePath}`;
    return res.json({ url: publicUrl, path: filePath });
  } catch (err) {
    console.error('[Upload Exception]', err);
    return res.status(500).json({ error: 'Image upload failed.' });
  }
});

export default router;
