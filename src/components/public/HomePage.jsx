import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import {
  Search,
  Calendar,
  Eye,
  FileText,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles
} from 'lucide-react';

export default function HomePage({ onSelectPost }) {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadPosts();
  }, [page, selectedCat]);

  async function loadCategories() {
    try {
      const data = await api.getPublicCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadPosts() {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (selectedCat) params.categoryId = selectedCat;
      if (search) params.search = search;

      const data = await api.getPublicPosts(params);
      setPosts(data.posts || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    loadPosts();
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Search & Category Filter Pills */}
      <div style={{ marginBottom: '2.5rem' }}>
        <form onSubmit={handleSearch} style={{ maxWidth: '600px', margin: '0 auto 1.5rem', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-input"
            style={{
              paddingLeft: '46px',
              paddingRight: '90px',
              height: '50px',
              borderRadius: '9999px',
              fontSize: '1rem',
              background: 'rgba(20, 28, 46, 0.8)',
              border: '1px solid var(--border-strong)',
              boxShadow: 'var(--shadow-md)'
            }}
            placeholder="Search all published articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{
              position: 'absolute',
              right: '6px',
              top: '6px',
              bottom: '6px',
              borderRadius: '9999px',
              padding: '0 1.25rem'
            }}
          >
            Search
          </button>
        </form>

        {/* Category Pills */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <button
            onClick={() => { setSelectedCat(''); setPage(1); }}
            className={`badge ${selectedCat === '' ? 'badge-admin' : ''}`}
            style={{
              cursor: 'pointer',
              padding: '0.45rem 1rem',
              fontSize: '0.85rem',
              borderRadius: '9999px',
              background: selectedCat === '' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              color: selectedCat === '' ? '#fff' : 'var(--text-muted)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            All Articles
          </button>

          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => { setSelectedCat(c.id); setPage(1); }}
              className={`badge`}
              style={{
                cursor: 'pointer',
                padding: '0.45rem 1rem',
                fontSize: '0.85rem',
                borderRadius: '9999px',
                background: selectedCat === c.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: selectedCat === c.id ? '#fff' : 'var(--text-muted)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
          <div>Loading articles from MongoDB Atlas...</div>
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
          No published articles found.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.75rem',
          marginBottom: '3rem'
        }}>
          {posts.map(post => (
            <article
              key={post.id || post._id}
              onClick={() => onSelectPost(post.slug)}
              className="content-card"
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                margin: 0,
                transition: 'transform 0.2s ease, border-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'var(--border-strong)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              {/* Cover Image */}
              <div style={{
                height: '190px',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.03)',
                position: 'relative'
              }}>
                {post.coverImage ? (
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                    <FileText size={32} />
                  </div>
                )}
                <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                  <span className="badge badge-published" style={{ backdropFilter: 'blur(8px)', background: 'rgba(16, 185, 129, 0.85)', color: '#fff' }}>
                    {categories.find(c => c.id === post.categoryId)?.name || 'General'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h2 style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: '#fff',
                  lineHeight: 1.4,
                  marginBottom: '0.75rem',
                  letterSpacing: '-0.01em'
                }}>
                  {post.title}
                </h2>

                <p style={{
                  color: 'var(--text-muted)',
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
                  borderTop: '1px solid var(--border-subtle)',
                  color: 'var(--text-dim)',
                  fontSize: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={13} />
                    <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString('vi-VN')}</span>
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
            className="btn btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Page {page} of {totalPages}
          </span>
          <button
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
