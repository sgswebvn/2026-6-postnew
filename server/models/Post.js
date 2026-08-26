import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  id: { type: String, unique: true, index: true },
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true, trim: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  coverImage: { type: String, default: '' },
  categoryId: { type: String, required: true, index: true },
  authorId: { type: String, required: true },
  factCheckerId: { type: String, default: '' },
  readTime: { type: String, default: '5 min read' },
  status: { type: String, enum: ['published', 'draft'], default: 'published', index: true },
  featured: { type: Boolean, default: false },
  trendingRank: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  tags: [{ type: String, trim: true }],
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  focusKeyword: { type: String, default: '' },
  enableAds: { type: Boolean, default: true },
  publishedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true
});

export const Post = mongoose.model('Post', postSchema);
