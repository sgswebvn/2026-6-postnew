import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import LoadingSpinner from '../common/LoadingSpinner';
import { Search, Calendar, Eye, ChevronLeft, ChevronRight, FileText, ArrowLeft } from 'lucide-react';

export default function SearchPage({ initialQuery = '', onNavigate, onSelectPost }) {
  const [query, setQuery] = useState(initialQuery);
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery, 1);
    }
  }, [initialQuery]);

  async function performSearch(term, targetPage = 1) {
    if (!term || !term.trim()) {
      setPosts([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const data = await api.getPublicPosts({
        search: term.trim(),
        page: targetPage,
        limit: 12
      });
      setPosts(data.posts || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setPage(targetPage);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      window.history.replaceState(null, '', `/search?q=${encodeURIComponent(query.trim())}`);
    } catch (e) {}
    performSearch(query, 1);
  }

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
      {/* Breadcrumb */}
      <div className="breadcrumbs">
        <button type="button" onClick={() => onNavigate('/')} style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer' }}>
          Home
        </button>
        <span>/</span>
        <span className="current">Search</span>
      </div>

      {/* Search Header Form */}
      <div style={{ maxWidth: '720px', margin: '0 auto 3rem', textAlign: 'center' }}>
        <h1 style={{
          fontSize: 'clamp(1.75rem, 3.5vw, 2.35rem)',
          fontWeight: 850,
          color: '#0f172a',
          letterSpacing: '-0.02em',
          marginBottom: '1rem'
        }}>
          Search Articles & Research
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '1.75rem' }}>
          Query full text across technical analysis, macroeconomic trends, and company profiles.
        </p>

        <form onSubmit={handleFormSubmit} style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{
                paddingLeft: '44px',
                height: '50px',
                fontSize: '1rem',
                borderRadius: '12px'
              }}
              placeholder="e.g. artificial intelligence, semiconductors, treasury yield..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0 1.5rem', borderRadius: '12px', fontSize: '0.95rem' }}>
            Search
          </button>
        </form>

        {hasSearched && !loading && (
          <div style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
            Found <strong>{total}</strong> result{total === 1 ? '' : 's'} for "{query}"
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <LoadingSpinner minHeight="260px" label="Loading" />
      ) : hasSearched && posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
          <FileText size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            No Articles Found
          </h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Try using different keywords or exploring our categories.
          </p>
          <button type="button" onClick={() => onNavigate('/')} className="btn btn-secondary btn-sm">
            Return to Homepage
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {posts.map((post) => (
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
              <div style={{ height: '190px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
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
              </div>

              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h2 style={{
                  fontSize: '1.15rem',
                  fontWeight: 750,
                  color: '#0f172a',
                  lineHeight: 1.4,
                  marginBottom: '0.75rem'
                }}>
                  {post.title}
                </h2>

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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Eye size={13} />
                    <span>{(post.views || 0).toLocaleString()} views</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page <= 1}
            onClick={() => performSearch(query, Math.max(1, page - 1))}
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
            onClick={() => performSearch(query, Math.min(totalPages, page + 1))}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
