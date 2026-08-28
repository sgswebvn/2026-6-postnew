import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { Lock, User, Key, ArrowRight, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export const AdminAuthModal = () => {
  const { loginAdmin, navigate, currentRoute } = useBlog();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const targetPath = currentRoute && currentRoute.startsWith('/admin') ? currentRoute : '/admin';

  const handleLogin = (e) => {
    e.preventDefault();
    loginAdmin(identifier, password, targetPath);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 admin-view font-admin animate-fadeIn text-white dark">
      <div className="w-full max-w-md bg-[#111726] rounded-3xl border border-[#2a3a54] shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 text-blue-400 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white">
            Hệ Thống Quản Trị CMS
          </h2>
          <p className="text-xs text-neutral-400">
            Đăng nhập tài khoản nhân viên hoặc ban quản trị được phân quyền.
          </p>

          {targetPath !== '/admin' && (
            <div className="p-2 bg-[#182234] text-blue-300 border border-blue-800/60 rounded-xl text-[11px] font-mono flex items-center justify-center gap-1.5 mt-2">
              <AlertCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>Trang đích: <strong>{targetPath}</strong></span>
            </div>
          )}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
              Tên đăng nhập hoặc Email *
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="VD: admin hoặc email@thehori.click"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#182234] border border-[#2a3a54] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-neutral-500"
                required
                autoFocus
              />
              <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
              Mật khẩu *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu truy cập"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-[#182234] border border-[#2a3a54] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-neutral-500"
                required
              />
              <Key className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 absolute right-3 top-2.5 text-neutral-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
          >
            <span>Đăng Nhập Quản Trị Hệ Thống</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-[#1e293b] text-center space-y-2">
          <div className="p-3 bg-[#182234] rounded-xl border border-[#2a3a54] text-[11px] text-neutral-400 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Tài khoản và quyền hạn chức năng do Tổng Biên Tập (Admin) cấp phát.</span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs text-neutral-400 hover:text-neutral-200 pt-1 block mx-auto transition-colors"
          >
            ← Quay lại trang chủ độc giả
          </button>
        </div>
      </div>
    </div>
  );
};
