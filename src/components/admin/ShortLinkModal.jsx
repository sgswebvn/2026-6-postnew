import React, { useState, useEffect } from 'react';
import { useBlog } from '../../context/BlogContext';
import { 
  Link2, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Share2, 
  BarChart3, 
  Trash2, 
  X, 
  TrendingUp,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { api } from '../../services/api';

export const ShortLinkModal = ({ isOpen, onClose, defaultPost = null }) => {
  const { posts, staffList, currentUser, showToast } = useBlog();
  const [selectedPostId, setSelectedPostId] = useState(defaultPost?.id || posts[0]?.id || '');
  const [selectedStaffCode, setSelectedStaffCode] = useState(currentUser?.refCode || 'QB');
  const [customAlias, setCustomAlias] = useState('');
  const [shortLinks, setShortLinks] = useState([]);
  const [createdLink, setCreatedLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedPost = posts.find(p => p.id === selectedPostId) || defaultPost || posts[0];

  useEffect(() => {
    if (defaultPost) {
      setSelectedPostId(defaultPost.id);
    }
  }, [defaultPost]);

  const loadLinks = async () => {
    try {
      const data = await api.getShortLinks();
      setShortLinks(Array.isArray(data) ? data : []);
    } catch (e) {
      setShortLinks([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLinks();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedPost) {
      showToast('Vui lòng chọn bài viết cần rút gọn link', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const staff = staffList.find(s => s.refCode === selectedStaffCode);
      const originalUrl = `https://www.thehori.click/post/${selectedPost.slug}${selectedStaffCode ? `?ref=${selectedStaffCode}` : ''}`;
      
      const payload = {
        originalUrl,
        postSlug: selectedPost.slug,
        postTitle: selectedPost.title,
        coverImage: selectedPost.coverImage,
        staffCode: selectedStaffCode,
        staffName: staff?.name || currentUser?.name || 'Cộng tác viên',
        customCode: customAlias.trim()
      };

      const saved = await api.createShortLink(payload);
      const shortUrl = `${window.location.origin}/s/${saved.code}`;
      setCreatedLink(shortUrl);
      showToast('Đã tạo link rút gọn Seeding thành công!', 'success');
      loadLinks();
    } catch (err) {
      showToast('Lỗi khi tạo link rút gọn: ' + err.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    showToast(`Đã sao chép link rút gọn: ${url}`);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteShortLink(id);
      showToast('Đã xóa link rút gọn', 'info');
      loadLinks();
    } catch (e) {
      showToast(e.message || 'Lỗi khi xóa link', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-admin animate-fadeIn">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 text-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-neutral-900">
                Công Cụ Rút Gọn Link Seeding & Tối Ưu Mạng Xã Hội
              </h2>
              <p className="text-xs text-neutral-500">
                Tạo link ngắn đẹp, tự động hiện ảnh bìa + tiêu đề chuẩn Facebook/Zalo và tích hợp Google Analytics 4.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Generator Form */}
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                1. Chọn Bài Viết Cần Rút Gọn Link *
              </label>
              <select
                value={selectedPostId}
                onChange={(e) => setSelectedPostId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-blue-500"
              >
                {posts.map(p => (
                  <option key={p.id} value={p.id}>{p.title} ({p.categoryName || 'Tin tức'})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  2. Gắn Mã Seeding Nhân Viên (?ref=...)
                </label>
                <select
                  value={selectedStaffCode}
                  onChange={(e) => setSelectedStaffCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold text-purple-700 font-mono focus:outline-none focus:border-purple-500"
                >
                  {staffList.filter(s => s.refCode).map(s => (
                    <option key={s.id} value={s.refCode}>{s.name} (?ref={s.refCode})</option>
                  ))}
                  <option value="QB">Admin Quốc Bảo (?ref=QB)</option>
                  <option value="DIRECT">Không gắn mã (Direct View)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  3. Tùy Chọn Đuôi Link Ngắn (Tùy chọn)
                </label>
                <div className="flex items-center gap-1">
                  <span className="px-2.5 py-2 bg-neutral-100 border border-neutral-300 rounded-l-xl text-xs font-mono text-neutral-500">
                    /s/
                  </span>
                  <input
                    type="text"
                    placeholder="vd: qb01, hot-news (hoặc để trống)"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-r-xl text-xs font-mono text-neutral-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Link2 className="w-4 h-4" />
            <span>{isGenerating ? 'Đang Tạo Link Ngắn...' : 'Tạo Link Rút Gọn Seeding Ngay'}</span>
          </button>
        </form>

        {/* Generated Result Card */}
        {createdLink && (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Link Rút Gọn Của Bạn Đã Sẵn Sàng Đi Rải / Chia Sẻ:</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-700 font-bold">
                Tích hợp GA4 & Open Graph
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={createdLink}
                className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold text-emerald-900 select-all"
              />
              <button
                type="button"
                onClick={() => handleCopy(createdLink)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all flex-shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Đã Chép!' : 'Copy Link'}</span>
              </button>
            </div>

            {/* Live Social Card Preview */}
            {selectedPost && (
              <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs space-y-2">
                <span className="text-[11px] font-bold text-neutral-500 block uppercase font-mono">
                  📱 Xem Trước Thẻ Hiển Thị Khi Dán Lên Facebook / Zalo:
                </span>
                <div className="flex items-center gap-3 p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                  <img
                    src={selectedPost.coverImage}
                    alt="Cover"
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border"
                  />
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">THEHORI.CLICK</span>
                    <h4 className="font-serif font-bold text-neutral-900 text-xs truncate">{selectedPost.title}</h4>
                    <p className="text-[11px] text-neutral-500 line-clamp-1">{selectedPost.excerpt || selectedPost.title}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History List */}
        {shortLinks.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase text-neutral-500 font-mono flex items-center justify-between">
              <span>Danh Sách Link Rút Gọn Gần Đây ({shortLinks.length})</span>
            </h3>

            <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
              {shortLinks.slice(0, 8).map(link => {
                const fullShortUrl = `${window.location.origin}/s/${link.code}`;
                return (
                  <div key={link.id || link.code} className="p-3 bg-neutral-50 hover:bg-neutral-100/80 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <a 
                          href={fullShortUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="font-mono font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <span>/s/{link.code}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        {link.staffCode && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-mono font-bold">
                            ?ref={link.staffCode}
                          </span>
                        )}
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-bold">
                          {link.clicks || 0} Clicks
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-600 truncate max-w-sm">{link.postTitle || link.originalUrl}</p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleCopy(fullShortUrl)}
                        className="p-1.5 bg-white hover:bg-neutral-200 rounded-lg text-neutral-700 border border-neutral-200"
                        title="Sao chép link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(link.id || link.code)}
                        className="p-1.5 bg-white hover:bg-rose-50 rounded-lg text-rose-600 border border-neutral-200"
                        title="Xóa link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
