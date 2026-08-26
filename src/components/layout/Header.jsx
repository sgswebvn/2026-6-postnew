import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { Search, Sun, Moon, Menu, X, ArrowUpRight, Bookmark } from 'lucide-react';
import { MarketTicker } from '../blog/MarketTicker';

export const Header = () => {
  const { 
    darkMode, 
    toggleDarkMode, 
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
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  return (
    <header className="w-full bg-white dark:bg-[#0c1017] border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-30 transition-colors">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex items-center justify-between">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
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
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700/80 rounded-full text-xs text-neutral-600 dark:text-neutral-300 transition-colors"
            title="Search Articles (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-neutral-500" />
            <span className="hidden md:inline">Search</span>
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
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-blue-600 dark:bg-neutral-100 dark:hover:bg-blue-500 text-white dark:text-neutral-900 dark:hover:text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
          >
            <span>Subscribe</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Category Navigation Bar */}
      <nav className="border-t border-neutral-200 dark:border-neutral-800 hidden lg:block bg-neutral-50/60 dark:bg-[#090d14]/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center justify-center space-x-8 py-2.5 text-xs font-bold uppercase tracking-wider">
            <li>
              <button
                onClick={() => navigate('#/')}
                className={`transition-colors pb-1 border-b-2 ${currentRoute === '#/' ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-neutral-700 dark:text-neutral-300 border-transparent hover:text-blue-600 dark:hover:text-blue-400'}`}
              >
                Front Page
              </button>
            </li>
            {categories.map(cat => {
              const isActive = currentRoute === `#/category/${cat.slug}`;
              return (
                <li key={cat.id}>
                  <button
                    onClick={() => navigate(`#/category/${cat.slug}`)}
                    className={`transition-colors pb-1 border-b-2 ${isActive ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-neutral-700 dark:text-neutral-300 border-transparent hover:text-blue-600 dark:hover:text-blue-400'}`}
                  >
                    {cat.name}
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
              onClick={() => { navigate('#/'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Front Page
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { navigate(`#/category/${cat.slug}`); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between"
              >
                <span>{cat.name}</span>
                <span className="text-xs text-neutral-400">{cat.postCount || 2} stories</span>
              </button>
            ))}
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
