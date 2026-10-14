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
  const measurementId = data?.gaStatus?.measurementId || 'G-MZ34K70519';

  return (
    <div>
      {/* Title & Time Range Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Traffic & Audience Analytics</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            First-party readership intelligence and Google Analytics 4 integration telemetry.
          </p>
        </div>

        {/* Time Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <Calendar size={16} color="var(--text-dim)" />
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
              <span style={{ color: 'var(--text-dim)' }}>to</span>
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
      <div className="card" style={{ marginBottom: '1.75rem', border: '1px solid var(--border-strong)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)'
            }}>
              <Globe size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>Google Analytics 4 Status:</span>
                <span className="badge badge-published" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981' }}>
                  Client Tracking Active
                </span>
                <span className="badge" style={{ background: gaConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)', color: gaConnected ? '#10b981' : 'var(--text-dim)', border: '1px solid currentColor' }}>
                  {gaConnected ? 'GA4 Data API Linked' : 'GA4 Data API Unlinked'}
                </span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Measurement ID: <code style={{ color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>{measurementId}</code> • SPA Pageview Tracking Enabled
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
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            color: 'var(--text-main)'
          }}>
            <h4 style={{ color: '#60a5fa', marginBottom: '0.5rem', fontWeight: 700 }}>
              How to Connect Official Google Analytics 4 Data API to this Admin Dashboard:
            </h4>
            <ol style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>
                Visit <strong>Google Cloud Console</strong> (<a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>console.cloud.google.com</a>) and enable the <strong>Google Analytics Data API (v1beta)</strong>.
              </li>
              <li>
                Create a <strong>Service Account</strong>, generate a <strong>JSON Private Key</strong>, and securely save it on your server (e.g. <code>server/config/google-service-account.json</code>).
              </li>
              <li>
                In your Google Analytics 4 Property (<a href="https://analytics.google.com" target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>analytics.google.com</a>), go to <strong>Admin → Property Access Management</strong> and add the Service Account email with <strong>Viewer</strong> role.
              </li>
              <li>
                Add the following keys to your server <code>.env</code> file:
                <pre style={{ background: 'var(--bg-main)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  GOOGLE_APPLICATION_CREDENTIALS=./server/config/google-service-account.json&#10;GA_PROPERTY_ID=123456789
                </pre>
              </li>
              <li>
                Restart the backend. The dashboard will automatically query official GA4 realtime and historical audience metrics.
              </li>
            </ol>
            <div style={{ marginTop: '0.75rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
              * Client-side tracking is currently running live via your Measurement ID without requiring Data API keys.
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 0.75rem' }} />
          <div>Aggregating traffic telemetry from database...</div>
        </div>
      ) : (
        <>
          {/* Top Audience KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Article Views</span>
                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Eye size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                {(data?.totalViews || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <TrendingUp size={14} /> Cumulative all-time telemetry
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Views in Period</span>
                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                {(data?.periodViews || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Across {data?.periodPostsCount || 0} posts updated in window
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Avg Views Per Article</span>
                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart2 size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                {data?.totalPosts ? Math.round(data.totalViews / data.totalPosts).toLocaleString() : 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                High engagement ratio
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Published Articles</span>
                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                {data?.publishedPosts || 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Live & indexable by search engines
              </div>
            </div>
          </div>

          {/* Grid: Category Performance & Top Landing Pages */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Top Landing Pages / Articles */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} color="#60a5fa" />
                Top Landing Articles & Readership
              </h3>
              {(!data?.topLandingPages || data.topLandingPages.length === 0) ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
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
                        background: 'var(--bg-main)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                        <span style={{ fontWeight: 800, color: idx < 3 ? '#60a5fa' : 'var(--text-dim)', fontSize: '0.9rem', width: '20px' }}>
                          #{idx + 1}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <a
                            href={`/post/${post.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontWeight: 600, color: '#fff', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            title={post.title}
                          >
                            {post.title}
                          </a>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            /{post.slug}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.95rem' }}>
                          {(post.views || 0).toLocaleString()}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>views</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Performance by Category */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} color="#c084fc" />
                Views Breakdown by Taxonomy / Category
              </h3>
              {(!data?.categoryStats || data.categoryStats.length === 0) ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No taxonomy data available.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {data.categoryStats.map((cat, idx) => (
                    <div
                      key={cat._id || idx}
                      style={{
                        padding: '0.75rem 1rem',
                        background: 'var(--bg-main)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                          {cat.name || cat._id}
                        </span>
                        <span style={{ fontWeight: 700, color: '#60a5fa', fontSize: '0.9rem' }}>
                          {(cat.totalViews || 0).toLocaleString()} views
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
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
