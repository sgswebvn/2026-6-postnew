import React from 'react';

export default function PrivacyPolicyPage({ settings, onNavigate }) {
  const rawSiteName = settings?.siteName || 'TheHorizon';
  const siteName = rawSiteName.replace(/\s*Post\b/gi, '').trim() || 'TheHorizon';
  const siteUrl = settings?.siteUrl || 'https://www.thehori.click';
  const contactEmail = settings?.contactEmail || 'contact@thehori.click';

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
      {/* Breadcrumb */}
      <div className="breadcrumbs">
        <button type="button" onClick={() => onNavigate('/')} style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer' }}>
          Home
        </button>
        <span>/</span>
        <span className="current">Privacy Policy</span>
      </div>

      <h1 style={{
        fontSize: 'clamp(2rem, 4vw, 2.75rem)',
        fontWeight: 850,
        color: '#0f172a',
        letterSpacing: '-0.025em',
        marginBottom: '0.75rem'
      }}>
        Privacy Policy
      </h1>

      <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
        Effective Date: January 1, {new Date().getFullYear()} • Compliant with GDPR, CCPA & Google AdSense Publisher Policies
      </div>

      <div style={{ color: '#1e293b', fontSize: '1.05rem', lineHeight: 1.85, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <p>
          At <strong>{siteName}</strong>, accessible from <strong>{siteUrl}</strong>, one of our main priorities is the privacy of our visitors. This Privacy Policy document outlines the types of information collected and recorded by {siteName} and how we use it.
        </p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '1rem' }}>
          1. Consent
        </h2>
        <p>
          By using our website, you hereby consent to our Privacy Policy and agree to its terms.
        </p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '1rem' }}>
          2. Information We Collect
        </h2>
        <p>
          The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information. If you contact us directly via our contact form or email, we may receive additional information about you such as your name, email address, the contents of the message and attachments you may send us, and any other information you may choose to provide.
        </p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '1rem' }}>
          3. Log Files
        </h2>
        <p>
          {siteName} follows a standard procedure of using log files. These files log visitors when they visit websites. The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, and gathering demographic information.
        </p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '1rem' }}>
          4. Google DoubleClick DART Cookies & Google AdSense
        </h2>
        <p>
          Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our site and other sites on the internet. However, visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy at the following URL: <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>https://policies.google.com/technologies/ads</a>.
        </p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '1rem' }}>
          5. Our Advertising Partners
        </h2>
        <p>
          Some of advertisers on our site may use cookies and web beacons. Our primary advertising partner is <strong>Google AdSense</strong>. Third-party ad servers or ad networks use technologies like cookies, JavaScript, or Web Beacons that are used in their respective advertisements and links that appear on {siteName}, which are sent directly to users' browser. They automatically receive your IP address when this occurs. These technologies are used to measure the effectiveness of their advertising campaigns and/or to personalize the advertising content that you see on websites that you visit.
        </p>
        <p>
          Note that {siteName} has no access to or control over these cookies that are used by third-party advertisers.
        </p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '1rem' }}>
          6. CCPA Privacy Rights (Do Not Sell My Personal Information)
        </h2>
        <p>
          Under the California Consumer Privacy Act (CCPA), California consumers have the right to:
        </p>
        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <li>Request that a business disclose the categories and specific pieces of personal data collected.</li>
          <li>Request that a business delete any personal data about the consumer that a business has collected.</li>
          <li>Request that a business that sells a consumer's personal data, not sell the consumer's personal data.</li>
        </ul>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '1rem' }}>
          7. GDPR Data Protection Rights
        </h2>
        <p>
          We would like to make sure you are fully aware of all of your data protection rights under the General Data Protection Regulation (GDPR):
        </p>
        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <li><strong>The right to access:</strong> You have the right to request copies of your personal data.</li>
          <li><strong>The right to rectification:</strong> You have the right to request that we correct any information you believe is inaccurate.</li>
          <li><strong>The right to erasure:</strong> You have the right to request that we erase your personal data, under certain conditions.</li>
          <li><strong>The right to restrict processing:</strong> You have the right to request that we restrict the processing of your personal data.</li>
          <li><strong>The right to data portability:</strong> You have the right to request transfer of data to another organization.</li>
        </ul>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '1rem' }}>
          8. Contact Information
        </h2>
        <p>
          If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact our Data Protection Officer at: <a href={`mailto:${contactEmail}`} style={{ color: '#2563eb' }}>{contactEmail}</a>.
        </p>
      </div>
    </div>
  );
}
