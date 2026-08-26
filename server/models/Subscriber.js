import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  date: { type: Date, default: Date.now },
  source: { type: String, default: 'Website Newsletter Form' },
  active: { type: Boolean, default: true },
}, {
  timestamps: true
});

export const Subscriber = mongoose.model('Subscriber', subscriberSchema);
