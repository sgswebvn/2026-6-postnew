import React from 'react';

export default function TermsPage({ settings, onNavigate }) {
  const siteName = settings?.siteName || 'THE HORIZON POST';
  const siteUrl = settings?.siteUrl || 'https://www.thehori.click';

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
      {/* Breadcrumb */}
      <div className="breadcrumbs">
        <button type="button" onClick={() => onNavigate('/')} style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer' }}>
          Home
        </button>
        <span>/</span>
        <span className="current">Terms of Service</span>
      </div>

      <h1 style={{
        fontSize: 'clamp(2rem, 4vw, 2.75rem)',
        fontWeight: 850,
        color: '#0f172a',
        letterSpacing: '-0.025em',
        marginBottom: '0.75rem'
      }}>
        Terms of Service
      </h1>

      <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
        Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>

      <div style={{ color: '#1e293b', fontSize: '1.05rem', lineHeight: 1.85, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <p>
          Welcome to <strong>{siteName}</strong>. These terms and conditions outline the rules and regulations for the use of our website located at {siteUrl}.
        </p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '1rem' }}>
          1. Acceptance of Terms
        </h2>
        <p>
          By accessing this website we assume you accept these terms and conditions. Do not continue to use {siteName} if you do not agree to take all of the terms and conditions stated on this page.
        </p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '1rem' }}>
          2. Intellectual Property Rights
        </h2>
        <p>
          Unless otherwise stated, {siteName} and/or its licensors own the intellectual property rights for all material on {siteName}. All intellectual property rights are reserved. You may access this from {siteName} for your own personal use subjected to restrictions set in these terms and conditions.
        </p>
        <p>You must not:</p>
        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <li>Republish material from {siteName} without explicit attribution and canonical link.</li>
          <li>Sell, rent, or sub-license material from {siteName}.</li>
          <li>Reproduce, duplicate, or copy material from {siteName} for mass syndication without written consent.</li>
        </ul>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '1rem' }}>
          3. Disclaimer & Informational Nature of Content
        </h2>
        <p>
          The materials on {siteName} are provided on an 'as is' basis. All articles, research, and technical insights are published strictly for informational, educational, and journalistic purposes. Nothing contained herein constitutes financial, legal, investment, or technical advice.
        </p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '1rem' }}>
          4. Hyperlinking to our Content
        </h2>
        <p>
          Organizations may link to our home page, publications, or other website information so long as the link: (a) is not in any way deceptive; (b) does not falsely imply sponsorship, endorsement, or approval of the linking party and its products/services; and (c) fits within the context of the linking party's site.
        </p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '1rem' }}>
          5. Limitation of Liability
        </h2>
        <p>
          In no event shall {siteName}, nor any of its officers, directors, and employees, be held liable for anything arising out of or in any way connected with your use of this website.
        </p>
      </div>
    </div>
  );
}
