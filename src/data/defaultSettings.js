export const defaultSettings = {
  siteName: 'THE HORIZON POST',
  tagline: 'Definitive Intelligence for Modern Wealth, Technology & Living',
  edition: 'U.S. Edition',
  description: 'In-depth investigative reports, actionable financial blueprints, and technological frontier insights crafted for modern thinkers and investors.',
  contactEmail: 'editor@thehorizonpost.com',
  businessAddress: '742 Evergreen Terrace, Suite 400, Austin, TX 78701, United States',
  phone: '+1 (512) 890-4421',
  gaTrackingId: 'G-HORIZON2026',
  searchConsoleCode: 'google-site-verification=hz7890abcdef123456',
  
  // AdSense & Monetization Settings
  adsense: {
    enabled: true,
    sandboxMode: true, // Demo banners mode for testing & visual verification before live approval
    publisherId: 'ca-pub-9876543210123456',
    autoAdsEnabled: true,
    slots: {
      headerLeaderboard: {
        enabled: true,
        slotId: '1029384756',
        format: 'horizontal', // 728x90 or responsive
        name: 'Top Header Leaderboard (728x90)'
      },
      inArticleTop: {
        enabled: true,
        slotId: '2938475610',
        paragraphIndex: 2,
        format: 'fluid',
        name: 'In-Article Inline Ad (After Paragraph 2)'
      },
      inArticleMid: {
        enabled: true,
        slotId: '3847561029',
        paragraphIndex: 5,
        format: 'fluid',
        name: 'In-Article High-CTR Ad (After Paragraph 5)'
      },
      sidebarSticky: {
        enabled: true,
        slotId: '4756102938',
        format: 'rectangle', // 300x600 Half-page or 300x250
        name: 'Sidebar Sticky Half-Page (300x600)'
      },
      multiplexBottom: {
        enabled: true,
        slotId: '5610293847',
        format: 'autorelaxed',
        name: 'Matched Content / Multiplex Ad (Post Footer)'
      },
      mobileAnchor: {
        enabled: true,
        slotId: '6102938475',
        format: 'anchor',
        name: 'Sticky Mobile Bottom Anchor (320x50)'
      }
    }
  },

  socialLinks: {
    twitter: 'https://twitter.com/horizonpost',
    linkedin: 'https://linkedin.com/company/horizonpost',
    facebook: 'https://facebook.com/horizonpost',
    youtube: 'https://youtube.com/@horizonpost',
    rss: '/rss.xml'
  }
};
