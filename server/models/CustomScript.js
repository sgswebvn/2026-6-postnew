import mongoose from 'mongoose';

const customScriptSchema = new mongoose.Schema({
  id: { type: String, unique: true, sparse: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  code: { type: String, required: true },
  location: {
    type: String,
    enum: ['header', 'body_start', 'footer'],
    default: 'header',
    index: true
  },
  scope: {
    type: String,
    enum: ['all', 'home_only', 'posts_only'],
    default: 'all',
    index: true
  },
  enabled: { type: Boolean, default: true, index: true },
  createdBy: { type: String, default: 'admin' }
}, {
  timestamps: true,
  strict: false
});

export const CustomScript = mongoose.models.CustomScript || mongoose.model('CustomScript', customScriptSchema);
