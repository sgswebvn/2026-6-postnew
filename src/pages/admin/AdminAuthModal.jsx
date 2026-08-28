import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { Lock, ShieldCheck, Key, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

export const AdminAuthModal = () => {
  const { loginAdmin, navigate, currentRoute } = useBlog();
  const [passcode, setPasscode] = useState('');

  const targetPath = currentRoute && currentRoute.startsWith('/admin') ? currentRoute : '/admin';

  const handleLogin = (e) => {
    e.preventDefault();
    loginAdmin(passcode, targetPath);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 admin-view font-admin animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl border border-neutral-200 shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-neutral-950">
            Hệ Thống Quản Trị Blog
          </h2>
          <p className="text-xs text-neutral-500">
            Nhập mã bảo mật để vào khu vực quản trị nội dung, nhân sự và bảng lương.
          </p>

          {targetPath !== '/admin' && (
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl text-[11px] font-mono flex items-center justify-center gap-1.5 mt-2">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Đang mở trang: <strong>{targetPath}</strong></span>
            </div>
          )}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
              Mã bảo mật / Mật khẩu truy cập
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="Nhập mã truy cập (Mặc định: admin123)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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

        <div className="pt-4 border-t border-neutral-100 text-center space-y-2.5">
          <span className="text-[11px] font-mono text-neutral-400 block uppercase font-semibold">Tùy chọn đăng nhập nhanh 1-Click:</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => loginAdmin('admin123', targetPath)}
              className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 border border-blue-200 shadow-2xs active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Admin (Toàn quyền)</span>
            </button>

            <button
              type="button"
              onClick={() => loginAdmin('editor123', targetPath)}
              className="py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 border border-purple-200 shadow-2xs active:scale-95"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
              <span>Editor (Ẩn doanh thu)</span>
            </button>
          </div>
          
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs text-neutral-400 hover:text-neutral-600 pt-2 block mx-auto"
          >
            ← Quay lại trang chủ độc giả
          </button>
        </div>
      </div>
    </div>
  );
};
