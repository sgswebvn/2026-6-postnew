import React from 'react';
import { useBlog } from '../../context/BlogContext';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  FolderTree, 
  DollarSign, 
  Settings, 
  LogOut, 
  ExternalLink, 
  Sun, 
  Moon,
  Sparkles,
  MessageSquare,
  Mail,
  Users,
  ShieldCheck
} from 'lucide-react';

export const AdminLayout = ({ children, currentTab = 'dashboard' }) => {
  const { logoutAdmin, navigate, darkMode, toggleDarkMode, settings, posts } = useBlog();

  const navItems = [
    { id: 'dashboard', label: 'Bảng Tổng Quan', icon: LayoutDashboard, path: '#/admin' },
    { id: 'posts', label: 'Quản Lý Bài Viết', icon: FileText, path: '#/admin/posts', count: posts.length },
    { id: 'new-post', label: 'Soạn Thảo Bài Mới', icon: PlusCircle, path: '#/admin/posts/new' },
    { id: 'categories', label: 'Chuyên Mục & Desks', icon: FolderTree, path: '#/admin/categories' },
    { id: 'adsense', label: 'Google AdSense Ads', icon: DollarSign, path: '#/admin/adsense', highlight: true },
    { id: 'comments', label: 'Quản Lý Bình Luận', icon: MessageSquare, path: '#/admin/comments' },
    { id: 'subscribers', label: 'Email Đăng Ký Tin', icon: Mail, path: '#/admin/subscribers' },
    { id: 'authors', label: 'Ban Biên Tập (E-E-A-T)', icon: Users, path: '#/admin/authors' },
    { id: 'settings', label: 'Cài Đặt & Cấu Hình SEO', icon: Settings, path: '#/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-[#f4f5f8] dark:bg-[#080b11] text-neutral-900 dark:text-neutral-100 flex flex-col lg:flex-row admin-view font-admin animate-fadeIn">
      {/* Admin Sidebar */}
      <aside className="w-full lg:w-72 bg-white dark:bg-[#0f1420] border-r border-neutral-200 dark:border-neutral-800 flex flex-col justify-between p-4 flex-shrink-0">
        <div className="space-y-6">
          {/* Brand & Admin Badge */}
          <div className="px-2 py-3 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-blue-600 text-white font-serif font-black flex items-center justify-center text-base shadow">
                H
              </span>
              <div>
                <h2 className="font-serif font-bold text-sm leading-tight text-neutral-950 dark:text-neutral-50">
                  {settings?.siteName || 'THE HORIZON POST'}
                </h2>
                <span className="text-[11px] font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Hệ Thống CMS Chuẩn Mỹ
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-amber-500' : 'text-neutral-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.count !== undefined && !isActive && (
                    <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-[10px] font-mono">
                      {item.count}
                    </span>
                  )}

                  {item.highlight && !isActive && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-mono font-bold">
                      ADSENSE
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom */}
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
          <button
            onClick={() => navigate('#/')}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors border border-neutral-200 dark:border-neutral-700"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
              <span>Xem Trang Chủ Độc Giả</span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">
              Live
            </span>
          </button>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={toggleDarkMode}
              className="p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-xs flex items-center gap-1.5"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              <span>{darkMode ? 'Sáng' : 'Tối'}</span>
            </button>

            <button
              onClick={logoutAdmin}
              className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs flex items-center gap-1.5 font-medium"
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};
