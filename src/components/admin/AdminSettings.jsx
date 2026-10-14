import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import {
  Settings,
  Save,
  Globe,
  Mail,
  DollarSign,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Search,
  Check,
  AlertCircle,
  HelpCircle,
  Layout,
  Tag
} from 'lucide-react';

export default function AdminSettings({ showToast }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'analytics' | 'adsense' | 'seo'
  const [lastSaved, setLastSaved] = useState(null);

  const [form, setForm] = useState({
    siteName: '',
    siteUrl: '',
    tagline: '',
    contactEmail: '',
    businessAddress: '',
    phone: '',
    gaTrackingId: '',
    gtmId: '',
    metaVerification: {
      google: '',
      bing: '',
      pinterest: ''
    },
    seo: {
      metaTitle: '',
      metaDescription: '',
      defaultKeywords: '',
      ogImage: ''
    },
    adsense: {
      enabled: false,
      publisherId: '',
      autoAds: true,
      headerAd: { enabled: false, slotId: '' },
      inArticleAd: { enabled: false, slotId: '' },
      sidebarAd: { enabled: false, slotId: '' },
      footerAd: { enabled: false, slotId: '' }
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const data = await api.getSettings();
      setForm({
        siteName: data.siteName || '',
        siteUrl: data.siteUrl || '',
        tagline: data.tagline || '',
        contactEmail: data.contactEmail || '',
        businessAddress: data.businessAddress || '',
        phone: data.phone || '',
        gaTrackingId: data.gaTrackingId || '',
        gtmId: data.gtmId || '',
        metaVerification: {
          google: data.metaVerification?.google || '',
          bing: data.metaVerification?.bing || '',
          pinterest: data.metaVerification?.pinterest || ''
        },
        seo: {
          metaTitle: data.seo?.metaTitle || '',
          metaDescription: data.seo?.metaDescription || '',
          defaultKeywords: data.seo?.defaultKeywords || '',
          ogImage: data.seo?.ogImage || ''
        },
        adsense: {
          enabled: data.adsense?.enabled === true,
          publisherId: data.adsense?.publisherId || '',
          autoAds: data.adsense?.autoAds !== false,
          headerAd: {
            enabled: data.adsense?.headerAd?.enabled === true,
            slotId: data.adsense?.headerAd?.slotId || ''
          },
          inArticleAd: {
            enabled: data.adsense?.inArticleAd?.enabled === true,
            slotId: data.adsense?.inArticleAd?.slotId || ''
          },
          sidebarAd: {
            enabled: data.adsense?.sidebarAd?.enabled === true,
            slotId: data.adsense?.sidebarAd?.slotId || ''
          },
          footerAd: {
            enabled: data.adsense?.footerAd?.enabled === true,
            slotId: data.adsense?.footerAd?.slotId || ''
          }
        }
      });
      if (data.updatedAt) {
        setLastSaved(new Date(data.updatedAt));
      }
    } catch (err) {
      showToast(err.message || 'Failed to load website settings.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateSettings(form);
      setLastSaved(new Date());
      showToast(res.message || 'Website settings saved to database and applied dynamically!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
        <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 0.75rem' }} />
        <div>Loading website settings from MongoDB...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px' }}>
      {/* Header with live status badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
            Website & System Configuration
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Dynamic configurations stored in database and loaded live by public readers and SEO crawlers.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="badge badge-published" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.75rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span>Active & Synced</span>
          </span>
          {lastSaved && (
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Saved {lastSaved.toLocaleTimeString('vi-VN')}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '1.5rem',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'general' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'general' ? '#2563eb' : '#64748b',
            fontWeight: activeTab === 'general' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          <Globe size={16} />
          <span>General Info</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'seo' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'seo' ? '#2563eb' : '#64748b',
            fontWeight: activeTab === 'seo' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          <Search size={16} />
          <span>SEO & Metadata</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'analytics' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'analytics' ? '#2563eb' : '#64748b',
            fontWeight: activeTab === 'analytics' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          <ShieldCheck size={16} />
          <span>Analytics & Verification</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('adsense')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'adsense' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'adsense' ? '#2563eb' : '#64748b',
            fontWeight: activeTab === 'adsense' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          <DollarSign size={16} />
          <span>Google AdSense</span>
        </button>
      </div>

      <form onSubmit={handleSave}>
        {/* TAB 1: GENERAL INFO */}
        {activeTab === 'general' && (
          <div className="content-card" style={{ padding: '1.75rem', marginBottom: '1.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={18} color="#2563eb" />
              <span>Core Brand & Organization</span>
            </h3>

            <div className="form-group">
              <label className="form-label">Website Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. THE HORIZON POST"
                value={form.siteName}
                onChange={(e) => setForm(f => ({ ...f, siteName: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Canonical URL / Site Domain</label>
              <input
                type="text"
                className="form-input"
                placeholder="https://www.example.com"
                value={form.siteUrl}
                onChange={(e) => setForm(f => ({ ...f, siteUrl: e.target.value }))}
              />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
                Used for canonical tags and sitemap URL generation.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Tagline / Slogan</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Definitive Intelligence for Modern Wealth & Technology"
                value={form.tagline}
                onChange={(e) => setForm(f => ({ ...f, tagline: e.target.value }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="contact@domain.com"
                  value={form.contactEmail}
                  onChange={(e) => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Support Phone</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Business / Office Address</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Floor 22, Financial Tower, District 1"
                value={form.businessAddress}
                onChange={(e) => setForm(f => ({ ...f, businessAddress: e.target.value }))}
              />
            </div>
          </div>
        )}

        {/* TAB 2: SEO & METADATA */}
        {activeTab === 'seo' && (
          <div className="content-card" style={{ padding: '1.75rem', marginBottom: '1.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={18} color="#2563eb" />
              <span>Default SEO & OpenGraph Sharing</span>
            </h3>

            <div className="form-group">
              <label className="form-label">Default SEO Meta Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. The Horizon Post - Finance & Technology Insights"
                value={form.seo.metaTitle}
                onChange={(e) => setForm(f => ({ ...f, seo: { ...f.seo, metaTitle: e.target.value } }))}
              />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
                Used on homepage and as fallback for pages without custom title.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Default SEO Meta Description</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: '80px' }}
                placeholder="e.g. In-depth analysis on modern semiconductors, macroeconomic trends, and technology architecture."
                value={form.seo.metaDescription}
                onChange={(e) => setForm(f => ({ ...f, seo: { ...f.seo, metaDescription: e.target.value } }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Default Keywords (comma-separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="technology, finance, semiconductors, ai, investments"
                value={form.seo.defaultKeywords}
                onChange={(e) => setForm(f => ({ ...f, seo: { ...f.seo, defaultKeywords: e.target.value } }))}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Default OpenGraph Image URL (Social share thumbnail)</label>
              <input
                type="text"
                className="form-input"
                placeholder="https://.../og-image.jpg"
                value={form.seo.ogImage}
                onChange={(e) => setForm(f => ({ ...f, seo: { ...f.seo, ogImage: e.target.value } }))}
              />
            </div>
          </div>
        )}

        {/* TAB 3: ANALYTICS & VERIFICATION */}
        {activeTab === 'analytics' && (
          <div className="content-card" style={{ padding: '1.75rem', marginBottom: '1.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="#2563eb" />
              <span>Google Analytics, Tag Manager & Webmaster Verification</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Google Analytics 4 Measurement ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="G-XXXXXXXXXX"
                  value={form.gaTrackingId}
                  onChange={(e) => setForm(f => ({ ...f, gaTrackingId: e.target.value.trim() }))}
                />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
                  Dynamically loaded by ScriptInjector. Leave blank to disable client tracking.
                </span>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Google Tag Manager Container ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="GTM-XXXXXXX"
                  value={form.gtmId}
                  onChange={(e) => setForm(f => ({ ...f, gtmId: e.target.value.trim() }))}
                />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
                  Optional container ID. Injected into document head and body noscript.
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginBottom: '1rem' }}>
                Search Engine Verification Meta Tags
              </h4>

              <div className="form-group">
                <label className="form-label">Google Search Console Verification Token</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. google-site-verification token string"
                  value={form.metaVerification.google}
                  onChange={(e) => setForm(f => ({ ...f, metaVerification: { ...f.metaVerification, google: e.target.value.trim() } }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bing Webmaster Verification Code</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. msvalidate.01 token string"
                  value={form.metaVerification.bing}
                  onChange={(e) => setForm(f => ({ ...f, metaVerification: { ...f.metaVerification, bing: e.target.value.trim() } }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Pinterest Domain Verification Code</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. p:domain_verify token string"
                  value={form.metaVerification.pinterest}
                  onChange={(e) => setForm(f => ({ ...f, metaVerification: { ...f.metaVerification, pinterest: e.target.value.trim() } }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GOOGLE ADSENSE MONETIZATION */}
        {activeTab === 'adsense' && (
          <div className="content-card" style={{ padding: '1.75rem', marginBottom: '1.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <DollarSign size={18} color="#10b981" />
                <span>Google AdSense Monetization & Placements</span>
              </h3>

              <span className={`badge ${form.adsense.enabled ? 'badge-published' : 'badge-draft'}`}>
                {form.adsense.enabled ? 'AdSense Master Enabled' : 'AdSense Master Disabled'}
              </span>
            </div>

            {/* Master Switch */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem',
              borderRadius: '8px',
              backgroundColor: form.adsense.enabled ? '#f0fdf4' : '#f8fafc',
              border: form.adsense.enabled ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
              marginBottom: '1.5rem'
            }}>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                  Master AdSense Switch
                </div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                  Toggles all Google AdSense scripts and ad slots site-wide. When disabled, zero ad scripts are loaded.
                </div>
              </div>

              <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px' }}>
                <input
                  type="checkbox"
                  style={{ opacity: 0, width: 0, height: 0 }}
                  checked={form.adsense.enabled}
                  onChange={(e) => setForm(f => ({ ...f, adsense: { ...f.adsense, enabled: e.target.checked } }))}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  inset: 0,
                  backgroundColor: form.adsense.enabled ? '#10b981' : '#cbd5e1',
                  borderRadius: '34px',
                  transition: '0.2s'
                }}>
                  <span style={{
                    position: 'absolute',
                    height: '18px',
                    width: '18px',
                    left: form.adsense.enabled ? '26px' : '4px',
                    bottom: '4px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: '0.2s'
                  }} />
                </span>
              </label>
            </div>

            {/* Publisher ID & Auto Ads */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">AdSense Publisher ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                  value={form.adsense.publisherId}
                  onChange={(e) => setForm(f => ({ ...f, adsense: { ...f.adsense, publisherId: e.target.value.trim() } }))}
                />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
                  Must start with <code>ca-pub-</code>. Saved to database and matched with public ads.txt.
                </span>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Google Auto Ads</label>
                <div style={{ display: 'flex', alignItems: 'center', height: '42px', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="autoAdsCheckbox"
                    style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }}
                    checked={form.adsense.autoAds}
                    onChange={(e) => setForm(f => ({ ...f, adsense: { ...f.adsense, autoAds: e.target.checked } }))}
                  />
                  <label htmlFor="autoAdsCheckbox" style={{ fontSize: '0.875rem', color: '#334155', cursor: 'pointer', margin: 0 }}>
                    Enable Google AI Auto Ads on eligible pages
                  </label>
                </div>
              </div>
            </div>

            {/* Individual Placement Slots */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layout size={15} />
                <span>Granular Ad Placement Controls</span>
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Header Slot */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>Header Leaderboard Banner</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Displayed at the top of article content</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '160px', height: '34px', fontSize: '0.8rem' }}
                      placeholder="Slot ID (e.g. 1234567890)"
                      value={form.adsense.headerAd?.slotId || ''}
                      onChange={(e) => setForm(f => ({ ...f, adsense: { ...f.adsense, headerAd: { ...f.adsense.headerAd, slotId: e.target.value.trim() } } }))}
                    />
                    <input
                      type="checkbox"
                      style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }}
                      checked={form.adsense.headerAd?.enabled === true}
                      onChange={(e) => setForm(f => ({ ...f, adsense: { ...f.adsense, headerAd: { ...f.adsense.headerAd, enabled: e.target.checked } } }))}
                    />
                  </div>
                </div>

                {/* In-Article Slot */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>In-Article Native Ad</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Inserted automatically between article paragraphs</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '160px', height: '34px', fontSize: '0.8rem' }}
                      placeholder="Slot ID (e.g. 2345678901)"
                      value={form.adsense.inArticleAd?.slotId || ''}
                      onChange={(e) => setForm(f => ({ ...f, adsense: { ...f.adsense, inArticleAd: { ...f.adsense.inArticleAd, slotId: e.target.value.trim() } } }))}
                    />
                    <input
                      type="checkbox"
                      style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }}
                      checked={form.adsense.inArticleAd?.enabled === true}
                      onChange={(e) => setForm(f => ({ ...f, adsense: { ...f.adsense, inArticleAd: { ...f.adsense.inArticleAd, enabled: e.target.checked } } }))}
                    />
                  </div>
                </div>

                {/* Sidebar Slot */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>Sidebar Sticky Banner</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Shown in desktop sidebar rail next to articles</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '160px', height: '34px', fontSize: '0.8rem' }}
                      placeholder="Slot ID (e.g. 3456789012)"
                      value={form.adsense.sidebarAd?.slotId || ''}
                      onChange={(e) => setForm(f => ({ ...f, adsense: { ...f.adsense, sidebarAd: { ...f.adsense.sidebarAd, slotId: e.target.value.trim() } } }))}
                    />
                    <input
                      type="checkbox"
                      style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }}
                      checked={form.adsense.sidebarAd?.enabled === true}
                      onChange={(e) => setForm(f => ({ ...f, adsense: { ...f.adsense, sidebarAd: { ...f.adsense.sidebarAd, enabled: e.target.checked } } }))}
                    />
                  </div>
                </div>

                {/* Footer Slot */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>Footer Matched Content Banner</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Appears at the bottom of the article above the footer</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '160px', height: '34px', fontSize: '0.8rem' }}
                      placeholder="Slot ID (e.g. 4567890123)"
                      value={form.adsense.footerAd?.slotId || ''}
                      onChange={(e) => setForm(f => ({ ...f, adsense: { ...f.adsense, footerAd: { ...f.adsense.footerAd, slotId: e.target.value.trim() } } }))}
                    />
                    <input
                      type="checkbox"
                      style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }}
                      checked={form.adsense.footerAd?.enabled === true}
                      onChange={(e) => setForm(f => ({ ...f, adsense: { ...f.adsense, footerAd: { ...f.adsense.footerAd, enabled: e.target.checked } } }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating / Sticky Save Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Changes are saved to MongoDB Atlas and applied live immediately.
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ padding: '0.75rem 1.75rem', minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
