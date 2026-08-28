import React, { useState, useEffect } from 'react';
import { useBlog } from '../../context/BlogContext';
import { 
  Save, 
  ArrowLeft, 
  Eye, 
  Sparkles, 
  Heading2, 
  Heading3, 
  Bold, 
  Italic, 
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
  ExternalLink
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { supabaseStorage } from '../../services/supabaseStorage';

const SAMPLE_COVERS = [
  { name: 'Tài Chính & Đầu Tư', url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1200&auto=format&fit=crop' },
  { name: 'AI & Công Nghệ Cao', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Sức Khỏe & Giấc Ngủ', url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Không Gian Sống Hiện Đại', url: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Phân Tích Dữ Liệu Thị Trường', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop' },
];

export const AdminPostEditor = ({ postId }) => {
  const { posts, categories, authors, savePost, addCategory, navigate, showToast, showPrompt } = useBlog();

  const existingPost = postId ? posts.find(p => p.id === postId) : null;

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    coverImage: SAMPLE_COVERS[0].url,
    categoryId: categories[0]?.id || 'cat-money',
    authorId: authors[0]?.id || 'author-1',
    factCheckerId: authors[1]?.id || 'author-2',
    readTime: '6 phút đọc',
    status: 'published',
    featured: false,
    tagsString: 'Tài chính cá nhân, Đầu tư, Cổ phiếu Mỹ',
    metaTitle: '',
    metaDescription: '',
    focusKeyword: '',
    enableAds: true,
    content: ''
  });

  const [activeTab, setActiveTab] = useState('write'); // 'write' or 'preview'
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showToast('Vui lòng nhập tên chuyên mục', 'error');
      return;
    }
    const created = addCategory({
      name: newCatName.trim(),
      slug: generateSlug(newCatName),
      description: newCatDesc.trim(),
      color: 'blue'
    });
    setFormData(prev => ({ ...prev, categoryId: created.id }));
    setShowCatModal(false);
    setNewCatName('');
    setNewCatDesc('');
  };

  useEffect(() => {
    if (existingPost) {
      setFormData({
        ...existingPost,
        tagsString: existingPost.tags ? existingPost.tags.join(', ') : ''
      });
    }
  }, [existingPost]);

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s-]+/g, '-');
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
      metaTitle: prev.metaTitle || title
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
    setFormData(prev => ({
      ...prev,
      content: prev.content ? prev.content + outlineSnippet : outlineSnippet
    }));
  };

  const handleInsertHtml = (tag) => {
    let insertSnippet = '';
    switch (tag) {
      case 'h2':
        insertSnippet = '\n<h2>Tiêu Đề Mục Chính (Heading 2)</h2>\n<p>Nội dung phân tích chuyên sâu...</p>\n';
        break;
      case 'h3':
        insertSnippet = '\n<h3>Tiêu Đề Mục Phụ (Heading 3)</h3>\n';
        break;
      case 'bold':
        insertSnippet = ' <strong>từ khóa quan trọng</strong> ';
        break;
      case 'italic':
        insertSnippet = ' <em>ghi chú đặc biệt</em> ';
        break;
      case 'quote':
        insertSnippet = '\n<blockquote>\n  "Trích dẫn câu nói nổi tiếng hoặc nhận định đắt giá từ chuyên gia."\n</blockquote>\n';
        break;
      case 'callout':
        insertSnippet = '\n<div class="my-6 p-4 bg-blue-50 dark:bg-blue-950/40 border-l-4 border-blue-600 rounded-r-lg">\n  <h4 class="font-bold text-blue-900 dark:text-blue-200">Điểm Nhấn Chiến Lược</h4>\n  <p class="text-xs text-blue-800 dark:text-blue-300">Tóm tắt lợi ích quan trọng nhất cho độc giả...</p>\n</div>\n';
        break;
      case 'table':
        insertSnippet = `
<div class="overflow-x-auto my-6">
  <table class="min-w-full text-left text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg">
    <thead class="bg-neutral-100 dark:bg-neutral-800 font-semibold">
      <tr><th class="p-3">Hạng Mục</th><th class="p-3">Chỉ Số</th><th class="p-3">Đánh Giá</th></tr>
    </thead>
    <tbody class="divide-y divide-neutral-200 dark:divide-neutral-800">
      <tr><td class="p-3">Mô Hình A</td><td class="p-3">+15.4%</td><td class="p-3 text-emerald-600">Xuất Sắc</td></tr>
    </tbody>
  </table>
</div>
`;
        break;
      case 'list':
        insertSnippet = '\n<ul>\n  <li>Ý phân tích quan trọng 1</li>\n  <li>Ý phân tích quan trọng 2</li>\n</ul>\n';
        break;
      default:
        break;
    }

    setFormData(prev => ({
      ...prev,
      content: prev.content + insertSnippet
    }));
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
        let videoId = '';
        const match1 = rawUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
        if (match1) {
          videoId = match1[1];
        } else if (rawUrl.trim().length === 11) {
          videoId = rawUrl.trim();
        }

        if (!videoId) {
          showToast('Không tìm thấy Video ID hợp lệ từ liên kết YouTube vừa nhập', 'warning');
          return;
        }

        const embedHtml = `
<div class="my-8 rounded-3xl overflow-hidden aspect-video shadow-xl border border-neutral-200 dark:border-neutral-800 bg-black">
  <iframe 
    class="w-full h-full" 
    src="https://www.youtube.com/embed/${videoId}" 
    title="YouTube video player" 
    frameborder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
    allowfullscreen>
  </iframe>
</div>
`;
        setFormData(prev => ({
          ...prev,
          content: prev.content + embedHtml
        }));
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
      setFormData(prev => ({ ...prev, content: prev.content + imageHtml }));
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
    setFormData(prev => ({ ...prev, content: prev.content + imageHtml }));
    setShowImageModal(false);
    setCustomImageUrl('');
    setImageCaption('');
    showToast('Đã chèn hình ảnh vào bài viết!', 'success');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết (*)', 'warning');
      return;
    }

    const tagsArray = formData.tagsString
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const postPayload = {
      ...formData,
      tags: tagsArray,
      id: existingPost ? existingPost.id : undefined,
      slug: formData.slug || generateSlug(formData.title),
    };

    savePost(postPayload);
    navigate('/admin/posts');
  };

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

        <div className="flex items-center space-x-3">
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
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{existingPost ? 'Lưu Thay Đổi' : 'Xuất Bản Bài Viết'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 8 Cols Content + 4 Cols Metadata & SEO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Cols: Title & Rich Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Headline & Basic Info */}
          <div className="p-6 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                Tiêu Đề Bài Viết (Chuẩn Báo Chí Mỹ) *
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Chiến Lược Tối Ưu Dòng Tiền Lãi Suất Cao Cho Nhà Đầu Tư Thông Minh"
                value={formData.title}
                onChange={handleTitleChange}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-base font-serif font-bold text-neutral-900 dark:text-neutral-50 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-neutral-500 mb-1">
                  Đường dẫn tĩnh (Slug URL)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono"
                />
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

            <div>
              <label className="block text-[11px] font-bold uppercase text-neutral-500 mb-1">
                Đoạn Tóm Tắt Mở Đầu (Lead Excerpt) *
              </label>
              <textarea
                rows="2"
                placeholder="Đoạn mở đầu súc tích 2-3 câu làm nổi bật giá trị bài viết cho người đọc..."
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-blue-500"
                required
              ></textarea>
            </div>
          </div>

          {/* Rich Content Editor & Toolbar */}
          <div className="bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden space-y-0">
            {/* Editor Tabs & Quick HTML Snippet Toolbar */}
            <div className="p-3 bg-neutral-50 dark:bg-neutral-900/70 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2">
              {/* Tab Switcher */}
              <div className="flex items-center space-x-1 bg-white dark:bg-neutral-800 p-1 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${activeTab === 'write' ? 'bg-blue-600 text-white' : 'text-neutral-600 dark:text-neutral-400'}`}
                >
                  Trình Soạn Thảo
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${activeTab === 'preview' ? 'bg-blue-600 text-white' : 'text-neutral-600 dark:text-neutral-400'}`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem Trước</span>
                </button>
              </div>

              {/* Formatting Quick Insert Tools */}
              {activeTab === 'write' && (
                <div className="flex flex-wrap items-center gap-1">
                  <button type="button" onClick={() => handleInsertHtml('h2')} className="px-2 py-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300" title="Chèn Heading 2">H2</button>
                  <button type="button" onClick={() => handleInsertHtml('h3')} className="px-2 py-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300" title="Chèn Heading 3">H3</button>
                  <button type="button" onClick={() => handleInsertHtml('bold')} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded text-neutral-700 dark:text-neutral-300" title="In đậm"><Bold className="w-4 h-4" /></button>
                  <button type="button" onClick={() => handleInsertHtml('quote')} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded text-neutral-700 dark:text-neutral-300" title="Trích dẫn"><Quote className="w-4 h-4" /></button>
                  <button type="button" onClick={() => handleInsertHtml('callout')} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded text-blue-600 dark:text-blue-400" title="Hộp Takeaways"><Sparkles className="w-4 h-4" /></button>
                  <button type="button" onClick={() => handleInsertHtml('table')} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded text-neutral-700 dark:text-neutral-300" title="Bảng dữ liệu"><Table className="w-4 h-4" /></button>
                  <button type="button" onClick={() => handleInsertHtml('list')} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded text-neutral-700 dark:text-neutral-300" title="Danh sách"><List className="w-4 h-4" /></button>
                  
                  {/* YouTube & Image Inserters */}
                  <button 
                    type="button" 
                    onClick={handleInsertYouTube}
                    className="px-2 py-1 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-700 dark:text-red-300 rounded-lg text-xs font-mono font-bold flex items-center gap-1 border border-red-200 dark:border-red-800 transition-colors"
                    title="Nhúng Video YouTube vào bài viết"
                  >
                    <Video className="w-3.5 h-3.5 text-red-600" />
                    <span>+ Video YT</span>
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setShowImageModal(true)}
                    className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-mono font-bold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 transition-colors"
                    title="Tải ảnh từ máy tính hoặc chèn link CDN"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>+ Tải / Chèn Ảnh</span>
                  </button>

                  {/* AI Outline Assistant */}
                  <button 
                    type="button" 
                    onClick={handleInsertAiOutline}
                    className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 hover:bg-amber-200 rounded-lg text-xs font-mono font-bold flex items-center gap-1 border border-amber-300 dark:border-amber-800 transition-colors ml-1"
                    title="Chèn khung dàn bài mẫu chuẩn báo chí Mỹ"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>+ Dàn Ý Chuẩn Mỹ</span>
                  </button>
                </div>
              )}
            </div>

            {/* Word Count Indicator */}
            <div className="px-6 py-1.5 bg-neutral-100/50 dark:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-[11px] font-mono text-neutral-500">
              <span>Định dạng hỗ trợ: HTML, Headings, Tables, Blockquotes</span>
              <span className={wordCount >= 1000 ? 'text-emerald-600 font-bold' : 'text-amber-600'}>
                {wordCount} từ {wordCount >= 1000 ? '✓ Đạt chuẩn 1,000+ từ cho AdSense' : '(Khuyến nghị 1,000+ từ)'}
              </span>
            </div>

            {/* Main Editor or Live Preview */}
            <div className="p-4 sm:p-6">
              {activeTab === 'write' ? (
                <textarea
                  rows="16"
                  placeholder="Nhập nội dung bài viết chi tiết..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full font-mono text-sm bg-transparent border-0 focus:outline-none text-neutral-900 dark:text-neutral-100 leading-relaxed resize-y"
                  required
                ></textarea>
              ) : (
                <div 
                  className="editorial-prose min-h-[300px]"
                  dangerouslySetInnerHTML={{ __html: formData.content || '<p class="text-neutral-400">Chưa có nội dung...</p>' }}
                />
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

      {/* Right 4 Cols: Publishing Settings & Ad Controls */}
      <div className="lg:col-span-4 space-y-6">
          {/* AdSense Placement Controls for this Post */}
          <div className="p-6 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase font-mono pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <DollarSign className="w-4 h-4" />
              <span>Kiểm Soát Quảng Cáo AdSense</span>
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

          {/* Desk Category & Author Byline */}
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
              <select
                value={formData.authorId}
                onChange={(e) => setFormData({ ...formData, authorId: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs"
              >
                {authors.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                ))}
              </select>
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

          {/* Cover Image Selector */}
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
    </form>
  );
};
