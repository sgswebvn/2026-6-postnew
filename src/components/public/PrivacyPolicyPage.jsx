import React from 'react';
import { ShieldCheck, Lock, Eye, FileText, ExternalLink, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PrivacyPolicyPage({ settings, onNavigate }) {
  const rawSiteName = settings?.siteName || 'TheHorizon';
  const siteName = rawSiteName.replace(/\s*Post\b/gi, '').trim() || 'TheHorizon';
  const siteUrl = settings?.siteUrl || 'https://www.thehori.click';
  const contactEmail = settings?.contactEmail || 'contact@thehori.click';
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3.5rem 1.5rem 6rem' }}>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="breadcrumbs" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
        <button
          type="button"
          onClick={() => onNavigate('/')}
          style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Home
        </button>
        <span>/</span>
        <span style={{ color: '#0f172a', fontWeight: 600 }}>Privacy Policy</span>
      </nav>

      {/* Header */}
      <div style={{ marginBottom: '2.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.3rem 0.75rem',
          backgroundColor: '#eff6ff',
          color: '#2563eb',
          borderRadius: '999px',
          fontSize: '0.8rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: '1rem'
        }}>
          <ShieldCheck size={14} />
          Transparency & Data Protection
        </div>

        <h1 style={{
          fontSize: 'clamp(2.1rem, 4.5vw, 3rem)',
          fontWeight: 850,
          color: '#0f172a',
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
          marginBottom: '0.75rem'
        }}>
          Privacy Policy
        </h1>

        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
          Last Updated: <strong>{lastUpdated}</strong> • Effective across all services at <strong>{siteUrl}</strong>
        </p>
      </div>

      {/* Introductory Callout */}
      <div style={{
        padding: '1.25rem 1.5rem',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginBottom: '2.5rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'flex-start'
      }}>
        <div style={{ color: '#2563eb', marginTop: '0.15rem' }}>
          <Lock size={20} />
        </div>
        <div style={{ fontSize: '0.925rem', color: '#334155', lineHeight: 1.65 }}>
          <strong>Our Commitment to Truth and Transparency:</strong> We operate <strong>{siteName}</strong> as an independent digital blog and publishing website. We believe in plain-spoken honesty: we do not sell your personal data, we do not claim fictitious corporate partnerships, and we only collect the minimum technical data necessary to keep our website secure, functional, and fast.
        </div>
      </div>

      {/* Policy Content */}
      <div style={{
        color: '#1e293b',
        fontSize: '1.02rem',
        lineHeight: 1.85,
        display: 'flex',
        flexDirection: 'column',
        gap: '2.25rem'
      }}>

        {/* Section 1 */}
        <section>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
            1. Introduction & Operational Scope
          </h2>
          <p>
            Welcome to <strong>{siteName}</strong> ("we," "us," "our," or "the Website"), accessible online at <strong>{siteUrl}</strong>. We provide original editorial reporting, educational guides, deep-dive technology architecture analysis, and macroeconomic commentary.
          </p>
          <p>
            This Privacy Policy governs your visit to and interactions with our website. It outlines in clear, plain language what information is recorded when you browse our pages, how that information is utilized, the third-party technical services we employ, and the legal rights available to you under modern privacy frameworks, including the European Union General Data Protection Regulation (<strong>GDPR</strong>), the California Consumer Privacy Act as amended by the California Privacy Rights Act (<strong>CCPA/CPRA</strong>), and the privacy guidelines established by global advertising networks including <strong>Google AdSense</strong>.
          </p>
          <p>
            By accessing or reading content on <strong>{siteName}</strong>, you acknowledge that you have read and understood this policy. If you do not agree with our practices, your recourse is simply to discontinue using our website.
          </p>
        </section>

        {/* Section 2 */}
        <section>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
            2. Truthful Identification of Operator & Independence
          </h2>
          <p>
            To avoid any misunderstanding or misleading claims:
          </p>
          <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <strong>Independent Publisher:</strong> {siteName} is an independently owned and maintained digital editorial site. We are not an official arm, subsidiary, joint venture, or accredited partner of any government entity, stock exchange, central bank, or Fortune 500 company mentioned in our news articles.
            </li>
            <li>
              <strong>No Fictitious Corporate Relationships:</strong> We do not claim any exclusive, fabricated, or unverified affiliations. Any mentions of third-party products, algorithms, hardware components, or corporations (such as Apple, NVIDIA, Google, Microsoft, OpenAI, etc.) are strictly for objective journalistic commentary, fair-use analysis, and informational reviews.
            </li>
            <li>
              <strong>Non-Financial & Non-Advisory Nature:</strong> The articles published here reflect research and journalistic opinion. Nothing on this website constitutes registered financial advice, broker services, or legal counsel.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
            3. Information We Collect
          </h2>
          <p>
            We collect information in two limited manners: information you voluntarily choose to give us, and standard automated technical telemetry that web servers naturally log.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginTop: '1.25rem', marginBottom: '0.5rem' }}>
            A. Information You Provide Voluntarily
          </h3>
          <p>
            You are never required to create an account, purchase a subscription, or submit personal details simply to browse and read our public publications. However, you may voluntarily provide personal information when you:
          </p>
          <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <strong>Contact Us Directly:</strong> If you submit an inquiry through our Contact Form or write to our editorial desk at <a href={`mailto:${contactEmail}`} style={{ color: '#2563eb' }}>{contactEmail}</a>, we receive your name, your email address, the subject line, and the verbatim text of your message along with any attachments you choose to send.
            </li>
            <li>
              <strong>Editorial Feedback & News Tips:</strong> If you provide confidential feedback or corrections regarding an article, we record the correspondence solely to evaluate and respond to the editorial matter.
            </li>
          </ul>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginTop: '1.25rem', marginBottom: '0.5rem' }}>
            B. Information Collected Automatically (Server Logs & Telemetry)
          </h3>
          <p>
            Like virtually all websites on the Internet, {siteName} automatically logs basic diagnostic information whenever your browser requests an HTML page, stylesheet, script, or image. This automated telemetry includes:
          </p>
          <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><strong>Internet Protocol (IP) Address:</strong> Used strictly for geographic region routing, rate-limiting, and defense against automated DDoS or scraper attacks.</li>
            <li><strong>Browser & Device Metadata:</strong> Browser type, operating system (e.g., Windows, macOS, Android, iOS), version numbers, and system language preferences to ensure responsive rendering.</li>
            <li><strong>Referring URL & Exit Pages:</strong> The web address that directed you to our website, and the subsequent pages you view on our site.</li>
            <li><strong>Timestamps & Network Metrics:</strong> Date, exact time of request, bytes transferred, and HTTP response codes (e.g., 200 OK, 404 Not Found).</li>
          </ul>
          <p>
            These server log records are stored in aggregated or pseudonymized formats and are not merged with any identifying personal data to discover your real-world identity.
          </p>
        </section>

        {/* Section 4 */}
        <section>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
            4. Purpose & Legal Bases for Processing Data
          </h2>
          <p>
            We process the limited data we receive under recognized legal grounds under GDPR (Article 6) and global privacy standards:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
            <div style={{ padding: '1rem 1.25rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>Operational Continuity</div>
              <div style={{ fontSize: '0.875rem', color: '#475569' }}>To deliver web pages swiftly, maintain uptime, optimize assets, and verify server integrity.</div>
            </div>
            <div style={{ padding: '1rem 1.25rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>Security & Abuse Prevention</div>
              <div style={{ fontSize: '0.875rem', color: '#475569' }}>To detect and block malicious botnets, SQL injection probes, unauthorized scrapers, and brute-force attempts.</div>
            </div>
            <div style={{ padding: '1rem 1.25rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>Direct Reader Communications</div>
              <div style={{ fontSize: '0.875rem', color: '#475569' }}>To reply to reader questions, editorial corrections, or technical support inquiries initiated by you.</div>
            </div>
            <div style={{ padding: '1rem 1.25rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>Regulatory Compliance</div>
              <div style={{ fontSize: '0.875rem', color: '#475569' }}>To satisfy statutory accounting, tax, or legal requirements when formally mandated by applicable law.</div>
            </div>
          </div>
          <p style={{ marginTop: '1rem' }}>
            <strong>We do not sell personal data:</strong> We do not sell, rent, monetize, or trade your personal email address or personal contact information to data brokers, telemarketers, or commercial list aggregators. Period.
          </p>
        </section>

        {/* Section 5 */}
        <section>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
            5. Cookies, Web Beacons & Advertising Disclosures
          </h2>
          <p>
            Cookies are small text files placed on your device by websites you visit. They are widely used to make web applications function, store visitor preferences, and assist programmatic advertising systems.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginTop: '1.25rem', marginBottom: '0.5rem' }}>
            A. Essential & First-Party Cookies
          </h3>
          <p>
            {siteName} utilizes minimal first-party session cookies necessary to maintain site security, preserve your browsing state, or store administrative authentication tokens when our staff logs in to write articles. These cookies do not track your browsing habits across external websites.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginTop: '1.25rem', marginBottom: '0.5rem' }}>
            B. Google AdSense & DoubleClick DART Cookies
          </h3>
          <p>
            We participate as an independent publisher in the <strong>Google AdSense</strong> program to help defray hosting, server infrastructure, and editorial research expenses.
          </p>
          <p>
            In accordance with Google AdSense Publisher Policies, we disclose the following operational facts:
          </p>
          <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to our website or other websites on the Internet.
            </li>
            <li>
              Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our sites and/or other sites on the Internet.
            </li>
            <li>
              Users may opt out of personalized advertising by visiting Google's official Ads Settings at: <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>https://www.google.com/settings/ads</a>.
            </li>
            <li>
              Alternatively, users can opt out of a third-party vendor's use of cookies for personalized advertising by visiting the Digital Advertising Alliance Consumer Choice tool at: <a href="http://www.aboutads.info/choices/" target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>http://www.aboutads.info/choices/</a> or the Network Advertising Initiative at: <a href="https://optout.networkadvertising.org/" target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>https://optout.networkadvertising.org/</a>.
            </li>
            <li>
              <strong>No Endorsement:</strong> The appearance of commercial advertisements on our website does not represent a product review, personal endorsement, or commercial guarantee by {siteName}. All commercial claims made in third-party advertisements are the sole responsibility of the respective advertiser.
            </li>
          </ul>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginTop: '1.25rem', marginBottom: '0.5rem' }}>
            C. How to Manage and Disable Cookies in Your Browser
          </h3>
          <p>
            You have full control over cookies. You can instruct your web browser to delete all existing cookies, decline new cookies, or alert you before a cookie is stored. Please consult your browser's official support documentation:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noreferrer" style={{ padding: '0.35rem 0.75rem', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '0.85rem', color: '#2563eb', textDecoration: 'none' }}>Google Chrome</a>
            <a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noreferrer" style={{ padding: '0.35rem 0.75rem', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '0.85rem', color: '#2563eb', textDecoration: 'none' }}>Mozilla Firefox</a>
            <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noreferrer" style={{ padding: '0.35rem 0.75rem', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '0.85rem', color: '#2563eb', textDecoration: 'none' }}>Apple Safari</a>
            <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noreferrer" style={{ padding: '0.35rem 0.75rem', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '0.85rem', color: '#2563eb', textDecoration: 'none' }}>Microsoft Edge</a>
          </div>
        </section>

        {/* Section 6 */}
        <section>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
            6. Analytics & Performance Measurement
          </h2>
          <p>
            We may use privacy-conscious analytics services, such as Google Analytics, to measure general website audience metrics. These tools record high-level data such as which articles are most read, the average time visitors spend reading an investigative piece, and general regional distribution (country and city level).
          </p>
          <p>
            All analytical reporting is anonymized and aggregated. We do not use analytics tools to correlate your individual reading habits with personal identity records. If you prefer to block Google Analytics across the web, Google offers an official browser add-on: <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>https://tools.google.com/dlpage/gaoptout</a>.
          </p>
        </section>

        {/* Section 7 */}
        <section>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
            7. GDPR Rights for European Economic Area (EEA) and UK Users
          </h2>
          <p>
            If you reside within the European Economic Area (EEA) or the United Kingdom, you enjoy enforceable statutory rights under the General Data Protection Regulation (GDPR):
          </p>
          <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <li>
              <strong>Right of Access (Article 15):</strong> You have the right to request confirmation as to whether we process your personal data and to obtain a copy of that data.
            </li>
            <li>
              <strong>Right to Rectification (Article 16):</strong> You have the right to request that we correct any inaccurate or incomplete personal information we store about you.
            </li>
            <li>
              <strong>Right to Erasure / "Right to be Forgotten" (Article 17):</strong> You may request the deletion of your personal data where it is no longer required for the purpose for which it was collected.
            </li>
            <li>
              <strong>Right to Restrict Processing (Article 18):</strong> You have the right to restrict our processing of your personal information under certain circumstances.
            </li>
            <li>
              <strong>Right to Data Portability (Article 20):</strong> You have the right to obtain your personal information in a structured, commonly used, and machine-readable format.
            </li>
            <li>
              <strong>Right to Object (Article 21):</strong> You may object at any time to the processing of your personal data based on legitimate interests.
            </li>
            <li>
              <strong>Right to Lodge a Complaint:</strong> You have the right to file a formal complaint with your national Data Protection Authority (DPA) if you believe our data processing infringes European privacy laws.
            </li>
          </ul>
          <p>
            To exercise any of these rights, please write to our privacy desk at <a href={`mailto:${contactEmail}`} style={{ color: '#2563eb' }}>{contactEmail}</a>. We respond to all legitimate requests within 30 calendar days at no cost to you.
          </p>
        </section>

        {/* Section 8 */}
        <section>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
            8. California Consumer Privacy Rights (CCPA / CPRA Notice)
          </h2>
          <p>
            Under the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA), California residents are entitled to specific statutory disclosures:
          </p>
          <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <li>
              <strong>Categories of Personal Information Collected:</strong> In the preceding 12 months, we have collected internet activity identifiers (IP addresses, browsing telemetry) and contact details (name and email) only if voluntarily submitted via our contact form.
            </li>
            <li>
              <strong>No Sale or Sharing of Personal Data:</strong> {siteName} has not sold, rented, or shared consumers' personal information for cross-context behavioral advertising in exchange for monetary consideration in the preceding 12 months.
            </li>
            <li>
              <strong>Right to Request Deletion:</strong> You may request that we delete the personal information we collected from you, subject to narrow legal retention exceptions.
            </li>
            <li>
              <strong>Right to Non-Discrimination:</strong> We will never deny services, charge different prices, or provide an inferior browsing experience because you exercised any of your CCPA/CPRA rights.
            </li>
          </ul>
          <p>
            California residents may submit a verifiable consumer request by emailing <a href={`mailto:${contactEmail}`} style={{ color: '#2563eb' }}>{contactEmail}</a> with "CCPA Request" in the subject line.
          </p>
        </section>

        {/* Section 9 */}
        <section>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
            9. Children's Online Privacy Protection (COPPA)
          </h2>
          <p>
            Protecting the privacy of children is of paramount importance. <strong>{siteName}</strong> is designed and operated as an adult informational and technology publication. We do not knowingly target, solicit, or collect personal information from children under the age of 13 (or under 16 for residents of the European Union).
          </p>
          <p>
            If a parent or guardian believes that their child has provided personal information to our website without parental consent, please contact us immediately at <a href={`mailto:${contactEmail}`} style={{ color: '#2563eb' }}>{contactEmail}</a>. Upon notification, we will promptly investigate and securely erase such records from our databases.
          </p>
        </section>

        {/* Section 10 */}
        <section>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
            10. Data Retention, Storage & Security Safeguards
          </h2>
          <p>
            We implement robust administrative, technical, and physical security measures to protect the integrity of our systems:
          </p>
          <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <strong>Encryption in Transit:</strong> All data transmitted between your browser and our servers is secured using modern TLS/HTTPS encryption protocols.
            </li>
            <li>
              <strong>Access Controls:</strong> Access to backend server administration is strictly restricted via multi-factor authentication, strong cryptographically generated secrets, and role-based permissions.
            </li>
            <li>
              <strong>Retention Periods:</strong> Standard server access logs are routinely rotated and purged on a regular schedule (typically every 30 to 90 days). Email inquiries are maintained only as long as needed to resolve the communication, after which they are archived or deleted.
            </li>
          </ul>
          <p>
            Please note, however, that no method of transmission over the Internet or method of electronic storage is 100% invulnerable. While we employ rigorous standard precautions, we cannot guarantee absolute, impenetrable security against novel cyber threats.
          </p>
        </section>

        {/* Section 11 */}
        <section>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
            11. External Outbound Links
          </h2>
          <p>
            Throughout our articles, research papers, and technical analyses, we provide outbound hyperlinks to external websites, academic journals, open-source repositories (such as GitHub), and primary news sources for reference convenience.
          </p>
          <p>
            We do not own, operate, or supervise these third-party websites. When you click an external link, you leave <strong>{siteUrl}</strong> and become subject to the independent privacy policies and terms of those external operators. We encourage you to review their respective policies before sharing any personal data.
          </p>
        </section>

        {/* Section 12 */}
        <section>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
            12. Amendments to this Privacy Policy
          </h2>
          <p>
            We reserve the right to revise or update this Privacy Policy periodically to reflect technological developments, operational refinements, changes in relevant legal statutes, or updates to Google Publisher Policies.
          </p>
          <p>
            Whenever modifications occur, we will update the "Last Updated" date at the top of this document. Any changes become effective immediately upon posting. We encourage readers to check this page periodically to stay informed about our data protection standards.
          </p>
        </section>

        {/* Section 13 */}
        <section>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
            13. Contact Information & Data Inquiries
          </h2>
          <p>
            If you have questions, feedback, or requests regarding this Privacy Policy, your personal data, or our compliance practices, please contact our editorial and data administration team directly:
          </p>
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            marginTop: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div><strong>Publication:</strong> {siteName}</div>
            <div><strong>Official Website:</strong> <a href={siteUrl} style={{ color: '#2563eb' }}>{siteUrl}</a></div>
            <div><strong>Direct Contact Email:</strong> <a href={`mailto:${contactEmail}`} style={{ color: '#2563eb' }}>{contactEmail}</a></div>
            <div><strong>Contact Page:</strong> <button type="button" onClick={() => onNavigate('/contact')} style={{ background: 'none', border: 'none', color: '#2563eb', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}>{siteUrl}/contact</button></div>
          </div>
        </section>

      </div>
    </div>
  );
}

