import React, { useState, useEffect } from 'react';
import { useBlog } from '../../context/BlogContext';
import { 
  Save, 
  ArrowLeft, 
  Eye, 
  Sparkles, 
  Heading1,
  Heading2, 
  Heading3, 
  Bold, 
  Italic, 
  Underline,
  Type,
  Palette,
  Highlighter,
  AlignCenter,
  AlignLeft,
  AlignRight,
  ListOrdered,
  Monitor,
  Smartphone,
  Tablet as TabletIcon,
  Quote, 
  List, 
  Table, 
  Image as ImageIcon, 
  CheckCircle, 
  Globe, 
  DollarSign,
  AlertCircle,
  Wand2,
  FileText,
  Video,
  Link as LinkIcon,
  PlusCircle,
  Upload,
  X,
  ExternalLink,
  Clock,
  Zap,
  User,
  Share2,
  Layers,
  ThumbsUp,
  Lightbulb,
  TrendingUp,
  Lock
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { supabaseStorage } from '../../services/supabaseStorage';
import { ShortLinkModal } from '../../components/admin/ShortLinkModal';
import { api } from '../../services/api';
import {
  extractYouTubeVideoId,
  extractStandaloneYouTubeId,
  buildYouTubeEmbedHtml,
  isEmptyVisualHtml,
  resolveContentToSave,
  sanitizePastedHtml,
  replaceYouTubeUrlsWithEmbeds,
  stripYouTubeEditorChrome,
  decorateYouTubeBlocks,
  convertTypedYouTubeUrls,
  moveYouTubeBlock,
  placeYouTubeBlockAtPoint
} from '../../utils/postEditor';

const SAMPLE_COVERS = [
  { name: 'Tài Chính & Đầu Tư', url: 'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_24.jpg' },
  { name: 'AI & Công Nghệ Cao', url: 'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_25.jpg' },
  { name: 'Sức Khỏe & Giấc Ngủ', url: 'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_26.jpg' },
  { name: 'Không Gian Sống Hiện Đại', url: 'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_27.jpg' },
  { name: 'Phân Tích Dữ Liệu Thị Trường', url: 'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_28.jpg' },
];

export const AdminPostEditor = ({ postId }) => {
  const { posts, categories, authors, savePost, addCategory, navigate, showToast, showPrompt, userRole, currentUser } = useBlog();

  const isGlobalAdmin = userRole === 'admin' || currentUser?.role === 'admin';
  const listPost = postId ? posts.find(p => p.id === postId || p.slug === postId) : null;
  const [fullPost, setFullPost] = useState(null);
  const existingPost = fullPost || listPost;

  // Check if staff has permission to edit this post:
  // Admin has 100% full access. Staff can edit their own posts or when granted canManagePosts permission.
  const hasManagePostsPermission = Boolean(currentUser?.permissions?.canManagePosts);
  const isPostOwner = !existingPost || isGlobalAdmin || hasManagePostsPermission || (
    (existingPost.createdById && (String(existingPost.createdById) === String(currentUser?.id) || String(existingPost.createdById).toLowerCase() === String(currentUser?.username).toLowerCase())) ||
    (existingPost.authorId && (String(existingPost.authorId) === String(currentUser?.id) || String(existingPost.authorId) === String(currentUser?.authorId))) ||
    (existingPost.authorName && currentUser?.name && existingPost.authorName.toLowerCase().includes(currentUser.name.toLowerCase())) ||
    (existingPost.createdByName && currentUser?.name && existingPost.createdByName.toLowerCase().includes(currentUser.name.toLowerCase()))
  );

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    coverImage: SAMPLE_COVERS[0].url,
    categoryId: categories[0]?.id || 'cat-money',
    authorId: currentUser?.authorId || currentUser?.id || authors[0]?.id || 'author-1',
    factCheckerId: authors[1]?.id || 'author-2',
    readTime: '6 phút đọc',
    status: 'published',
    featured: false,
    tagsString: 'Tài chính cá nhân, Đầu tư, Cổ phiếu Mỹ',
    metaTitle: '',
    metaDescription: '',
    focusKeyword: '',
    enableAds: true,
    content: '',
    createdById: currentUser?.id || '',
    createdByName: currentUser?.name || ''
  });

  const [activeTab, setActiveTab] = useState('write'); // 'write' or 'preview'
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShortLinkModalOpen, setIsShortLinkModalOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const visualEditorRef = React.useRef(null);
  const textareaRef = React.useRef(null);
  const isContentMountedRef = React.useRef(false);
  const loadedFromListRef = React.useRef(false);
  const loadedFromApiRef = React.useRef(false);
  const ytDragRef = React.useRef(null);
  const ytSelectedRef = React.useRef(null);

  const syncVisualToForm = () => {
    if (!visualEditorRef.current) return;
    decorateYouTubeBlocks(visualEditorRef.current);
    const clean = stripYouTubeEditorChrome(visualEditorRef.current.innerHTML || '');
    setFormData(prev => ({ ...prev, content: clean }));
  };

  const insertHtmlIntoEditor = (html) => {
    const snippet = String(html || '');
    if (!snippet.trim()) return;
    if (activeTab === 'write' && visualEditorRef.current) {
      visualEditorRef.current.focus();
      const marker = snippet.includes('youtube.com/embed/')
        ? 'youtube.com/embed/'
        : snippet.trim().slice(0, 48);
      try {
        document.execCommand('insertHTML', false, snippet);
      } catch {
        // contentEditable insertHTML can reject iframes; fall through to append
      }
      const current = visualEditorRef.current.innerHTML || '';
      if (!current.includes(marker)) {
        visualEditorRef.current.innerHTML = current + snippet;
      }
      decorateYouTubeBlocks(visualEditorRef.current);
      const next = stripYouTubeEditorChrome(visualEditorRef.current.innerHTML || '');
      setFormData(prev => ({ ...prev, content: next }));
      isContentMountedRef.current = true;
      return;
    }
    setFormData(prev => ({ ...prev, content: replaceYouTubeUrlsWithEmbeds((prev.content || '') + snippet) }));
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showToast('Vui lòng nhập tên chuyên mục', 'error');
      return;
    }
    try {
      const created = await addCategory({
        name: newCatName.trim(),
        slug: generateSlug(newCatName),
        description: newCatDesc.trim(),
        color: 'blue'
      });
      if (created && created.id) {
        setFormData(prev => ({ ...prev, categoryId: created.id }));
      }
      setShowCatModal(false);
      setNewCatName('');
      setNewCatDesc('');
    } catch {
      // Toast is shown by addCategory
    }
  };

  useEffect(() => {
    loadedFromListRef.current = false;
    loadedFromApiRef.current = false;
    setFullPost(null);
    isContentMountedRef.current = false;
    if (!postId) return undefined;

    let cancelled = false;
    api.getPostBySlug(postId).then((data) => {
      if (cancelled || !data || !(data.id || data.slug)) return;
      setFullPost(data);
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [postId]);

  useEffect(() => {
    if (!listPost || loadedFromListRef.current) return;
    loadedFromListRef.current = true;
    setFormData({
      ...listPost,
      tagsString: listPost.tags ? listPost.tags.join(', ') : ''
    });
    isContentMountedRef.current = false;
  }, [listPost]);

  useEffect(() => {
    if (!fullPost || loadedFromApiRef.current) return;
    loadedFromApiRef.current = true;
    setFormData((prev) => ({
      ...prev,
      ...fullPost,
      tagsString: Array.isArray(fullPost.tags) ? fullPost.tags.join(', ') : (prev.tagsString || ''),
      content: (fullPost.content && fullPost.content.length >= String(prev.content || '').length)
        ? fullPost.content
        : (prev.content || fullPost.content || '')
    }));
    isContentMountedRef.current = false;
  }, [fullPost]);

  const generateSlug = (text = '') => {
    let clean = String(text || '')
      .replace(/<[^>]*>/g, ' ') // Strip HTML tags
      .replace(/https?:\/\/[^\s]+/gi, '') // Strip full URLs
      .replace(/www\.[^\s]+/gi, '')
      .replace(/href\s*=\s*["'][^"']*["']/gi, '')
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return clean || `bai-viet-${Date.now().toString(36)}`;
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    const isAutoSlug = !formData.slug || formData.slug === generateSlug(formData.title);
    setFormData(prev => ({
      ...prev,
      title,
      slug: isAutoSlug ? generateSlug(title) : prev.slug,
      metaTitle: (!prev.metaTitle || prev.metaTitle === prev.title) ? title : prev.metaTitle
    }));
  };

  const handleInsertAiOutline = () => {
    const outlineSnippet = `
<p>Trong bối cảnh kinh tế vĩ mô và công nghệ biến chuyển nhanh chóng, các nhà đầu tư và chuyên gia hàng đầu luôn tìm kiếm những chiến lược tối ưu hóa nguồn lực có tính toán bài bản.</p>

<div class="my-6 p-5 bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-blue-600 rounded-r-lg">
  <h4 class="font-bold text-blue-900 dark:text-blue-300 mb-2">Điểm Cốt Lõi Cần Nắm Vững (Key Takeaways)</h4>
  <ul class="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc pl-5">
    <li>Chiến lược phân bổ thanh khoản đa tầng giúp bảo vệ danh mục trước các biến động ngắn hạn.</li>
    <li>Tận dụng các ưu đãi thuế suất và lãi suất thực để tối đa hóa tỷ suất sinh lời ròng.</li>
    <li>Thiết lập quy trình tự động hóa nhằm giảm thiểu các quyết định mang tính cảm xúc.</li>
  </ul>
</div>

<h2>1. Nền Tảng Lý Thuyết & Bối Cảnh Thực Tế</h2>
<p>Mô tả chi tiết nguyên lý hoạt động, dữ liệu thống kê từ các cơ quan quản lý và các trường hợp điển hình đã được kiểm chứng.</p>

<h2>2. Bảng So Sánh Hiệu Quả Giữa Các Phương Án</h2>
<div class="overflow-x-auto my-6">
  <table class="min-w-full text-left text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg">
    <thead class="bg-neutral-100 dark:bg-neutral-800 font-semibold">
      <tr>
        <th class="p-3 border-b">Giải Pháp</th>
        <th class="p-3 border-b">Tính Thanh Khoản</th>
        <th class="p-3 border-b">Lợi Thế Vượt Trội</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-neutral-200 dark:divide-neutral-800">
      <tr>
        <td class="p-3 font-medium">Chiến Lược Tối Ưu A</td>
        <td class="p-3">Tức thì (T+0)</td>
        <td class="p-3 text-emerald-600">Linh hoạt, bảo toàn vốn</td>
      </tr>
      <tr>
        <td class="p-3 font-medium">Chiến Lược Nâng Cao B</td>
        <td class="p-3">Trung hạn (T+30)</td>
        <td class="p-3 text-blue-600">Lợi tức thực cao hơn lạm phát</td>
      </tr>
    </tbody>
  </table>
</div>

<blockquote>
  "Sự thành công bền vững trong quản trị tài chính và công nghệ không đến từ may mắn, mà là kết quả của tính kỷ luật và khả năng thực thi nhất quán."
</blockquote>

<h2>3. Lộ Trình Triển Khai Thực Tiễn</h2>
<p>Hướng dẫn từng bước cụ thể để độc giả có thể áp dụng trực tiếp vào công việc và danh mục đầu tư của mình ngay hôm nay.</p>
`;
    insertHtmlIntoEditor(outlineSnippet);
  };

  // Sync content into visual editor on initial load, tab switch, or fetched post
  useEffect(() => {
    if (activeTab !== 'write') {
      isContentMountedRef.current = false;
      return;
    }
    if (visualEditorRef.current && !isContentMountedRef.current) {
      visualEditorRef.current.innerHTML = formData.content || '';
      decorateYouTubeBlocks(visualEditorRef.current);
      isContentMountedRef.current = true;
    }
  }, [activeTab, formData.content, existingPost]);

  const switchTab = (newTab) => {
    if (newTab === activeTab) return;
    if (activeTab === 'write' && visualEditorRef.current) {
      const visualHtml = stripYouTubeEditorChrome(visualEditorRef.current.innerHTML || '');
      if (!isEmptyVisualHtml(visualHtml)) {
        setFormData(prev => ({ ...prev, content: visualHtml }));
      }
    } else if (activeTab === 'code' && textareaRef.current) {
      setFormData(prev => ({ ...prev, content: textareaRef.current.value || prev.content }));
    }
    if (newTab === 'write') {
      isContentMountedRef.current = false;
    }
    setActiveTab(newTab);
  };

  const handleVisualInput = () => {
    if (!visualEditorRef.current) return;
    convertTypedYouTubeUrls(visualEditorRef.current);
    syncVisualToForm();
  };

  const handleFormatVisual = (command, value = null) => {
    if (visualEditorRef.current) {
      visualEditorRef.current.focus();
    }

    if (command === 'fontSize') {
      const sizePx = value || '18';
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (!range.collapsed) {
          const span = document.createElement('span');
          span.style.fontSize = `${sizePx}px`;
          span.style.lineHeight = '1.6';
          span.appendChild(range.extractContents());
          range.insertNode(span);
          selection.removeAllRanges();
          const newRange = document.createRange();
          newRange.selectNodeContents(span);
          selection.addRange(newRange);
        } else {
          document.execCommand('insertHTML', false, `<span style="font-size: ${sizePx}px;">Văn bản cỡ ${sizePx}px</span>`);
        }
      }
    } else if (command === 'heading') {
      if (value === 'p') {
        document.execCommand('formatBlock', false, '<p>');
      } else {
        document.execCommand('formatBlock', false, `<${value}>`);
      }
    } else if (command === 'color') {
      document.execCommand('foreColor', false, value);
    } else if (command === 'highlight') {
      document.execCommand('hiliteColor', false, '#FEF08A');
    } else if (command === 'table') {
      const tableHtml = `
<div class="overflow-x-auto my-6">
  <table class="min-w-full text-left text-sm border border-neutral-300 rounded-lg">
    <thead class="bg-neutral-100 font-semibold">
      <tr><th class="p-3 border">Hạng Mục</th><th class="p-3 border">Số Liệu</th><th class="p-3 border">Đánh Giá</th></tr>
    </thead>
    <tbody class="divide-y divide-neutral-200">
      <tr><td class="p-3 border">Mô Hình A</td><td class="p-3 border">+15.4%</td><td class="p-3 border text-emerald-600 font-bold">Xuất Sắc</td></tr>
      <tr><td class="p-3 border">Mô Hình B</td><td class="p-3 border">+8.2%</td><td class="p-3 border text-blue-600">Ổn Định</td></tr>
    </tbody>
  </table>
</div><p><br></p>
`;
      document.execCommand('insertHTML', false, tableHtml);
    } else if (command === 'callout') {
      const calloutHtml = `
<div class="my-6 p-4 bg-blue-50 border-l-4 border-blue-600 rounded-r-lg">
  <h4 class="font-bold text-blue-900 mb-1 text-base">💡 Điểm Nhấn Chiến Lược</h4>
  <p class="text-sm text-blue-800">Nhập tóm tắt ý quan trọng nhất cho độc giả tại đây...</p>
</div><p><br></p>
`;
      document.execCommand('insertHTML', false, calloutHtml);
    } else if (command === 'quote') {
      document.execCommand('formatBlock', false, '<blockquote>');
    } else if (command === 'hr') {
      document.execCommand('insertHorizontalRule', false, null);
    } else {
      document.execCommand(command, false, value);
    }

    if (visualEditorRef.current) {
      syncVisualToForm();
    }
  };

  const handleVisualPaste = (e) => {
    const text = (e.clipboardData?.getData('text/plain') || '').trim();
    const html = e.clipboardData?.getData('text/html') || '';
    const standaloneId = extractStandaloneYouTubeId(text);

    if (standaloneId) {
      e.preventDefault();
      insertHtmlIntoEditor(buildYouTubeEmbedHtml(standaloneId));
      showToast('Đã nhúng video YouTube từ liên kết vừa dán!', 'success');
      return;
    }

    if (html && html.includes('<')) {
      const cleanHtml = replaceYouTubeUrlsWithEmbeds(sanitizePastedHtml(html));
      if (cleanHtml.length > 20) {
        e.preventDefault();
        document.execCommand('insertHTML', false, cleanHtml);
      }
    } else if (text && extractYouTubeVideoId(text)) {
      e.preventDefault();
      document.execCommand('insertHTML', false, replaceYouTubeUrlsWithEmbeds(text));
    }

    setTimeout(() => {
      if (!visualEditorRef.current) return;
      convertTypedYouTubeUrls(visualEditorRef.current);
      syncVisualToForm();
    }, 50);
  };

  const handleVisualMouseDown = (e) => {
    const editor = visualEditorRef.current;
    if (!editor) return;
    const moveBtn = e.target.closest('[data-yt-move]');
    const deleteBtn = e.target.closest('[data-yt-delete]');
    const block = e.target.closest('.yt-embed-block');
    if (!block || !editor.contains(block)) return;

    if (moveBtn) {
      e.preventDefault();
      e.stopPropagation();
      moveYouTubeBlock(block, moveBtn.getAttribute('data-yt-move'));
      block.classList.add('yt-embed-selected');
      ytSelectedRef.current = block;
      syncVisualToForm();
      return;
    }

    if (deleteBtn) {
      e.preventDefault();
      e.stopPropagation();
      block.remove();
      ytSelectedRef.current = null;
      if (!editor.innerHTML.trim()) editor.innerHTML = '<p><br></p>';
      syncVisualToForm();
      showToast('Đã xóa video YouTube khỏi bài viết', 'info');
    }
  };

  const handleVisualClick = (e) => {
    const editor = visualEditorRef.current;
    if (!editor) return;
    editor.querySelectorAll('.yt-embed-selected').forEach((el) => el.classList.remove('yt-embed-selected'));
    const block = e.target.closest('.yt-embed-block');
    if (block && editor.contains(block)) {
      block.classList.add('yt-embed-selected');
      ytSelectedRef.current = block;
    } else {
      ytSelectedRef.current = null;
    }
  };

  const handleVisualKeyDown = (e) => {
    if (e.key !== 'Backspace' && e.key !== 'Delete') return;
    const selected = ytSelectedRef.current;
    if (!selected || !visualEditorRef.current?.contains(selected)) return;
    e.preventDefault();
    selected.remove();
    ytSelectedRef.current = null;
    if (!visualEditorRef.current.innerHTML.trim()) {
      visualEditorRef.current.innerHTML = '<p><br></p>';
    }
    syncVisualToForm();
    showToast('Đã xóa video YouTube khỏi bài viết', 'info');
  };

  const handleVisualDragStart = (e) => {
    const block = e.target.closest?.('.yt-embed-block');
    if (!block || !visualEditorRef.current?.contains(block)) return;
    if (e.target.closest('.yt-embed-toolbar')) {
      e.preventDefault();
      return;
    }
    ytDragRef.current = block;
    block.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'youtube-block');
  };

  const handleVisualDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = ytDragRef.current ? 'move' : 'copy';
  };

  const handleVisualDrop = (e) => {
    e.preventDefault();
    if (!visualEditorRef.current) return;
    const dragging = ytDragRef.current;
    if (dragging) {
      placeYouTubeBlockAtPoint(visualEditorRef.current, dragging, e.clientY);
      dragging.classList.remove('is-dragging');
      ytDragRef.current = null;
      syncVisualToForm();
      return;
    }

    const dropped = (e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain') || '')
      .split('\n')
      .map((line) => line.trim())
      .find(Boolean) || '';
    const droppedId = extractYouTubeVideoId(dropped);
    if (!droppedId) return;
    insertHtmlIntoEditor(buildYouTubeEmbedHtml(droppedId));
    const placed = [...visualEditorRef.current.querySelectorAll(`.yt-embed-block[data-youtube-id="${droppedId}"]`)].pop();
    if (placed) placeYouTubeBlockAtPoint(visualEditorRef.current, placed, e.clientY);
    syncVisualToForm();
    showToast('Đã nhúng video YouTube từ liên kết vừa kéo thả!', 'success');
  };

  const handleVisualDragEnd = () => {
    if (ytDragRef.current) {
      ytDragRef.current.classList.remove('is-dragging');
    }
    ytDragRef.current = null;
  };

  const handlePaste = (e) => {
    const text = (e.clipboardData?.getData('text/plain') || '').trim();
    const html = e.clipboardData?.getData('text/html');
    const standaloneId = extractStandaloneYouTubeId(text);
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (standaloneId) {
      e.preventDefault();
      const embed = buildYouTubeEmbedHtml(standaloneId);
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const current = formData.content || '';
      const newContent = current.substring(0, start) + embed + current.substring(end);
      setFormData(prev => ({ ...prev, content: newContent }));
      showToast('Đã nhúng video YouTube từ liên kết vừa dán!', 'success');
      return;
    }

    if (html && html.includes('<')) {
      const cleanHtml = replaceYouTubeUrlsWithEmbeds(sanitizePastedHtml(html));

      if (cleanHtml.length > 20) {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const current = formData.content || '';
        const newContent = current.substring(0, start) + cleanHtml + current.substring(end);
        setFormData(prev => ({ ...prev, content: newContent }));
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + cleanHtml.length;
        }, 0);
        showToast('Đã giữ nguyên định dạng Rich Text từ văn bản dán vào!', 'info');
      }
    }
  };

  const handleInsertYouTube = () => {
    showPrompt({
      title: 'Chèn Video YouTube Vào Bài Viết',
      message: 'Nhập đường dẫn URL của Video YouTube để hệ thống tự động nhúng khung phát chuẩn 16:9 sắc nét.',
      placeholder: 'https://www.youtube.com/watch?v=... hoặc https://youtu.be/...',
      inputLabel: 'Đường dẫn YouTube URL:',
      confirmText: 'Nhúng Video',
      onConfirm: (rawUrl) => {
        if (!rawUrl || !rawUrl.trim()) return;
        const videoId = extractYouTubeVideoId(rawUrl);
        if (!videoId) {
          showToast('Không tìm thấy Video ID hợp lệ từ liên kết YouTube vừa nhập', 'warning');
          return;
        }

        const embedHtml = buildYouTubeEmbedHtml(videoId);
        insertHtmlIntoEditor(embedHtml);
        showToast('Đã chèn khung video YouTube thành công!', 'success');
      }
    });
  };

  const coverFileInputRef = React.useRef(null);
  const contentFileInputRef = React.useRef(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageModalTab, setImageModalTab] = useState('upload'); // 'upload' | 'url' | 'cdn'
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');

  // Client-side image compressor: scales down & converts to optimized WebP
  const compressImage = (file, maxWidth = 1200, quality = 0.82) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/webp', quality));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleCoverFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      // 1. Upload directly to Supabase Storage bucket 'postnew'
      try {
        const res = await supabaseStorage.uploadImage(file);
        if (res && res.url) {
          setFormData(prev => ({ ...prev, coverImage: res.url }));
          showToast('Đã tải ảnh lên Supabase Storage (postnew) thành công!', 'success');
          return;
        }
      } catch (cloudErr) {
        console.warn('Supabase cloud upload fallback to local compress:', cloudErr);
      }

      // 2. Fallback to client-side compressed WebP
      const compressed = await compressImage(file, 1400, 0.85);
      setFormData(prev => ({ ...prev, coverImage: compressed }));
      showToast('Đã tải lên và nén ảnh bìa thành công!', 'success');
    } catch (err) {
      showToast('Không thể xử lý file ảnh', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleContentFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const caption = imageCaption || file.name.replace(/\.[^/.]+$/, "");
      let finalImgUrl = '';

      // 1. Upload to Supabase Storage
      try {
        const res = await supabaseStorage.uploadImage(file);
        if (res && res.url) {
          finalImgUrl = res.url;
        }
      } catch (cloudErr) {
        console.warn('Supabase cloud upload fallback to local compress:', cloudErr);
      }

      // 2. Fallback to client-side compressed WebP
      if (!finalImgUrl) {
        finalImgUrl = await compressImage(file, 1200, 0.82);
      }

      const imageHtml = `
<figure class="my-8 rounded-3xl overflow-hidden shadow-lg border border-neutral-200 dark:border-neutral-800">
  <img src="${finalImgUrl}" alt="${caption}" class="w-full h-auto object-cover rounded-3xl" loading="lazy" />
  ${caption ? `<figcaption class="text-xs text-center text-neutral-500 dark:text-neutral-400 mt-2 font-mono">${caption}</figcaption>` : ''}
</figure>
`;
      insertHtmlIntoEditor(imageHtml);
      setShowImageModal(false);
      setImageCaption('');
      showToast('Đã tải ảnh lên Supabase & chèn vào bài viết thành công!', 'success');
    } catch (err) {
      showToast('Lỗi khi tải hoặc nén ảnh', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleInsertUrlImage = () => {
    if (!customImageUrl.trim()) {
      showToast('Vui lòng nhập đường dẫn hình ảnh', 'error');
      return;
    }
    const caption = imageCaption || 'Minh họa nội dung';
    const imageHtml = `
<figure class="my-8 rounded-3xl overflow-hidden shadow-lg border border-neutral-200 dark:border-neutral-800">
  <img src="${customImageUrl.trim()}" alt="${caption}" class="w-full h-auto object-cover rounded-3xl" loading="lazy" />
  ${caption ? `<figcaption class="text-xs text-center text-neutral-500 dark:text-neutral-400 mt-2 font-mono">${caption}</figcaption>` : ''}
</figure>
`;
    insertHtmlIntoEditor(imageHtml);
    setShowImageModal(false);
    setCustomImageUrl('');
    setImageCaption('');
    showToast('Đã chèn hình ảnh vào bài viết!', 'success');
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const contentToSave = resolveContentToSave({
      activeTab,
      formContent: formData.content,
      visualHtml: visualEditorRef.current ? visualEditorRef.current.innerHTML : '',
      textareaValue: textareaRef.current ? textareaRef.current.value : formData.content
    });

    if (!formData.title.trim() || !contentToSave) {
      showToast('Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết (*)', 'warning');
      return;
    }

    if (existingPost && String(existingPost.content || '').trim().length > 50 && isEmptyVisualHtml(contentToSave)) {
      showToast('Nội dung soạn thảo đang trống — hệ thống không ghi đè bài viết đã có.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const tagsArray = formData.tagsString
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      // Auto-extract a clean 160-character lead excerpt from content
      const plainTextContent = contentToSave.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const cleanExcerpt = formData.excerpt || (plainTextContent.length > 160 ? plainTextContent.slice(0, 160) + '...' : plainTextContent);

      const postPayload = {
        ...formData,
        content: contentToSave,
        excerpt: cleanExcerpt,
        tags: tagsArray,
        id: existingPost ? existingPost.id : undefined,
        slug: formData.slug || generateSlug(formData.title),
        createdById: existingPost?.createdById || currentUser?.id || 'admin',
        createdByName: existingPost?.createdByName || currentUser?.name || 'Admin',
        authorId: isGlobalAdmin ? formData.authorId : (existingPost?.authorId || currentUser?.authorId || currentUser?.id || 'author-1'),
        authorName: isGlobalAdmin 
          ? (authors.find(a => a.id === formData.authorId)?.name || formData.authorName || currentUser?.name)
          : (existingPost?.authorName || currentUser?.name)
      };

      await savePost(postPayload);
      navigate('/admin/posts');
    } catch (err) {
      console.error('Error saving post:', err);
      showToast('Lỗi khi lưu bài viết vào cơ sở dữ liệu: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guard: if existing post is not owned by current staff
  if (existingPost && !isPostOwner) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center animate-fadeIn">
        <div className="bg-white rounded-3xl border border-neutral-200 p-8 sm:p-12 space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-neutral-900">Không Có Quyền Chỉnh Sửa Bài Viết Này</h2>
          <p className="text-sm text-neutral-600 max-w-md mx-auto">
            Bài viết này do tài khoản khác tạo. Bạn chỉ có quyền chỉnh sửa bài viết do chính bạn ({currentUser?.name || 'Tài khoản của bạn'}) đăng tải.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/admin/posts')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold font-mono transition-all"
            >
              ← Về Danh Sách Bài Viết Của Bạn
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SEO Score Calculations
  const metaTitleLength = (formData.metaTitle || formData.title || '').length;
  const metaDescLength = (formData.metaDescription || formData.excerpt || '').length;
  const wordCount = (formData.content || '').replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;

  return (
    <form onSubmit={handleSave} className="space-y-8 animate-fadeIn pb-16">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => navigate('/admin/posts')}
            className="p-2 bg-white dark:bg-[#111622] hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300"
            title="Quay lại danh sách bài viết"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-serif text-2xl font-bold text-neutral-950 dark:text-neutral-50">
              {existingPost ? 'Chỉnh Sửa Bài Viết Chuyên Sâu' : 'Soạn Thảo Bài Viết Mới'}
            </h1>
            <p className="text-xs text-neutral-500">
              Trình soạn thảo chuẩn SEO Google, tối ưu độ dài từ khóa và tích hợp vị trí AdSense.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {existingPost && (
            <button
              type="button"
              onClick={() => setIsShortLinkModalOpen(true)}
              className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold border border-purple-200 flex items-center gap-1.5 transition-all shadow-xs"
              title="Tạo link rút gọn bài viết này để rải seeding MXH"
            >
              <Zap className="w-3.5 h-3.5 text-purple-600" />
              <span>🔗 Rút Gọn Link</span>
            </button>
          )}

          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="px-3.5 py-2 bg-white dark:bg-[#111622] border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-semibold text-neutral-800 dark:text-neutral-200"
          >
            <option value="published">Trạng thái: Đã Xuất Bản (Live)</option>
            <option value="draft">Trạng thái: Bản Nháp (Draft)</option>
          </select>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Đang Lưu...' : (existingPost ? 'Lưu Thay Đổi' : 'Xuất Bản Bài Viết')}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 8 Cols Content + 4 Cols Metadata & SEO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Cols: Title & Rich Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Article Title & Basic Meta */}
          <div className="p-6 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                Tiêu Đề Bài Báo Phân Tích (Headline) *
              </label>
              <input
                type="text"
                placeholder="Nhập tiêu đề ấn tượng, có từ khóa và số liệu hấp dẫn độc giả..."
                value={formData.title}
                onChange={handleTitleChange}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl font-serif text-lg font-bold text-neutral-900 dark:text-neutral-50 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-neutral-500 mb-1">
                  Đường Dẫn Thân Thiện (URL Slug)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, slug: generateSlug(prev.title) }))}
                    className="px-2.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 rounded-lg text-[10px] font-bold font-mono whitespace-nowrap flex-shrink-0"
                    title="Tự động tạo lại đường dẫn slug chuẩn từ tiêu đề"
                  >
                    🔄 Tạo lại
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-neutral-500 mb-1">
                  Thời Gian Đọc Dự Tính
                </label>
                <input
                  type="text"
                  value={formData.readTime}
                  onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                  placeholder="Ví dụ: 7 phút đọc"
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Quick Top Bar: Category & Cover Image (Không cần cuộn xuống dưới) */}
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center text-xs">
              {/* Quick Category */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-700">📁 Chuyên Mục:</span>
                  <button
                    type="button"
                    onClick={() => setShowCatModal(true)}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>+ Tạo Chuyên Mục</span>
                  </button>
                </div>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg font-semibold text-neutral-900 focus:outline-none focus:border-blue-500"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Quick Cover Image Thumbnail & Uploader */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-700">🖼️ Ảnh Bìa:</span>
                  <button
                    type="button"
                    onClick={() => coverFileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{uploadingImage ? 'Đang tải...' : '+ Tải Ảnh Từ Máy'}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {formData.coverImage ? (
                    <img 
                      src={formData.coverImage} 
                      alt="Thumbnail" 
                      className="w-9 h-7 object-cover rounded-md border border-neutral-300 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-7 bg-neutral-200 rounded-md flex items-center justify-center text-neutral-400 text-[10px] flex-shrink-0">
                      Chưa có
                    </div>
                  )}
                  <input
                    type="text"
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    placeholder="Dán URL ảnh hoặc bấm nút Tải Ảnh..."
                    className="flex-1 px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-[11px] truncate focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rich Content Editor & Toolbar */}
          <div className="bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden space-y-0">
            {/* Editor Tabs & Quick Visual Formatting Toolbar */}
            <div className="p-3 bg-neutral-50 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-2">
              {/* Tab Switcher */}
              <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-neutral-200 shadow-xs">
                <button
                  type="button"
                  onClick={() => switchTab('write')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${activeTab === 'write' ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Soạn Thảo Trực Quan (Word / Docs)</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchTab('preview')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${activeTab === 'preview' ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem Trước Giao Diện</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchTab('code')}
                  className={`px-2.5 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${activeTab === 'code' ? 'bg-neutral-100 text-neutral-800 border border-neutral-300' : 'text-neutral-500 hover:text-neutral-900'}`}
                  title="Xem mã HTML nguồn bài viết"
                >
                  <span>&lt;/&gt; Mã HTML</span>
                </button>
              </div>

              {/* Visual Formatting Tools (Shown in Visual mode) */}
              {activeTab === 'write' && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Cỡ chữ Dropdown */}
                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-neutral-200 shadow-xs">
                    <Type className="w-3.5 h-3.5 text-neutral-500" />
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleFormatVisual('fontSize', e.target.value);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                      className="bg-transparent text-xs font-bold text-neutral-800 focus:outline-none cursor-pointer"
                      title="Chọn cỡ chữ trực quan"
                    >
                      <option value="" disabled>Cỡ Chữ...</option>
                      <option value="12">12px - Rất nhỏ</option>
                      <option value="14">14px - Nhỏ</option>
                      <option value="16">16px - Chuẩn (16px)</option>
                      <option value="18">18px - Lớn (18px)</option>
                      <option value="20">20px - Rất lớn (20px)</option>
                      <option value="24">24px - Tiêu đề phụ (24px)</option>
                      <option value="28">28px - Tiêu đề mục (28px)</option>
                      <option value="32">32px - Tiêu đề lớn (32px)</option>
                      <option value="36">36px - Cực lớn (36px)</option>
                    </select>
                  </div>

                  {/* Định dạng Khối / Tiêu đề */}
                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-neutral-200 shadow-xs">
                    <Heading1 className="w-3.5 h-3.5 text-neutral-500" />
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleFormatVisual('heading', e.target.value);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                      className="bg-transparent text-xs font-bold text-neutral-800 focus:outline-none cursor-pointer"
                      title="Chọn định dạng tiêu đề hoặc đoạn văn"
                    >
                      <option value="" disabled>Kiểu Tiêu Đề...</option>
                      <option value="p">Đoạn văn thông thường (P)</option>
                      <option value="h1">Tiêu Đề Lớn (H1)</option>
                      <option value="h2">Tiêu Đề Chính (H2)</option>
                      <option value="h3">Tiêu Đề Mục Phụ (H3)</option>
                      <option value="h4">Tiêu Đề Nhỏ (H4)</option>
                    </select>
                  </div>

                  {/* Màu chữ Selector */}
                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-neutral-200 shadow-xs">
                    <Palette className="w-3.5 h-3.5 text-neutral-500" />
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleFormatVisual('color', e.target.value);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                      className="bg-transparent text-xs font-bold text-neutral-800 focus:outline-none cursor-pointer"
                      title="Chọn màu chữ"
                    >
                      <option value="" disabled>Màu Chữ...</option>
                      <option value="#e11d48">🔴 Đỏ (Rose)</option>
                      <option value="#2563eb">🔵 Xanh Dương</option>
                      <option value="#059669">🟢 Xanh Lá</option>
                      <option value="#d97706">🟠 Vàng Cam</option>
                      <option value="#7c3aed">🟣 Tím (Indigo)</option>
                      <option value="#0f172a">⚫ Đen Đậm</option>
                    </select>
                  </div>

                  {/* Text Styles */}
                  <button type="button" onClick={() => handleFormatVisual('bold')} className="p-1.5 bg-white hover:bg-neutral-100 rounded-lg border border-neutral-200 text-neutral-800 font-bold shadow-xs" title="In đậm (Bold)"><Bold className="w-4 h-4" /></button>
                  <button type="button" onClick={() => handleFormatVisual('italic')} className="p-1.5 bg-white hover:bg-neutral-100 rounded-lg border border-neutral-200 text-neutral-800 italic shadow-xs" title="In nghiêng"><Italic className="w-4 h-4" /></button>
                  <button type="button" onClick={() => handleFormatVisual('underline')} className="p-1.5 bg-white hover:bg-neutral-100 rounded-lg border border-neutral-200 text-neutral-800 shadow-xs" title="Gạch chân"><Underline className="w-4 h-4" /></button>
                  <button type="button" onClick={() => handleFormatVisual('highlight')} className="p-1.5 bg-yellow-50 hover:bg-yellow-100 rounded-lg border border-yellow-200 text-amber-700 font-bold shadow-xs" title="Tô vàng Highlight"><Highlighter className="w-4 h-4" /></button>

                  {/* Alignments */}
                  <button type="button" onClick={() => handleFormatVisual('justifyLeft')} className="p-1.5 bg-white hover:bg-neutral-100 rounded-lg border border-neutral-200 text-neutral-700 shadow-xs" title="Căn trái"><AlignLeft className="w-4 h-4" /></button>
                  <button type="button" onClick={() => handleFormatVisual('justifyCenter')} className="p-1.5 bg-white hover:bg-neutral-100 rounded-lg border border-neutral-200 text-neutral-700 shadow-xs" title="Căn giữa"><AlignCenter className="w-4 h-4" /></button>
                  <button type="button" onClick={() => handleFormatVisual('justifyRight')} className="p-1.5 bg-white hover:bg-neutral-100 rounded-lg border border-neutral-200 text-neutral-700 shadow-xs" title="Căn phải"><AlignRight className="w-4 h-4" /></button>

                  {/* Lists & Blocks */}
                  <button type="button" onClick={() => handleFormatVisual('insertUnorderedList')} className="p-1.5 bg-white hover:bg-neutral-100 rounded-lg border border-neutral-200 text-neutral-700 shadow-xs" title="Danh sách gạch đầu dòng"><List className="w-4 h-4" /></button>
                  <button type="button" onClick={() => handleFormatVisual('insertOrderedList')} className="p-1.5 bg-white hover:bg-neutral-100 rounded-lg border border-neutral-200 text-neutral-700 shadow-xs" title="Danh sách số 1, 2, 3"><ListOrdered className="w-4 h-4" /></button>
                  <button type="button" onClick={() => handleFormatVisual('quote')} className="p-1.5 bg-white hover:bg-neutral-100 rounded-lg border border-neutral-200 text-neutral-700 shadow-xs" title="Trích dẫn câu nói"><Quote className="w-4 h-4" /></button>
                  <button type="button" onClick={() => handleFormatVisual('callout')} className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 text-blue-700 shadow-xs" title="Hộp Điểm Nhấn"><Sparkles className="w-4 h-4" /></button>
                  <button type="button" onClick={() => handleFormatVisual('table')} className="p-1.5 bg-white hover:bg-neutral-100 rounded-lg border border-neutral-200 text-neutral-700 shadow-xs" title="Chèn Bảng Dữ Liệu"><Table className="w-4 h-4" /></button>
                  
                  {/* YouTube & Image Inserters */}
                  <button 
                    type="button" 
                    onClick={handleInsertYouTube}
                    className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-mono font-bold flex items-center gap-1 border border-red-200 transition-colors shadow-xs"
                    title="Nhúng Video YouTube vào bài viết"
                  >
                    <Video className="w-3.5 h-3.5 text-red-600" />
                    <span>+ Video YT</span>
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setShowImageModal(true)}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-mono font-bold flex items-center gap-1 border border-emerald-200 transition-colors shadow-xs"
                    title="Tải ảnh từ máy tính hoặc chèn link CDN"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ Tải / Chèn Ảnh</span>
                  </button>

                  {/* AI Outline Assistant */}
                  <button 
                    type="button" 
                    onClick={handleInsertAiOutline}
                    className="px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg text-xs font-mono font-bold flex items-center gap-1 border border-amber-300 transition-colors ml-1 shadow-xs"
                    title="Chèn khung dàn bài mẫu chuẩn báo chí Mỹ"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>+ Dàn Ý Mẫu</span>
                  </button>
                </div>
              )}
            </div>

            {/* Word Count & Low-Tech Helper Bar */}
            <div className="px-6 py-2.5 bg-blue-50/60 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-blue-900">
                ✨ <span className="font-sans font-medium">Dán <strong>link YouTube</strong> để tự nhúng thành khối video — kéo hoặc bấm Đầu / Lên / Xuống / Cuối / Xóa để đặt vị trí. Paste từ Word, Docs, ChatGPT vẫn giữ định dạng.</span>
              </span>
              <span className={wordCount >= 1000 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                {wordCount} từ {wordCount >= 1000 ? '✓ Đạt chuẩn 1,000+ từ AdSense' : '(Khuyến nghị 1,000+ từ)'}
              </span>
            </div>

            {/* Main Visual WYSIWYG Editor / Code Editor / High-End Live Preview */}
            <div className="p-4 sm:p-6 bg-white min-h-[420px]">
              {activeTab === 'write' ? (
                <div
                  ref={visualEditorRef}
                  contentEditable
                  onInput={handleVisualInput}
                  onPaste={handleVisualPaste}
                  onMouseDown={handleVisualMouseDown}
                  onClick={handleVisualClick}
                  onKeyDown={handleVisualKeyDown}
                  onDragStart={handleVisualDragStart}
                  onDragOver={handleVisualDragOver}
                  onDrop={handleVisualDrop}
                  onDragEnd={handleVisualDragEnd}
                  className="editorial-prose min-h-[420px] p-4 sm:p-6 focus:outline-none text-neutral-900 leading-relaxed bg-white border border-neutral-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-inner"
                  style={{ minHeight: '420px' }}
                />
              ) : activeTab === 'code' ? (
                <div className="space-y-2">
                  <div className="p-2 bg-neutral-100 text-neutral-700 text-xs font-mono rounded-lg border border-neutral-200">
                    💻 Chế độ mã HTML thô (Dành cho nhà phát triển chỉnh sửa thẻ trực tiếp):
                  </div>
                  <textarea
                    ref={textareaRef}
                    rows="16"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    onPaste={handlePaste}
                    className="w-full font-mono text-sm bg-neutral-900 text-neutral-100 p-4 rounded-xl border border-neutral-700 focus:outline-none focus:border-blue-500 leading-relaxed resize-y min-h-[380px]"
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Device Preview Switcher Bar */}
                  <div className="flex flex-wrap items-center justify-between p-2.5 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs gap-2">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 ml-1">
                      <Eye className="w-4 h-4 text-blue-500" />
                      <span>Mô phỏng hiển thị trên các thiết bị:</span>
                    </span>
                    <div className="flex items-center space-x-1 bg-white dark:bg-neutral-900 p-1 rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('desktop')}
                        className={`px-3 py-1 rounded flex items-center gap-1 font-semibold transition-colors ${previewDevice === 'desktop' ? 'bg-blue-600 text-white shadow-xs' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'}`}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>Desktop</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('tablet')}
                        className={`px-3 py-1 rounded flex items-center gap-1 font-semibold transition-colors ${previewDevice === 'tablet' ? 'bg-blue-600 text-white shadow-xs' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'}`}
                      >
                        <TabletIcon className="w-3.5 h-3.5" />
                        <span>iPad / Tablet</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        className={`px-3 py-1 rounded flex items-center gap-1 font-semibold transition-colors ${previewDevice === 'mobile' ? 'bg-blue-600 text-white shadow-xs' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'}`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>iPhone / Mobile</span>
                      </button>
                    </div>
                  </div>

                  {/* Device Simulation Container */}
                  <div className={`transition-all duration-300 mx-auto ${
                    previewDevice === 'mobile' 
                      ? 'max-w-sm p-4 bg-white dark:bg-[#0d1117] rounded-[2.5rem] border-8 border-neutral-800 shadow-2xl space-y-6' 
                      : previewDevice === 'tablet'
                        ? 'max-w-2xl p-6 bg-white dark:bg-[#0d1117] rounded-3xl border-4 border-neutral-700 shadow-2xl space-y-6'
                        : 'w-full p-6 sm:p-8 bg-white dark:bg-[#0d1117] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-8'
                  }`}>
                    {/* Header Details */}
                    <div className="space-y-4 text-left border-b border-neutral-200 dark:border-neutral-800 pb-6">
                      <div className="flex items-center gap-2">
                        <Badge label={categories.find(c => c.id === formData.categoryId)?.name || 'Chuyên Mục'} size="sm" />
                        <span className="text-xs text-neutral-400 font-mono">
                          29/08/2026 • {formData.readTime || '6 phút đọc'}
                        </span>
                      </div>

                      <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-neutral-950 dark:text-neutral-50 leading-tight">
                        {formData.title || 'Tiêu Đề Bài Báo Chưa Nhập...'}
                      </h1>

                      {/* Author Bar */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-3">
                          <img
                            src={authors.find(a => a.id === formData.authorId)?.avatar || 'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_01.jpg'}
                            alt="Author"
                            className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                          />
                          <div>
                            <div className="flex items-center gap-1 font-bold text-sm text-neutral-900 dark:text-neutral-100">
                              <span>{authors.find(a => a.id === formData.authorId)?.name || 'Ban Biên Tập'}</span>
                              <CheckCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-500 text-white" />
                            </div>
                            <span className="text-xs text-neutral-500 block">{authors.find(a => a.id === formData.authorId)?.role || 'Biên tập viên'}</span>
                          </div>
                        </div>

                        <div className="text-xs text-neutral-400 font-mono hidden sm:flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formData.readTime || '6 phút đọc'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cover Image Preview */}
                    {formData.coverImage && (
                      <div className="rounded-2xl overflow-hidden shadow-lg border border-neutral-200 dark:border-neutral-800 aspect-[16/9] bg-neutral-100 dark:bg-neutral-800">
                        <img 
                          src={formData.coverImage} 
                          alt="Cover" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}

                    {/* Simulated AdSense Slot */}
                    {formData.enableAds && (
                      <div className="p-3 bg-amber-50/60 dark:bg-amber-950/40 border border-dashed border-amber-400/80 rounded-xl text-center">
                        <span className="text-[11px] font-mono text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider">
                          [Vị trí Quảng Cáo Google AdSense Tự Động]
                        </span>
                      </div>
                    )}

                    {/* Article Content Render */}
                    <div 
                      className="editorial-prose min-h-[250px]"
                      dangerouslySetInnerHTML={{ 
                        __html: (formData.content && /<(p|div|h[1-6]|ul|ol|table|blockquote|figure)\b[^>]*>/i.test(formData.content))
                          ? formData.content 
                          : (formData.content || '')
                              .split(/\n\s*\n/)
                              .map(p => p.trim())
                              .filter(Boolean)
                              .map(p => `<p>${p.replace(/\n/g, '<br />')}</p>`)
                              .join('\n') || '<p class="text-neutral-400 italic">Nội dung bài viết sẽ hiển thị tại đây...</p>'
                      }}
                    />

                    {/* Simulated Reaction Bar */}
                    <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
                      <span className="font-semibold">Độc giả đánh giá bài viết:</span>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5 text-blue-500" /> Hữu ích</span>
                        <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Sâu sắc</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Google Search Live Snippet Preview & SEO Analyzer */}
          <div className="p-6 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" />
                <h3 className="font-serif text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Xem Trước Kết Quả Google Tìm Kiếm (SERP Snippet Preview)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                Chuẩn Schema Article ✓
              </span>
            </div>

            {/* Google SERP Card Preview */}
            <div className="p-4 bg-white dark:bg-[#1a1f2c] rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-1 font-sans">
              <div className="flex items-center space-x-1 text-xs text-neutral-400 font-mono">
                <span>https://www.thehori.click</span>
                <span>›</span>
                <span className="text-neutral-300 font-mono">post/{formData.slug || 'slug'}</span>
              </div>
              <h4 className="text-base font-medium text-[#8ab4f8] hover:underline cursor-pointer line-clamp-1">
                {formData.metaTitle || formData.title || 'Tiêu Đề SEO Hiển Thị Trên Google'} - THE HORI CLICK
              </h4>
              <p className="text-xs text-[#4d5156] dark:text-[#bdc1c6] line-clamp-2 leading-relaxed">
                {formData.metaDescription || formData.excerpt || 'Đoạn mô tả ngắn gọn này sẽ xuất hiện bên dưới tiêu đề khi độc giả tìm kiếm bài viết trên Google máy tính và di động.'}
              </p>
            </div>

            {/* SEO Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                  <span className="text-neutral-600 dark:text-neutral-400">Tiêu Đề SEO (Meta Title)</span>
                  <span className={`font-mono text-[11px] ${metaTitleLength > 60 ? 'text-amber-500 font-bold' : 'text-emerald-500'}`}>
                    {metaTitleLength} / 60 ký tự
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Tiêu đề SEO tùy chỉnh"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                  <span className="text-neutral-600 dark:text-neutral-400">Từ Khóa Trọng Tâm (Focus Keyword)</span>
                  <span className="font-mono text-[11px] text-blue-500">Mục Tiêu CPC Cao</span>
                </div>
                <input
                  type="text"
                  placeholder="Ví dụ: treasury bills yield, high yield savings"
                  value={formData.focusKeyword}
                  onChange={(e) => setFormData({ ...formData, focusKeyword: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                  <span className="text-neutral-600 dark:text-neutral-400">Mô Tả SEO (Meta Description)</span>
                  <span className={`font-mono text-[11px] ${metaDescLength > 160 ? 'text-amber-500 font-bold' : 'text-emerald-500'}`}>
                    {metaDescLength} / 160 ký tự
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Mô tả súc tích tăng tỷ lệ click (CTR) trên Google Search..."
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>
        </div>

      {/* Right 4 Cols: Publishing Settings, Cover Image & Categories */}
      <div className="lg:col-span-4 space-y-6">
          {/* 1. Cover Image Selector (Đưa lên ĐẦU TIÊN để dễ tải ảnh) */}
          <div className="p-6 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-500" />
                <span>Ảnh Bìa Bài Viết</span>
              </h3>
              <button
                type="button"
                onClick={() => coverFileInputRef.current?.click()}
                disabled={uploadingImage}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingImage ? 'Đang nén...' : 'Tải File Máy Tính'}</span>
              </button>
              <input 
                type="file" 
                ref={coverFileInputRef} 
                onChange={handleCoverFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {formData.coverImage && (
              <div className="relative group">
                <img 
                  src={formData.coverImage} 
                  alt="Ảnh bìa xem trước"
                  className="w-full aspect-[16/9] object-cover rounded-xl border border-neutral-200 dark:border-neutral-700" 
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, coverImage: '' })}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-rose-600 text-white rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Xóa ảnh bìa"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase text-neutral-500 mb-1">
                Đường dẫn ảnh (URL hoặc CDN)
              </label>
              <input
                type="text"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                placeholder="Dán link ảnh https://... hoặc bấm nút Tải File"
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-neutral-500 mb-1.5">
                Chọn Nhanh Bộ Ảnh Mẫu Phong Cách Mỹ
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_COVERS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData({ ...formData, coverImage: preset.url })}
                    className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-[10px] font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-blue-50 dark:hover:bg-blue-950 text-left truncate"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Desk Category & Author Byline (Đưa lên THỨ HAI) */}
          <div className="p-6 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <h3 className="font-serif text-base font-bold text-neutral-900 dark:text-neutral-100">
              Phân Loại & Tác Giả (E-E-A-T)
            </h3>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase text-neutral-500">
                  Chuyên Mục Bài Viết
                </label>
                <button
                  type="button"
                  onClick={() => setShowCatModal(true)}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Tạo Chuyên Mục</span>
                </button>
              </div>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">
                Tác Giả Biên Soạn
              </label>
              {isGlobalAdmin ? (
                <select
                  value={formData.authorId}
                  onChange={(e) => setFormData({ ...formData, authorId: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold"
                >
                  {authors.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-900">{currentUser?.name || 'Tài khoản của bạn'}</span>
                  <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-bold">
                    Tác Giả Sở Hữu
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">
                Thẻ Phân Loại (Tags - Cách nhau dấu phẩy)
              </label>
              <input
                type="text"
                placeholder="Tài chính, Đầu tư, Trái phiếu Mỹ"
                value={formData.tagsString}
                onChange={(e) => setFormData({ ...formData, tagsString: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* 3. AdSense Placement Controls & Featured Lead */}
          <div className="p-6 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase font-mono pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <DollarSign className="w-4 h-4" />
              <span>Kiểm Soát Quảng Cáo & Hiển Thị</span>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer p-2.5 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold block text-neutral-800 dark:text-neutral-200">
                    Bật Quảng Cáo Trong Bài
                  </span>
                  <span className="text-[11px] text-neutral-500 block">
                    Chèn banner sau đoạn 2 và đoạn 5
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.enableAds}
                  onChange={(e) => setFormData({ ...formData, enableAds: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2.5 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold block text-neutral-800 dark:text-neutral-200">
                    Đặt Làm Bài Viết Đinh (Featured Lead)
                  </span>
                  <span className="text-[11px] text-neutral-500 block">
                    Hiển thị vị trí lớn nhất trên Trang chủ
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK INLINE MODAL: CREATE CATEGORY */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111622] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-md p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-serif text-base font-bold text-neutral-900 dark:text-neutral-100">
                Tạo Chuyên Mục Mới Cho Bài Viết
              </h3>
              <button 
                type="button" 
                onClick={() => setShowCatModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Tên Chuyên Mục *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Bất Động Sản Mỹ, Năng Lượng Xanh..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Mô Tả Ngắn Về Chuyên Mục
                </label>
                <textarea
                  rows="2"
                  placeholder="Định hướng nội dung của chuyên mục này..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 rounded-xl font-semibold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold"
                >
                  Lưu & Chọn Luôn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL FEATURED IMAGE UPLOADER & CDN MANAGER MODAL */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#111726] rounded-3xl border border-neutral-200 dark:border-[#1e293b] shadow-2xl w-full max-w-xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-[#1e293b]">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-500" />
                <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-white">
                  Tải Lên & Chèn Hình Ảnh Vào Bài Viết
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowImageModal(false)}
                className="p-1 hover:bg-neutral-100 dark:hover:bg-[#182234] rounded-lg text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 p-1 bg-neutral-100 dark:bg-[#0d131f] rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setImageModalTab('upload')}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  imageModalTab === 'upload'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-white'
                }`}
              >
                📁 Tải File Từ Máy Tính
              </button>
              <button
                type="button"
                onClick={() => setImageModalTab('url')}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  imageModalTab === 'url'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-white'
                }`}
              >
                🔗 Dán Link URL Ảnh
              </button>
              <button
                type="button"
                onClick={() => setImageModalTab('cdn')}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  imageModalTab === 'cdn'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-white'
                }`}
              >
                ⚡ Cloud CDN Tốc Độ Cao
              </button>
            </div>

            {/* Caption Input (Common for both) */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Chú Thích Hình Ảnh (Caption hiển thị dưới ảnh)
              </label>
              <input
                type="text"
                placeholder="VD: Biểu đồ tăng trưởng dòng vốn FDI vào Việt Nam năm 2026"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-[#182234] border border-neutral-200 dark:border-[#2a3a54] rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* TAB 1: LOCAL UPLOAD */}
            {imageModalTab === 'upload' && (
              <div className="space-y-4">
                <div 
                  onClick={() => contentFileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-300 dark:border-[#2a3a54] hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition-colors space-y-2 bg-neutral-50/50 dark:bg-[#0d131f]"
                >
                  <Upload className="w-8 h-8 text-blue-500 mx-auto" />
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">
                    {uploadingImage ? 'Đang nén & tối ưu hóa ảnh...' : 'Nhấp để chọn ảnh từ máy tính'}
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Hỗ trợ PNG, JPG, WebP, SVG. Hệ thống tự động nén sang định dạng WebP siêu nhẹ giúp tải trang chỉ trong 0.05s!
                  </p>
                </div>
                <input
                  type="file"
                  ref={contentFileInputRef}
                  onChange={handleContentFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            )}

            {/* TAB 2: PASTE DIRECT URL */}
            {imageModalTab === 'url' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Đường Dẫn URL Hình Ảnh *
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... hoặc https://i.ibb.co/..."
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-[#182234] border border-neutral-200 dark:border-[#2a3a54] rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleInsertUrlImage}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold font-mono shadow-md active:scale-95 transition-all"
                  >
                    Chèn Hình Ảnh Này
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: CLOUD CDN GUIDE & RECOMMENDATIONS */}
            {imageModalTab === 'cdn' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl space-y-1">
                  <p className="font-bold text-purple-300">⚡ Top 3 Dịch Vụ Lưu Ảnh Miễn Phí & Tốc Độ Cực Nhanh:</p>
                  <p className="text-[11px] text-neutral-300">
                    Để website đạt tốc độ tải trang cao nhất chuẩn Google Core Web Vitals, bạn có thể lưu ảnh trên các CDN chuyên dụng:
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-neutral-50 dark:bg-[#182234] rounded-xl border border-neutral-200 dark:border-[#2a3a54] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-blue-400 block">1. ImgBB (Free Không Giới Hạn)</span>
                      <span className="text-[11px] text-neutral-400">Tải ảnh lên và nhận link trực tiếp `i.ibb.co` tức thì</span>
                    </div>
                    <a href="https://imgbb.com" target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/50 rounded-lg text-xs font-bold flex items-center gap-1">
                      <span>Mở Web</span> <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="p-3 bg-neutral-50 dark:bg-[#182234] rounded-xl border border-neutral-200 dark:border-[#2a3a54] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-emerald-400 block">2. Cloudinary (Free 25GB/tháng)</span>
                      <span className="text-[11px] text-neutral-400">Tự động nén WebP/AVIF theo thiết bị đọc của người dùng</span>
                    </div>
                    <a href="https://cloudinary.com" target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/50 rounded-lg text-xs font-bold flex items-center gap-1">
                      <span>Mở Web</span> <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="p-3 bg-neutral-50 dark:bg-[#182234] rounded-xl border border-neutral-200 dark:border-[#2a3a54] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-amber-400 block">3. Cloudflare R2 / Supabase Storage (10GB Free)</span>
                      <span className="text-[11px] text-neutral-400">Độ trễ Edge CDN dưới 30ms trên toàn thế giới</span>
                    </div>
                    <a href="https://supabase.com" target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/50 rounded-lg text-xs font-bold flex items-center gap-1">
                      <span>Mở Web</span> <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Short Link Modal */}
      <ShortLinkModal
        isOpen={isShortLinkModalOpen}
        onClose={() => setIsShortLinkModalOpen(false)}
        defaultPost={existingPost || { ...formData, id: 'temp', slug: formData.slug }}
      />
    </form>
  );
};
