// Lightweight default fallback configurations for Client-Side Frontend
// Keeps bundle size optimal by decoupling heavy 68KB seed data bodies from client build

export const initialCategories = [
  {
    id: 'cat-finance',
    name: 'Personal Finance & Wealth',
    slug: 'personal-finance',
    description: 'High-yield cash management, Treasury bill laddering, tax-advantaged accounts, and real estate credit.',
    color: 'emerald',
    icon: 'TrendingUp',
    featured: true,
    postCount: 6
  },
  {
    id: 'cat-tech',
    name: 'AI & Frontier Tech',
    slug: 'ai-frontier-tech',
    description: 'Multi-agent orchestration, 2nm semiconductor physics, small language models, and quantum computing.',
    color: 'blue',
    icon: 'Cpu',
    featured: true,
    postCount: 5
  },
  {
    id: 'cat-health',
    name: 'Longevity & Biohacking',
    slug: 'longevity-biohacking',
    description: 'Glymphatic clearance, continuous glucose telemetry, mitochondrial biogenesis, and circadian biology.',
    color: 'rose',
    icon: 'Heart',
    featured: true,
    postCount: 5
  },
  {
    id: 'cat-living',
    name: 'Smart Living & Design',
    slug: 'smart-living-design',
    description: 'Architectural minimalism, ergonomic deep-work studios, passive house engineering, and biophilic light.',
    color: 'amber',
    icon: 'Home',
    featured: true,
    postCount: 4
  },
  {
    id: 'cat-venture',
    name: 'Venture & Economy',
    slug: 'venture-economy',
    description: 'Federal Reserve monetary dynamics, lean AI startup valuations, secondary markets, and global liquidity.',
    color: 'indigo',
    icon: 'DollarSign',
    featured: true,
    postCount: 4
  },
  {
    id: 'cat-cyber',
    name: 'Cybersecurity & Privacy',
    slug: 'cybersecurity-privacy',
    description: 'Zero Trust architecture, post-quantum cryptography, air-gapped cryptographic vaults, and identity defense.',
    color: 'blue',
    icon: 'Shield',
    featured: true,
    postCount: 3
  },
  {
    id: 'cat-energy',
    name: 'Clean Energy & Mobility',
    slug: 'clean-energy-mobility',
    description: 'Solid-state battery chemistry, small modular nuclear reactors (SMRs), and industrial grid storage.',
    color: 'emerald',
    icon: 'Zap',
    featured: true,
    postCount: 3
  }
];

export const initialAuthors = [
  {
    id: 'author-1',
    name: 'Sarah Jenkins, CFA',
    slug: 'sarah-jenkins',
    role: 'Senior Financial Markets & Treasury Analyst',
    avatar: 'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_01.jpg',
    bio: 'Former Wall Street fixed-income portfolio strategist with over 14 years analyzing Federal Reserve monetary policies, liquidity curves, and high-yield capital allocation.',
    verified: true,
    twitter: '@sarahj_cfa',
    linkedin: 'linkedin.com/in/sarahjenkins-cfa'
  },
  {
    id: 'author-2',
    name: 'Marcus Vance, PhD',
    slug: 'marcus-vance',
    role: 'Principal Artificial Intelligence & Systems Editor',
    avatar: 'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_02.jpg',
    bio: 'Computational researcher and tech essayist tracking frontier LLM architectures, semiconductor geopolitics, and autonomous agent orchestration.',
    verified: true,
    twitter: '@marcusvance_ai',
    linkedin: 'linkedin.com/in/marcusvance-phd'
  },
  {
    id: 'author-3',
    name: 'Dr. Elena Rostova, MD',
    slug: 'elena-rostova',
    role: 'Longevity Science & Cellular Health Lead',
    avatar: 'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_03.jpg',
    bio: 'Clinical physician and neurobiology researcher focused on restorative sleep architecture, metabolic resilience, and biomarker-guided health optimization.',
    verified: true,
    twitter: '@drelenarostova',
    linkedin: 'linkedin.com/in/elenarostova-md'
  },
  {
    id: 'author-4',
    name: 'Julian Sterling',
    slug: 'julian-sterling',
    role: 'Editorial Director & Lead Fact-Checker',
    avatar: 'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_04.jpg',
    bio: '20-year veteran investigative financial journalist ensuring strict empirical verification, source corroboration, and SEC filing accuracy across all published dispatches.',
    verified: true,
    twitter: '@jsterling_post',
    linkedin: 'linkedin.com/in/juliansterling'
  },
  {
    id: 'author-5',
    name: 'Alexander Wright, PE',
    slug: 'alexander-wright',
    role: 'Energy Infrastructure & Clean Tech Editor',
    avatar: 'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_05.jpg',
    bio: 'Licensed professional engineer and grid storage consultant focusing on small modular nuclear systems and utility-scale sodium-ion battery deployment.',
    verified: true,
    twitter: '@awright_energy',
    linkedin: 'linkedin.com/in/alexanderwright-pe'
  }
];

export const initialSettings = {
  key: 'global_settings',
  siteName: 'THE HORIZON POST',
  siteUrl: 'https://www.thehori.click',
  tagline: 'Definitive Intelligence for Modern Wealth & Technology',
  edition: 'U.S. Edition',
  description: 'Delivering rigorous, independent reporting on personal finance architectures, frontier artificial intelligence, longevity science, and macroeconomic trends.',
  contactEmail: 'contact@thehori.click',
  businessAddress: '742 Evergreen Terrace, Suite 400, Austin, TX 78701, United States',
  phone: '+1 (512) 890-4421',
  gaTrackingId: 'G-MZ34K70519',
  searchConsoleCode: 'google-site-verification=hori7890abcdef123456',
  adsense: {
    enabled: true,
    sandboxMode: true,
    publisherId: 'ca-pub-9876543210123456',
    autoAdsEnabled: true,
    slots: {
      headerLeaderboard: { enabled: true, slotId: '1029384756', format: 'horizontal', name: 'Top Header Banner (Leaderboard 728x90)' },
      inArticleTop: { enabled: true, slotId: '2938475610', paragraphIndex: 2, format: 'fluid', name: 'In-Article Top (After Paragraph 2)' },
      inArticleMid: { enabled: true, slotId: '3847561029', paragraphIndex: 5, format: 'fluid', name: 'In-Article Mid (After Paragraph 5)' },
      sidebarSticky: { enabled: true, slotId: '4756102938', format: 'rectangle', name: 'Sticky Sidebar Unit (Half-Page 300x600)' },
      multiplexBottom: { enabled: true, slotId: '5610293847', format: 'autorelaxed', name: 'Bottom Multiplex / Matched Content' },
      mobileAnchor: { enabled: true, slotId: '6102938475', format: 'anchor', name: 'Mobile Anchor Bottom Overlay (320x50)' }
    }
  }
};

export const initialPosts = [];
export const initialSubscribers = [];
export const initialActivityLogs = [];
