import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true }, // Contains scrypt 'salt:hash'
  email: { type: String, required: true },
  phone: { type: String },
  refCode: { type: String, index: true },
  role: { type: String, enum: ['admin', 'editor', 'author', 'accountant'], default: 'editor', index: true },
  roleName: { type: String },
  joinDate: { type: String },
  status: { type: String, default: 'active' },
  avatar: { type: String },
  permissions: { type: mongoose.Schema.Types.Mixed, default: {} },
  salary: { type: mongoose.Schema.Types.Mixed, default: {} },
  seedingHits: { type: Number, default: 0 },
  tokenVersion: { type: Number, default: 0 },
  passwordChangedAt: { type: Date, default: null }
}, {
  timestamps: true
});

export const Staff = mongoose.model('Staff', staffSchema);

