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
  Users
} from 'lucide-react';

export const AdminLayout = ({ children, currentTab = 'dashboard' }) => {
  const { logoutAdmin, navigate, darkMode, toggleDarkMode, settings, posts, staffList, userRole } = useBlog();

  const allNavItems = [
    { id: 'dashboard', label: 'Bảng Tổng Quan', icon: LayoutDashboard, path: '/admin', adminOnly: true },
    { id: 'posts', label: 'Quản Lý Bài Viết', icon: FileText, path: '/admin/posts', count: posts.length },
    { id: 'new-post', label: 'Soạn Thảo Bài Mới', icon: PlusCircle, path: '/admin/posts/new' },
    { id: 'categories', label: 'Chuyên Mục & Desks', icon: FolderTree, path: '/admin/categories', adminOnly: true },
    { id: 'staff', label: 'Nhân Sự & Bảng Lương', icon: Users, path: '/admin/staff', count: staffList?.length || 4, adminOnly: true },
    { id: 'adsense', label: 'Google AdSense Ads', icon: DollarSign, path: '/admin/adsense', highlight: true, adminOnly: true },
    { id: 'comments', label: 'Quản Lý Bình Luận', icon: MessageSquare, path: '/admin/comments' },
    { id: 'subscribers', label: 'Email Đăng Ký Tin', icon: Mail, path: '/admin/subscribers', adminOnly: true },
    { id: 'authors', label: 'Ban Biên Tập (E-E-A-T)', icon: Users, path: '/admin/authors', adminOnly: true },
    { id: 'settings', label: 'Cài Đặt & Cấu Hình SEO', icon: Settings, path: '/admin/settings', adminOnly: true },
  ];

  const navItems = userRole === 'editor' 
    ? allNavItems.filter(item => !item.adminOnly)
    : allNavItems;

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
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    userRole === 'editor' 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {userRole === 'editor' ? '✍️ BIÊN TẬP VIÊN / CTV' : '👑 TỔNG BIÊN TẬP (ADMIN)'}
                  </span>
                </div>
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
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => navigate('/')}
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
        </div>
      </aside>

      {/* Main Content Area with Top Bar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Admin Bar with Logout at Top Right Corner */}
        <header className="h-14 bg-white dark:bg-[#0f1420] border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500">Quản Trị</span>
            <span className="text-neutral-300 dark:text-neutral-700">/</span>
            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
              {navItems.find(n => n.id === currentTab)?.label || 'Bảng Tổng Quan'}
            </span>
          </div>

          {/* Right Action Tools: Logout Button at Top Right Corner */}
          <div className="flex items-center space-x-3">
            <button
              onClick={logoutAdmin}
              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 border border-rose-200 active:scale-95 shadow-2xs"
              title="Đăng xuất khỏi bảng quản trị"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng Xuất</span>
            </button>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
