import mongoose from 'mongoose';

const authorSchema = new mongoose.Schema({
  id: { type: String, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  role: { type: String, required: true },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  verified: { type: Boolean, default: true },
  twitter: { type: String, default: '' },
  linkedin: { type: String, default: '' },
}, {
  timestamps: true
});

export const Author = mongoose.model('Author', authorSchema);
