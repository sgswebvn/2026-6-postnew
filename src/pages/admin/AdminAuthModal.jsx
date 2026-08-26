import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { Lock, ShieldCheck, Key, ArrowRight, Sparkles } from 'lucide-react';

export const AdminAuthModal = () => {
  const { loginAdmin, navigate } = useBlog();
  const [passcode, setPasscode] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    loginAdmin(passcode);
  };

  const handleDemoQuickLogin = () => {
    loginAdmin('admin123');
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 admin-view font-admin animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-[#111622] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-neutral-950 dark:text-neutral-50">
            Hệ Thống Quản Trị Blog
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500">
            Nhập mã bảo mật để quản lý nội dung bài viết, tối ưu SEO và cấu hình Google AdSense.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
              Mã bảo mật / Mật khẩu truy cập
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="Nhập mã truy cập (Mặc định: admin123)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                autoFocus
              />
              <Key className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <span>Xác thực & Vào Bảng Điều Khiển</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 text-center space-y-3">
          <button
            type="button"
            onClick={handleDemoQuickLogin}
            className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>⚡ Đăng nhập nhanh 1-Click (admin123)</span>
          </button>
          
          <button
            type="button"
            onClick={() => navigate('#/')}
            className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            ← Quay lại trang chủ độc giả
          </button>
        </div>
      </div>
    </div>
  );
};
