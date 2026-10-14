import React from 'react';
import { HelpCircle, ArrowLeft, Home, Search } from 'lucide-react';

export default function NotFoundPage({ onNavigate }) {
  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '6rem 1.5rem', textAlign: 'center' }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '16px',
        backgroundColor: '#fee2e2',
        color: '#dc2626',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem'
      }}>
        <HelpCircle size={32} />
      </div>

      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: 850,
        color: '#0f172a',
        marginBottom: '0.75rem',
        letterSpacing: '-0.025em'
      }}>
        Page Not Found (404)
      </h1>

      <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2rem' }}>
        The article, category, or page you were looking for could not be located. It might have been retitled or relocated.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="btn btn-primary"
          style={{ padding: '0.65rem 1.25rem' }}
        >
          <Home size={16} />
          <span>Return to Homepage</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('/search')}
          className="btn btn-secondary"
          style={{ padding: '0.65rem 1.25rem' }}
        >
          <Search size={16} />
          <span>Search Articles</span>
        </button>
      </div>
    </div>
  );
}
