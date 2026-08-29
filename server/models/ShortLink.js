import mongoose from 'mongoose';

const shortLinkSchema = new mongoose.Schema({
  id: { type: String, unique: true, index: true },
  code: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  originalUrl: { type: String, required: true },
  postSlug: { type: String, default: '', index: true },
  postTitle: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  staffCode: { type: String, default: '', uppercase: true, index: true },
  staffName: { type: String, default: '' },
  clicks: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export const ShortLink = mongoose.model('ShortLink', shortLinkSchema);
