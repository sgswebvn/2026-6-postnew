import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import {
  FileText,
  CheckCircle2,
  Clock,
  FolderTree,
  Eye,
  Database,
  ArrowRight,
  PlusCircle,
  ExternalLink,
  Edit,
  Loader2,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Layers,
  Sparkles,
  RefreshCw
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
  { id: 'last_quarter', label: 'Last Quarter' },
  { id: 'this_year', label: 'This Year' },
  { id: 'last_year', label: 'Last Year' },
  { id: 'custom', label: 'Custom Range' }
];

export default function AdminDashboard({ onNavigate, onEditPost, onPreviewPost }) {
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [range, setRange] = useState('30d');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadStats();
  }, [range, selectedCat, selectedStatus]);

  async function loadCategories() {
    try {
      const data = await api.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Could not load categories for dashboard filter:', e);
    }
  }

  async function loadStats() {
    setLoading(true);
    setError('');
    try {
      const params = { range };
      if (selectedCat) params.categoryId = selectedCat;
      if (selectedStatus) params.status = selectedStatus;
      if (range === 'custom') {
        if (!customStart || !customEnd) {
          setLoading(false);
          return;
        }
        params.startDate = customStart;
        params.endDate = customEnd;
      }

      const data = await api.getStats(params);
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }

  function handleCustomDateSubmit(e) {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    loadStats();
  }

  // Calculate comparison delta
  function calculatePeriodDelta() {
    if (!stats) return { percent: 0, direction: 'neutral' };
    const curr = stats.periodPostsCount || 0;
    const prev = stats.prevPeriodPostsCount || 0;
    if (prev === 0 && curr === 0) return { percent: 0, direction: 'neutral' };
    if (prev === 0) return { percent: 100, direction: 'up' };
    const diff = curr - prev;
    const pct = Math.round((diff / prev) * 100);
    return {
      percent: Math.abs(pct),
      direction: pct >= 0 ? 'up' : 'down'
    };
  }

  const delta = calculatePeriodDelta();

  return (
    <div>
      {/* Top Banner / DB Status */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Database size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>MongoDB Atlas Status:</span>
              <span className="badge badge-published">
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                Online & Synchronized
              </span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.15rem' }}>
              Connected to database: <code style={{ color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>blogweb</code> • Real data authoritative
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={loadStats} className="btn btn-secondary btn-sm" title="Refresh metrics">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => onNavigate('posts')} className="btn btn-primary btn-sm">
            <PlusCircle size={15} /> Write New Article
          </button>
        </div>
      </div>

      {/* Filter Bar with 12 Time Presets + Category + Status */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.25rem',
        marginBottom: '2rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Time Preset */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={16} color="var(--text-dim)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Period:</span>
            <select
              className="form-select"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem', width: 'auto', background: 'var(--bg-main)' }}
              value={range}
              onChange={e => setRange(e.target.value)}
            >
              {TIME_RANGES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FolderTree size={16} color="var(--text-dim)" />
            <select
              className="form-select"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem', width: 'auto', background: 'var(--bg-main)' }}
              value={selectedCat}
              onChange={e => setSelectedCat(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id || c.slug} value={c.id || c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={16} color="var(--text-dim)" />
            <select
              className="form-select"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem', width: 'auto', background: 'var(--bg-main)' }}
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="published">Published Only</option>
              <option value="draft">Drafts Only</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {range === 'custom' && (
          <form onSubmit={handleCustomDateSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              type="date"
              className="form-input"
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem', width: 'auto' }}
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              required
            />
            <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>to</span>
            <input
              type="date"
              className="form-input"
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem', width: 'auto' }}
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary btn-sm">Filter</button>
          </form>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '0.75rem', color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" size={24} />
          <span>Refreshing database metrics...</span>
        </div>
      ) : error ? (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', color: '#f87171' }}>
          <strong>Error connecting to database:</strong> {error}
          <button onClick={loadStats} className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem', display: 'block' }}>
            Retry Connection
          </button>
        </div>
      ) : (
        <>
          {/* Section A: Cumulative vs Period KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            {/* Total Articles */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Articles</span>
                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                {stats?.totalPosts || 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                {stats?.publishedPosts || 0} published • {stats?.draftPosts || 0} drafts
              </div>
            </div>

            {/* Articles in Selected Period */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Posts Created/Updated</span>
                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                {stats?.periodPostsCount || 0}
              </div>
              <div style={{ fontSize: '0.8rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: delta.direction === 'up' ? '#10b981' : delta.direction === 'down' ? '#f87171' : 'var(--text-muted)' }}>
                {delta.direction === 'up' && <TrendingUp size={14} />}
                {delta.direction === 'down' && <TrendingDown size={14} />}
                <span>{delta.percent}% vs previous period</span>
              </div>
            </div>

            {/* Cumulative Article Views */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Telemetry Views</span>
                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Eye size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                {(stats?.totalViews || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                All-time readership across posts
              </div>
            </div>

            {/* Taxonomies & Categories */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Taxonomy Categories</span>
                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FolderTree size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                {stats?.totalCategories || 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                {stats?.totalStaff || 0} active staff editors
              </div>
            </div>
          </div>

          {/* Section B: Trend Visualization Chart */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={18} color="#60a5fa" />
                  Publication & Activity Trend
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                  Daily breakdown of articles created or updated within the selected window.
                </p>
              </div>
              <span className="badge badge-published">
                {stats?.timelineData?.length || 0} active days
              </span>
            </div>

            {(!stats?.timelineData || stats.timelineData.length === 0) ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Clock size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <div style={{ fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>No publication records in this period</div>
                <p style={{ fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto' }}>
                  Try switching the time range to "Last 30 Days", "This Year", or "All Time" to view article distributions.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', paddingTop: '0.5rem' }}>
                {/* SVG Trend Bars */}
                <div style={{ minWidth: '500px', height: '180px', display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  {stats.timelineData.map((item, idx) => {
                    const maxCount = Math.max(...stats.timelineData.map(d => d.count || 1), 1);
                    const heightPercent = Math.max(Math.round((item.count / maxCount) * 100), 15);
                    return (
                      <div
                        key={item._id || idx}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          height: '100%',
                          justifyContent: 'flex-end',
                          position: 'relative'
                        }}
                        title={`${item._id}: ${item.count} articles, ${item.views} views`}
                      >
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', marginBottom: '4px' }}>
                          {item.count}
                        </div>
                        <div
                          style={{
                            width: '100%',
                            maxWidth: '36px',
                            height: `${heightPercent}%`,
                            background: 'var(--primary-gradient)',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.3s ease',
                            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                          }}
                        />
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '6px', whiteSpace: 'nowrap' }}>
                          {item._id.slice(5)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section C: Top Performing Posts & Recently Updated Posts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Top Performing Articles */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={18} color="#10b981" />
                  Top Performing Articles by Views
                </h3>
                <button onClick={() => onNavigate('posts')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                  View All <ArrowRight size={12} />
                </button>
              </div>

              {(!stats?.topPosts || stats.topPosts.length === 0) ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No published articles yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {stats.topPosts.map((post, idx) => (
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
                        <span style={{ fontWeight: 800, color: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : '#60a5fa', fontSize: '0.9rem', width: '20px' }}>
                          #{idx + 1}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={post.title}>
                            {post.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {post.categoryId} • <span style={{ color: '#10b981', fontWeight: 600 }}>{(post.views || 0).toLocaleString()} views</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                        <button
                          onClick={() => onPreviewPost(post.slug)}
                          className="btn-icon btn-secondary"
                          style={{ width: '28px', height: '28px' }}
                          title="Preview article"
                        >
                          <ExternalLink size={13} />
                        </button>
                        <button
                          onClick={() => onEditPost(post.id || post._id)}
                          className="btn-icon btn-secondary"
                          style={{ width: '28px', height: '28px' }}
                          title="Edit article"
                        >
                          <Edit size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recently Updated Articles */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={18} color="#60a5fa" />
                  Recently Updated Articles
                </h3>
                <button onClick={() => onNavigate('posts')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                  Manage All <ArrowRight size={12} />
                </button>
              </div>

              {(!stats?.recentPosts || stats.recentPosts.length === 0) ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No recent articles found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {stats.recentPosts.map((post) => (
                    <div
                      key={post.id || post._id}
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
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={post.title}>
                          {post.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          <span className={`badge ${post.status === 'published' ? 'badge-published' : 'badge-draft'}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', marginRight: '0.4rem' }}>
                            {post.status}
                          </span>
                          {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recent'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                        <button
                          onClick={() => onPreviewPost(post.slug)}
                          className="btn-icon btn-secondary"
                          style={{ width: '28px', height: '28px' }}
                          title="Preview article"
                        >
                          <ExternalLink size={13} />
                        </button>
                        <button
                          onClick={() => onEditPost(post.id || post._id)}
                          className="btn-icon btn-secondary"
                          style={{ width: '28px', height: '28px' }}
                          title="Edit article"
                        >
                          <Edit size={13} />
                        </button>
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
