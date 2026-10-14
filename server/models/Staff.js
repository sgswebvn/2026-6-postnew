import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  id: { type: String, unique: true, sparse: true, index: true },
  name: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, default: '' },
  role: { type: String, enum: ['admin', 'editor', 'author', 'accountant'], default: 'editor', index: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  avatar: { type: String, default: '' },
  tokenVersion: { type: Number, default: 0 }
}, {
  timestamps: true,
  strict: false
});

export const Staff = mongoose.models.Staff || mongoose.model('Staff', staffSchema);
