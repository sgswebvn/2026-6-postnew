import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../api/client';
import LoadingSpinner from '../common/LoadingSpinner';
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
  AlertTriangle,
  Layers,
  CheckSquare,
  Square,
  XCircle,
  ShieldAlert,
  Archive,
  RefreshCw,
  Image as ImageIcon,
  Eye,
  Calendar,
  X,
  RotateCcw
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

  // Selection states for bulk actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAllMatching, setSelectAllMatching] = useState(false);

  // Modals
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [bulkActionTarget, setBulkActionTarget] = useState(null); // 'publish' | 'draft' | 'delete'
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [deleteAllConfirmation, setDeleteAllConfirmation] = useState('');
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Image Preview Lightbox Modal
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadPosts();
    // Clear selection on page or filter change unless selectAllMatching
    if (!selectAllMatching) {
      setSelectedIds([]);
    }
  }, [page, statusFilter, categoryFilter]);

  async function loadCategories() {
    try {
      const data = await api.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }

  // Memoized category lookup map for fast human-readable category badges
  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      if (c.id) map[c.id] = c.name;
      if (c.slug) map[c.slug] = c.name;
      if (c._id) map[String(c._id)] = c.name;
    });
    return map;
  }, [categories]);

  function getCategoryLabel(catId) {
    if (!catId) return 'Uncategorized';
    return categoryMap[catId] || catId;
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
    setSelectedIds([]);
    setSelectAllMatching(false);
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

  // --- SELECTION LOGIC ---
  const allCurrentPageSelected = posts.length > 0 && posts.every(p => selectedIds.includes(p.id || p._id));
  const someCurrentPageSelected = posts.some(p => selectedIds.includes(p.id || p._id)) && !allCurrentPageSelected;

  function toggleSelectAllCurrentPage() {
    if (selectAllMatching) {
      setSelectAllMatching(false);
      setSelectedIds([]);
      return;
    }
    if (allCurrentPageSelected) {
      const currentPageIds = posts.map(p => p.id || p._id);
      setSelectedIds(selectedIds.filter(id => !currentPageIds.includes(id)));
    } else {
      const currentPageIds = posts.map(p => p.id || p._id);
      const combined = Array.from(new Set([...selectedIds, ...currentPageIds]));
      setSelectedIds(combined);
    }
  }

  function toggleSelectPost(postId) {
    if (selectAllMatching) {
      setSelectAllMatching(false);
    }
    if (selectedIds.includes(postId)) {
      setSelectedIds(selectedIds.filter(id => id !== postId));
    } else {
      setSelectedIds([...selectedIds, postId]);
    }
  }

  function handleSelectAllMatchingResults() {
    setSelectAllMatching(true);
    const currentPageIds = posts.map(p => p.id || p._id);
    setSelectedIds(currentPageIds);
  }

  function handleClearSelection() {
    setSelectedIds([]);
    setSelectAllMatching(false);
  }

  // --- BULK ACTION LOGIC ---
  async function executeBulkAction() {
    if (!bulkActionTarget) return;
    setIsBulkProcessing(true);
    try {
      const filterQuery = {};
      if (search) filterQuery.search = search;
      if (statusFilter) filterQuery.status = statusFilter;
      if (categoryFilter) filterQuery.categoryId = categoryFilter;

      const res = await api.bulkPostAction(bulkActionTarget, selectedIds, selectAllMatching, filterQuery);
      showToast(res.message || 'Bulk operation completed successfully.', 'success');
      setBulkActionTarget(null);
      handleClearSelection();
      loadPosts();
    } catch (err) {
      showToast(err.message || 'Failed to complete bulk action.', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  }

  // --- SINGLE DELETE ---
  async function confirmDeleteSingle() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deletePost(deleteTarget.id || deleteTarget._id);
      showToast('Article deleted successfully from database.', 'success');
      setDeleteTarget(null);
      setSelectedIds(selectedIds.filter(id => id !== (deleteTarget.id || deleteTarget._id)));
      loadPosts();
    } catch (err) {
      showToast(err.message || 'Failed to delete post.', 'error');
    } finally {
      setIsDeleting(false);
    }
  }

  // --- DANGER ZONE: DELETE ALL POSTS ---
  async function handleConfirmDeleteAll() {
    if (deleteAllConfirmation !== 'DELETE ALL POSTS') {
      showToast('Confirmation phrase does not match.', 'error');
      return;
    }
    setIsDeletingAll(true);
    try {
      const res = await api.deleteAllPosts(deleteAllConfirmation);
      showToast(res.message || 'All posts purged. Safety backup preserved.', 'success');
      setIsDeleteAllModalOpen(false);
      setDeleteAllConfirmation('');
      handleClearSelection();
      setPage(1);
      loadPosts();
    } catch (err) {
      showToast(err.message || 'Purge operation failed.', 'error');
    } finally {
      setIsDeletingAll(false);
    }
  }

  const selectedCountDisplay = selectAllMatching ? total : selectedIds.length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
              Articles & Posts
            </h1>
            <span style={{
              background: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px'
            }}>
              {total} articles
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
            Manage editorial content directly stored in MongoDB Atlas.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setDeleteAllConfirmation(''); setIsDeleteAllModalOpen(true); }}
            className="btn btn-secondary btn-sm"
            style={{ color: '#dc2626', borderColor: '#fca5a5', backgroundColor: '#fff5f5' }}
            title="Purge all articles with automatic backup"
          >
            <ShieldAlert size={15} /> Delete All Posts...
          </button>
          <button onClick={onNewPost} className="btn btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
            <PlusCircle size={16} /> New Article
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem', borderRadius: '12px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by title or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '38px', paddingRight: search ? '32px' : '12px', borderColor: '#cbd5e1' }}
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                  loadPosts();
                }}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 0
                }}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div style={{ width: '190px' }}>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="form-select"
              style={{ borderColor: '#cbd5e1' }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id || c.slug} value={c.id || c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ width: '160px' }}>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="form-select"
              style={{ borderColor: '#cbd5e1' }}
            >
              <option value="">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary" style={{ borderColor: '#cbd5e1' }}>
            <Filter size={15} /> Filter
          </button>

          {(search || statusFilter || categoryFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setCategoryFilter('');
                setPage(1);
                loadPosts();
              }}
              className="btn btn-secondary btn-sm"
              style={{ color: '#64748b', borderColor: '#e2e8f0' }}
            >
              <RotateCcw size={14} /> Reset
            </button>
          )}
        </form>
      </div>

      {/* Select All Across Pages Banner */}
      {allCurrentPageSelected && total > posts.length && (
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 1rem',
          marginBottom: '1rem',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          color: '#1e3a8a'
        }}>
          {selectAllMatching ? (
            <>
              <span>All <strong>{total}</strong> articles matching current query are selected.</span>
              <button
                onClick={handleClearSelection}
                style={{ background: 'none', border: 'none', color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600, padding: 0 }}
              >
                Clear selection
              </button>
            </>
          ) : (
            <>
              <span>All <strong>{posts.length}</strong> articles on this page are selected.</span>
              <button
                onClick={handleSelectAllMatchingResults}
                style={{ background: 'none', border: 'none', color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600, padding: 0 }}
              >
                Select all {total} articles matching filter
              </button>
            </>
          )}
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {(selectedIds.length > 0 || selectAllMatching) && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius-lg)',
          padding: '0.75rem 1.25rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -2px rgba(37, 99, 235, 0.05)',
          animation: 'slideUp 0.2s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CheckSquare size={18} color="#2563eb" />
            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
              {selectedCountDisplay} article{selectedCountDisplay === 1 ? '' : 's'} selected
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setBulkActionTarget('publish')}
              className="btn btn-secondary btn-sm"
              style={{ color: '#059669', borderColor: '#a7f3d0', backgroundColor: '#ecfdf5' }}
            >
              <CheckCircle size={14} /> Publish Selected
            </button>
            <button
              onClick={() => setBulkActionTarget('draft')}
              className="btn btn-secondary btn-sm"
              style={{ color: '#d97706', borderColor: '#fde68a', backgroundColor: '#fffbeb' }}
            >
              <Clock size={14} /> Draft Selected
            </button>
            <button
              onClick={() => setBulkActionTarget('delete')}
              className="btn btn-danger btn-sm"
            >
              <Trash2 size={14} /> Delete Selected
            </button>
            <button
              onClick={handleClearSelection}
              className="btn btn-secondary btn-sm"
              style={{ color: '#64748b' }}
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Posts Table Card */}
      <div className="card" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
        {loading ? (
          <LoadingSpinner minHeight="260px" label="Loading" />
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
            <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.3, color: '#94a3b8' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>No articles found</h3>
            <p style={{ fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 1.5rem', color: '#64748b' }}>
              {search || statusFilter || categoryFilter
                ? 'Try adjusting your search criteria or resetting filters.'
                : 'Get started by creating your first article.'}
            </p>
            <button onClick={onNewPost} className="btn btn-primary btn-sm">
              <PlusCircle size={16} /> Create Article
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '44px', paddingLeft: '1.25rem' }}>
                    <input
                      type="checkbox"
                      checked={allCurrentPageSelected}
                      ref={el => { if (el) el.indeterminate = someCurrentPageSelected; }}
                      onChange={toggleSelectAllCurrentPage}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#2563eb' }}
                      title="Select all on this page"
                    />
                  </th>
                  <th style={{ width: '90px' }}>Cover Image</th>
                  <th>Article Title</th>
                  <th style={{ width: '150px' }}>Category</th>
                  <th style={{ width: '120px' }}>Status</th>
                  <th style={{ width: '95px' }}>Views</th>
                  <th style={{ width: '125px' }}>Published Date</th>
                  <th style={{ textAlign: 'right', paddingRight: '1.25rem', width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => {
                  const pId = post.id || post._id;
                  const isChecked = selectAllMatching || selectedIds.includes(pId);
                  const catName = getCategoryLabel(post.categoryId);

                  return (
                    <tr
                      key={pId}
                      style={{
                        backgroundColor: isChecked ? '#f0f7ff' : undefined,
                        borderBottom: '1px solid #f1f5f9'
                      }}
                    >
                      <td style={{ paddingLeft: '1.25rem' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectPost(pId)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#2563eb' }}
                        />
                      </td>

                      {/* Cover Image Thumbnail Column */}
                      <td style={{ width: '90px' }}>
                        <div
                          onClick={() => {
                            if (post.coverImage) {
                              setPreviewImage({ url: post.coverImage, title: post.title });
                            }
                          }}
                          className="admin-post-thumb"
                          style={{
                            width: '72px',
                            height: '48px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: post.coverImage ? 'pointer' : 'default',
                            position: 'relative'
                          }}
                          title={post.coverImage ? 'Click to preview full cover image' : 'No image'}
                        >
                          {post.coverImage ? (
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              loading="lazy"
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextSibling) {
                                  e.currentTarget.nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div
                            style={{
                              display: post.coverImage ? 'none' : 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '2px',
                              width: '100%',
                              height: '100%',
                              color: '#94a3b8'
                            }}
                          >
                            <ImageIcon size={18} strokeWidth={1.5} />
                            <span style={{ fontSize: '0.62rem', fontWeight: 600 }}>No img</span>
                          </div>
                        </div>
                      </td>

                      {/* Title & Slug */}
                      <td>
                        <div
                          onClick={() => onEditPost(pId)}
                          className="admin-post-title"
                          style={{
                            fontWeight: 700,
                            color: '#0f172a',
                            fontSize: '0.94rem',
                            lineHeight: 1.4,
                            cursor: 'pointer',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                          title={post.title}
                        >
                          {post.title || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(Untitled Article)</span>}
                        </div>
                        <div style={{
                          fontSize: '0.78rem',
                          color: '#64748b',
                          marginTop: '0.25rem',
                          fontFamily: 'var(--font-mono)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}>
                          <span style={{ opacity: 0.6 }}>/</span>
                          <span style={{ maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {post.slug}
                          </span>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            maxWidth: '150px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={catName}
                        >
                          {catName}
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td>
                        <button
                          onClick={() => handleToggleStatus(post)}
                          style={{
                            cursor: 'pointer',
                            border: post.status === 'published' ? '1px solid #a7f3d0' : '1px solid #fde68a',
                            backgroundColor: post.status === 'published' ? '#ecfdf5' : '#fffbeb',
                            color: post.status === 'published' ? '#047857' : '#b45309',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.15s ease'
                          }}
                          title="Click to toggle status (Published / Draft)"
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: post.status === 'published' ? '#10b981' : '#f59e0b'
                            }}
                          />
                          {post.status === 'published' ? 'Published' : 'Draft'}
                        </button>
                      </td>

                      {/* Views */}
                      <td style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Eye size={14} style={{ color: '#94a3b8' }} />
                          {(post.views || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Published Date */}
                      <td style={{ color: '#475569', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={14} style={{ color: '#94a3b8' }} />
                          {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : 'Draft'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right', paddingRight: '1.25rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                          <button
                            onClick={() => onPreviewPost(post.slug)}
                            className="admin-action-btn admin-action-view"
                            title="Preview on Public Site"
                          >
                            <ExternalLink size={14} />
                          </button>
                          <button
                            onClick={() => onEditPost(pId)}
                            className="admin-action-btn admin-action-edit"
                            title="Edit Article"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(post)}
                            className="admin-action-btn admin-action-delete"
                            title="Delete Article"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination Footer */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.15rem 1.5rem',
            borderTop: '1px solid #f1f5f9',
            flexWrap: 'wrap',
            gap: '1rem',
            backgroundColor: '#ffffff'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Showing {posts.length} of {total} articles • Page {page} of {totalPages}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn btn-secondary btn-sm"
                style={{ borderColor: '#cbd5e1' }}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span style={{ fontSize: '0.85rem', color: '#0f172a', padding: '0 0.5rem', fontWeight: 700 }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn btn-secondary btn-sm"
                style={{ borderColor: '#cbd5e1' }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox / Image Preview Modal */}
      {previewImage && (
        <div
          className="modal-overlay"
          onClick={() => setPreviewImage(null)}
          style={{ zIndex: 60 }}
        >
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '720px', padding: 0, overflow: 'hidden', borderRadius: '16px', background: '#ffffff', border: '1px solid #cbd5e1' }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '1rem' }}>
                Cover Image: {previewImage.title}
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="admin-action-btn"
                title="Close preview"
                style={{ width: '28px', height: '28px' }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '1.25rem', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
              <img
                src={previewImage.url}
                alt={previewImage.title}
                style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '8px' }}
              />
            </div>
            <div style={{ padding: '0.85rem 1.25rem', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', wordBreak: 'break-all', maxWidth: '500px' }}>
                {previewImage.url}
              </span>
              <button
                onClick={() => setPreviewImage(null)}
                className="btn btn-secondary btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Single Delete Confirmation */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} /> Confirm Article Deletion
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ color: '#334155', marginBottom: '0.75rem' }}>
                Are you sure you want to permanently delete this article from MongoDB Atlas?
              </p>
              <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', fontWeight: 600, color: '#0f172a' }}>
                {deleteTarget.title}
              </div>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                This will also automatically decrement the corresponding category article count.
              </p>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setDeleteTarget(null)}
                className="btn btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSingle}
                className="btn btn-danger"
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bulk Action Confirmation */}
      {bulkActionTarget && (
        <div className="modal-overlay" onClick={() => setBulkActionTarget(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: bulkActionTarget === 'delete' ? '#dc2626' : '#2563eb', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {bulkActionTarget === 'delete' ? <AlertTriangle size={18} /> : <CheckSquare size={18} />}
                Confirm Bulk {bulkActionTarget === 'publish' ? 'Publication' : bulkActionTarget === 'draft' ? 'Draft Move' : 'Deletion'}
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ color: '#334155', marginBottom: '0.75rem' }}>
                You are about to <strong>{bulkActionTarget.toUpperCase()}</strong>{' '}
                <span style={{ color: '#2563eb', fontWeight: 700 }}>{selectedCountDisplay}</span> article{selectedCountDisplay === 1 ? '' : 's'}.
              </p>
              {bulkActionTarget === 'delete' && (
                <div style={{ background: '#fef2f2', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.85rem' }}>
                  ⚠️ Deleting these articles will permanently remove them from the database.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setBulkActionTarget(null)}
                className="btn btn-secondary"
                disabled={isBulkProcessing}
              >
                Cancel
              </button>
              <button
                onClick={executeBulkAction}
                className={bulkActionTarget === 'delete' ? 'btn btn-danger' : 'btn btn-primary'}
                disabled={isBulkProcessing}
              >
                {isBulkProcessing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                <span>Confirm {bulkActionTarget.toUpperCase()}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: DANGER ZONE - PURGE ALL POSTS */}
      {isDeleteAllModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDeleteAllModalOpen(false)}>
          <div className="modal-dialog" style={{ maxWidth: '540px', border: '2px solid rgba(239, 68, 68, 0.6)' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottomColor: '#fecaca', backgroundColor: '#fff5f5' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={20} /> DANGER ZONE: Purge All Articles
              </h3>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.875rem', lineHeight: 1.5 }}>
                <strong>CRITICAL OPERATION:</strong> You are about to delete <strong>ALL {total} articles</strong> currently stored in the MongoDB Atlas database.
              </div>

              <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li>An automatic safety snapshot of all articles will be saved to disk before deletion.</li>
                  <li>Categories, Staff accounts, Website settings, and Analytics will <strong>NOT</strong> be deleted.</li>
                  <li>Category post counts will be cleanly reset to 0.</li>
                </ul>
              </div>

              <div>
                <label className="form-label" style={{ color: '#0f172a', fontWeight: 600 }}>
                  To confirm, type <span style={{ color: '#dc2626', fontFamily: 'var(--font-mono)' }}>DELETE ALL POSTS</span> below:
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontFamily: 'var(--font-mono)', borderColor: deleteAllConfirmation === 'DELETE ALL POSTS' ? '#10b981' : '#cbd5e1' }}
                  placeholder="DELETE ALL POSTS"
                  value={deleteAllConfirmation}
                  onChange={(e) => setDeleteAllConfirmation(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer" style={{ borderTopColor: '#f1f5f9' }}>
              <button
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="btn btn-secondary"
                disabled={isDeletingAll}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteAll}
                className="btn btn-danger"
                disabled={deleteAllConfirmation !== 'DELETE ALL POSTS' || isDeletingAll}
              >
                {isDeletingAll ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                <span>Execute Complete Deletion</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
