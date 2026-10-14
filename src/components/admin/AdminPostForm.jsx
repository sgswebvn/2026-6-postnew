import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../api/client';
import {
  ArrowLeft,
  Save,
  Upload,
  Image,
  Link,
  Eye,
  CheckCircle,
  Clock,
  Sparkles,
  Globe,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function AdminPostForm({ postId, onBack, onSuccess, showToast }) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categories, setCategories] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [manualSlug, setManualSlug] = useState(false);

  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    categoryId: '',
    authorName: '',
    status: 'published',
    tags: '',
    metaTitle: '',
    metaDescription: '',
    focusKeyword: '',
    enableAds: true
  });

  useEffect(() => {
    loadCategories();
    if (postId) {
      loadPost(postId);
    }
  }, [postId]);

  async function loadCategories() {
    try {
      const data = await api.getCategories();
      setCategories(data);
      if (!postId && data.length > 0 && !form.categoryId) {
        setForm(f => ({ ...f, categoryId: data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadPost(id) {
    setLoading(true);
    try {
      const data = await api.getPost(id);
      setForm({
        title: data.title || '',
        slug: data.slug || '',
        excerpt: data.excerpt || '',
        content: data.content || '',
        coverImage: data.coverImage || '',
        categoryId: data.categoryId || '',
        authorName: data.authorName || '',
        status: data.status || 'published',
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
        metaTitle: data.metaTitle || '',
        metaDescription: data.metaDescription || '',
        focusKeyword: data.focusKeyword || '',
        enableAds: data.enableAds !== false
      });
      setManualSlug(true);
    } catch (err) {
      showToast(err.message || 'Failed to load post data.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function generateSlugString(str) {
    return String(str || '')
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100);
  }

  function handleTitleChange(e) {
    const titleVal = e.target.value;
    setForm(prev => ({
      ...prev,
      title: titleVal,
      slug: manualSlug ? prev.slug : generateSlugString(titleVal)
    }));
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size must be less than 5MB.', 'error');
      return;
    }

    setUploadingImage(true);
    try {
      const res = await api.uploadImage(file);
      if (res && res.url) {
        setForm(prev => ({ ...prev, coverImage: res.url }));
        showToast('Image uploaded to Supabase Storage successfully!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to upload image.', 'error');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(targetStatus) {
    if (!form.title.trim()) {
      showToast('Please provide a post title.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        status: targetStatus || form.status,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };

      if (postId) {
        await api.updatePost(postId, payload);
        showToast('Article updated in MongoDB successfully!', 'success');
      } else {
        await api.createPost(payload);
        showToast('Article created in MongoDB successfully!', 'success');
      }
      onSuccess();
    } catch (err) {
      showToast(err.message || 'Failed to save article.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 0.75rem' }} />
        <div>Loading article details from database...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button onClick={onBack} className="btn btn-secondary">
          <ArrowLeft size={16} />
          <span>Back to Articles</span>
        </button>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            className={`btn ${previewMode ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye size={16} />
            <span>{previewMode ? 'Edit Mode' : 'Preview Reader'}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            disabled={submitting}
            onClick={() => handleSubmit('draft')}
          >
            <Clock size={16} />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            disabled={submitting}
            onClick={() => handleSubmit('published')}
          >
            {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
            <span>Publish Article</span>
          </button>
        </div>
      </div>

      {previewMode ? (
        /* Preview Tab */
        <div className="content-card" style={{ padding: '3rem 2rem', maxWidth: '840px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <span className="badge badge-published">
              {categories.find(c => c.id === form.categoryId)?.name || 'General'}
            </span>
            <span className={`badge ${form.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
              {form.status}
            </span>
          </div>

          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#fff', lineHeight: 1.25, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            {form.title || 'Untitled Article'}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
            <span>By <strong>{form.authorName || 'Editorial Team'}</strong></span>
            <span>•</span>
            <span>{new Date().toLocaleDateString('vi-VN')}</span>
          </div>

          {form.coverImage && (
            <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '2rem', maxHeight: '420px' }}>
              <img src={form.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          {form.excerpt && (
            <div style={{ fontSize: '1.15rem', color: '#cbd5e1', fontStyle: 'italic', marginBottom: '2rem', borderLeft: '3px solid var(--primary)', paddingLeft: '1.25rem', lineHeight: 1.6 }}>
              {form.excerpt}
            </div>
          )}

          <div style={{ color: 'var(--text-main)', fontSize: '1.05rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {form.content || 'No body content provided.'}
          </div>
        </div>
      ) : (
        /* Edit Form Grid */
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Main Column */}
          <div className="content-card" style={{ padding: '1.75rem' }}>
            {/* Title */}
            <div className="form-group">
              <label className="form-label">Article Title *</label>
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '1.1rem', fontWeight: 600 }}
                placeholder="Enter an engaging, authoritative title..."
                value={form.title}
                onChange={handleTitleChange}
                required
              />
            </div>

            {/* Slug */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="form-label" style={{ margin: 0 }}>URL Slug</label>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '0.75rem', cursor: 'pointer' }}
                  onClick={() => {
                    const generated = generateSlugString(form.title);
                    setForm(f => ({ ...f, slug: generated }));
                    setManualSlug(true);
                  }}
                >
                  Regenerate from title
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                  /
                </span>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '24px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                  value={form.slug}
                  onChange={(e) => {
                    setManualSlug(true);
                    setForm(f => ({ ...f, slug: generateSlugString(e.target.value) }));
                  }}
                  placeholder="article-url-slug"
                />
              </div>
            </div>

            {/* Excerpt */}
            <div className="form-group">
              <label className="form-label">Excerpt / Summary</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: '80px' }}
                placeholder="Brief summary or introductory dispatch (shown on homepage and reader feeds)..."
                value={form.excerpt}
                onChange={(e) => setForm(f => ({ ...f, excerpt: e.target.value }))}
              />
            </div>

            {/* Content Body */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Article Body Content</label>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Full Unicode & Markdown supported</span>
              </div>
              <textarea
                className="form-textarea"
                style={{ minHeight: '360px', fontFamily: 'var(--font-sans)', lineHeight: 1.7 }}
                placeholder="Write the full in-depth article analysis here..."
                value={form.content}
                onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
              />
            </div>

            {/* SEO Section */}
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: '#60a5fa', fontWeight: 700, fontSize: '0.95rem' }}>
                <Globe size={18} />
                <span>SEO & Search Engine Metadata</span>
              </div>

              <div className="form-group">
                <label className="form-label">SEO Meta Title (Defaults to Article Title)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Optimized 60-character title for Google..."
                  value={form.metaTitle}
                  onChange={(e) => setForm(f => ({ ...f, metaTitle: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">SEO Meta Description</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '70px' }}
                  placeholder="155-character snippet for search engine SERP results..."
                  value={form.metaDescription}
                  onChange={(e) => setForm(f => ({ ...f, metaDescription: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Focus Keyword</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. personal finance, treasury bills, artificial intelligence"
                  value={form.focusKeyword}
                  onChange={(e) => setForm(f => ({ ...f, focusKeyword: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Sidebar Settings Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Publishing Settings */}
            <div className="content-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                Publishing Details
              </h3>

              {/* Status */}
              <div className="form-group">
                <label className="form-label">Publication Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="published">Published (Live)</option>
                  <option value="draft">Draft (Hidden)</option>
                </select>
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="form-select"
                  value={form.categoryId}
                  onChange={(e) => setForm(f => ({ ...f, categoryId: e.target.value }))}
                  required
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Author Name */}
              <div className="form-group">
                <label className="form-label">Author Byline</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sarah Jenkins, CFA"
                  value={form.authorName}
                  onChange={(e) => setForm(f => ({ ...f, authorName: e.target.value }))}
                />
              </div>

              {/* Tags */}
              <div className="form-group">
                <label className="form-label">Tags (Comma-separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="finance, ai, tech, wealth"
                  value={form.tags}
                  onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))}
                />
              </div>

              {/* Google AdSense Switch */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>AdSense Slots</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Show ads on this article</div>
                </div>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', accentColor: '#3b82f6', cursor: 'pointer' }}
                  checked={form.enableAds}
                  onChange={(e) => setForm(f => ({ ...f, enableAds: e.target.checked }))}
                />
              </div>
            </div>

            {/* Cover Image Upload Card */}
            <div className="content-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                Featured Cover Image
              </h3>

              {/* Thumbnail Display */}
              {form.coverImage ? (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', height: '160px', position: 'relative', border: '1px solid var(--border-subtle)' }}>
                    <img
                      src={form.coverImage}
                      alt="Cover Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, coverImage: '' }))}
                    style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.8rem', marginTop: '0.5rem', cursor: 'pointer' }}
                  >
                    Remove Image
                  </button>
                </div>
              ) : null}

              {/* Upload to Supabase Button */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png, image/jpeg, image/webp, image/gif"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />

              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', marginBottom: '0.75rem' }}
                disabled={uploadingImage}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingImage ? (
                  <><Loader2 className="animate-spin" size={16} /> Uploading to Supabase...</>
                ) : (
                  <><Upload size={16} /> Upload to Supabase Storage</>
                )}
              </button>

              {/* Or manual URL */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Or paste direct image URL</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '0.8rem' }}
                  placeholder="https://..."
                  value={form.coverImage}
                  onChange={(e) => setForm(f => ({ ...f, coverImage: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
