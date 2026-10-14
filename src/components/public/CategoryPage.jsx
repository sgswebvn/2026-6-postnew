import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import {
  FolderTree,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  ArrowLeft
} from 'lucide-react';

export default function CategoryPage({ slug, onNavigate, onSelectPost }) {
  const [category, setCategory] = useState(null);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategoryAndPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug, page]);

  async function loadCategoryAndPosts() {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Category metadata
      let catData = null;
      try {
        const catRes = await api.getPublicCategoryBySlug(slug);
        catData = catRes.category;
      } catch (e) {
        // Fallback: look up in categories list
        const allCats = await api.getPublicCategories();
        catData = allCats.find(c => c.slug === slug || c.id === slug) || null;
      }

      if (!catData) {
        setError('Category could not be found.');
        setLoading(false);
        return;
      }

      setCategory(catData);

      // 2. Fetch posts in this category
      const targetCatId = catData.id || catData.slug;
      const postsRes = await api.getPublicPosts({
        categoryId: targetCatId,
        page,
        limit: 12
      });

      setPosts(postsRes.posts || []);
      setTotal(postsRes.total || 0);
      setTotalPages(postsRes.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to load category articles.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
        <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
        <div>Loading category dispatches...</div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', marginBottom: '0.75rem' }}>
          Category Not Found
        </h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
          The editorial taxonomy you requested does not exist or may have been reorganized.
        </p>
        <button type="button" onClick={() => onNavigate('/')} className="btn btn-primary">
          <ArrowLeft size={16} />
          <span>Return to Homepage</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <button type="button" onClick={() => onNavigate('/')} style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer' }}>
          Home
        </button>
        <span>/</span>
        <button type="button" onClick={() => onNavigate('/')} style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer' }}>
          Categories
        </button>
        <span>/</span>
        <span className="current">{category.name}</span>
      </div>

      {/* Category Hero Banner */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '2.5rem 2rem',
        marginBottom: '2.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', background: '#eff6ff', borderRadius: '9999px', color: '#2563eb', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem' }}>
          <FolderTree size={14} />
          <span>Editorial Taxonomy</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 4vw, 2.75rem)',
          fontWeight: 850,
          color: '#0f172a',
          letterSpacing: '-0.025em',
          marginBottom: '0.75rem'
        }}>
          {category.name}
        </h1>

        <p style={{ color: '#475569', fontSize: '1.1rem', maxWidth: '720px', lineHeight: 1.6, margin: 0 }}>
          {category.description || `In-depth analysis, intelligence dispatches, and reports filed under ${category.name}.`}
        </p>

        <div style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          Showing {posts.length} of {total} published article{total === 1 ? '' : 's'}
        </div>
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
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
            No Articles Filed in this Category Yet
          </h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Our editorial staff is preparing dispatches for this pillar.
          </p>
          <button type="button" onClick={() => onNavigate('/')} className="btn btn-secondary btn-sm">
            Browse All Articles
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
              {/* Cover Image */}
              <div style={{ height: '200px', backgroundColor: '#f1f5f9', overflow: 'hidden', position: 'relative' }}>
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

              {/* Card Body */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h2 style={{
                  fontSize: '1.15rem',
                  fontWeight: 750,
                  color: '#0f172a',
                  lineHeight: 1.4,
                  marginBottom: '0.75rem',
                  letterSpacing: '-0.01em'
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
