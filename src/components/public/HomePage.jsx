import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  Search,
  Calendar,
  Eye,
  FileText,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Tag,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export default function HomePage({ onSelectPost, onNavigate, settings }) {
  const [posts, setPosts] = useState([]);
  const [featuredPost, setFeaturedPost] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const adsConfig = settings?.adsense;
  const isAdsAllowed = adsConfig?.enabled === true && !!adsConfig?.publisherId;

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadPosts();
  }, [page, selectedCat]);

  async function loadCategories() {
    try {
      const data = await api.getPublicCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadPosts() {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 12 };
      if (selectedCat) params.categoryId = selectedCat;
      if (search) params.search = search;

      const data = await api.getPublicPosts(params);
      const fetchedPosts = data.posts || [];
      setPosts(fetchedPosts);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);

      // On first page and without filter, set top post as featured story
      if (page === 1 && !selectedCat && !search && fetchedPosts.length > 0) {
        setFeaturedPost(fetchedPosts[0]);
      } else {
        setFeaturedPost(null);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load articles at this time.');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    loadPosts();
  }

  const gridPosts = featuredPost ? posts.slice(1) : posts;

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>
      {!loading && featuredPost && (
        <section style={{ marginBottom: '3.5rem' }}>
          <div
            onClick={() => onSelectPost(featuredPost.slug)}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              overflow: 'hidden',
              cursor: 'pointer',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.05)',
              transition: 'border-color 0.2s ease, transform 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Visual Cover */}
            <div style={{ minHeight: '340px', backgroundColor: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
              {featuredPost.coverImage ? (
                <img
                  src={featuredPost.coverImage}
                  alt={featuredPost.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  <FileText size={48} />
                </div>
              )}
              <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
                <span className="badge badge-published" style={{ background: '#2563eb', color: '#ffffff', border: 'none', fontWeight: 700 }}>
                  Lead Story
                </span>
              </div>
            </div>

            {/* Narrative Content */}
            <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
                <span className="badge" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', textTransform: 'capitalize' }}>
                  {categories.find(c => c.id === featuredPost.categoryId)?.name || 'Analysis'}
                </span>
                <span>•</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={13} />
                  <span>{new Date(featuredPost.publishedAt || featuredPost.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <span>•</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Eye size={13} />
                  <span>{(featuredPost.views || 0).toLocaleString()} views</span>
                </div>
              </div>

              <h2 style={{
                fontSize: 'clamp(1.5rem, 3vw, 2.15rem)',
                fontWeight: 850,
                color: '#0f172a',
                lineHeight: 1.25,
                letterSpacing: '-0.025em',
                marginBottom: '1rem'
              }}>
                {featuredPost.title}
              </h2>

              <p style={{
                color: '#475569',
                fontSize: '1rem',
                lineHeight: 1.65,
                marginBottom: '1.75rem',
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {featuredPost.excerpt || 'Read our complete in-depth investigation and technical analysis on this subject.'}
              </p>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#2563eb', fontWeight: 700, fontSize: '0.95rem' }}>
                <span>Read Full Dispatch</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Optional Top AdSense Leaderboard Placement */}
      {isAdsAllowed && adsConfig?.headerAd?.enabled && (
        <div className="ad-slot-container" style={{ marginBottom: '3rem' }}>
          <div className="ad-slot-label">Advertisement</div>
          <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
            Google AdSense Leaderboard Slot • ID: {adsConfig.headerAd.slotId || 'Header'}
          </div>
        </div>
      )}

      {/* Section Header: Latest Dispatches */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
            {selectedCat ? `${categories.find(c => c.id === selectedCat || c.slug === selectedCat)?.name || 'Category'} Articles` : 'Latest Articles'}
          </h2>
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <LoadingSpinner minHeight="280px" label="Loading" />
      ) : error ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          backgroundColor: '#fff5f5',
          borderRadius: '12px',
          border: '1px solid #fed7d7',
          color: '#c53030'
        }}>
          <AlertCircle size={36} style={{ margin: '0 auto 0.75rem', color: '#e53e3e' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {error}
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#742a2a', marginBottom: '1.25rem' }}>
            Please check your network connection and try again.
          </p>
          <button
            type="button"
            onClick={loadPosts}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          color: '#64748b'
        }}>
          <FileText size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            No Articles Found
          </h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            No published articles match the current filter criteria.
          </p>
          <button
            type="button"
            onClick={() => { setSelectedCat(''); setSearch(''); setPage(1); }}
            className="btn btn-secondary btn-sm"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {gridPosts.map((post) => (
            <article
              key={post.id || post._id}
              onClick={() => onSelectPost(post.slug)}
              className="card-item"
              style={{
                cursor: 'pointer',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#ffffff'
              }}
            >
              {/* Cover Image */}
              <div style={{
                height: '190px',
                backgroundColor: '#f1f5f9',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {post.coverImage ? (
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    <FileText size={32} />
                  </div>
                )}
                <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                  <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(4px)', color: '#0f172a', border: '1px solid rgba(0,0,0,0.06)', fontWeight: 600 }}>
                    {categories.find(c => c.id === post.categoryId)?.name || 'General'}
                  </span>
                </div>
              </div>

              {/* Content Body */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{
                  fontSize: '1.15rem',
                  fontWeight: 750,
                  color: '#0f172a',
                  lineHeight: 1.4,
                  marginBottom: '0.75rem',
                  letterSpacing: '-0.01em'
                }}>
                  {post.title}
                </h3>

                <p style={{
                  color: '#64748b',
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  marginBottom: '1.25rem',
                  flex: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {post.excerpt || 'Read full analysis dispatch on this subject...'}
                </p>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.85rem',
                  borderTop: '1px solid #f1f5f9',
                  color: '#94a3b8',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={13} />
                    <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Server-Side Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', color: '#475569', fontSize: '0.875rem', fontWeight: 600 }}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
