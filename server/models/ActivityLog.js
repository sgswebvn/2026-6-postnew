import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  staffId: { type: String },
  staffName: { type: String },
  refCode: { type: String },
  action: { type: String },
  title: { type: String },
  details: { type: String },
  timestamp: { type: String }, // ISO string as used in the frontend
  type: { type: String, default: 'info' } // success, info, warning, neutral
}, {
  timestamps: true
});

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
