import React from 'react';
import { BookOpen, Mail, Phone, MapPin, ShieldCheck, ArrowRight } from 'lucide-react';

export default function PublicFooter({ settings, categories = [], onNavigate }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      backgroundColor: '#f8fafc',
      borderTop: '1px solid #e2e8f0',
      color: '#475569',
      fontSize: '0.875rem',
      lineHeight: 1.6,
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '3.5rem 1.5rem 2rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3rem'
        }}>
          {/* Column 1: Brand & Mission */}
          <div>
            <div
              onClick={() => onNavigate('/')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', cursor: 'pointer' }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <BookOpen size={18} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0f172a', letterSpacing: '-0.02em' }}>
                {settings?.siteName || 'THE HORIZON POST'}
              </span>
            </div>

            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              {settings?.tagline || 'Definitive Intelligence for Modern Wealth & Technology'}. Delivering high-conviction analysis, investigative journalism, and architectural deep-dives.
            </p>

            {settings?.contactEmail && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                <Mail size={14} color="#2563eb" />
                <span>{settings.contactEmail}</span>
              </div>
            )}
            {settings?.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                <Phone size={14} color="#2563eb" />
                <span>{settings.phone}</span>
              </div>
            )}
            {settings?.businessAddress && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.8rem' }}>
                <MapPin size={14} color="#2563eb" />
                <span>{settings.businessAddress}</span>
              </div>
            )}
          </div>

          {/* Column 2: Content Pillars / Categories */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Editorial Pillars
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {categories.slice(0, 6).map((c) => (
                <li key={c.id || c.slug}>
                  <button
                    type="button"
                    onClick={() => onNavigate(`/category/${c.slug || c.id}`)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#64748b',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'color 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#2563eb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Trust & Policies (Google AdSense Required) */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Trust & Transparency
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/about')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', fontSize: '0.875rem', cursor: 'pointer' }}
                >
                  About the Publication
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/contact')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', fontSize: '0.875rem', cursor: 'pointer' }}
                >
                  Contact & Inquiries
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/privacy-policy')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', fontSize: '0.875rem', cursor: 'pointer' }}
                >
                  Privacy Policy (GDPR / CCPA)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/terms')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', fontSize: '0.875rem', cursor: 'pointer' }}
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/cookie-policy')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', fontSize: '0.875rem', cursor: 'pointer' }}
                >
                  Cookie Policy & Consent
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Standards & Search */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Editorial Standards
            </h4>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>
              All publications are independently researched and fact-checked. We strictly observe publisher integrity and international digital compliance standards.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'none', background: '#eff6ff', padding: '0.25rem 0.5rem', borderRadius: '4px' }}
              >
                XML Sitemap
              </a>
              <a
                href="/robots.txt"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'none', background: '#eff6ff', padding: '0.25rem 0.5rem', borderRadius: '4px' }}
              >
                Robots.txt
              </a>
              <a
                href="/ads.txt"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'none', background: '#eff6ff', padding: '0.25rem 0.5rem', borderRadius: '4px' }}
              >
                Ads.txt
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid #e2e8f0',
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8rem',
          color: '#94a3b8'
        }}>
          <div>
            © {currentYear} {settings?.siteName || 'THE HORIZON POST'}. All rights reserved.
          </div>
          <div>
            Independent Editorial Publishing • Designed for Clarity & Speed
          </div>
        </div>
      </div>
    </footer>
  );
}
