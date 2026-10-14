import React from 'react';
import { BookOpen, ShieldCheck, Target, Award, Users, Mail, ArrowRight } from 'lucide-react';

export default function AboutPage({ settings, onNavigate }) {
  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
      {/* Breadcrumb */}
      <div className="breadcrumbs">
        <button type="button" onClick={() => onNavigate('/')} style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer' }}>
          Home
        </button>
        <span>/</span>
        <span className="current">About</span>
      </div>

      <h1 style={{
        fontSize: 'clamp(2rem, 4vw, 2.75rem)',
        fontWeight: 850,
        color: '#0f172a',
        letterSpacing: '-0.025em',
        marginBottom: '1rem',
        lineHeight: 1.2
      }}>
        About {settings?.siteName || 'THE HORIZON POST'}
      </h1>

      <div style={{
        fontSize: '1.2rem',
        color: '#475569',
        lineHeight: 1.7,
        marginBottom: '2.5rem',
        paddingBottom: '2rem',
        borderBottom: '1px solid #e2e8f0'
      }}>
        {settings?.tagline || 'Definitive Intelligence for Modern Wealth & Technology'}. Delivering high-conviction journalism, rigorous architectural investigations, and objective global analysis.
      </div>

      {/* Main Narrative */}
      <div style={{ color: '#1e293b', fontSize: '1.05rem', lineHeight: 1.85, display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        <p>
          Founded as an independent digital publication, <strong>{settings?.siteName || 'THE HORIZON POST'}</strong> bridges the gap between deep technical architecture and macroeconomic strategy. In an era saturated with sensationalism and automated noise, we prioritize depth, verified facts, and enduring clarity.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
          margin: '1.5rem 0'
        }}>
          <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <ShieldCheck size={20} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
              Editorial Independence
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
              Our analysis is uncompromised by corporate sponsors or external commercial interests. Every claim is cross-referenced with primary sources.
            </p>
          </div>

          <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <Target size={20} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
              Precision Intelligence
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
              We cover semiconductors, artificial intelligence systems, modern software infrastructure, and quantitative market movements.
            </p>
          </div>
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '1rem' }}>
          Our Editorial Code of Conduct
        </h2>
        <p>
          We adhere to international journalistic standards. Our team conducts first-party research, technical reverse engineering, and macroeconomic modeling. When corrections or updates occur, we maintain full transparency with clear revision notices.
        </p>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '1rem' }}>
          Contact & Media Relations
        </h2>
        <p>
          For corrections, confidential news tips, or commercial partnership inquiries, please contact our editorial bureau directly:
        </p>

        <div style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: '#f8fafc',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>Editorial Desk</div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{settings?.contactEmail || 'contact@thehori.click'}</div>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onNavigate('/contact')}
          >
            <span>Send Inquiry</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
