import React, { useState } from 'react';
import {
  Globe,
  Search,
  Menu,
  X,
  Lock,
  ChevronDown,
  BookOpen
} from 'lucide-react';

export default function PublicNavbar({ settings, categories = [], onNavigate, onAdminClick }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    onNavigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setMobileMenuOpen(false);
  }

  function handleCategoryClick(catSlug) {
    onNavigate(`/category/${catSlug}`);
    setMobileMenuOpen(false);
  }

  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.02)'
    }}>
      <div style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0 1.5rem',
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand Logo & Name */}
        <div
          onClick={() => onNavigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
            flexShrink: 0
          }}>
            <BookOpen size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontWeight: 850, fontSize: '1.25rem', color: '#0f172a', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
              {settings?.siteName || 'THE HORIZON POST'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
              {settings?.tagline || 'Modern Intelligence & Technology Journal'}
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav style={{
          display: 'none',
          alignItems: 'center',
          gap: '1.5rem'
        }} className="desktop-nav">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#0f172a',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            Home
          </button>

          {categories.slice(0, 4).map((c) => (
            <button
              key={c.id || c.slug}
              type="button"
              onClick={() => handleCategoryClick(c.slug || c.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#475569',
                fontWeight: 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#2563eb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#475569'; }}
            >
              {c.name}
            </button>
          ))}

          <button
            type="button"
            onClick={() => onNavigate('/about')}
            style={{
              background: 'none',
              border: 'none',
              color: '#475569',
              fontWeight: 500,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            About
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/contact')}
            style={{
              background: 'none',
              border: 'none',
              color: '#475569',
              fontWeight: 500,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            Contact
          </button>
        </nav>

        {/* Right Action Icons & Mobile Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Search Trigger */}
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            className="btn btn-secondary btn-icon"
            title="Search articles"
            style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
          >
            <Search size={16} color="#475569" />
          </button>

          {/* Admin link */}
          <button
            type="button"
            onClick={onAdminClick}
            className="btn btn-secondary btn-sm"
            style={{
              backgroundColor: '#ffffff',
              borderColor: '#e2e8f0',
              borderRadius: '9999px',
              padding: '0.4rem 0.85rem',
              fontSize: '0.8rem',
              color: '#334155'
            }}
          >
            <Lock size={13} color="#2563eb" />
            <span>Admin</span>
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-secondary btn-icon mobile-nav-toggle"
            title="Toggle Menu"
            style={{ display: 'none', backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Expandable Search Input Bar */}
      {searchOpen && (
        <div style={{
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: '0.75rem 1.5rem',
          animation: 'slideUp 0.15s ease'
        }}>
          <form
            onSubmit={handleSearchSubmit}
            style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', gap: '0.5rem' }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '38px', backgroundColor: '#ffffff' }}
                placeholder="Search articles, technology topics, finance..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '0 1.25rem' }}>
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <button
            type="button"
            onClick={() => { onNavigate('/'); setMobileMenuOpen(false); }}
            style={{ textAlign: 'left', background: 'none', border: 'none', color: '#0f172a', fontWeight: 600, fontSize: '1rem', padding: '0.5rem 0' }}
          >
            Home
          </button>

          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginTop: '0.5rem' }}>
            Categories
          </div>
          {categories.map((c) => (
            <button
              key={c.id || c.slug}
              type="button"
              onClick={() => handleCategoryClick(c.slug || c.id)}
              style={{ textAlign: 'left', background: 'none', border: 'none', color: '#475569', fontSize: '0.95rem', padding: '0.35rem 0' }}
            >
              {c.name} {c.postCount ? `(${c.postCount})` : ''}
            </button>
          ))}

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => { onNavigate('/about'); setMobileMenuOpen(false); }}
              style={{ textAlign: 'left', background: 'none', border: 'none', color: '#475569', fontSize: '0.95rem' }}
            >
              About the Publication
            </button>
            <button
              type="button"
              onClick={() => { onNavigate('/contact'); setMobileMenuOpen(false); }}
              style={{ textAlign: 'left', background: 'none', border: 'none', color: '#475569', fontSize: '0.95rem' }}
            >
              Contact Us
            </button>
            <button
              type="button"
              onClick={() => { onNavigate('/privacy-policy'); setMobileMenuOpen(false); }}
              style={{ textAlign: 'left', background: 'none', border: 'none', color: '#475569', fontSize: '0.95rem' }}
            >
              Privacy Policy
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
