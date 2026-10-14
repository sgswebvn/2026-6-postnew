import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import {
  BarChart2,
  TrendingUp,
  Globe,
  Eye,
  Clock,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Loader2,
  Calendar,
  Filter
} from 'lucide-react';

const TIME_RANGES = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'this_quarter', label: 'This Quarter' },
  { id: 'this_year', label: 'This Year' },
  { id: 'custom', label: 'Custom Range' }
];

export default function AdminAnalytics({ showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [range]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const params = { range };
      if (range === 'custom') {
        if (!customStart || !customEnd) {
          setLoading(false);
          return;
        }
        params.startDate = customStart;
        params.endDate = customEnd;
      }
      const res = await api.getAnalytics(params);
      setData(res);
    } catch (err) {
      showToast(err.message || 'Failed to load analytics data.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleCustomFilter(e) {
    e.preventDefault();
    if (!customStart || !customEnd) {
      showToast('Please select both start date and end date.', 'error');
      return;
    }
    loadAnalytics();
  }

  const gaConnected = !!data?.gaStatus?.connected;
  const measurementId = data?.gaStatus?.measurementId || '';

  return (
    <div>
      {/* Title & Time Range Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Traffic & Audience Analytics</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            First-party readership intelligence and Google Analytics 4 integration telemetry.
          </p>
        </div>

        {/* Time Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', padding: '0.25rem 0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <Calendar size={16} color="#64748b" />
            <select
              className="form-select"
              style={{ border: 'none', background: 'transparent', padding: '0.35rem 0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}
              value={range}
              onChange={e => setRange(e.target.value)}
            >
              {TIME_RANGES.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>

          {range === 'custom' && (
            <form onSubmit={handleCustomFilter} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="date"
                className="form-input"
                style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                required
              />
              <span style={{ color: '#64748b' }}>to</span>
              <input
                type="date"
                className="form-input"
                style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary btn-sm">Apply</button>
            </form>
          )}
        </div>
      </div>

      {/* GA4 Connection Status Card */}
      <div className="card" style={{ marginBottom: '1.75rem', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '8px',
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Globe size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>Google Analytics 4:</span>
                {measurementId ? (
                  <span className="badge badge-published">
                    Client Tracking Active
                  </span>
                ) : (
                  <span className="badge badge-draft">
                    Not Configured in Settings
                  </span>
                )}
                <span className="badge" style={{ background: gaConnected ? '#ecfdf5' : '#f1f5f9', color: gaConnected ? '#059669' : '#64748b', border: '1px solid #cbd5e1' }}>
                  {gaConnected ? 'GA4 Data API Linked' : 'GA4 Data API Unlinked'}
                </span>
              </div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Measurement ID: <code style={{ color: '#2563eb', fontFamily: 'var(--font-mono)' }}>{measurementId || 'None'}</code> • First-party views recorded in MongoDB
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowSetupGuide(!showSetupGuide)}
            className="btn btn-secondary btn-sm"
          >
            <HelpCircle size={15} />
            <span>{showSetupGuide ? 'Hide Setup Guide' : 'GA4 Data API Setup Guide'}</span>
          </button>
        </div>

        {/* Collapsible Setup Instructions */}
        {showSetupGuide && (
          <div style={{
            marginTop: '1.25rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid #e2e8f0',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            color: '#334155'
          }}>
            <h4 style={{ color: '#2563eb', marginBottom: '0.5rem', fontWeight: 700 }}>
              How to Connect Official Google Analytics 4 Data API to this Admin Dashboard:
            </h4>
            <ol style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>
                Visit <strong>Google Cloud Console</strong> (<a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>console.cloud.google.com</a>) and enable the <strong>Google Analytics Data API (v1beta)</strong>.
              </li>
              <li>
                Create a <strong>Service Account</strong>, generate a <strong>JSON Private Key</strong>, and securely save it on your server (e.g. <code>server/config/google-service-account.json</code>).
              </li>
              <li>
                In your Google Analytics 4 Property (<a href="https://analytics.google.com" target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>analytics.google.com</a>), go to <strong>Admin → Property Access Management</strong> and add the Service Account email with <strong>Viewer</strong> role.
              </li>
              <li>
                Add the following keys to your server <code>.env</code> file:
                <pre style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  GOOGLE_APPLICATION_CREDENTIALS=./server/config/google-service-account.json&#10;GA_PROPERTY_ID=123456789
                </pre>
              </li>
              <li>
                Restart the backend. The dashboard will automatically query official GA4 realtime and historical audience metrics.
              </li>
            </ol>
            <div style={{ marginTop: '0.75rem', color: '#64748b', fontSize: '0.8rem' }}>
              * Client-side tracking runs live via your Measurement ID without requiring Data API keys.
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
          <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 0.75rem' }} />
          <div>Aggregating real traffic telemetry from database...</div>
        </div>
      ) : (
        <>
          {/* Top Audience KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total Article Views</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Eye size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                {(data?.totalViews || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <TrendingUp size={14} /> Authoritative database telemetry
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Views in Period</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                {(data?.periodViews || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem' }}>
                Across {data?.periodPostsCount || 0} posts updated in window
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Avg Views Per Article</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart2 size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                {data?.totalPosts ? Math.round(data.totalViews / data.totalPosts).toLocaleString() : 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem' }}>
                Real engagement ratio
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Published Articles</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                {data?.publishedPosts || 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem' }}>
                Live & indexable by search engines
              </div>
            </div>
          </div>

          {/* Grid: Category Performance & Top Landing Pages */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Top Landing Pages / Articles */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} color="#2563eb" />
                Top Landing Articles & Readership
              </h3>
              {(!data?.topLandingPages || data.topLandingPages.length === 0) ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  No article view telemetry recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {data.topLandingPages.map((post, idx) => (
                    <div
                      key={post.id || post._id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                        <span style={{ fontWeight: 800, color: idx < 3 ? '#2563eb' : '#94a3b8', fontSize: '0.9rem', width: '20px' }}>
                          #{idx + 1}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <a
                            href={`/post/${post.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontWeight: 600, color: '#0f172a', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            title={post.title}
                          >
                            {post.title}
                          </a>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                            /{post.slug}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontWeight: 700, color: '#059669', fontSize: '0.95rem' }}>
                          {(post.views || 0).toLocaleString()}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>views</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Performance by Category */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} color="#7c3aed" />
                Views Breakdown by Taxonomy / Category
              </h3>
              {(!data?.categoryStats || data.categoryStats.length === 0) ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  No taxonomy data available.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {data.categoryStats.map((cat, idx) => (
                    <div
                      key={cat._id || idx}
                      style={{
                        padding: '0.75rem 1rem',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>
                          {cat.name || cat._id}
                        </span>
                        <span style={{ fontWeight: 700, color: '#2563eb', fontSize: '0.9rem' }}>
                          {(cat.totalViews || 0).toLocaleString()} views
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                        <span>{cat.count} articles</span>
                        <span>Avg {Math.round(cat.avgViews || 0)} views/post</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
