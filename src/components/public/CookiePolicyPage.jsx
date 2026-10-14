import React from 'react';

export default function CookiePolicyPage({ settings, onNavigate }) {
  const siteName = settings?.siteName || 'THE HORIZON POST';

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
      {/* Breadcrumb */}
      <div className="breadcrumbs">
        <button type="button" onClick={() => onNavigate('/')} style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer' }}>
          Home
        </button>
        <span>/</span>
        <span className="current">Cookie Policy</span>
      </div>

      <h1 style={{
        fontSize: 'clamp(2rem, 4vw, 2.75rem)',
        fontWeight: 850,
        color: '#0f172a',
        letterSpacing: '-0.025em',
        marginBottom: '0.75rem'
      }}>
        Cookie Policy & Transparency
      </h1>

      <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
        Compliance Guidelines for European ePrivacy Directive & Global Privacy Frameworks
      </div>

      <div style={{ color: '#1e293b', fontSize: '1.05rem', lineHeight: 1.85, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <p>
          This Cookie Policy explains what cookies are, how <strong>{siteName}</strong> uses cookies and similar technologies, and how you can manage your preferences.
        </p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '1rem' }}>
          1. What Are Cookies?
        </h2>
        <p>
          Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work efficiently, remember your preferences, and provide analytical information to site owners.
        </p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '1rem' }}>
          2. Categories of Cookies We Use
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
              A. Strictly Necessary / Essential Cookies
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0 }}>
              These cookies are essential for you to browse the website and use its features, such as accessing secure admin sessions and verifying security tokens.
            </p>
          </div>

          <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
              B. Analytics & Performance Cookies
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0 }}>
              We use first-party telemetry and Google Analytics 4 (GA4) to understand how visitors interact with our publications, identifying popular articles and navigation paths. All data is aggregated anonymously.
            </p>
          </div>

          <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
              C. Advertising & Google AdSense Cookies
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0 }}>
              Google and approved third-party vendors use cookies to serve relevant advertisements based on a user's prior visits to this website and other websites across the Internet. You can opt out of personalized advertising by visiting Google Ad Settings (<a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>www.google.com/settings/ads</a>).
            </p>
          </div>
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '1rem' }}>
          3. How to Control or Delete Cookies
        </h2>
        <p>
          Most web browsers allow you to control cookies through their settings preferences. You can configure your browser to reject all cookies or notify you when a cookie is set. Please note that disabling cookies may affect website navigation and authenticated features.
        </p>
      </div>
    </div>
  );
}
