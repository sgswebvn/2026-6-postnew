import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema({
  refCode: { type: String, required: true, unique: true, index: true },
  hits: { type: Number, default: 0 },
  lastHitAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const Referral = mongoose.model('Referral', referralSchema);
