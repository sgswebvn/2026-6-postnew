import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../api/client';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  ArrowLeft,
  Save,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Eye,
  CheckCircle,
  Clock,
  Sparkles,
  Globe,
  Loader2,
  AlertCircle,
  Video,
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  X,
  Maximize2,
  Calendar,
  Tag as TagIcon
} from 'lucide-react';
import RichContentRenderer from '../common/RichContentRenderer';

export default function AdminPostForm({ postId, onBack, onSuccess, showToast }) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingClipboard, setUploadingClipboard] = useState(false);
  const [categories, setCategories] = useState([]);
  const [manualSlug, setManualSlug] = useState(false);

  // Preview state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editorTab, setEditorTab] = useState('write'); // 'write' | 'preview'

  const fileInputRef = useRef(null);
  const editorRef = useRef(null);
  const inContentImageInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    categoryId: '',
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

  // Cover image upload
  async function handleCoverFileUpload(e) {
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
        showToast('Cover image uploaded to Supabase Storage!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to upload cover image.', 'error');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // Helper to insert text/HTML at textarea cursor position
  function insertAtCursor(textToInsert) {
    const textarea = editorRef.current;
    if (!textarea) {
      setForm(f => ({ ...f, content: (f.content || '') + textToInsert }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;

    const before = currentVal.substring(0, start);
    const after = currentVal.substring(end, currentVal.length);

    const newVal = before + textToInsert + after;
    setForm(f => ({ ...f, content: newVal }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 0);
  }

  // Parse YouTube video ID
  function extractYouTubeId(url) {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();

    // Standard watch: https://www.youtube.com/watch?v=VIDEO_ID
    const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/i);
    if (watchMatch) return watchMatch[1];

    // Shortened: https://youtu.be/VIDEO_ID
    const shortMatch = trimmed.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (shortMatch) return shortMatch[1];

    // Shorts: https://www.youtube.com/shorts/VIDEO_ID
    const shortsMatch = trimmed.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i);
    if (shortsMatch) return shortsMatch[1];

    // Embed: https://www.youtube.com/embed/VIDEO_ID
    const embedMatch = trimmed.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/i);
    if (embedMatch) return embedMatch[1];

    return null;
  }

  function createYouTubeEmbedHtml(videoId) {
    return `\n<div class="video-container" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:2rem 0;"><iframe src="https://www.youtube-nocookie.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;"></iframe></div>\n`;
  }

  // Paste Event Handler (Images & YouTube auto-embed)
  async function handleEditorPaste(e) {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // A. Check if user pasted an image file from clipboard
    const items = clipboardData.items;
    let imageItem = null;

    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.startsWith('image/')) {
          imageItem = items[i];
          break;
        }
      }
    }

    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        showToast('Pasted image size exceeds 5MB limit.', 'error');
        return;
      }

      setUploadingClipboard(true);
      showToast('Uploading clipboard image to Supabase Storage...', 'info');

      try {
        const res = await api.uploadImage(file);
        if (res && res.url) {
          const imgTag = `\n<p><img src="${res.url}" alt="Article illustration" style="max-width:100%;height:auto;border-radius:10px;margin:1.75rem auto;display:block;" /></p>\n`;
          insertAtCursor(imgTag);
          showToast('Image inserted at cursor position!', 'success');
        }
      } catch (err) {
        showToast('Failed to upload pasted image: ' + err.message, 'error');
      } finally {
        setUploadingClipboard(false);
      }
      return;
    }

    // B. Check if user pasted a YouTube link
    const text = clipboardData.getData('text/plain');
    if (text) {
      const ytId = extractYouTubeId(text);
      if (ytId) {
        e.preventDefault();
        const embedHtml = createYouTubeEmbedHtml(ytId);
        insertAtCursor(embedHtml);
        showToast('YouTube video embedded at cursor position!', 'success');
      }
    }
  }

  // Upload image to content at cursor
  async function handleInContentImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size must be less than 5MB.', 'error');
      return;
    }

    setUploadingClipboard(true);
    try {
      const res = await api.uploadImage(file);
      if (res && res.url) {
        const imgTag = `\n<p><img src="${res.url}" alt="${file.name || 'Image'}" style="max-width:100%;height:auto;border-radius:10px;margin:1.75rem auto;display:block;" /></p>\n`;
        insertAtCursor(imgTag);
        showToast('Image inserted at cursor position!', 'success');
      }
    } catch (err) {
      showToast('Failed to upload image: ' + err.message, 'error');
    } finally {
      setUploadingClipboard(false);
      if (inContentImageInputRef.current) inContentImageInputRef.current.value = '';
    }
  }

  // Toolbar actions
  function handleToolbarAction(type) {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end) || '';

    switch (type) {
      case 'h2':
        insertAtCursor(`\n<h2>${selected || 'Section Heading'}</h2>\n`);
        break;
      case 'h3':
        insertAtCursor(`\n<h3>${selected || 'Subheading'}</h3>\n`);
        break;
      case 'p':
        insertAtCursor(`\n<p>${selected || 'Paragraph text...'}</p>\n`);
        break;
      case 'bold':
        insertAtCursor(`<strong>${selected || 'bold text'}</strong>`);
        break;
      case 'italic':
        insertAtCursor(`<em>${selected || 'italic text'}</em>`);
        break;
      case 'underline':
        insertAtCursor(`<u>${selected || 'underlined text'}</u>`);
        break;
      case 'code':
        insertAtCursor(`<code>${selected || 'code snippet'}</code>`);
        break;
      case 'ul':
        insertAtCursor(`\n<ul>\n  <li>${selected || 'First item'}</li>\n  <li>Second item</li>\n</ul>\n`);
        break;
      case 'ol':
        insertAtCursor(`\n<ol>\n  <li>${selected || 'Step one'}</li>\n  <li>Step two</li>\n</ol>\n`);
        break;
      case 'quote':
        insertAtCursor(`\n<blockquote>${selected || 'Important quote statement...'}</blockquote>\n`);
        break;
      case 'link': {
        const url = prompt('Enter destination link URL (https://...):', 'https://');
        if (url && url !== 'https://') {
          insertAtCursor(`<a href="${url}" target="_blank" rel="noopener noreferrer">${selected || 'Link text'}</a>`);
        }
        break;
      }
      case 'youtube': {
        const url = prompt('Paste YouTube Video URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...):');
        if (url) {
          const ytId = extractYouTubeId(url);
          if (ytId) {
            insertAtCursor(createYouTubeEmbedHtml(ytId));
            showToast('YouTube video embedded successfully!', 'success');
          } else {
            showToast('Could not extract valid YouTube video ID from URL.', 'error');
          }
        }
        break;
      }
      case 'image-url': {
        const url = prompt('Enter direct image URL (https://...):');
        if (url) {
          insertAtCursor(`\n<p><img src="${url}" alt="Article image" style="max-width:100%;height:auto;border-radius:10px;margin:1.75rem auto;display:block;" /></p>\n`);
        }
        break;
      }
      default:
        break;
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
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        content: form.content,
        coverImage: form.coverImage,
        categoryId: form.categoryId,
        status: targetStatus || form.status,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        focusKeyword: form.focusKeyword,
        enableAds: form.enableAds
      };

      if (postId) {
        await api.updatePost(postId, payload);
        showToast('Article updated successfully!', 'success');
      } else {
        await api.createPost(payload);
        showToast('Article created successfully!', 'success');
      }
      onSuccess();
    } catch (err) {
      showToast(err.message || 'Failed to save article.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingSpinner minHeight="360px" label="Loading" />;
  }

  return (
    <div style={{ maxWidth: '1200px' }}>
      {/* Hidden file input for in-content image insertion */}
      <input
        type="file"
        ref={inContentImageInputRef}
        accept="image/png, image/jpeg, image/webp, image/gif"
        style={{ display: 'none' }}
        onChange={handleInContentImageUpload}
      />

      {/* Top Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem',
        background: '#ffffff',
        padding: '0.85rem 1.25rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <button onClick={onBack} className="btn btn-secondary">
          <ArrowLeft size={16} />
          <span>Back to Articles</span>
        </button>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Prominent Preview Button (Requirement 5) */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowPreviewModal(true)}
            title="Preview article as public reader"
            style={{ fontWeight: 600, color: '#2563eb', borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }}
          >
            <Eye size={16} />
            <span>Preview Article</span>
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

      {/* Main Form Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Editor & SEO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Title & Slug Card */}
          <div className="content-card" style={{ padding: '1.75rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.95rem' }}>Article Title *</label>
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '1.15rem', fontWeight: 700 }}
                placeholder="Enter an engaging, authoritative title..."
                value={form.title}
                onChange={handleTitleChange}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ margin: 0, fontSize: '0.85rem' }}>URL Slug</label>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
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
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
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
                  placeholder="article-slug-url"
                />
              </div>
            </div>
          </div>

          {/* Excerpt Card */}
          <div className="content-card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Excerpt / Lead Summary</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: '80px', lineHeight: 1.6 }}
                placeholder="Brief summary or introductory dispatch (shown on homepage and reader feeds)..."
                value={form.excerpt}
                onChange={(e) => setForm(f => ({ ...f, excerpt: e.target.value }))}
              />
            </div>
          </div>

          {/* Rich Content Editor Card (Requirement 6) */}
          <div className="content-card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <label className="form-label" style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>
                  Article Body Content
                </label>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Paste images directly from clipboard, paste YouTube links to auto-embed, or use the toolbar.
                </div>
              </div>

              {/* Write / Quick Preview Switcher */}
              <div style={{ display: 'flex', gap: '0.25rem', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEditorTab('write')}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: editorTab === 'write' ? '#ffffff' : 'transparent',
                    color: editorTab === 'write' ? '#0f172a' : '#64748b',
                    boxShadow: editorTab === 'write' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab('preview')}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: editorTab === 'preview' ? '#ffffff' : 'transparent',
                    color: editorTab === 'preview' ? '#0f172a' : '#64748b',
                    boxShadow: editorTab === 'preview' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  Inline Preview
                </button>
              </div>
            </div>

            {/* Rich Editor Toolbar */}
            {editorTab === 'write' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                flexWrap: 'wrap',
                padding: '0.5rem 0.75rem',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderBottom: 'none',
                borderRadius: '8px 8px 0 0'
              }}>
                <button type="button" className="btn-icon btn-secondary" title="Heading 2" onClick={() => handleToolbarAction('h2')}>
                  <Heading2 size={16} />
                </button>
                <button type="button" className="btn-icon btn-secondary" title="Heading 3" onClick={() => handleToolbarAction('h3')}>
                  <Heading3 size={16} />
                </button>
                <button type="button" className="btn-icon btn-secondary" title="Paragraph" onClick={() => handleToolbarAction('p')}>
                  P
                </button>

                <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 0.25rem' }} />

                <button type="button" className="btn-icon btn-secondary" title="Bold" onClick={() => handleToolbarAction('bold')}>
                  <Bold size={16} />
                </button>
                <button type="button" className="btn-icon btn-secondary" title="Italic" onClick={() => handleToolbarAction('italic')}>
                  <Italic size={16} />
                </button>
                <button type="button" className="btn-icon btn-secondary" title="Underline" onClick={() => handleToolbarAction('underline')}>
                  <Underline size={16} />
                </button>
                <button type="button" className="btn-icon btn-secondary" title="Code" onClick={() => handleToolbarAction('code')}>
                  <Code size={16} />
                </button>

                <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 0.25rem' }} />

                <button type="button" className="btn-icon btn-secondary" title="Bullet List" onClick={() => handleToolbarAction('ul')}>
                  <List size={16} />
                </button>
                <button type="button" className="btn-icon btn-secondary" title="Numbered List" onClick={() => handleToolbarAction('ol')}>
                  <ListOrdered size={16} />
                </button>
                <button type="button" className="btn-icon btn-secondary" title="Blockquote" onClick={() => handleToolbarAction('quote')}>
                  <Quote size={16} />
                </button>
                <button type="button" className="btn-icon btn-secondary" title="Insert Link" onClick={() => handleToolbarAction('link')}>
                  <LinkIcon size={16} />
                </button>

                <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 0.25rem' }} />

                {/* Upload Image to cursor position */}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  title="Upload image at cursor"
                  onClick={() => inContentImageInputRef.current?.click()}
                  style={{ gap: '0.35rem', fontSize: '0.8rem' }}
                >
                  <ImageIcon size={14} color="#2563eb" />
                  <span>Insert Image</span>
                </button>

                {/* Paste YouTube video */}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  title="Embed YouTube video"
                  onClick={() => handleToolbarAction('youtube')}
                  style={{ gap: '0.35rem', fontSize: '0.8rem', color: '#dc2626' }}
                >
                  <Video size={14} />
                  <span>YouTube</span>
                </button>

                {uploadingClipboard && (
                  <span style={{ fontSize: '0.75rem', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: 'auto' }}>
                    <Loader2 className="animate-spin" size={14} /> Uploading image to Supabase...
                  </span>
                )}
              </div>
            )}

            {editorTab === 'write' ? (
              <textarea
                ref={editorRef}
                className="form-textarea"
                style={{
                  minHeight: '440px',
                  fontFamily: 'var(--font-sans)',
                  lineHeight: 1.75,
                  borderRadius: '0 0 8px 8px',
                  borderTop: 'none',
                  fontSize: '0.95rem'
                }}
                placeholder="Write your article body here... Tip: You can directly paste images from your clipboard at any cursor position (top, between paragraphs, or bottom), or paste a YouTube URL to automatically embed the video player."
                value={form.content}
                onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                onPaste={handleEditorPaste}
              />
            ) : (
              <div style={{
                minHeight: '440px',
                padding: '1.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: '#f8fafc'
              }}>
                <RichContentRenderer content={form.content} />
              </div>
            )}
          </div>

          {/* SEO Metadata Card */}
          <div className="content-card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: '#2563eb', fontWeight: 700, fontSize: '0.95rem' }}>
              <Globe size={18} />
              <span>Article SEO & Meta Tags</span>
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

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Focus Keyword</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. artificial intelligence, silicon chips, semiconductor"
                value={form.focusKeyword}
                onChange={(e) => setForm(f => ({ ...f, focusKeyword: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Taxonomy, Cover Image & Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Publication Parameters */}
          <div className="content-card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              Publishing Options
            </h3>

            {/* Status */}
            <div className="form-group">
              <label className="form-label">Publication Status</label>
              <select
                className="form-select"
                value={form.status}
                onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
              >
                <option value="published">Published (Live to public)</option>
                <option value="draft">Draft (Private admin only)</option>
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

            {/* Tags */}
            <div className="form-group">
              <label className="form-label">Tags (Comma-separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="tech, ai, wealth, finance"
                value={form.tags}
                onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))}
              />
            </div>

            {/* Google AdSense Switch */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Google AdSense</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Allow ad slots on this article</div>
              </div>
              <input
                type="checkbox"
                style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }}
                checked={form.enableAds}
                onChange={(e) => setForm(f => ({ ...f, enableAds: e.target.checked }))}
              />
            </div>
          </div>

          {/* Featured Cover Image Card */}
          <div className="content-card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              Featured Cover Image
            </h3>

            {form.coverImage && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ borderRadius: '8px', overflow: 'hidden', height: '160px', border: '1px solid #e2e8f0' }}>
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
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Remove Cover Image
                </button>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/webp, image/gif"
              style={{ display: 'none' }}
              onChange={handleCoverFileUpload}
            />

            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              disabled={uploadingImage}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingImage ? (
                <><Loader2 className="animate-spin" size={16} /> Uploading...</>
              ) : (
                <><Upload size={16} /> Upload Cover to Storage</>
              )}
            </button>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Or direct cover image URL</label>
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

      {/* FULL-FIDELITY PREVIEW MODAL (Requirement 5) */}
      {showPreviewModal && (
        <div className="modal-overlay" onClick={() => setShowPreviewModal(false)} style={{ zIndex: 100, padding: '1rem' }}>
          <div
            className="modal-dialog"
            style={{
              maxWidth: '920px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              borderRadius: '16px',
              background: '#0a0f1d',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.02)',
              position: 'sticky',
              top: 0,
              zIndex: 10,
              backdropFilter: 'blur(8px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="badge badge-published" style={{ background: '#2563eb', color: '#ffffff' }}>
                  Live Reader Preview
                </span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Slug: /{form.slug || 'preview'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowPreviewModal(false)}
                  style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                  <ArrowLeft size={14} />
                  <span>Back to Editor</span>
                </button>
              </div>
            </div>

            {/* Modal Body: Identical to public PostDetailPage.jsx layout */}
            <article style={{ padding: '2rem 2.5rem 3.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <span className="badge badge-published" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981' }}>
                  {categories.find(c => c.id === form.categoryId)?.name || 'General'}
                </span>
                <span className={`badge ${form.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                  {form.status.toUpperCase()}
                </span>
              </div>

              <h1 style={{
                fontSize: 'clamp(1.75rem, 3.5vw, 2.35rem)',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.3,
                marginBottom: '1.25rem',
                letterSpacing: '-0.02em'
              }}>
                {form.title || 'Untitled Article'}
              </h1>

              {/* Metadata Bar (No author - matches public site) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                color: '#94a3b8',
                fontSize: '0.85rem',
                paddingBottom: '1.25rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={15} />
                  <span>{new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Eye size={15} />
                  <span>Preview Mode (0 views)</span>
                </div>
              </div>

              {/* Cover Image */}
              {form.coverImage && (
                <div style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginBottom: '2.5rem',
                  maxHeight: '440px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <img
                    src={form.coverImage}
                    alt={form.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}

              {/* Excerpt Lead */}
              {form.excerpt && (
                <div style={{
                  fontSize: '1.15rem',
                  color: '#e2e8f0',
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                  marginBottom: '2.5rem',
                  paddingLeft: '1.5rem',
                  borderLeft: '4px solid #3b82f6',
                  background: 'rgba(59, 130, 246, 0.05)',
                  padding: '1.25rem 1.5rem',
                  borderRadius: '0 8px 8px 0'
                }}>
                  {form.excerpt}
                </div>
              )}

              {/* Main Content Body */}
              <div style={{ color: '#cbd5e1', marginBottom: '2.5rem' }}>
                <RichContentRenderer content={form.content} />
              </div>

              {/* Tags */}
              {form.tags && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <TagIcon size={15} color="#94a3b8" />
                  {form.tags.split(',').map((tag, idx) => (
                    <span key={idx} className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8' }}>
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </article>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              padding: '1rem 1.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowPreviewModal(false)}
                style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                Close Preview & Continue Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
