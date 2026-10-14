import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'global_settings' },
  siteName: { type: String, default: 'THE HORIZON POST' },
  siteUrl: { type: String, default: 'https://www.thehori.click' },
  tagline: { type: String, default: 'Definitive Intelligence for Modern Wealth & Technology' },
  edition: { type: String, default: 'U.S. Edition' },
  description: { type: String, default: 'In-depth analysis and expert dispatches on US personal finance, artificial intelligence, longevity, and modern living.' },
  contactEmail: { type: String, default: 'contact@thehori.click' },
  businessAddress: { type: String, default: '742 Evergreen Terrace, Suite 400, Austin, TX 78701, United States' },
  phone: { type: String, default: '+1 (512) 890-4421' },
  gaTrackingId: { type: String, default: 'G-MZ34K70519' },
  adsense: {
    enabled: { type: Boolean, default: true },
    publisherId: { type: String, default: 'ca-pub-6469608148906900' }
  }
}, {
  timestamps: true,
  strict: false
});

export const Setting = mongoose.models.Setting || mongoose.model('Setting', settingSchema);
