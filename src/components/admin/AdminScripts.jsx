import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  Code2,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  Power,
  Globe,
  FileCode,
  Info
} from 'lucide-react';

export default function AdminScripts({ showToast }) {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScript, setEditingScript] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('header');
  const [scope, setScope] = useState('all');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    loadScripts();
  }, []);

  async function loadScripts() {
    setLoading(true);
    try {
      const data = await api.getScripts();
      setScripts(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(err.message || 'Failed to load scripts.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingScript(null);
    setName('');
    setDescription('');
    setCode('');
    setLocation('header');
    setScope('all');
    setEnabled(true);
    setIsModalOpen(true);
  }

  function handleOpenEdit(script) {
    setEditingScript(script);
    setName(script.name || '');
    setDescription(script.description || '');
    setCode(script.code || '');
    setLocation(script.location || 'header');
    setScope(script.scope || 'all');
    setEnabled(script.enabled !== false);
    setIsModalOpen(true);
  }

  async function handleSaveScript(e) {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Script name is required.', 'error');
      return;
    }
    if (!code.trim()) {
      showToast('Script code content is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        code: code.trim(),
        location,
        scope,
        enabled
      };

      if (editingScript) {
        await api.updateScript(editingScript.id || editingScript._id, payload);
        showToast('Script updated successfully.', 'success');
      } else {
        await api.createScript(payload);
        showToast('Script added successfully.', 'success');
      }
      setIsModalOpen(false);
      loadScripts();
    } catch (err) {
      showToast(err.message || 'Failed to save script.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(script) {
    const targetId = script.id || script._id;
    try {
      const res = await api.toggleScript(targetId);
      showToast(res.message || 'Script status updated.', 'success');
      setScripts(prev => prev.map(s => (s.id === targetId || s._id === targetId) ? { ...s, enabled: res.script.enabled } : s));
    } catch (err) {
      showToast(err.message || 'Failed to toggle script.', 'error');
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    const targetId = deleteTarget.id || deleteTarget._id;
    try {
      await api.deleteScript(targetId);
      showToast('Script removed successfully.', 'success');
      setDeleteTarget(null);
      loadScripts();
    } catch (err) {
      showToast(err.message || 'Failed to delete script.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Header & Footer Scripts</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Inject custom verification tags, analytics snippets, and tracking pixels safely into public pages.
          </p>
        </div>
        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={16} /> Add New Script
        </button>
      </div>

      {/* Security Callout Banner */}
      <div style={{
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        marginBottom: '1.75rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem'
      }}>
        <ShieldAlert size={22} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
          <strong style={{ color: '#f59e0b', display: 'block', marginBottom: '0.25rem' }}>
            Administrative Security Policy & Code Execution Warning
          </strong>
          Scripts inserted here execute directly in visitor browsers according to the configured scope. Only administrators have authorization to manage scripts. Scripts are never rendered inside the administration panel. Toggle scripts off immediately if experiencing conflicts.
        </div>
      </div>

      {/* Script List Table */}
      <div className="card">
        {loading ? (
          <LoadingSpinner minHeight="240px" label="Loading" />
        ) : scripts.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileCode size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <div style={{ fontWeight: 600, color: '#fff', fontSize: '1.1rem', marginBottom: '0.5rem' }}>No custom scripts installed</div>
            <p style={{ maxWidth: '420px', margin: '0 auto 1.5rem', fontSize: '0.875rem' }}>
              Add Google Tag Manager, Search Console verification, or custom marketing pixels to inject into Header or Footer.
            </p>
            <button onClick={handleOpenCreate} className="btn btn-primary btn-sm">
              <Plus size={16} /> Add First Script
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '45px' }}>Status</th>
                  <th>Script Name & Description</th>
                  <th>Location</th>
                  <th>Scope</th>
                  <th>Updated</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {scripts.map((script) => {
                  const sId = script.id || script._id;
                  const isEnabled = script.enabled !== false;
                  return (
                    <tr key={sId} style={{ opacity: isEnabled ? 1 : 0.65 }}>
                      <td>
                        <button
                          onClick={() => handleToggle(script)}
                          title={isEnabled ? 'Click to disable' : 'Click to enable'}
                          style={{
                            background: isEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                            border: `1px solid ${isEnabled ? '#10b981' : 'var(--border-strong)'}`,
                            color: isEnabled ? '#10b981' : 'var(--text-dim)',
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'var(--transition-fast)'
                          }}
                        >
                          <Power size={16} />
                        </button>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Code2 size={16} color="#60a5fa" />
                          <span>{script.name}</span>
                        </div>
                        {script.description && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            {script.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge" style={{
                          background: script.location === 'header' ? 'rgba(59, 130, 246, 0.15)' : script.location === 'footer' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: script.location === 'header' ? '#60a5fa' : script.location === 'footer' ? '#c084fc' : '#34d399',
                          border: '1px solid currentColor'
                        }}>
                          {script.location === 'header' ? '<head>' : script.location === 'footer' ? 'Before </body>' : 'Top of <body>'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-draft">
                          {script.scope === 'all' ? 'All Pages' : script.scope === 'home_only' ? 'Home Only' : 'Posts Only'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {script.updatedAt ? new Date(script.updatedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleOpenEdit(script)}
                            className="btn btn-secondary btn-sm"
                            title="Edit script"
                          >
                            <Edit size={14} /> Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget(script)}
                            className="btn btn-danger btn-sm"
                            title="Delete script"
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
      </div>

      {/* Script Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSaveScript}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Code2 size={18} color="#60a5fa" />
                  {editingScript ? 'Edit Header/Footer Script' : 'Add New Custom Script'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div>
                  <label className="form-label">Script Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g., Google Tag Manager, Meta Pixel, Bing Webmaster"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Description (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Brief note about the purpose of this script"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Injection Location *</label>
                    <select
                      className="form-select"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                    >
                      <option value="header">Header (&lt;head&gt;)</option>
                      <option value="body_start">Top of Body (after &lt;body&gt;)</option>
                      <option value="footer">Footer (before &lt;/body&gt;)</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Scope / Targeted Pages *</label>
                    <select
                      className="form-select"
                      value={scope}
                      onChange={e => setScope(e.target.value)}
                    >
                      <option value="all">Entire Website (All Pages)</option>
                      <option value="home_only">Homepage Only</option>
                      <option value="posts_only">Article Detail Pages Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Code / Snippet (HTML &lt;script&gt; or &lt;meta&gt;) *</label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Must include valid tags</span>
                  </div>
                  <textarea
                    className="form-textarea"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                      minHeight: '180px',
                      lineHeight: '1.4'
                    }}
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder={`<script>\n  // Tracking code snippet here\n</script>\n<!-- or <meta name="..." content="..."> -->`}
                    required
                  />
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <input
                    type="checkbox"
                    id="enableScriptCheckbox"
                    checked={enabled}
                    onChange={e => setEnabled(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="enableScriptCheckbox" style={{ cursor: 'pointer', fontSize: '0.9rem', color: '#fff', userSelect: 'none' }}>
                    Enable this script immediately on public pages
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                  <span>{editingScript ? 'Save Changes' : 'Install Script'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-dialog" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} /> Confirm Script Deletion
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                Are you sure you want to permanently delete the script:
              </p>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontWeight: 600, color: '#fff' }}>
                {deleteTarget.name}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                This script will immediately cease execution on all public pages.
              </p>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setDeleteTarget(null)}
                className="btn btn-secondary"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="btn btn-danger"
                disabled={deleting}
              >
                {deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                <span>Delete Script</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
