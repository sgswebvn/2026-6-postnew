import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  id: { type: String, unique: true, sparse: true, index: true },
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true, trim: true },
  excerpt: { type: String, default: '' },
  content: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  categoryId: { type: String, index: true },
  category: { type: mongoose.Schema.Types.Mixed },
  authorId: { type: String },
  authorName: { type: String, default: 'Editorial Team' },
  status: { type: String, enum: ['published', 'draft'], default: 'published', index: true },
  views: { type: Number, default: 0 },
  tags: [{ type: String, trim: true }],
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  focusKeyword: { type: String, default: '' },
  enableAds: { type: Boolean, default: true },
  publishedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  strict: false
});

// High performance compound indexes for fast query filtering and sorting
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ status: 1, categoryId: 1, publishedAt: -1 });
postSchema.index({ status: 1, views: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ status: 1, createdAt: -1 });

export const Post = mongoose.models.Post || mongoose.model('Post', postSchema);
