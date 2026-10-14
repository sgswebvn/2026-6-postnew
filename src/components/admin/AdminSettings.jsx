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
  CheckCircle2
} from 'lucide-react';

export default function AdminSettings({ showToast }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    siteName: '',
    siteUrl: '',
    tagline: '',
    contactEmail: '',
    businessAddress: '',
    phone: '',
    gaTrackingId: '',
    adsense: {
      enabled: true,
      publisherId: 'ca-pub-6469608148906900'
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
        siteName: data.siteName || 'THE HORIZON POST',
        siteUrl: data.siteUrl || 'https://www.thehori.click',
        tagline: data.tagline || 'Definitive Intelligence for Modern Wealth & Technology',
        contactEmail: data.contactEmail || 'contact@thehori.click',
        businessAddress: data.businessAddress || '',
        phone: data.phone || '',
        gaTrackingId: data.gaTrackingId || 'G-MZ34K70519',
        adsense: {
          enabled: data.adsense?.enabled !== false,
          publisherId: data.adsense?.publisherId || 'ca-pub-6469608148906900'
        }
      });
    } catch (err) {
      showToast(err.message || 'Failed to load website settings.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings(form);
      showToast('Website settings saved to MongoDB Atlas successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 0.5rem' }} />
        <div>Loading website settings from MongoDB...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
          Website & System Configuration
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Global parameters and Google monetization settings stored in database
        </p>
      </div>

      <form onSubmit={handleSave}>
        {/* General Settings */}
        <div className="content-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', fontWeight: 700, marginBottom: '1.25rem' }}>
            <Globe size={18} />
            <span>General Site Metadata</span>
          </div>

          <div className="form-group">
            <label className="form-label">Website Name</label>
            <input
              type="text"
              className="form-input"
              value={form.siteName}
              onChange={(e) => setForm(f => ({ ...f, siteName: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Canonical URL Domain</label>
            <input
              type="text"
              className="form-input"
              value={form.siteUrl}
              onChange={(e) => setForm(f => ({ ...f, siteUrl: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tagline / Slogan</label>
            <input
              type="text"
              className="form-input"
              value={form.tagline}
              onChange={(e) => setForm(f => ({ ...f, tagline: e.target.value }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input
                type="email"
                className="form-input"
                value={form.contactEmail}
                onChange={(e) => setForm(f => ({ ...f, contactEmail: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Support Phone</label>
              <input
                type="text"
                className="form-input"
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Google Analytics 4 Measurement ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="G-XXXXXXXXXX"
              value={form.gaTrackingId}
              onChange={(e) => setForm(f => ({ ...f, gaTrackingId: e.target.value }))}
            />
          </div>
        </div>

        {/* Google AdSense Settings */}
        <div className="content-card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 700, marginBottom: '1.25rem' }}>
            <DollarSign size={18} />
            <span>Google AdSense Monetization</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.25rem'
          }}>
            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>Master Ads Switch</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Toggle all Google AdSense banner placements across the website
              </div>
            </div>

            <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px' }}>
              <input
                type="checkbox"
                style={{ opacity: 0, width: 0, height: 0 }}
                checked={form.adsense?.enabled}
                onChange={(e) => setForm(f => ({ ...f, adsense: { ...f.adsense, enabled: e.target.checked } }))}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                inset: 0,
                backgroundColor: form.adsense?.enabled ? '#10b981' : '#334155',
                borderRadius: '34px',
                transition: '0.2s'
              }}>
                <span style={{
                  position: 'absolute',
                  height: '18px',
                  width: '18px',
                  left: form.adsense?.enabled ? '26px' : '4px',
                  bottom: '4px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.2s'
                }} />
              </span>
            </label>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">AdSense Publisher ID</label>
            <input
              type="text"
              className="form-input"
              value={form.adsense?.publisherId}
              onChange={(e) => setForm(f => ({ ...f, adsense: { ...f.adsense, publisherId: e.target.value } }))}
            />
            <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '0.3rem', display: 'block' }}>
              Matched with <code style={{ color: '#60a5fa' }}>public/ads.txt</code> on server.
            </span>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '0.75rem 1.75rem' }}>
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          <span>Save Changes to Database</span>
        </button>
      </form>
    </div>
  );
}
