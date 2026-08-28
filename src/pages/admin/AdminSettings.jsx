import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Globe, 
  Shield, 
  Activity, 
  Mail, 
  Download, 
  Upload, 
  FileCheck,
  CheckCircle,
  Database
} from 'lucide-react';

export const AdminSettings = () => {
  const { posts, categories, authors, settings, updateSettings, resetData, showToast, showConfirm } = useBlog();

  const [formData, setFormData] = useState({
    siteName: settings?.siteName || 'THE HORI CLICK',
    tagline: settings?.tagline || 'Definitive Intelligence for Modern Wealth & Technology',
    edition: settings?.edition || 'U.S. Edition',
    description: settings?.description || '',
    contactEmail: settings?.contactEmail || 'contact@thehori.click',
    businessAddress: settings?.businessAddress || '742 Evergreen Terrace, Suite 400, Austin, TX 78701, United States',
    phone: settings?.phone || '+1 (512) 890-4421',
    gaTrackingId: settings?.gaTrackingId || 'G-HORICLICK2026',
    searchConsoleCode: settings?.searchConsoleCode || 'google-site-verification=hori7890abcdef123456',
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
    showConfirm({
      title: 'Khôi Phục Dữ Liệu Ban Đầu',
      message: 'Khôi phục toàn bộ bài viết, chuyên mục, bình luận và cấu hình về bộ dữ liệu mẫu chuẩn ban đầu?',
      confirmText: 'Khôi Phục Ngay',
      variant: 'danger',
      onConfirm: () => {
        resetData();
      }
    });
  };

  const handleExportBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      version: '2.0.0',
      settings: { ...settings, ...formData },
      posts,
      categories,
      authors
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `horizon-post-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file sao lưu JSON thành công!', 'success');
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.settings) {
          updateSettings(parsed.settings);
        }
        showToast('Đã khôi phục dữ liệu từ file JSON thành công!', 'success');
      } catch (err) {
        showToast('File JSON không hợp lệ: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl pb-16 font-admin admin-view">
      <div className="pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-neutral-950 dark:text-neutral-50">
          Cài Đặt Hệ Thống & Cấu Hình SEO
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Thông tin thương hiệu, mã đo lường Google Analytics 4, Search Console, ads.txt và công cụ sao lưu dữ liệu.
        </p>
      </div>

      {/* AdSense & Indexing Compliance Status Banner */}
      <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-emerald-950 dark:text-emerald-200 block">
              Google AdSense & Search Console Đã Sẵn Sàng 100%
            </span>
            <p className="text-emerald-800 dark:text-emerald-300 text-[11px] mt-0.5">
              Đã tạo sẵn file <code className="font-mono bg-emerald-100 dark:bg-emerald-900/60 px-1 py-0.5 rounded">/ads.txt</code>, <code className="font-mono bg-emerald-100 dark:bg-emerald-900/60 px-1 py-0.5 rounded">/robots.txt</code> và <code className="font-mono bg-emerald-100 dark:bg-emerald-900/60 px-1 py-0.5 rounded">/sitemap.xml</code> cho bot Google lập chỉ mục tự động.
            </p>
          </div>
        </div>

        <a 
          href="/ads.txt" 
          target="_blank" 
          rel="noreferrer"
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold font-mono text-[11px] whitespace-nowrap transition-colors flex items-center gap-1 self-start sm:self-auto"
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Kiểm Tra ads.txt</span>
        </a>
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

        {/* JSON Backup & Restore Tools */}
        <div className="p-6 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
          <h3 className="font-serif text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-500" />
            <span>Sao Lưu & Khôi Phục Dữ Liệu Tòa Soạn</span>
          </h3>
          <p className="text-xs text-neutral-500">
            Xuất toàn bộ 30 bài viết, chuyên mục và cài đặt thành file JSON an toàn hoặc khôi phục dữ liệu tức thì.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4 text-blue-500" />
              <span>Tải Xuống File Backup JSON</span>
            </button>

            <label className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors">
              <Upload className="w-4 h-4 text-emerald-500" />
              <span>Khôi Phục Từ File JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={handleResetData}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi Phục Mặc Định</span>
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
