import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'global_settings' },
  siteName: { type: String, default: 'THE HORIZON POST', trim: true },
  siteUrl: { type: String, default: 'https://www.thehori.click', trim: true },
  tagline: { type: String, default: 'Modern Intelligence & Technology Journal', trim: true },
  description: { type: String, default: 'In-depth analysis on personal finance, artificial intelligence, enterprise technology, and modern living.', trim: true },
  contactEmail: { type: String, default: 'contact@thehori.click', trim: true },
  businessAddress: { type: String, default: '', trim: true },
  phone: { type: String, default: '', trim: true },

  // Tracking & Verification (Defaults empty - no hardcoded IDs)
  gaTrackingId: { type: String, default: '', trim: true },
  gtmId: { type: String, default: '', trim: true },
  metaVerification: {
    google: { type: String, default: '', trim: true },
    bing: { type: String, default: '', trim: true },
    pinterest: { type: String, default: '', trim: true }
  },

  // SEO Defaults
  seo: {
    metaTitle: { type: String, default: '', trim: true },
    metaDescription: { type: String, default: '', trim: true },
    defaultKeywords: { type: String, default: '', trim: true },
    ogImage: { type: String, default: '', trim: true }
  },

  // Google AdSense Monetization
  adsense: {
    enabled: { type: Boolean, default: false },
    publisherId: { type: String, default: '', trim: true },
    autoAds: { type: Boolean, default: false },
    headerAd: {
      enabled: { type: Boolean, default: false },
      slotId: { type: String, default: '', trim: true }
    },
    inArticleAd: {
      enabled: { type: Boolean, default: false },
      slotId: { type: String, default: '', trim: true }
    },
    sidebarAd: {
      enabled: { type: Boolean, default: false },
      slotId: { type: String, default: '', trim: true }
    },
    footerAd: {
      enabled: { type: Boolean, default: false },
      slotId: { type: String, default: '', trim: true }
    }
  }
}, {
  timestamps: true,
  strict: false
});

export const Setting = mongoose.models.Setting || mongoose.model('Setting', settingSchema);
