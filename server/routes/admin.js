import express from 'express';
import { Post } from '../models/Post.js';
import { Category } from '../models/Category.js';
import { Staff } from '../models/Staff.js';
import { Setting } from '../models/Setting.js';
import { requireAuth, requireAdmin, sanitizeStaff, hashPassword } from '../auth.js';
import { isDbConnected } from '../db.js';

const router = express.Router();

// Apply auth to all admin routes
router.use(requireAuth);

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

// ==========================================
// 1. DASHBOARD OVERVIEW STATS
// ==========================================
router.get('/stats', async (req, res) => {
  try {
    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      totalCategories,
      totalStaff,
      viewsAggregation,
      recentPosts
    ] = await Promise.all([
      Post.countDocuments(),
      Post.countDocuments({ status: 'published' }),
      Post.countDocuments({ status: 'draft' }),
      Category.countDocuments(),
      Staff.countDocuments(),
      Post.aggregate([{ $group: { _id: null, totalViews: { $sum: '$views' } } }]),
      Post.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('id title slug status views categoryId publishedAt createdAt')
    ]);

    const totalViews = viewsAggregation[0]?.totalViews || 0;

    return res.json({
      totalPosts,
      publishedPosts,
      draftPosts,
      totalCategories,
      totalStaff,
      totalViews,
      dbConnected: isDbConnected(),
      recentPosts
    });
  } catch (err) {
    console.error('[Admin Stats Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve system statistics.' });
  }
});

// ==========================================
// 2. POSTS MANAGEMENT (CRUD + PAGINATION + FILTERS)
// ==========================================
router.get('/posts', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const { search, status, categoryId } = req.query;
    const query = {};

    if (search && typeof search === 'string' && search.trim()) {
      const cleanSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: cleanSearch, $options: 'i' } },
        { slug: { $regex: cleanSearch, $options: 'i' } }
      ];
    }

    if (status && ['published', 'draft'].includes(status)) {
      query.status = status;
    }

    if (categoryId && typeof categoryId === 'string' && categoryId.trim()) {
      query.categoryId = categoryId.trim();
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
      authorName: (typeof authorName === 'string' && authorName.trim()) ? authorName.trim() : req.user.name || 'Editorial Team',
      authorId: req.user.id,
      status: status === 'draft' ? 'draft' : 'published',
      tags: Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : [],
      metaTitle: typeof metaTitle === 'string' ? metaTitle.trim() : '',
      metaDescription: typeof metaDescription === 'string' ? metaDescription.trim() : '',
      focusKeyword: typeof focusKeyword === 'string' ? focusKeyword.trim() : '',
      enableAds: enableAds !== false,
      publishedAt: status === 'draft' ? null : new Date()
    });

    await newPost.save();

    // Update category post count
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

    const oldCategoryId = post.categoryId;
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

    // Refresh category post count
    if (oldCategoryId) {
      const oldCount = await Post.countDocuments({ categoryId: oldCategoryId, status: 'published' });
      await Category.updateOne({ id: oldCategoryId }, { postCount: oldCount });
    }
    if (post.categoryId && post.categoryId !== oldCategoryId) {
      const newCount = await Post.countDocuments({ categoryId: post.categoryId, status: 'published' });
      await Category.updateOne({ id: post.categoryId }, { postCount: newCount });
    }

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
    // Recount real published posts for each category
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
        category.slug = newSlug;
      }
    }
    if (description !== undefined) category.description = String(description).trim();
    if (color !== undefined) category.color = String(color).trim();
    if (icon !== undefined) category.icon = String(icon).trim();

    await category.save();
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

    // Check if posts are attached
    const postCount = await Post.countDocuments({ categoryId: category.id });
    if (postCount > 0) {
      return res.status(400).json({
        error: `Cannot delete category: ${postCount} posts are currently assigned to this category. Please reassign them first.`
      });
    }

    await Category.deleteOne({ id: category.id });
    return res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete category.' });
  }
});

// ==========================================
// 4. WEBSITE SETTINGS
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
    const { siteName, siteUrl, tagline, contactEmail, businessAddress, phone, gaTrackingId, adsense } = req.body;

    const settings = await Setting.findOneAndUpdate(
      { key: 'global_settings' },
      {
        $set: {
          siteName: typeof siteName === 'string' ? siteName.trim() : undefined,
          siteUrl: typeof siteUrl === 'string' ? siteUrl.trim() : undefined,
          tagline: typeof tagline === 'string' ? tagline.trim() : undefined,
          contactEmail: typeof contactEmail === 'string' ? contactEmail.trim() : undefined,
          businessAddress: typeof businessAddress === 'string' ? businessAddress.trim() : undefined,
          phone: typeof phone === 'string' ? phone.trim() : undefined,
          gaTrackingId: typeof gaTrackingId === 'string' ? gaTrackingId.trim() : undefined,
          adsense: adsense && typeof adsense === 'object' ? {
            enabled: Boolean(adsense.enabled),
            publisherId: typeof adsense.publisherId === 'string' ? adsense.publisherId.trim() : 'ca-pub-6469608148906900'
          } : undefined
        }
      },
      { new: true, upsert: true }
    );

    return res.json({ message: 'Settings saved successfully', settings });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update website settings.' });
  }
});

// ==========================================
// 5. STAFF MANAGEMENT (Admin only)
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
      // Prevent admin from locking their own account
      if (staff.id === req.user.id && status === 'inactive') {
        return res.status(400).json({ error: 'You cannot deactivate your own account.' });
      }
      staff.status = status;
    }
    if (password && typeof password === 'string' && password.trim().length >= 6) {
      staff.password = hashPassword(password.trim());
      staff.tokenVersion = (staff.tokenVersion || 0) + 1; // Invalidate previous sessions
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
// 6. IMAGE UPLOAD VIA SUPABASE STORAGE
// ==========================================
router.post('/upload', async (req, res) => {
  try {
    const { imageBase64, fileName, mimeType } = req.body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Image base64 data is required.' });
    }

    // Supported mime types
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const type = mimeType || 'image/webp';
    if (!allowedMime.includes(type)) {
      return res.status(400).json({ error: 'Invalid file format. Allowed: JPG, PNG, WEBP, GIF.' });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Max 5MB size limit
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
