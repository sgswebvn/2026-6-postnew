import React from 'react';
import { ShieldCheck, Lock, Globe, Search } from 'lucide-react';

export default function PublicNavbar({ settings, onAdminClick }) {
  return (
    <header style={{
      backgroundColor: 'rgba(15, 21, 35, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 30
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1.5rem',
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Globe size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {settings?.siteName || 'THE HORIZON POST'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {settings?.tagline || 'Modern Intelligence & Technology Journal'}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={onAdminClick}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 'var(--radius-xl)', padding: '0.45rem 1rem' }}
          >
            <Lock size={14} color="#60a5fa" />
            <span>Admin Dashboard</span>
          </button>
        </div>
      </div>
    </header>
  );
}
