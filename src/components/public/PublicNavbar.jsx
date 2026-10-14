import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Menu,
  X,
  ChevronDown,
  BookOpen
} from 'lucide-react';

export default function PublicNavbar({ settings, categories = [], onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Normalize brand name: strictly "TheHorizon"
  const rawSiteName = settings?.siteName || 'TheHorizon';
  const siteName = rawSiteName.replace(/\s*Post\b/gi, '').trim() || 'TheHorizon';

  // Deduplicate and filter categories from database
  const uniqueCategories = Array.from(
    new Map((categories || []).filter(c => c && c.name).map(c => [c.slug || c.id, c])).values()
  );

  // Split into primary row (top 4) and secondary dropdown ("More")
  const primaryCategories = uniqueCategories.slice(0, 4);
  const moreCategories = uniqueCategories.slice(4);

  // Close "More" dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMoreDropdownOpen(false);
      }
    }
    if (moreDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [moreDropdownOpen]);

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
    setMoreDropdownOpen(false);
  }

  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.02)'
    }}>
      <div style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0 1.5rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand Logo & Name */}
        <div
          onClick={() => onNavigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', flexShrink: 0 }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '9px',
            background: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.22)',
            flexShrink: 0
          }}>
            <BookOpen size={18} color="#ffffff" />
          </div>
          <span style={{
            fontWeight: 850,
            fontSize: '1.25rem',
            color: '#0f172a',
            letterSpacing: '-0.025em',
            lineHeight: 1
          }}>
            {siteName}
          </span>
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
              cursor: 'pointer',
              padding: '0.4rem 0.2rem',
              transition: 'color 0.15s ease'
            }}
          >
            Home
          </button>

          {/* Primary Categories on Navbar Row */}
          {primaryCategories.map((c) => (
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
                padding: '0.4rem 0.2rem',
                transition: 'color 0.15s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#2563eb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#475569'; }}
            >
              {c.name}
            </button>
          ))}

          {/* More Categories Dropdown */}
          {moreCategories.length > 0 && (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: moreDropdownOpen ? '#2563eb' : '#475569',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  padding: '0.4rem 0.5rem',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => { if (!moreDropdownOpen) e.currentTarget.style.color = '#2563eb'; }}
                onMouseLeave={(e) => { if (!moreDropdownOpen) e.currentTarget.style.color = '#475569'; }}
              >
                <span>More</span>
                <ChevronDown
                  size={14}
                  style={{
                    transform: moreDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s ease'
                  }}
                />
              </button>

              {moreDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
                  padding: '0.5rem',
                  minWidth: '210px',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.15rem'
                }}>
                  {moreCategories.map((c) => (
                    <button
                      key={c.id || c.slug}
                      type="button"
                      onClick={() => handleCategoryClick(c.slug || c.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '6px',
                        color: '#334155',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease, color 0.15s ease',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f1f5f9';
                        e.currentTarget.style.color = '#2563eb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#334155';
                      }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Right Action Icons & Mobile Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Search Trigger */}
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            className="btn btn-secondary btn-icon"
            title="Search articles"
            style={{
              backgroundColor: searchOpen ? '#f1f5f9' : '#ffffff',
              borderColor: '#e2e8f0',
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Search size={16} color="#475569" />
          </button>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-secondary btn-icon mobile-nav-toggle"
            title="Toggle Menu"
            style={{
              display: 'none',
              backgroundColor: mobileMenuOpen ? '#f1f5f9' : '#ffffff',
              borderColor: '#e2e8f0',
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {mobileMenuOpen ? <X size={18} color="#0f172a" /> : <Menu size={18} color="#0f172a" />}
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
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8'
                }}
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '38px', backgroundColor: '#ffffff', height: '40px' }}
                placeholder="Search articles, technology topics, finance..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '0 1.25rem', height: '40px' }}>
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
          padding: '1rem 1.5rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxHeight: 'calc(100vh - 64px)',
          overflowY: 'auto'
        }}>
          <button
            type="button"
            onClick={() => { onNavigate('/'); setMobileMenuOpen(false); }}
            style={{
              textAlign: 'left',
              background: 'none',
              border: 'none',
              color: '#0f172a',
              fontWeight: 650,
              fontSize: '1rem',
              padding: '0.65rem 0',
              cursor: 'pointer'
            }}
          >
            Home
          </button>

          <div style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#94a3b8',
            marginTop: '0.5rem',
            marginBottom: '0.25rem'
          }}>
            Categories
          </div>

          {uniqueCategories.map((c) => (
            <button
              key={c.id || c.slug}
              type="button"
              onClick={() => handleCategoryClick(c.slug || c.id)}
              style={{
                textAlign: 'left',
                background: 'none',
                border: 'none',
                color: '#334155',
                fontSize: '0.95rem',
                fontWeight: 500,
                padding: '0.6rem 0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #f8fafc'
              }}
            >
              <span>{c.name}</span>
              {c.postCount ? (
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 400 }}>
                  {c.postCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
