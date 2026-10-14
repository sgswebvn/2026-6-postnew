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
  AlertTriangle,
  Layers,
  CheckSquare,
  Square,
  XCircle,
  ShieldAlert,
  Archive,
  RefreshCw
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Articles & Posts</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage editorial content directly stored in MongoDB Atlas ({total} total articles).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setDeleteAllConfirmation(''); setIsDeleteAllModalOpen(true); }}
            className="btn btn-secondary btn-sm"
            style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
            title="Purge all articles with automatic backup"
          >
            <ShieldAlert size={15} /> Delete All Posts...
          </button>
          <button onClick={onNewPost} className="btn btn-primary">
            <PlusCircle size={16} /> New Article
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search by title or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          {/* Category Filter */}
          <div style={{ width: '180px' }}>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="form-select"
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
          <div style={{ width: '150px' }}>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="form-select"
            >
              <option value="">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            Filter
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
              style={{ color: 'var(--text-muted)' }}
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Select All Across Pages Banner */}
      {allCurrentPageSelected && total > posts.length && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 1rem',
          marginBottom: '1rem',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          color: '#fff'
        }}>
          {selectAllMatching ? (
            <>
              <span>All <strong>{total}</strong> articles matching the current query are selected.</span>
              <button
                onClick={handleClearSelection}
                style={{ background: 'none', border: 'none', color: '#60a5fa', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600, padding: 0 }}
              >
                Clear selection
              </button>
            </>
          ) : (
            <>
              <span>All <strong>{posts.length}</strong> articles on this page are selected.</span>
              <button
                onClick={handleSelectAllMatchingResults}
                style={{ background: 'none', border: 'none', color: '#60a5fa', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600, padding: 0 }}
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
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.75rem 1.25rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: 'var(--shadow-md)',
          animation: 'slideUp 0.2s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CheckSquare size={18} color="#60a5fa" />
            <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
              {selectedCountDisplay} article{selectedCountDisplay === 1 ? '' : 's'} selected
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setBulkActionTarget('publish')}
              className="btn btn-secondary btn-sm"
              style={{ color: '#10b981' }}
            >
              <CheckCircle size={14} /> Publish Selected
            </button>
            <button
              onClick={() => setBulkActionTarget('draft')}
              className="btn btn-secondary btn-sm"
              style={{ color: '#f59e0b' }}
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
              style={{ color: 'var(--text-dim)' }}
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Posts Table */}
      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem', color: 'var(--text-muted)' }}>
            <Loader2 className="animate-spin" size={24} />
            <span>Loading articles from database...</span>
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>No articles found</h3>
            <p style={{ fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
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
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={allCurrentPageSelected}
                      ref={el => { if (el) el.indeterminate = someCurrentPageSelected; }}
                      onChange={toggleSelectAllCurrentPage}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      title="Select all on this page"
                    />
                  </th>
                  <th>Article Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>Published Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => {
                  const pId = post.id || post._id;
                  const isChecked = selectAllMatching || selectedIds.includes(pId);
                  return (
                    <tr key={pId} style={{ backgroundColor: isChecked ? 'rgba(59, 130, 246, 0.05)' : undefined }}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectPost(pId)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>
                          {post.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                          /{post.slug}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-draft" style={{ textTransform: 'capitalize' }}>
                          {post.categoryId || 'Uncategorized'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleStatus(post)}
                          className={`badge ${post.status === 'published' ? 'badge-published' : 'badge-draft'}`}
                          style={{ cursor: 'pointer', border: 'none' }}
                          title="Click to toggle status"
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: post.status === 'published' ? '#10b981' : '#f59e0b' }} />
                          {post.status}
                        </button>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {(post.views || 0).toLocaleString()}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Draft'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            onClick={() => onPreviewPost(post.slug)}
                            className="btn-icon btn-secondary"
                            title="Preview on Public Site"
                          >
                            <ExternalLink size={14} />
                          </button>
                          <button
                            onClick={() => onEditPost(pId)}
                            className="btn-icon btn-secondary"
                            title="Edit Article"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(post)}
                            className="btn-icon btn-danger"
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
            padding: '1.25rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {posts.length} of {total} articles • Page {page} of {totalPages}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn btn-secondary btn-sm"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span style={{ fontSize: '0.85rem', color: '#fff', padding: '0 0.5rem', fontWeight: 600 }}>
                {page}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn btn-secondary btn-sm"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Single Delete Confirmation */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} /> Confirm Article Deletion
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                Are you sure you want to permanently delete this article from MongoDB Atlas?
              </p>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontWeight: 600, color: '#fff' }}>
                {deleteTarget.title}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
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
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: bulkActionTarget === 'delete' ? '#f87171' : '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {bulkActionTarget === 'delete' ? <AlertTriangle size={18} /> : <CheckSquare size={18} />}
                Confirm Bulk {bulkActionTarget === 'publish' ? 'Publication' : bulkActionTarget === 'draft' ? 'Draft Move' : 'Deletion'}
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                You are about to <strong>{bulkActionTarget.toUpperCase()}</strong>{' '}
                <span style={{ color: '#60a5fa', fontWeight: 700 }}>{selectedCountDisplay}</span> article{selectedCountDisplay === 1 ? '' : 's'}.
              </p>
              {bulkActionTarget === 'delete' && (
                <div style={{ background: 'var(--danger-bg)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.85rem' }}>
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
            <div className="modal-header" style={{ borderBottomColor: 'rgba(239, 68, 68, 0.3)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={20} /> DANGER ZONE: Purge All Articles
              </h3>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: '0.875rem', lineHeight: 1.5 }}>
                <strong>CRITICAL OPERATION:</strong> You are about to delete <strong>ALL {total} articles</strong> currently stored in the MongoDB Atlas database.
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li>An automatic safety snapshot of all articles will be saved to disk before deletion.</li>
                  <li>Categories, Staff accounts, Website settings, and Analytics will <strong>NOT</strong> be deleted.</li>
                  <li>Category post counts will be cleanly reset to 0.</li>
                </ul>
              </div>

              <div>
                <label className="form-label" style={{ color: '#fff', fontWeight: 600 }}>
                  To confirm, type <span style={{ color: '#f87171', fontFamily: 'var(--font-mono)' }}>DELETE ALL POSTS</span> below:
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontFamily: 'var(--font-mono)', borderColor: deleteAllConfirmation === 'DELETE ALL POSTS' ? '#10b981' : 'var(--border-strong)' }}
                  placeholder="DELETE ALL POSTS"
                  value={deleteAllConfirmation}
                  onChange={(e) => setDeleteAllConfirmation(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer" style={{ borderTopColor: 'rgba(239, 68, 68, 0.3)' }}>
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
