import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  refCode: { type: String },
  role: { type: String, default: 'editor' },
  roleName: { type: String },
  joinDate: { type: String },
  status: { type: String, default: 'active' },
  avatar: { type: String },
  permissions: { type: mongoose.Schema.Types.Mixed, default: {} },
  salary: { type: mongoose.Schema.Types.Mixed, default: {} },
  seedingHits: { type: Number, default: 0 }
}, {
  timestamps: true
});

export const Staff = mongoose.model('Staff', staffSchema);
