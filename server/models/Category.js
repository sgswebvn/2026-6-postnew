import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  id: { type: String, unique: true, sparse: true, index: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true, trim: true },
  description: { type: String, default: '' },
  color: { type: String, default: 'blue' },
  icon: { type: String, default: 'Layers' },
  postCount: { type: Number, default: 0 }
}, {
  timestamps: true,
  strict: false
});

export const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
