import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  id: { type: String, unique: true, index: true },
  postId: { type: String, required: true, index: true },
  authorName: { type: String, required: true },
  authorRole: { type: String, default: 'Verified Reader' },
  avatar: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150' },
  content: { type: String, required: true },
  likes: { type: Number, default: 1 },
  status: { type: String, enum: ['approved', 'pending', 'spam'], default: 'approved', index: true },
  createdAt: { type: Date, default: Date.now },
}, {
  timestamps: true
});

export const Comment = mongoose.model('Comment', commentSchema);
