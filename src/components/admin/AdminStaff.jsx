import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import {
  Users,
  PlusCircle,
  Edit,
  Trash2,
  Shield,
  Loader2,
  AlertTriangle,
  Lock,
  UserCheck
} from 'lucide-react';

export default function AdminStaff({ currentUser, showToast }) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    role: 'editor',
    status: 'active'
  });

  useEffect(() => {
    loadStaff();
  }, []);

  async function loadStaff() {
    setLoading(true);
    try {
      const data = await api.getStaff();
      setStaffList(data);
    } catch (err) {
      showToast(err.message || 'Failed to load staff list', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingStaff(null);
    setForm({
      name: '',
      username: '',
      password: '',
      email: '',
      phone: '',
      role: 'editor',
      status: 'active'
    });
    setModalOpen(true);
  }

  function openEditModal(staff) {
    setEditingStaff(staff);
    setForm({
      name: staff.name,
      username: staff.username,
      password: '',
      email: staff.email || '',
      phone: staff.phone || '',
      role: staff.role || 'editor',
      status: staff.status || 'active'
    });
    setModalOpen(true);
  }

  async function handleSaveStaff(e) {
    e.preventDefault();
    if (!form.username.trim() || !form.name.trim()) {
      showToast('Name and username are required.', 'error');
      return;
    }

    if (!editingStaff && (!form.password || form.password.trim().length < 6)) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingStaff) {
        await api.updateStaff(editingStaff.id || editingStaff._id, form);
        showToast('Staff member updated successfully.', 'success');
      } else {
        await api.createStaff(form);
        showToast('Staff member created successfully.', 'success');
      }
      setModalOpen(false);
      loadStaff();
    } catch (err) {
      showToast(err.message || 'Failed to save staff.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api.deleteStaff(deleteTarget.id || deleteTarget._id);
      showToast('Staff member removed successfully.', 'success');
      setDeleteTarget(null);
      loadStaff();
    } catch (err) {
      showToast(err.message || 'Failed to delete staff member.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
            Staff & Role Management ({staffList.length})
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Authorize team members with role-based access control (RBAC)
          </p>
        </div>

        <button onClick={openCreateModal} className="btn btn-primary">
          <PlusCircle size={16} />
          <span>+ Add Staff Member</span>
        </button>
      </div>

      <div className="content-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 0.5rem' }} />
            <div>Loading team members...</div>
          </div>
        ) : staffList.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
            No staff records found.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((s) => {
                  const isCurrent = s.id === currentUser?.id || s.username === currentUser?.username;
                  return (
                    <tr key={s.id || s._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
                            {s.name ? s.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#fff' }}>
                              {s.name} {isCurrent && <span style={{ color: '#60a5fa', fontSize: '0.75rem' }}>(You)</span>}
                            </div>
                            <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{s.phone || 'No phone'}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <code style={{ color: '#cbd5e1', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                          {s.username}
                        </code>
                      </td>

                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {s.email || '—'}
                      </td>

                      <td>
                        <span className={`badge ${s.role === 'admin' ? 'badge-admin' : 'badge-editor'}`} style={{ textTransform: 'uppercase' }}>
                          <Shield size={12} /> {s.role || 'editor'}
                        </span>
                      </td>

                      <td>
                        <span className={`badge ${s.status === 'active' ? 'badge-published' : 'badge-draft'}`}>
                          <UserCheck size={12} /> {s.status || 'active'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => openEditModal(s)}
                          className="btn btn-secondary btn-icon"
                          title="Edit staff member"
                          style={{ marginRight: '0.4rem' }}
                        >
                          <Edit size={14} />
                        </button>

                        <button
                          onClick={() => setDeleteTarget(s)}
                          className="btn btn-danger btn-icon"
                          title="Delete staff member"
                          disabled={isCurrent}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <form onSubmit={handleSaveStaff}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                  {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                </h3>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Alex Johnson"
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. alexj"
                    disabled={!!editingStaff}
                    value={form.username}
                    onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="alex@thehori.click"
                    value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    className="form-select"
                    value={form.role}
                    onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                  >
                    <option value="editor">Editor (Can manage posts & categories)</option>
                    <option value="admin">Admin (Full system access & staff control)</option>
                    <option value="author">Author (Content contributor)</option>
                    <option value="accountant">Accountant</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={form.status}
                    onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive (Disabled)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {editingStaff ? 'Reset Password (Leave blank to keep current)' : 'Password * (min 6 characters)'}
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                    required={!editingStaff}
                  />
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
                  {saving ? 'Saving...' : (editingStaff ? 'Update Staff' : 'Add Staff Member')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontWeight: 700 }}>
                <AlertTriangle size={20} />
                <span>Remove Staff Member</span>
              </div>
            </div>

            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Are you sure you want to remove <strong>{deleteTarget.name}</strong> (@{deleteTarget.username})? They will immediately lose access to the admin system.
              </p>
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
                disabled={saving}
                onClick={confirmDelete}
              >
                {saving ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
