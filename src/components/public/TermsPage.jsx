import React from 'react';
import { Scale, FileText, ShieldAlert, AlertTriangle, CheckCircle2, ExternalLink, Mail, Info } from 'lucide-react';

export default function TermsPage({ settings, onNavigate }) {
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
        <span style={{ color: '#0f172a', fontWeight: 600 }}>Terms of Service</span>
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
          <Scale size={14} />
          Legal Agreement & Editorial Standards
        </div>

        <h1 style={{
          fontSize: 'clamp(2.1rem, 4.5vw, 3rem)',
          fontWeight: 850,
          color: '#0f172a',
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
          marginBottom: '0.75rem'
        }}>
          Terms of Service
        </h1>

        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
          Last Updated: <strong>{lastUpdated}</strong> • Binding agreement for all visitors to <strong>{siteUrl}</strong>
        </p>
      </div>

      {/* Important Disclaimer Notice */}
      <div style={{
        padding: '1.25rem 1.5rem',
        backgroundColor: '#fffbeb',
        borderRadius: '12px',
        border: '1px solid #fef3c7',
        marginBottom: '2.5rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'flex-start'
      }}>
        <div style={{ color: '#d97706', marginTop: '0.15rem' }}>
          <AlertTriangle size={20} />
        </div>
        <div style={{ fontSize: '0.925rem', color: '#92400e', lineHeight: 1.65 }}>
          <strong>Clear Nature of This Website:</strong> <strong>{siteName}</strong> is an independent digital news, technology analysis, and informational blog. We do not provide licensed financial, investment, legal, or medical advice. We do not claim any government sponsorship, corporate endorsement, or fake partnerships. All content is published purely for informational and journalistic purposes.
        </div>
      </div>

      {/* Main Legal Content */}
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
            1. Acceptance of Terms
          </h2>
          <p>
            These Terms of Service ("Terms," "Agreement") govern your access to and use of <strong>{siteName}</strong>, accessible at <strong>{siteUrl}</strong>, including any subdomains, mobile views, RSS feeds, and associated web services (collectively, "the Website").
          </p>
          <p>
            By accessing, reading, browsing, or utilizing any portion of this website, you confirm that you are at least 18 years of age (or have reached the age of majority in your jurisdiction), that you possess the legal capacity to enter into binding agreements, and that you accept and agree to be bound by these Terms and our accompanying <button type="button" onClick={() => onNavigate('/privacy-policy')} style={{ background: 'none', border: 'none', color: '#2563eb', padding: 0, cursor: 'pointer', textDecoration: 'underline', font: 'inherit' }}>Privacy Policy</button>.
          </p>
          <p>
            If you do not agree with all of these terms and conditions, you must immediately discontinue using our website.
          </p>
        </section>

        {/* Section 2 */}
        <section>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
            2. Truthful Identification & Independent Editorial Status
          </h2>
          <p>
            To maintain absolute clarity and prevent any misleading impressions regarding our organization:
          </p>
          <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <strong>Independent Digital Publication:</strong> {siteName} is an independently owned and operated digital media website. We are dedicated to providing technology journalism, software systems breakdown, macroeconomic insights, and modern lifestyle commentary.
            </li>
            <li>
              <strong>Zero Fake Affiliations or Corporate Ties:</strong> We do not claim any official affiliation, joint venture, corporate partnership, or sponsorship by any third-party company, trademark holder, central bank, or governmental institution mentioned in our articles.
            </li>
            <li>
              <strong>Fair-Use Editorial Discussion:</strong> Any references to trademarked company names, proprietary software, hardware architectures (such as Apple Silicon, NVIDIA GPUs, Google Gemini, OpenAI, etc.), or financial instruments are made strictly for editorial reporting, critical review, and informational illustration under fair-use doctrines.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
            3. Absolute No-Advice Disclaimers (Crucial Legal Notice)
          </h2>
          <p>
            Please read this section carefully before relying on any material found on this website:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                A. No Financial, Tax, or Investment Advice
              </h3>
              <p style={{ fontSize: '0.925rem', color: '#475569', margin: 0, lineHeight: 1.7 }}>
                The articles, commentary, and macroeconomic data published on {siteName} do not constitute financial advice, investment recommendations, securities endorsements, tax advice, or solicitation to buy or sell any asset, stock, bond, or cryptocurrency. We are not registered financial advisors (RIA), certified accountants, or broker-dealers. Any financial decision you make is solely your own responsibility. Always consult a qualified, licensed financial professional before making financial commitments.
              </p>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                B. No Medical or Health Advice
              </h3>
              <p style={{ fontSize: '0.925rem', color: '#475569', margin: 0, lineHeight: 1.7 }}>
                Articles covering biohacking, longevity, ergonomic design, or physiological telemetry are journalistic summaries of emerging research papers and personal exploration. They are never a substitute for professional medical advice, clinical diagnosis, or medical treatment. Never disregard professional medical advice because of something you read on this website.
              </p>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                C. No Engineering or Cybersecurity Guarantee
              </h3>
              <p style={{ fontSize: '0.925rem', color: '#475569', margin: 0, lineHeight: 1.7 }}>
                Articles discussing software development, server deployment, cloud security, or cryptographic methods are provided for educational and analytical purposes. You are solely responsible for testing and verifying any technical implementation in isolated staging environments before applying it to production systems.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
            4. Intellectual Property Rights & Fair Citation
          </h2>
          <p>
            All original text, written articles, visual designs, graphic layouts, user interfaces, branding assets, and custom source code contained on {siteName} are the proprietary intellectual property of the site owner or are published under appropriate license agreements.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginTop: '1.25rem', marginBottom: '0.5rem' }}>
            A. Permitted Uses
          </h3>
          <p>
            You are granted a limited, non-exclusive, non-transferable, revocable license to access and read the Website for your own personal, non-commercial informational use.
          </p>
          <p>
            <strong>Fair Quotation & Scholarly Citation:</strong> You may quote brief excerpts (up to 150 words) of our articles in research papers, blog commentaries, or social media discussions, provided that you clearly attribute <strong>{siteName}</strong> and include a direct, clickable canonical hyperlink to the specific source article on <strong>{siteUrl}</strong>.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginTop: '1.25rem', marginBottom: '0.5rem' }}>
            B. Expressly Prohibited Exploitation
          </h3>
          <p>
            Except as expressly permitted above, you agree that you will not:
          </p>
          <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Republish entire articles or substantial portions of our publications without prior written authorization.</li>
            <li>Sell, sub-license, rent, or commercially distribute any written material from this website.</li>
            <li>Use automated scripts, scrapers, data-mining spiders, or crawlers to harvest our database or mass-reproduce our archives for commercial re-syndication.</li>
            <li>Ingest or mass-scrape our original publications for unauthorized commercial training of proprietary AI or LLM models without explicit written licensing.</li>
            <li>Frame or embed our web pages within external frames in a manner designed to obscure our branding or copyright notices.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
            5. Third-Party Advertising, Google AdSense & Outbound Links
          </h2>
          <p>
            In order to sustainably support our operational hosting and independent research, <strong>{siteName}</strong> displays programmatic advertisements through third-party advertising networks, primarily <strong>Google AdSense</strong>.
          </p>
          <p>
            Regarding these advertisements and outbound links, you agree to the following terms:
          </p>
          <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <strong>No Partnership or Endorsement:</strong> The presence of an advertisement, banner, sponsored link, or product mention on {siteName} does <strong>not</strong> constitute an endorsement, official partnership, or commercial recommendation by us. Advertisements are served automatically via programmatic algorithms based on third-party networks.
            </li>
            <li>
              <strong>Zero Liability for Commercial Transactions:</strong> Any business dealings, purchases, contracts, or interactions you engage in with an advertiser or third party found on or through our website are solely between you and that third party. {siteName} bears no liability or responsibility for goods, services, representations, warranties, or damages arising from such transactions.
            </li>
            <li>
              <strong>External Links Disclaimer:</strong> Our articles frequently reference external websites, research papers, and technical repositories for journalistic completeness. We have no control over the content, uptime, or privacy standards of external websites and accept no liability for their materials.
            </li>
          </ul>
        </section>

        {/* Section 6 */}
        <section>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
            6. Acceptable User Conduct & Reader Submissions
          </h2>
          <p>
            When utilizing our website or submitting communications via our contact forms, you agree to uphold civilized and lawful conduct. Specifically, you agree not to:
          </p>
          <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Transmit unsolicited commercial spam, chain letters, pyramid schemes, or automated bot solicitations.</li>
            <li>Inject viruses, trojan horses, worms, keystroke loggers, SQL injection payloads, or other malicious software intended to damage or disrupt our server infrastructure.</li>
            <li>Harass, threaten, defame, or abuse our editorial staff or other community members.</li>
            <li>Attempt unauthorized access to our administrative dashboard, server credentials, database clusters, or hosting controls.</li>
          </ul>
          <p>
            <strong>Unsolicited Editorial Ideas:</strong> We welcome reader inquiries and tips. However, unless protected by a prior written non-disclosure agreement, any feedback, suggestions, or editorial proposals you send to us are considered non-confidential and non-proprietary.
          </p>
        </section>

        {/* Section 7 */}
        <section>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
            7. Disclaimer of Warranties ("As-Is" & "As-Available")
          </h2>
          <p>
            TO THE FULLEST EXTENT PERMISSIBLE UNDER APPLICABLE LAW, <strong>{siteName.toUpperCase()}</strong> AND ALL CONTENT, ARTICLES, DATA, CODE, AND FUNCTIONALITY ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS, STATUTORY, OR IMPLIED.
          </p>
          <p>
            WE EXPLICITLY DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
          </p>
          <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <li>IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</li>
            <li>WARRANTIES THAT THE WEBSITE WILL BE UNINTERRUPTED, TIMELY, IMMUNE TO SERVICE OUTAGES, SECURE, OR ENTIRELY FREE OF CODE ERRORS.</li>
            <li>WARRANTIES REGARDING THE HISTORICAL ACCURACY, ABSOLUTE COMPLETENESS, OR TIMELINESS OF ANY FACTUAL DATA, CHARTS, OR MARKET FIGURES.</li>
          </ul>
          <p>
            While our editorial team strives for rigorous fact-checking and technical precision, rapidly evolving technology and market volatility mean that articles may occasionally become outdated. We assume no duty to retroactively update all historical publications.
          </p>
        </section>

        {/* Section 8 */}
        <section>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
            8. Limitation of Liability
          </h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL <strong>{siteName}</strong>, ITS OWNER, EDITORS, JOURNALISTS, CONTRIBUTORS, DEVELOPERS, OR HOSTING PROVIDERS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES WHATSOEVER.
          </p>
          <p>
            THIS INCLUDES, WITHOUT LIMITATION, DAMAGES FOR LOSS OF PROFITS, LOSS OF REVENUE, LOSS OF BUSINESS OPPORTUNITIES, INVESTMENT LOSSES, LOSS OF DATA, GOODWILL, WORK STOPPAGE, OR HARDWARE MALFUNCTION, ARISING OUT OF OR IN CONNECTION WITH:
          </p>
          <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <li>YOUR USE OF OR INABILITY TO USE OUR WEBSITE;</li>
            <li>ANY RELIANCE PLACED UPON ARTICLES, BENCHMARKS, OR COMMENTARY PUBLISHED HERE;</li>
            <li>ANY STATEMENTS, CONDUCT, OR ADVERTISEMENTS OF ANY THIRD PARTY ON OUR SERVICE; OR</li>
            <li>ANY SERVER DOWNTIME, SECURITY BREACH, OR TECHNICAL FAILURE BEYOND OUR REASONABLE CONTROL.</li>
          </ul>
          <p>
            IF YOU ARE DISSATISFIED WITH ANY PORTION OF THIS WEBSITE, YOUR SOLE AND EXCLUSIVE REMEDY IS TO CEASE USING IT.
          </p>
        </section>

        {/* Section 9 */}
        <section>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
            9. Indemnification
          </h2>
          <p>
            You agree to defend, indemnify, and hold harmless <strong>{siteName}</strong> and its operators from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or legal fees arising out of or relating to your violation of these Terms of Service or your unauthorized, unlawful use of our content.
          </p>
        </section>

        {/* Section 10 */}
        <section>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
            10. Modifications to Website & Terms
          </h2>
          <p>
            We reserve the continuous right, at our sole discretion, to modify, update, replace, or sunset any portion of these Terms of Service, as well as to alter, enhance, or discontinue any feature, article, or section of {siteName} at any time without prior individual notice.
          </p>
          <p>
            Whenever amendments are posted, the "Last Updated" timestamp at the top of this document will be revised accordingly. Your continued use of the Website following the posting of revised Terms constitutes your full acceptance of those changes.
          </p>
        </section>

        {/* Section 11 */}
        <section>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
            11. Severability & Entire Agreement
          </h2>
          <p>
            If any provision of these Terms is deemed unlawful, void, or for any reason unenforceable by a court of competent jurisdiction, that specific provision shall be deemed severable and shall not affect the validity and enforceability of any remaining provisions.
          </p>
          <p>
            These Terms of Service, together with our Privacy Policy, constitute the complete and exclusive agreement between you and <strong>{siteName}</strong> regarding your use of the Website.
          </p>
        </section>

        {/* Section 12 */}
        <section>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
            12. Contact Information & Legal Inquiries
          </h2>
          <p>
            If you have questions regarding these Terms of Service, wish to report a copyright concern, or require clarification regarding our editorial guidelines, please contact us directly:
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
            <div><strong>Website URL:</strong> <a href={siteUrl} style={{ color: '#2563eb' }}>{siteUrl}</a></div>
            <div><strong>Editorial & Legal Email:</strong> <a href={`mailto:${contactEmail}`} style={{ color: '#2563eb' }}>{contactEmail}</a></div>
            <div><strong>Direct Inquiries:</strong> <button type="button" onClick={() => onNavigate('/contact')} style={{ background: 'none', border: 'none', color: '#2563eb', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}>{siteUrl}/contact</button></div>
          </div>
        </section>

      </div>
    </div>
  );
}

