import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { Settings, Save, RotateCcw, Globe, Shield, Activity, Mail } from 'lucide-react';

export const AdminSettings = () => {
  const { settings, updateSettings, resetData, showToast } = useBlog();

  const [formData, setFormData] = useState({
    siteName: settings?.siteName || 'THE HORIZON POST',
    tagline: settings?.tagline || 'Definitive Intelligence for Modern Wealth & Technology',
    edition: settings?.edition || 'U.S. Edition',
    description: settings?.description || '',
    contactEmail: settings?.contactEmail || 'editor@thehorizonpost.com',
    businessAddress: settings?.businessAddress || '742 Evergreen Terrace, Suite 400, Austin, TX 78701, United States',
    phone: settings?.phone || '+1 (512) 890-4421',
    gaTrackingId: settings?.gaTrackingId || 'G-HORIZON2026',
    searchConsoleCode: settings?.searchConsoleCode || 'google-site-verification=hz7890abcdef123456',
  });

  const handleSave = (e) => {
    e.preventDefault();
    updateSettings({
      ...settings,
      ...formData
    });
    showToast('Đã lưu toàn bộ cấu hình trang web và mã SEO!');
  };

  const handleResetData = () => {
    if (window.confirm('Khôi phục toàn bộ bài viết, chuyên mục, bình luận và cấu hình về bộ dữ liệu mẫu chuẩn Mỹ ban đầu?')) {
      resetData();
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl pb-16">
      <div className="pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-neutral-950 dark:text-neutral-50">
          Cài Đặt Hệ Thống & Cấu Hình SEO
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Thông tin thương hiệu, mã theo dõi Google Analytics 4, Search Console và địa chỉ tòa soạn.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Masthead */}
        <div className="p-6 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
          <h3 className="font-serif text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            <span>Thương Hiệu & Tiêu Đề Báo Chí (Masthead)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                Tên Trang Web / Tạp Chí
              </label>
              <input
                type="text"
                value={formData.siteName}
                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-serif font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                Nhãn Ấn Bản (Edition)
              </label>
              <input
                type="text"
                value={formData.edition}
                onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                Khẩu Hiệu / Slogan
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                Mô Tả Trang Chủ Mặc Định (Cho Google Indexing)
              </label>
              <textarea
                rows="2"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Analytics & Search Verification */}
        <div className="p-6 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
          <h3 className="font-serif text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>Mã Đo Lường Google Analytics 4 & Search Console</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                Mã Đo Lường Google Analytics GA4 (G-XXXXXXXXXX)
              </label>
              <input
                type="text"
                placeholder="G-XXXXXXXXXX"
                value={formData.gaTrackingId}
                onChange={(e) => setFormData({ ...formData, gaTrackingId: e.target.value })}
                className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                Thẻ Xác Minh Google Search Console
              </label>
              <input
                type="text"
                placeholder="google-site-verification=..."
                value={formData.searchConsoleCode}
                onChange={(e) => setFormData({ ...formData, searchConsoleCode: e.target.value })}
                className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Physical Address & Compliance Info */}
        <div className="p-6 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
          <h3 className="font-serif text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-500" />
            <span>Thông Tin Tòa Soạn & Pháp Lý Chuẩn Mỹ</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                Email Tòa Soạn Tiếp Nhận Bài
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                Hotline Tòa Soạn
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                Địa Chỉ Trụ Sở Chính Tại Mỹ
              </label>
              <input
                type="text"
                value={formData.businessAddress}
                onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={handleResetData}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi Phục Dữ Liệu Mẫu</span>
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Toàn Bộ Cài Đặt</span>
          </button>
        </div>
      </form>
    </div>
  );
};
