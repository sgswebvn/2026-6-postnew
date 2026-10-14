import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import {
  FolderTree,
  PlusCircle,
  Edit,
  Trash2,
  Loader2,
  AlertTriangle,
  Layers,
  FileText
} from 'lucide-react';

export default function AdminCategories({ showToast }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    color: 'blue'
  });

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      showToast(err.message || 'Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingCategory(null);
    setForm({ name: '', slug: '', description: '', color: 'blue' });
    setModalOpen(true);
  }

  function openEditModal(cat) {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      color: cat.color || 'blue'
    });
    setModalOpen(true);
  }

  async function handleSaveCategory(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Category name is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id || editingCategory._id, form);
        showToast('Category updated successfully.', 'success');
      } else {
        await api.createCategory(form);
        showToast('Category created successfully.', 'success');
      }
      setModalOpen(false);
      loadCategories();
    } catch (err) {
      showToast(err.message || 'Failed to save category.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api.deleteCategory(deleteTarget.id || deleteTarget._id);
      showToast('Category deleted successfully.', 'success');
      setDeleteTarget(null);
      loadCategories();
    } catch (err) {
      showToast(err.message || 'Failed to delete category.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
            Taxonomies & Categories ({categories.length})
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Organize articles into structured content pillars stored in MongoDB
          </p>
        </div>

        <button onClick={openCreateModal} className="btn btn-primary">
          <PlusCircle size={16} />
          <span>+ Add Category</span>
        </button>
      </div>

      <div className="content-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 0.5rem' }} />
            <div>Loading categories...</div>
          </div>
        ) : categories.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
            No categories found. Click "+ Add Category" to create one.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Slug</th>
                  <th>Description</th>
                  <th>Color Tag</th>
                  <th>Articles</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id || cat._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: cat.color === 'emerald' ? '#10b981' :
                                      cat.color === 'rose' ? '#f43f5e' :
                                      cat.color === 'amber' ? '#f59e0b' :
                                      cat.color === 'indigo' ? '#6366f1' :
                                      cat.color === 'cyan' ? '#06b6d4' : '#3b82f6'
                        }} />
                        <span style={{ fontWeight: 600, color: '#fff' }}>{cat.name}</span>
                      </div>
                    </td>

                    <td>
                      <code style={{ color: '#60a5fa', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                        /{cat.slug}
                      </code>
                    </td>

                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '320px' }}>
                      {cat.description || '—'}
                    </td>

                    <td>
                      <span className="badge" style={{ textTransform: 'capitalize' }}>
                        {cat.color || 'blue'}
                      </span>
                    </td>

                    <td>
                      <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8' }}>
                        <FileText size={12} /> {cat.postCount || 0} posts
                      </span>
                    </td>

                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => openEditModal(cat)}
                        className="btn btn-secondary btn-icon"
                        title="Edit category"
                        style={{ marginRight: '0.4rem' }}
                      >
                        <Edit size={14} />
                      </button>

                      <button
                        onClick={() => setDeleteTarget(cat)}
                        className="btn btn-danger btn-icon"
                        title="Delete category"
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
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <form onSubmit={handleSaveCategory}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h3>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Category Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Artificial Intelligence"
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">URL Slug</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. artificial-intelligence"
                    value={form.slug}
                    onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: '80px' }}
                    placeholder="Brief description of this content pillar..."
                    value={form.description}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Color Theme</label>
                  <select
                    className="form-select"
                    value={form.color}
                    onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))}
                  >
                    <option value="blue">Blue (Default)</option>
                    <option value="emerald">Emerald Green</option>
                    <option value="rose">Rose Red</option>
                    <option value="amber">Amber Gold</option>
                    <option value="indigo">Indigo Violet</option>
                    <option value="cyan">Cyan Teal</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={saving}
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (editingCategory ? 'Update Category' : 'Create Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontWeight: 700 }}>
                <AlertTriangle size={20} />
                <span>Delete Category</span>
              </div>
            </div>

            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
                Are you sure you want to delete category <strong>{deleteTarget.name}</strong>?
              </p>
              {deleteTarget.postCount > 0 && (
                <div style={{ background: 'var(--danger-bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '0.85rem' }}>
                  ⚠️ This category has <strong>{deleteTarget.postCount}</strong> active articles. The system will prevent deletion until you reassign those articles.
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={saving || deleteTarget.postCount > 0}
                onClick={confirmDelete}
              >
                {saving ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
