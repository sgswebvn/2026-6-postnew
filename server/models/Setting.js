import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'global_settings' },
  siteName: { type: String, default: 'THE HORIZON POST' },
  tagline: { type: String, default: 'Definitive Intelligence for Modern Wealth & Technology' },
  edition: { type: String, default: 'U.S. Edition' },
  description: { type: String, default: 'In-depth analysis and expert dispatches on US personal finance, artificial intelligence, longevity, and modern living.' },
  contactEmail: { type: String, default: 'editor@thehorizonpost.com' },
  businessAddress: { type: String, default: '742 Evergreen Terrace, Suite 400, Austin, TX 78701, United States' },
  phone: { type: String, default: '+1 (512) 890-4421' },
  gaTrackingId: { type: String, default: 'G-HORIZON2026' },
  searchConsoleCode: { type: String, default: 'google-site-verification=hz7890abcdef123456' },
  adsense: {
    enabled: { type: Boolean, default: true },
    sandboxMode: { type: Boolean, default: true },
    publisherId: { type: String, default: 'ca-pub-9876543210123456' },
    autoAdsEnabled: { type: Boolean, default: true },
    slots: { type: mongoose.Schema.Types.Mixed, default: {} }
  }
}, {
  timestamps: true
});

export const Setting = mongoose.model('Setting', settingSchema);
