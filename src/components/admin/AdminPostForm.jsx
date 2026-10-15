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
  Tag as TagIcon,
  FileCode,
  Check,
  Film
} from 'lucide-react';
import RichContentRenderer from '../common/RichContentRenderer';
import ErrorBoundary from '../common/ErrorBoundary';
import {
  processPastedContent,
  extractYouTubeId,
  isYouTubeShortsUrl,
  createYouTubeEmbed,
  isValidImageUrl,
  createImageEmbed,
  buildImageMediaBlockHtml,
  buildYouTubeMediaBlockHtml,
  cleanContentForStorage,
  prepareContentForEditor,
  renderContentToHtml
} from '../../utils/contentFormatter';

export default function AdminPostForm({ postId, onBack, onSuccess, showToast }) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingClipboard, setUploadingClipboard] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [manualSlug, setManualSlug] = useState(false);

  // Editor mode: 'visual' (WYSIWYG live inline embeds) | 'code' (raw HTML) | 'preview' (reader view)
  const [editorMode, setEditorMode] = useState('visual');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const fileInputRef = useRef(null);
  const inContentImageInputRef = useRef(null);
  const visualEditorRef = useRef(null);
  const textareaRef = useRef(null);
  const isInternalChangeRef = useRef(false);
  const draggingBlockRef = useRef(null);

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

  // Synchronize ContentEditable DOM when switching modes or loading post
  useEffect(() => {
    if (editorMode === 'visual' && visualEditorRef.current) {
      if (!isInternalChangeRef.current) {
        visualEditorRef.current.innerHTML = prepareContentForEditor(form.content || '');
      }
    }
    isInternalChangeRef.current = false;
  }, [editorMode]);

  async function loadCategories() {
    try {
      const data = await api.getCategories();
      setCategories(Array.isArray(data) ? data : []);
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
      const postContent = data.content || '';
      setForm({
        title: data.title || '',
        slug: data.slug || '',
        excerpt: data.excerpt || '',
        content: postContent,
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

      // Populate visual editor if ref is ready
      setTimeout(() => {
        if (visualEditorRef.current) {
          visualEditorRef.current.innerHTML = prepareContentForEditor(postContent);
        }
      }, 50);
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

  // Cover image upload (Right Column)
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

  // ContentEditable input sync
  function handleVisualEditorInput() {
    if (!visualEditorRef.current) return;
    const html = visualEditorRef.current.innerHTML;
    isInternalChangeRef.current = true;
    setForm(prev => ({ ...prev, content: html }));
  }

  // Insert HTML into editor at caret position (works seamlessly in both Visual and Code mode)
  function insertContentIntoEditor(htmlToInsert) {
    if (editorMode === 'visual' && visualEditorRef.current) {
      visualEditorRef.current.focus();
      const sel = window.getSelection();

      if (sel && sel.rangeCount > 0 && visualEditorRef.current.contains(sel.getRangeAt(0).commonAncestorContainer)) {
        const range = sel.getRangeAt(0);
        range.deleteContents();

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlToInsert;
        const frag = document.createDocumentFragment();
        let node, lastNode;
        while ((node = tempDiv.firstChild)) {
          lastNode = frag.appendChild(node);
        }
        range.insertNode(frag);

        if (lastNode) {
          const newRange = range.cloneRange();
          newRange.setStartAfter(lastNode);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
      } else {
        // Fallback: append to bottom
        visualEditorRef.current.innerHTML += htmlToInsert;
      }

      handleVisualEditorInput();
    } else {
      // In Code (textarea) mode
      const textarea = textareaRef.current;
      if (!textarea) {
        setForm(f => ({ ...f, content: (f.content || '') + htmlToInsert }));
        return;
      }

      const start = textarea.selectionStart ?? (textarea.value || '').length;
      const end = textarea.selectionEnd ?? (textarea.value || '').length;
      const currentVal = textarea.value ?? form.content ?? '';

      const before = currentVal.substring(0, start);
      const after = currentVal.substring(end, currentVal.length);
      const newVal = before + htmlToInsert + after;

      setForm(f => ({ ...f, content: newVal }));

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const nextPos = start + htmlToInsert.length;
          textareaRef.current.setSelectionRange(nextPos, nextPos);
        }
      }, 10);
    }
  }

  // Upload an image file (from clipboard, drag-drop, or toolbar) to Supabase Storage with INSTANT local preview
  async function uploadImageFile(file) {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast(`Image "${file.name || 'Pasted image'}" exceeds 5MB size limit.`, 'error');
      return;
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (file.type && !allowedMimes.includes(file.type)) {
      showToast(`Unsupported format "${file.type}". Allowed: JPG, PNG, WEBP, GIF.`, 'error');
      return;
    }

    const uploadId = 'media_up_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    let previewUrl = '';
    try {
      previewUrl = URL.createObjectURL(file);
    } catch (e) {
      previewUrl = '';
    }

    // Instant interactive preview media block with uploading overlay
    const previewBlockHtml = `
<figure id="${uploadId}" class="media-block media-block-image is-uploading is-selected" data-media-type="image" data-upload-id="${uploadId}" style="max-width:100%;width:100%;margin:2rem auto;text-align:center;position:relative;" contenteditable="false">
  <header class="media-block-toolbar" contenteditable="false">
    <div class="media-toolbar-group">
      <span class="media-drag-handle" title="Drag to reorder" draggable="true">⠿ Drag</span>
      <button type="button" class="media-btn media-move-up" title="Move Up">▲</button>
      <button type="button" class="media-btn media-move-down" title="Move Down">▼</button>
    </div>
    <div class="media-toolbar-group">
      <button type="button" class="media-btn media-align-left" data-align-btn="left" title="Align Left">Left</button>
      <button type="button" class="media-btn media-align-center active" data-align-btn="center" title="Align Center">Center</button>
      <button type="button" class="media-btn media-align-right" data-align-btn="right" title="Align Right">Right</button>
    </div>
    <button type="button" class="media-btn media-delete-btn" title="Remove image block">✕</button>
  </header>
  <div class="media-image-wrapper" style="position:relative;display:inline-block;width:100%;max-width:100%;">
    <img src="${previewUrl}" alt="${file.name || 'Article illustration'}" style="width:100%;height:auto;border-radius:10px;display:block;box-shadow:0 4px 12px rgba(0,0,0,0.06);opacity:0.85;" />
    <span class="media-resize-handle media-resize-se" data-handle="se" title="Drag corner to resize width"></span>
    <span class="media-resize-handle media-resize-sw" data-handle="sw" title="Drag corner to resize width"></span>
    <div class="media-upload-overlay" contenteditable="false">
      <span class="horizon-spinner sm accent"></span>
      <span>Uploading to cloud storage...</span>
    </div>
  </div>
  <figcaption class="media-caption" style="text-align:center;font-size:0.85rem;color:#64748b;margin-top:0.5rem;font-style:italic;">
    ${file.name || 'Article illustration'}
  </figcaption>
</figure><p><br></p>
`;

    insertContentIntoEditor(previewBlockHtml);
    setUploadingClipboard(true);
    setUploadingCount(c => c + 1);

    try {
      const res = await api.uploadImage(file);
      if (res && res.url) {
        if (editorMode === 'visual' && visualEditorRef.current) {
          const blockEl = visualEditorRef.current.querySelector(`#${uploadId}`);
          if (blockEl) {
            const img = blockEl.querySelector('img');
            if (img) {
              img.src = res.url;
              img.style.opacity = '1';
            }
            const overlay = blockEl.querySelector('.media-upload-overlay');
            if (overlay) overlay.remove();
            blockEl.classList.remove('is-uploading');
            handleVisualEditorInput();
          }
        } else {
          // In code mode, replace preview with permanent URL
          setForm(prev => {
            const current = prev.content || '';
            const replaced = previewUrl ? current.replace(previewUrl, res.url) : current;
            return { ...prev, content: cleanContentForStorage(replaced) };
          });
        }
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        showToast(`Image "${file.name || 'Pasted image'}" uploaded successfully!`, 'success');
      } else {
        throw new Error('Storage returned no image URL');
      }
    } catch (err) {
      console.error('[Image Upload Failure]', err);
      if (editorMode === 'visual' && visualEditorRef.current) {
        const blockEl = visualEditorRef.current.querySelector(`#${uploadId}`);
        if (blockEl) {
          const overlay = blockEl.querySelector('.media-upload-overlay');
          if (overlay) {
            overlay.className = 'media-upload-error';
            overlay.innerHTML = `<span>⚠️ Upload failed: ${err.message}</span> <button type="button" class="btn btn-secondary btn-sm" onclick="this.closest('.media-block').remove()">Remove</button>`;
          }
        }
      }
      showToast(`Failed to upload image: ${err.message}. Your text is preserved.`, 'error');
    } finally {
      setUploadingCount(c => {
        const next = Math.max(0, c - 1);
        if (next === 0) setUploadingClipboard(false);
        return next;
      });
    }
  }

  // Embed YouTube Video into editor as independent media block
  function handleInsertYouTube(targetUrl) {
    const url = targetUrl || prompt('Paste YouTube Video URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...):');
    if (!url || typeof url !== 'string' || !url.trim()) return;

    const trimmed = url.trim();
    const ytId = extractYouTubeId(trimmed);

    if (!ytId) {
      showToast('Could not extract valid YouTube video ID from URL. Inserted as link instead.', 'warning');
      insertContentIntoEditor(`<p><a href="${trimmed}" target="_blank" rel="noopener noreferrer">${trimmed}</a></p><p><br></p>`);
      return;
    }

    const isShorts = isYouTubeShortsUrl(trimmed);
    const embedHtml = buildYouTubeMediaBlockHtml({ videoId: ytId, isShorts, isInteractive: true }) + '<p><br></p>';
    insertContentIntoEditor(embedHtml);
    showToast('YouTube video media block embedded at cursor!', 'success');
  }

  // Insert Image via direct URL as independent media block
  function handleInsertImageUrl() {
    const url = prompt('Enter direct image URL (https://...):');
    if (!url || typeof url !== 'string' || !url.trim()) return;

    const trimmed = url.trim();
    if (!isValidImageUrl(trimmed)) {
      showToast('URL does not appear to be a valid image format. Inserted as link instead.', 'warning');
      insertContentIntoEditor(`<p><a href="${trimmed}" target="_blank" rel="noopener noreferrer">${trimmed}</a></p><p><br></p>`);
      return;
    }

    const imageHtml = buildImageMediaBlockHtml({ url: trimmed, alt: 'Article illustration', isInteractive: true }) + '<p><br></p>';
    insertContentIntoEditor(imageHtml);
    showToast('Image media block inserted!', 'success');
  }

  // Visual Editor interactive handlers: click, keyboard, mouse resize, drag and drop
  function handleVisualEditorClick(e) {
    const target = e.target;
    if (!visualEditorRef.current) return;

    // 1. Delete button ✕
    const deleteBtn = target.closest('.media-delete-btn');
    if (deleteBtn) {
      e.preventDefault();
      e.stopPropagation();
      const block = deleteBtn.closest('.media-block');
      if (block) {
        block.remove();
        handleVisualEditorInput();
        showToast('Media block removed.', 'info');
      }
      return;
    }

    // 2. Move Up button ▲
    const moveUpBtn = target.closest('.media-move-up');
    if (moveUpBtn) {
      e.preventDefault();
      e.stopPropagation();
      const block = moveUpBtn.closest('.media-block');
      if (block && block.previousElementSibling) {
        visualEditorRef.current.insertBefore(block, block.previousElementSibling);
        handleVisualEditorInput();
      }
      return;
    }

    // 3. Move Down button ▼
    const moveDownBtn = target.closest('.media-move-down');
    if (moveDownBtn) {
      e.preventDefault();
      e.stopPropagation();
      const block = moveDownBtn.closest('.media-block');
      if (block && block.nextElementSibling) {
        visualEditorRef.current.insertBefore(block, block.nextElementSibling.nextElementSibling);
        handleVisualEditorInput();
      }
      return;
    }

    // 4. Alignment buttons (Left, Center, Right)
    const alignBtn = target.closest('[data-align-btn]');
    if (alignBtn) {
      e.preventDefault();
      e.stopPropagation();
      const block = alignBtn.closest('.media-block-image');
      if (block) {
        const align = alignBtn.dataset.alignBtn || 'center';
        block.dataset.align = align;
        block.style.textAlign = align;
        if (align === 'left') {
          block.style.margin = '2rem auto 2rem 0';
        } else if (align === 'right') {
          block.style.margin = '2rem 0 2rem auto';
        } else {
          block.style.margin = '2rem auto';
        }
        const allAlignBtns = block.querySelectorAll('[data-align-btn]');
        allAlignBtns.forEach(btn => {
          btn.classList.toggle('active', btn.dataset.alignBtn === align);
        });
        handleVisualEditorInput();
      }
      return;
    }

    // 5. Select block on click
    const mediaBlock = target.closest('.media-block');
    const allBlocks = visualEditorRef.current.querySelectorAll('.media-block');
    if (mediaBlock) {
      allBlocks.forEach(b => {
        if (b !== mediaBlock) b.classList.remove('is-selected');
      });
      mediaBlock.classList.add('is-selected');
    } else {
      allBlocks.forEach(b => b.classList.remove('is-selected'));
    }
  }

  function handleVisualEditorKeyDown(e) {
    if (!visualEditorRef.current) return;

    if (e.key === 'Backspace' || e.key === 'Delete') {
      const selectedBlock = visualEditorRef.current.querySelector('.media-block.is-selected');
      if (selectedBlock) {
        e.preventDefault();
        selectedBlock.remove();
        handleVisualEditorInput();
        showToast('Media block removed.', 'info');
      }
    }
  }

  function handleVisualEditorMouseDown(e) {
    const handle = e.target.closest('.media-resize-handle');
    if (!handle || !visualEditorRef.current) return;

    e.preventDefault();
    e.stopPropagation();

    const block = handle.closest('.media-block-image');
    if (!block) return;

    const startX = e.clientX;
    const initialRect = block.getBoundingClientRect();
    const startWidth = initialRect.width;
    const isLeft = handle.dataset.handle === 'sw';

    function onMouseMove(moveEvent) {
      const deltaX = moveEvent.clientX - startX;
      let newWidth = isLeft ? (startWidth - deltaX) : (startWidth + deltaX);
      const editorWidth = visualEditorRef.current?.clientWidth || 800;
      newWidth = Math.max(140, Math.min(editorWidth, Math.round(newWidth)));

      block.style.maxWidth = `${newWidth}px`;
      block.dataset.width = String(newWidth);
    }

    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      handleVisualEditorInput();
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function handleDragStart(e) {
    const handle = e.target.closest('.media-drag-handle');
    if (!handle) return;
    const block = handle.closest('.media-block');
    if (!block) return;

    draggingBlockRef.current = block;
    block.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', block.id || 'media-block');
  }

  function handleDragOver(e) {
    if (!draggingBlockRef.current || !visualEditorRef.current) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const targetChild = e.target.closest('.admin-visual-editor > *');
    if (!targetChild || targetChild === draggingBlockRef.current) return;

    visualEditorRef.current.querySelectorAll('.drop-indicator-top, .drop-indicator-bottom').forEach(el => {
      if (el !== targetChild) {
        el.classList.remove('drop-indicator-top', 'drop-indicator-bottom');
      }
    });

    const rect = targetChild.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (e.clientY < midY) {
      targetChild.classList.add('drop-indicator-top');
      targetChild.classList.remove('drop-indicator-bottom');
    } else {
      targetChild.classList.add('drop-indicator-bottom');
      targetChild.classList.remove('drop-indicator-top');
    }
  }

  function handleDragLeave(e) {
    if (e.target.classList) {
      e.target.classList.remove('drop-indicator-top', 'drop-indicator-bottom');
    }
  }

  function handleDrop(e) {
    if (!draggingBlockRef.current || !visualEditorRef.current) return;
    e.preventDefault();

    const targetChild = e.target.closest('.admin-visual-editor > *');
    const draggedEl = draggingBlockRef.current;

    visualEditorRef.current.querySelectorAll('.drop-indicator-top, .drop-indicator-bottom').forEach(el => {
      el.classList.remove('drop-indicator-top', 'drop-indicator-bottom');
    });

    if (targetChild && targetChild !== draggedEl) {
      const rect = targetChild.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        visualEditorRef.current.insertBefore(draggedEl, targetChild);
      } else {
        visualEditorRef.current.insertBefore(draggedEl, targetChild.nextSibling);
      }
      handleVisualEditorInput();
      showToast('Media block repositioned.', 'success');
    }

    draggedEl.classList.remove('is-dragging');
    draggingBlockRef.current = null;
  }

  function handleDragEnd() {
    if (draggingBlockRef.current) {
      draggingBlockRef.current.classList.remove('is-dragging');
      draggingBlockRef.current = null;
    }
    if (visualEditorRef.current) {
      visualEditorRef.current.querySelectorAll('.drop-indicator-top, .drop-indicator-bottom').forEach(el => {
        el.classList.remove('drop-indicator-top', 'drop-indicator-bottom');
      });
    }
  }

  // Unified Paste Event Handler (works on both Visual Editor and Code textarea)
  async function handlePaste(e) {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // 1. Check if user pasted an image file directly from clipboard
    const imageFiles = [];
    if (clipboardData.files && clipboardData.files.length > 0) {
      for (let i = 0; i < clipboardData.files.length; i++) {
        const f = clipboardData.files[i];
        if (f.type && f.type.startsWith('image/')) imageFiles.push(f);
      }
    }
    if (imageFiles.length === 0 && clipboardData.items && clipboardData.items.length > 0) {
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        if (item.type && item.type.startsWith('image/')) {
          const f = item.getAsFile();
          if (f) imageFiles.push(f);
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      for (const file of imageFiles) {
        uploadImageFile(file);
      }
      return;
    }

    // 2. Check if user pasted a standalone YouTube URL
    const textData = (clipboardData.getData('text/plain') || '').trim();
    if (textData && (textData.startsWith('http://') || textData.startsWith('https://')) && !textData.includes('\n')) {
      const ytId = extractYouTubeId(textData);
      if (ytId) {
        e.preventDefault();
        handleInsertYouTube(textData);
        return;
      }

      // Check if user pasted a standalone image URL
      if (isValidImageUrl(textData)) {
        e.preventDefault();
        const imgHtml = createImageEmbed(textData, 'Article illustration') + '<p><br></p>';
        insertContentIntoEditor(imgHtml);
        showToast('Pasted image URL converted to inline image!', 'success');
        return;
      }
    }

    // 3. Process formatted text / ChatGPT rich HTML / Markdown
    const formatted = processPastedContent(clipboardData);
    if (formatted) {
      e.preventDefault();
      insertContentIntoEditor(formatted);
      showToast('Pasted content formatted and inserted!', 'info');
    }
  }

  // Toolbar formatting actions
  function handleToolbarFormat(action) {
    if (editorMode === 'visual') {
      visualEditorRef.current?.focus();
      switch (action) {
        case 'bold':
          document.execCommand('bold', false, null);
          break;
        case 'italic':
          document.execCommand('italic', false, null);
          break;
        case 'underline':
          document.execCommand('underline', false, null);
          break;
        case 'h2':
          document.execCommand('formatBlock', false, '<h2>');
          break;
        case 'h3':
          document.execCommand('formatBlock', false, '<h3>');
          break;
        case 'p':
          document.execCommand('formatBlock', false, '<p>');
          break;
        case 'ul':
          document.execCommand('insertUnorderedList', false, null);
          break;
        case 'ol':
          document.execCommand('insertOrderedList', false, null);
          break;
        case 'quote':
          document.execCommand('formatBlock', false, '<blockquote>');
          break;
        case 'code':
          insertContentIntoEditor('<code>Code snippet</code>');
          break;
        case 'link': {
          const url = prompt('Enter link URL (https://...):', 'https://');
          if (url && url !== 'https://') {
            document.execCommand('createLink', false, url);
          }
          break;
        }
        default:
          break;
      }
      handleVisualEditorInput();
    } else {
      // In code mode
      switch (action) {
        case 'h2':
          insertContentIntoEditor('\n<h2>Section Heading</h2>\n');
          break;
        case 'h3':
          insertContentIntoEditor('\n<h3>Subheading</h3>\n');
          break;
        case 'p':
          insertContentIntoEditor('\n<p>Paragraph text...</p>\n');
          break;
        case 'bold':
          insertContentIntoEditor('<strong>bold text</strong>');
          break;
        case 'italic':
          insertContentIntoEditor('<em>italic text</em>');
          break;
        case 'underline':
          insertContentIntoEditor('<u>underlined text</u>');
          break;
        case 'code':
          insertContentIntoEditor('<code>code snippet</code>');
          break;
        case 'ul':
          insertContentIntoEditor('\n<ul>\n  <li>First item</li>\n  <li>Second item</li>\n</ul>\n');
          break;
        case 'ol':
          insertContentIntoEditor('\n<ol>\n  <li>Step one</li>\n  <li>Step two</li>\n</ol>\n');
          break;
        case 'quote':
          insertContentIntoEditor('\n<blockquote>Important quote statement...</blockquote>\n');
          break;
        case 'link': {
          const url = prompt('Enter destination link URL (https://...):', 'https://');
          if (url && url !== 'https://') {
            insertContentIntoEditor(`<a href="${url}" target="_blank" rel="noopener noreferrer">Link text</a>`);
          }
          break;
        }
        default:
          break;
      }
    }
  }

  // Switch between editor modes cleanly
  function handleModeSwitch(targetMode) {
    if (targetMode === editorMode) return;

    if (editorMode === 'visual' && visualEditorRef.current) {
      // Save cleaned HTML to form state
      setForm(prev => ({ ...prev, content: cleanContentForStorage(visualEditorRef.current.innerHTML) }));
    }

    setEditorMode(targetMode);
  }

  async function handleSubmit(targetStatus) {
    if (!form.title.trim()) {
      showToast('Please provide a post title.', 'error');
      return;
    }

    // Read latest content from active visual editor if currently in visual mode
    const rawContent = editorMode === 'visual' && visualEditorRef.current
      ? visualEditorRef.current.innerHTML
      : form.content;

    const finalContent = cleanContentForStorage(rawContent);

    if (uploadingClipboard || uploadingCount > 0 || (rawContent && rawContent.includes('is-uploading'))) {
      showToast('Please wait for active image uploads to complete before saving.', 'warning');
      return;
    }

    if (finalContent.includes('blob:')) {
      showToast('Please wait for cloud image uploads to complete before saving.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        content: finalContent,
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
    <div style={{ maxWidth: '1240px' }}>
      {/* Hidden file input for in-content image insertion */}
      <input
        type="file"
        ref={inContentImageInputRef}
        accept="image/png, image/jpeg, image/webp, image/gif"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadImageFile(file);
          if (inContentImageInputRef.current) inContentImageInputRef.current.value = '';
        }}
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
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <button onClick={onBack} className="btn btn-secondary">
          <ArrowLeft size={16} />
          <span>Back to Articles</span>
        </button>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              if (editorMode === 'visual' && visualEditorRef.current) {
                setForm(prev => ({ ...prev, content: visualEditorRef.current.innerHTML }));
              }
              setShowPreviewModal(true);
            }}
            title="Preview article exactly as public readers see it"
            style={{ fontWeight: 600, color: '#2563eb', borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }}
          >
            <Eye size={16} />
            <span>Reader Preview</span>
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
            style={{ padding: '0.6rem 1.25rem' }}
          >
            {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
            <span>Publish Article</span>
          </button>
        </div>
      </div>

      {/* Main Form Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
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

          {/* Rich Content Editor Card with WYSIWYG Visual Canvas */}
          <div className="content-card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <label className="form-label" style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>
                  Article Body Content
                </label>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Directly paste images or YouTube URLs to embed them visually right at your cursor.
                </div>
              </div>

              {/* View Mode Switcher: Visual WYSIWYG | Source HTML | Reader Preview */}
              <div style={{ display: 'flex', gap: '0.25rem', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleModeSwitch('visual')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: editorMode === 'visual' ? '#ffffff' : 'transparent',
                    color: editorMode === 'visual' ? '#2563eb' : '#64748b',
                    boxShadow: editorMode === 'visual' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                  title="Visual WYSIWYG Editor: View real images & YouTube video players while writing"
                >
                  <Sparkles size={14} />
                  <span>Visual Editor</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeSwitch('code')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: editorMode === 'code' ? '#ffffff' : 'transparent',
                    color: editorMode === 'code' ? '#2563eb' : '#64748b',
                    boxShadow: editorMode === 'code' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                  title="Source HTML Code Editor"
                >
                  <Code size={14} />
                  <span>HTML Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeSwitch('preview')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: editorMode === 'preview' ? '#ffffff' : 'transparent',
                    color: editorMode === 'preview' ? '#2563eb' : '#64748b',
                    boxShadow: editorMode === 'preview' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                  title="Live Reader View Preview"
                >
                  <Eye size={14} />
                  <span>Inline Preview</span>
                </button>
              </div>
            </div>

            {/* Rich Editor Toolbar (Active in Visual and Code mode) */}
            {editorMode !== 'preview' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                flexWrap: 'wrap',
                padding: '0.5rem 0.75rem',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderBottom: 'none',
                borderRadius: '8px 8px 0 0'
              }}>
                <button type="button" className="btn-icon btn-secondary" title="Heading 2" onClick={() => handleToolbarFormat('h2')}>
                  <Heading2 size={16} />
                </button>
                <button type="button" className="btn-icon btn-secondary" title="Heading 3" onClick={() => handleToolbarFormat('h3')}>
                  <Heading3 size={16} />
                </button>
                <button type="button" className="btn-icon btn-secondary" title="Paragraph" onClick={() => handleToolbarFormat('p')}>
                  P
                </button>

                <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 0.25rem' }} />

                <button type="button" className="btn-icon btn-secondary" title="Bold" onClick={() => handleToolbarFormat('bold')}>
                  <Bold size={16} />
                </button>
                <button type="button" className="btn-icon btn-secondary" title="Italic" onClick={() => handleToolbarFormat('italic')}>
                  <Italic size={16} />
                </button>
                <button type="button" className="btn-icon btn-secondary" title="Underline" onClick={() => handleToolbarFormat('underline')}>
                  <Underline size={16} />
                </button>
                <button type="button" className="btn-icon btn-secondary" title="Code snippet" onClick={() => handleToolbarFormat('code')}>
                  <Code size={16} />
                </button>

                <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 0.25rem' }} />

                <button type="button" className="btn-icon btn-secondary" title="Bullet List" onClick={() => handleToolbarFormat('ul')}>
                  <List size={16} />
                </button>
                <button type="button" className="btn-icon btn-secondary" title="Numbered List" onClick={() => handleToolbarFormat('ol')}>
                  <ListOrdered size={16} />
                </button>
                <button type="button" className="btn-icon btn-secondary" title="Blockquote" onClick={() => handleToolbarFormat('quote')}>
                  <Quote size={16} />
                </button>
                <button type="button" className="btn-icon btn-secondary" title="Insert Link" onClick={() => handleToolbarFormat('link')}>
                  <LinkIcon size={16} />
                </button>

                <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 0.25rem' }} />

                {/* Insert Image: Upload File */}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  title="Upload image at cursor position (Supabase Storage)"
                  onClick={() => inContentImageInputRef.current?.click()}
                  style={{ gap: '0.35rem', fontSize: '0.8rem', color: '#2563eb', borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }}
                >
                  <ImageIcon size={14} />
                  <span>Insert Image</span>
                </button>

                {/* Insert Image via URL */}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  title="Insert image from external web URL"
                  onClick={handleInsertImageUrl}
                  style={{ gap: '0.35rem', fontSize: '0.8rem' }}
                >
                  <LinkIcon size={13} />
                  <span>Image URL</span>
                </button>

                {/* Embed YouTube Video */}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  title="Embed YouTube video (watch, youtu.be, or shorts)"
                  onClick={() => handleInsertYouTube()}
                  style={{ gap: '0.35rem', fontSize: '0.8rem', color: '#dc2626', borderColor: '#fca5a5', backgroundColor: '#fff5f5' }}
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

            {/* Visual WYSIWYG Editor: Renders real images & YouTube embeds directly */}
            {editorMode === 'visual' && (
              <div
                ref={visualEditorRef}
                className="admin-visual-editor article-rich-body"
                contentEditable="true"
                suppressContentEditableWarning={true}
                onInput={handleVisualEditorInput}
                onClick={handleVisualEditorClick}
                onKeyDown={handleVisualEditorKeyDown}
                onMouseDown={handleVisualEditorMouseDown}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onPaste={handlePaste}
                data-placeholder="Start typing your article here... You can paste images from clipboard, paste YouTube URLs to instantly embed playable video players, or click the toolbar buttons above."
              />
            )}

            {/* Raw HTML Code Editor */}
            {editorMode === 'code' && (
              <textarea
                ref={textareaRef}
                className="form-textarea"
                style={{
                  minHeight: '460px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.875rem',
                  lineHeight: 1.65,
                  borderRadius: '0 0 8px 8px',
                  borderTop: 'none',
                  backgroundColor: '#ffffff',
                  color: '#0f172a'
                }}
                placeholder="Edit raw HTML markup..."
                value={form.content}
                onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                onPaste={handlePaste}
              />
            )}

            {/* Reader Inline Preview */}
            {editorMode === 'preview' && (
              <div style={{
                minHeight: '460px',
                padding: '2rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                backgroundColor: '#ffffff'
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

      {/* FULL-FIDELITY PREVIEW MODAL (White UI Matching Public Site) */}
      {showPreviewModal && (
        <div className="modal-overlay" onClick={() => setShowPreviewModal(false)} style={{ zIndex: 100, padding: '1rem', backgroundColor: 'rgba(15, 23, 42, 0.45)' }}>
          <div
            className="modal-dialog"
            style={{
              maxWidth: '920px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              borderRadius: '16px',
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="badge badge-published" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                  Live Reader Preview
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Slug: /{form.slug || 'preview'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowPreviewModal(false)}
                  style={{ background: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                >
                  <ArrowLeft size={14} />
                  <span>Back to Editor</span>
                </button>
              </div>
            </div>

            {/* Modal Body: Identical to public PostDetailPage.jsx layout */}
            <article style={{ padding: '2rem 2.5rem 3.5rem', backgroundColor: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <span className="badge badge-published" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                  {categories.find(c => c.id === form.categoryId)?.name || 'General'}
                </span>
                <span className={`badge ${form.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                  {form.status.toUpperCase()}
                </span>
              </div>

              <h1 style={{
                fontSize: 'clamp(1.75rem, 3.5vw, 2.35rem)',
                fontWeight: 800,
                color: '#0f172a',
                lineHeight: 1.3,
                marginBottom: '1.25rem',
                letterSpacing: '-0.02em'
              }}>
                {form.title || 'Untitled Article'}
              </h1>

              {/* Metadata Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                color: '#64748b',
                fontSize: '0.85rem',
                paddingBottom: '1.25rem',
                borderBottom: '1px solid #e2e8f0',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={15} />
                  <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Eye size={15} />
                  <span>Preview Mode</span>
                </div>
              </div>

              {/* Cover Image */}
              {form.coverImage && (
                <div style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginBottom: '2.5rem',
                  maxHeight: '440px',
                  border: '1px solid #e2e8f0'
                }}>
                  <img
                    src={form.coverImage}
                    alt={form.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}

              {/* Excerpt */}
              {form.excerpt && (
                <div style={{
                  fontSize: '1.15rem',
                  color: '#334155',
                  lineHeight: 1.65,
                  fontStyle: 'italic',
                  marginBottom: '2.25rem',
                  paddingLeft: '1.5rem',
                  borderLeft: '4px solid #2563eb',
                  backgroundColor: '#f8fafc',
                  padding: '1.25rem 1.5rem',
                  borderRadius: '0 12px 12px 0'
                }}>
                  {form.excerpt}
                </div>
              )}

              {/* Article Content with Rich Media Embeds */}
              <div style={{ marginBottom: '3rem' }}>
                <RichContentRenderer content={form.content} />
              </div>
            </article>
          </div>
        </div>
      )}
    </div>
  );
}
