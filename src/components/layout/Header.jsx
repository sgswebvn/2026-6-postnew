import React, { useState, useRef } from 'react';
import { useBlog } from '../../context/BlogContext';
import { 
  Search, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  ArrowUpRight, 
  Bookmark, 
  Globe, 
  TrendingUp, 
  Cpu, 
  Heart, 
  Home, 
  DollarSign, 
  ShieldCheck, 
  Zap, 
  ChevronDown, 
  ArrowRight, 
  Clock,
  Sparkles
} from 'lucide-react';
import { MarketTicker } from '../blog/MarketTicker';

// Category icon mapper
const getCategoryIcon = (slug, color) => {
  switch (slug) {
    case 'personal-finance':
      return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
    case 'ai-frontier-tech':
      return <Cpu className="w-3.5 h-3.5 text-blue-500" />;
    case 'longevity-biohacking':
      return <Heart className="w-3.5 h-3.5 text-rose-500" />;
    case 'smart-living-design':
      return <Home className="w-3.5 h-3.5 text-amber-500" />;
    case 'venture-economy':
      return <DollarSign className="w-3.5 h-3.5 text-indigo-500" />;
    case 'cybersecurity-privacy':
      return <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />;
    case 'clean-energy-mobility':
      return <Zap className="w-3.5 h-3.5 text-emerald-500" />;
    default:
      return <Sparkles className="w-3.5 h-3.5 text-blue-500" />;
  }
};

export const Header = () => {
  const { 
    darkMode, 
    toggleDarkMode, 
    categories, 
    posts,
    settings, 
    navigate, 
    currentRoute, 
    setSearchOpen,
    bookmarks
  } = useBlog();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState(null);
  const hoverTimeoutRef = useRef(null);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  const handleMouseEnter = (cat) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredCat(cat);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCat(null);
    }, 200);
  };

  return (
    <header className="w-full bg-white/95 dark:bg-[#0c1017]/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 sticky top-0 z-30 transition-colors shadow-xs">
      {/* Top US Market Indices Ticker */}
      <MarketTicker />

      {/* Top Bar: Date, Edition, Compliance links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 border-b border-neutral-100 dark:border-neutral-900 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider font-mono text-[11px] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {settings?.edition || 'U.S. Edition'}
          </span>
          <span className="text-neutral-300 dark:text-neutral-700">|</span>
          <span className="hidden sm:inline-block font-mono text-[11px]">{formattedDate}</span>
        </div>

        <div className="flex items-center space-x-4 text-[11px] font-medium">
          <button
            onClick={() => navigate('#/about')}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors hidden md:inline-block"
          >
            Editorial Board & E-E-A-T
          </button>
          <span className="text-neutral-300 dark:text-neutral-700 hidden md:inline-block">|</span>
          <button
            onClick={() => navigate('#/contact')}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors hidden md:inline-block"
          >
            Contact Newsroom
          </button>
          <span className="text-neutral-300 dark:text-neutral-700 hidden md:inline-block">|</span>
          <button
            onClick={() => navigate('#/privacy-policy')}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors hidden sm:inline-block"
          >
            Privacy & AdSense Disclosures
          </button>
        </div>
      </div>

      {/* Main Header Branding & Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Center Brand Logo (Classic US Editorial Masthead) */}
        <div 
          onClick={() => navigate('#/')}
          className="cursor-pointer text-center group flex-1 lg:flex-initial"
        >
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-neutral-950 dark:text-neutral-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {settings?.siteName || 'THE HORIZON POST'}
          </h1>
          <p className="hidden sm:block text-[11px] uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400 font-sans mt-0.5 font-medium">
            {settings?.tagline || 'Definitive Intelligence for Modern Wealth & Technology'}
          </p>
        </div>

        {/* Right Actions: Search, Bookmarks, Theme Toggle, Subscribe */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Search Trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700/80 rounded-full text-xs text-neutral-600 dark:text-neutral-300 transition-colors border border-transparent hover:border-neutral-300 dark:hover:border-neutral-700"
            title="Search Articles (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-neutral-500" />
            <span className="hidden md:inline font-medium">Search</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-[10px] font-mono text-neutral-400">
              ⌘K
            </kbd>
          </button>

          {/* Bookmarks Counter */}
          {bookmarks.length > 0 && (
            <button
              onClick={() => {
                navigate('#/');
                window.dispatchEvent(new CustomEvent('filter-bookmarks'));
              }}
              className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors relative"
              title="View Saved Articles"
            >
              <Bookmark className="w-4 h-4 text-blue-500 fill-current" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                {bookmarks.length}
              </span>
            </button>
          )}

          {/* Dark / Light Mode */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-700" />}
          </button>

          {/* Newsletter Subscribe Trigger */}
          <button
            onClick={() => {
              const el = document.getElementById('newsletter-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else {
                navigate('#/');
                setTimeout(() => {
                  document.getElementById('newsletter-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 200);
              }
            }}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-blue-600 dark:bg-neutral-100 dark:hover:bg-blue-500 text-white dark:text-neutral-900 dark:hover:text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
          >
            <span>Subscribe</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* MODERN REFINED CATEGORY NAVIGATION BAR */}
      <nav className="border-t border-neutral-200/90 dark:border-neutral-800/90 hidden lg:block bg-neutral-50/80 dark:bg-[#080c14]/90 backdrop-blur-md relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-1.5">
            <ul className="flex items-center space-x-1.5 w-full justify-between">
              {/* Front Page Tab */}
              <li>
                <button
                  onClick={() => navigate('#/')}
                  className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold tracking-tight transition-all duration-200 ${
                    currentRoute === '#/'
                      ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500/50'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800/80 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-xs'
                  }`}
                >
                  <Globe className={`w-3.5 h-3.5 ${currentRoute === '#/' ? 'text-white' : 'text-blue-500'}`} />
                  <span>Front Page</span>
                </button>
              </li>

              {/* Individual Category Tabs with Micro-Icons & Hover Mega-Menu */}
              {categories.map(cat => {
                const isActive = currentRoute === `#/category/${cat.slug}`;
                const catPosts = posts.filter(p => p.categoryId === cat.id && p.status === 'published');

                return (
                  <li 
                    key={cat.id} 
                    className="relative"
                    onMouseEnter={() => handleMouseEnter(cat)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      onClick={() => navigate(`#/category/${cat.slug}`)}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all duration-200 whitespace-nowrap ${
                        isActive
                          ? 'bg-white dark:bg-[#111622] text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-neutral-200 dark:ring-neutral-700 font-bold'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800/80 hover:text-neutral-950 dark:hover:text-white hover:shadow-xs'
                      }`}
                    >
                      {getCategoryIcon(cat.slug, cat.color)}
                      <span>{cat.name}</span>
                      
                      {/* Micro Post Count Badge */}
                      <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold transition-colors ${
                        isActive
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          : 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 group-hover:bg-neutral-300/80 dark:group-hover:bg-neutral-700'
                      }`}>
                        {catPosts.length || cat.postCount || 4}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* ELEGANT HOVER MEGA-MENU PREVIEW */}
        {hoveredCat && (
          <div 
            onMouseEnter={() => handleMouseEnter(hoveredCat)}
            onMouseLeave={handleMouseLeave}
            className="absolute top-full left-0 w-full bg-white/95 dark:bg-[#0f141f]/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800 shadow-2xl z-40 animate-fadeIn"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-12 gap-6 items-start">
                {/* Left 4 Cols: Category Info & Description */}
                <div className="col-span-4 pr-6 border-r border-neutral-200 dark:border-neutral-800/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                      {getCategoryIcon(hoveredCat.slug, hoveredCat.color)}
                    </span>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-neutral-950 dark:text-neutral-50">
                        {hoveredCat.name}
                      </h3>
                      <span className="text-[11px] font-mono text-neutral-400">
                        {posts.filter(p => p.categoryId === hoveredCat.id).length} In-Depth Articles
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {hoveredCat.description}
                  </p>

                  <button
                    onClick={() => {
                      navigate(`#/category/${hoveredCat.slug}`);
                      setHoveredCat(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors pt-2 group"
                  >
                    <span>Explore All {hoveredCat.name} Dispatches</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Right 8 Cols: Latest Top 2 Articles in Category */}
                <div className="col-span-8">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400 block mb-3">
                    Featured Intelligence in this Desk:
                  </span>

                  <div className="grid grid-cols-2 gap-4">
                    {posts
                      .filter(p => p.categoryId === hoveredCat.id && p.status === 'published')
                      .slice(0, 2)
                      .map(post => (
                        <div
                          key={post.id}
                          onClick={() => {
                            navigate(`#/post/${post.slug}`);
                            setHoveredCat(null);
                          }}
                          className="group/card cursor-pointer p-3 rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/60 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-800 transition-all flex items-start gap-3"
                        >
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-18 h-18 rounded-xl object-cover flex-shrink-0 group-hover/card:scale-105 transition-transform duration-300 border border-neutral-200 dark:border-neutral-700"
                          />
                          <div className="space-y-1 flex-1">
                            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400 transition-colors line-clamp-2 leading-snug">
                              {post.title}
                            </h4>
                            <div className="flex items-center space-x-2 text-[10px] text-neutral-400 font-mono">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {post.readTime}
                              </span>
                              <span>•</span>
                              <span>{(post.views || 0).toLocaleString()} views</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c1017] p-4 space-y-4 shadow-xl animate-fadeIn">
          <div className="space-y-1.5">
            <button
              onClick={() => { navigate('#/'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
            >
              <Globe className="w-4 h-4" />
              <span>Front Page</span>
            </button>

            {categories.map(cat => {
              const catCount = posts.filter(p => p.categoryId === cat.id && p.status === 'published').length;
              return (
                <button
                  key={cat.id}
                  onClick={() => { navigate(`#/category/${cat.slug}`); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {getCategoryIcon(cat.slug, cat.color)}
                    <span>{cat.name}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                    {catCount || 4} articles
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
            <button
              onClick={() => { navigate('#/about'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
            >
              Editorial Board & Mission
            </button>
            <button
              onClick={() => { navigate('#/contact'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
            >
              Contact Newsroom
            </button>
            <button
              onClick={() => { navigate('#/privacy-policy'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
            >
              Privacy Policy & Cookies
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
