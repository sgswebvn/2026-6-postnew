import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { 
  Search, 
  Menu, 
  X, 
  Bookmark, 
  DollarSign,
  Cpu,
  Heart,
  Home,
  Sparkles
} from 'lucide-react';

// Category icon mapper
const getCategoryIcon = (slug) => {
  switch (slug) {
    case 'money':
    case 'personal-finance':
    case 'venture-economy':
      return <DollarSign className="w-3.5 h-3.5 text-neutral-400" />;
    case 'tech':
    case 'ai-frontier-tech':
    case 'cybersecurity-privacy':
      return <Cpu className="w-3.5 h-3.5 text-neutral-400" />;
    case 'health':
    case 'longevity-biohacking':
      return <Heart className="w-3.5 h-3.5 text-neutral-400" />;
    case 'home':
    case 'smart-living-design':
    case 'clean-energy-mobility':
      return <Home className="w-3.5 h-3.5 text-neutral-400" />;
    default:
      return <Sparkles className="w-3.5 h-3.5 text-neutral-400" />;
  }
};

export const Header = () => {
  const { 
    categories, 
    settings, 
    navigate, 
    currentRoute, 
    setSearchOpen,
    bookmarks
  } = useBlog();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  const cleanCurrentRoute = currentRoute.startsWith('#') ? currentRoute.replace(/^#/, '') : currentRoute;

  return (
    <header className="w-full bg-white dark:bg-[#0c1017] border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-30 transition-colors">
      {/* Subtle Minimal Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 border-b border-neutral-100 dark:border-neutral-900 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center space-x-3">
          <span className="font-mono text-[11px] text-neutral-600 dark:text-neutral-400">{formattedDate}</span>
          <span className="text-neutral-300 dark:text-neutral-700">|</span>
          <span className="font-mono text-[11px] uppercase tracking-wider">{settings?.edition || 'U.S. Edition'}</span>
        </div>

        <div className="flex items-center space-x-4 text-[11px]">
          <button
            onClick={() => navigate('/about')}
            className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors hidden md:inline-block"
          >
            About Us
          </button>
          <span className="text-neutral-300 dark:text-neutral-700 hidden md:inline-block">•</span>
          <button
            onClick={() => navigate('/privacy-policy')}
            className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors hidden sm:inline-block"
          >
            Privacy
          </button>
          <span className="text-neutral-300 dark:text-neutral-700 hidden sm:inline-block">•</span>
          <button
            onClick={() => navigate('/contact')}
            className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors hidden sm:inline-block"
          >
            Contact
          </button>
        </div>
      </div>

      {/* Clean Masthead & Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Brand Masthead */}
        <div 
          onClick={() => navigate('/')}
          className="cursor-pointer group text-left"
        >
          <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-neutral-950 dark:text-neutral-50 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
            {settings?.siteName || 'THE HORIZON POST'}
          </h1>
        </div>

        {/* Right Actions: Search, Bookmarks, Theme Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800/80 dark:hover:bg-neutral-700 rounded-lg text-xs text-neutral-600 dark:text-neutral-300 transition-colors"
            title="Search Articles"
          >
            <Search className="w-3.5 h-3.5 text-neutral-500" />
            <span className="hidden md:inline font-medium">Search</span>
          </button>

          {/* Bookmarks Counter */}
          {bookmarks.length > 0 && (
            <button
              onClick={() => {
                navigate('/');
                window.dispatchEvent(new CustomEvent('filter-bookmarks'));
              }}
              className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors relative"
              title="View Saved Articles"
            >
              <Bookmark className="w-4 h-4 text-neutral-900 fill-current" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-neutral-900 text-white text-[9px] font-mono font-bold flex items-center justify-center">
                {bookmarks.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Clean Category Navigation Strip */}
      <nav className="border-t border-neutral-100 dark:border-neutral-800/60 hidden lg:block bg-neutral-50/50 dark:bg-[#090d14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center space-x-6 py-2">
            <li>
              <button
                onClick={() => navigate('/')}
                className={`text-xs font-semibold tracking-tight transition-colors py-1 ${
                  cleanCurrentRoute === '/'
                    ? 'text-neutral-950 dark:text-neutral-50 font-bold border-b-2 border-neutral-900 dark:border-neutral-100'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-100'
                }`}
              >
                Front Page
              </button>
            </li>

            {categories.map(cat => {
              const isActive = cleanCurrentRoute === `/category/${cat.slug}`;
              return (
                <li key={cat.id}>
                  <button
                    onClick={() => navigate(`/category/${cat.slug}`)}
                    className={`flex items-center gap-1.5 text-xs font-medium tracking-tight transition-colors py-1 ${
                      isActive
                        ? 'text-neutral-950 dark:text-neutral-50 font-bold border-b-2 border-neutral-900 dark:border-neutral-100'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-100'
                    }`}
                  >
                    {getCategoryIcon(cat.slug)}
                    <span>{cat.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c1017] p-4 space-y-4 shadow-xl animate-fadeIn">
          <div className="space-y-1">
            <button
              onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Front Page
            </button>

            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { navigate(`/category/${cat.slug}`); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {getCategoryIcon(cat.slug)}
                  <span>{cat.name}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
            <button
              onClick={() => { navigate('/about'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-1 text-neutral-600 dark:text-neutral-400"
            >
              About Us
            </button>
            <button
              onClick={() => { navigate('/privacy-policy'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-1 text-neutral-600 dark:text-neutral-400"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => { navigate('/contact'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-1 text-neutral-600 dark:text-neutral-400"
            >
              Contact
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
