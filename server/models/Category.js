import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  id: { type: String, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true, trim: true },
  description: { type: String, default: '' },
  color: { type: String, default: 'blue' },
  icon: { type: String, default: 'Layers' },
  featured: { type: Boolean, default: false },
  postCount: { type: Number, default: 0 },
}, {
  timestamps: true,
  // Keep the string `id` path; do not alias it to Mongo `_id`.
  id: false
});

export const Category = mongoose.model('Category', categorySchema);
