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
  Loader2
} from 'lucide-react';

export default function AdminDashboard({ onNavigate, onEditPost, onPreviewPost }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    setError('');
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '0.75rem', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={24} />
        <span>Loading database metrics from MongoDB Atlas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', color: '#f87171' }}>
        <strong>Error connecting to database:</strong> {error}
        <button onClick={loadStats} className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem', display: 'block' }}>
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Top Banner / DB Status */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        marginBottom: '2rem',
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

        <button onClick={() => onNavigate('post-form')} className="btn btn-primary">
          <PlusCircle size={16} />
          <span>Create New Article</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Total Articles</span>
            <div className="stat-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
              <FileText size={20} />
            </div>
          </div>
          <div className="stat-value">{stats?.totalPosts ?? 0}</div>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Stored in database</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Published Articles</span>
            <div className="stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#34d399' }}>{stats?.publishedPosts ?? 0}</div>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Live on public reader</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Drafts</span>
            <div className="stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <Clock size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#fbbf24' }}>{stats?.draftPosts ?? 0}</div>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Unpublished edits</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Categories</span>
            <div className="stat-icon-wrap" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
              <FolderTree size={20} />
            </div>
          </div>
          <div className="stat-value">{stats?.totalCategories ?? 0}</div>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Active taxonomies</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Reader Impressions</span>
            <div className="stat-icon-wrap" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
              <Eye size={20} />
            </div>
          </div>
          <div className="stat-value">{(stats?.totalViews || 0).toLocaleString()}</div>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Article telemetry count</div>
        </div>
      </div>

      {/* Recent Posts Card */}
      <div className="content-card">
        <div className="card-header">
          <div className="card-title">
            <FileText size={18} color="#3b82f6" />
            <span>Latest Articles in Database</span>
          </div>
          <button
            onClick={() => onNavigate('posts')}
            className="btn btn-secondary btn-sm"
          >
            <span>View All Articles</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title & Slug</th>
                <th>Category</th>
                <th>Status</th>
                <th>Views</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentPosts && stats.recentPosts.length > 0 ? (
                stats.recentPosts.map((post) => (
                  <tr key={post.id || post._id}>
                    <td style={{ maxWidth: '380px' }}>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {post.title}
                      </div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                        /{post.slug}
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#cbd5e1' }}>
                        {post.categoryId || 'General'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${post.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                        {post.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {(post.views || 0).toLocaleString()}
                    </td>
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => onEditPost(post.id || post._id)}
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: '0.5rem' }}
                        title="Edit article"
                      >
                        <Edit size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => onPreviewPost(post.slug)}
                        className="btn btn-secondary btn-sm"
                        title="Open reader preview"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-dim)' }}>
                    No articles found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
