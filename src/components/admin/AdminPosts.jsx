import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import {
  FileText,
  Search,
  Filter,
  PlusCircle,
  Edit,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

export default function AdminPosts({ onNewPost, onEditPost, onPreviewPost, showToast }) {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadPosts();
  }, [page, statusFilter, categoryFilter]);

  async function loadCategories() {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }

  async function loadPosts() {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.categoryId = categoryFilter;

      const data = await api.getPosts(params);
      setPosts(data.posts || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      showToast(err.message || 'Failed to fetch articles.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    loadPosts();
  }

  async function handleToggleStatus(post) {
    try {
      const res = await api.togglePostStatus(post.id || post._id);
      showToast(res.message || 'Status updated', 'success');
      setPosts(posts.map(p => (p.id === post.id ? { ...p, status: res.post.status } : p)));
    } catch (err) {
      showToast(err.message || 'Failed to toggle status', 'error');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deletePost(deleteTarget.id || deleteTarget._id);
      showToast('Article deleted successfully from database.', 'success');
      setDeleteTarget(null);
      loadPosts();
    } catch (err) {
      showToast(err.message || 'Failed to delete post.', 'error');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
            All Articles ({total})
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Manage, edit, publish and review articles directly stored in MongoDB
          </p>
        </div>

        <button onClick={onNewPost} className="btn btn-primary">
          <PlusCircle size={16} />
          <span>+ Create New Article</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="content-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '34px' }}
              placeholder="Search title or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Search Button */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-secondary" style={{ flex: 1 }}>
              <Filter size={15} />
              <span>Apply Filters</span>
            </button>
            {(search || statusFilter || categoryFilter) && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); setPage(1); }}
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Posts Table */}
      <div className="content-card">
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 0.75rem' }} />
            <div>Loading articles from MongoDB...</div>
          </div>
        ) : posts.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--text-dim)' }}>
              <FileText size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>No articles match your criteria</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Try clearing filters or create a new article</p>
            <button onClick={onNewPost} className="btn btn-primary btn-sm">
              <PlusCircle size={15} />
              <span>Create New Article</span>
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Cover</th>
                  <th>Title & Slug</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id || post._id}>
                    <td>
                      <div style={{
                        width: '44px',
                        height: '36px',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {post.coverImage ? (
                          <img
                            src={post.coverImage}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <FileText size={16} color="var(--text-dim)" />
                        )}
                      </div>
                    </td>

                    <td style={{ maxWidth: '340px' }}>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {post.title}
                      </div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                        /{post.slug}
                      </div>
                    </td>

                    <td>
                      <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8' }}>
                        {categories.find(c => c.id === post.categoryId)?.name || post.categoryId || 'General'}
                      </span>
                    </td>

                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      {post.authorName || 'Staff'}
                    </td>

                    <td>
                      <button
                        onClick={() => handleToggleStatus(post)}
                        className={`badge ${post.status === 'published' ? 'badge-published' : 'badge-draft'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="Click to toggle status"
                      >
                        {post.status === 'published' ? (
                          <><CheckCircle size={12} /> Published</>
                        ) : (
                          <><Clock size={12} /> Draft</>
                        )}
                      </button>
                    </td>

                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {(post.views || 0).toLocaleString()}
                    </td>

                    <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString('vi-VN')}
                    </td>

                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => onEditPost(post.id || post._id)}
                        className="btn btn-secondary btn-icon"
                        title="Edit article"
                        style={{ marginRight: '0.4rem' }}
                      >
                        <Edit size={14} />
                      </button>

                      <button
                        onClick={() => onPreviewPost(post.slug)}
                        className="btn btn-secondary btn-icon"
                        title="Open reader preview"
                        style={{ marginRight: '0.4rem' }}
                      >
                        <ExternalLink size={14} />
                      </button>

                      <button
                        onClick={() => setDeleteTarget(post)}
                        className="btn btn-danger btn-icon"
                        title="Delete article"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Showing Page {page} of {totalPages} ({total} articles)
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>

              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#f87171', fontWeight: 700, fontSize: '1.05rem' }}>
                <AlertTriangle size={20} />
                <span>Confirm Permanent Deletion</span>
              </div>
            </div>

            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                Are you sure you want to permanently delete this article from MongoDB Atlas?
              </p>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', marginBottom: '0.25rem' }}>
                  {deleteTarget.title}
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                  Slug: {deleteTarget.slug}
                </div>
              </div>
              <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.75rem' }}>
                ⚠️ This action is irreversible.
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                disabled={isDeleting}
                onClick={confirmDelete}
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
