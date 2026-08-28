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
  Sparkles,
  MessageSquare,
  Mail,
  Users,
  ShieldCheck,
  User
} from 'lucide-react';

export const AdminLayout = ({ children, currentTab = 'dashboard' }) => {
  const { logoutAdmin, navigate, settings, posts, staffList, userRole, currentUser, hasPermission } = useBlog();

  const allNavItems = [
    { id: 'dashboard', label: 'Bảng Tổng Quan', icon: LayoutDashboard, path: '/admin', perm: 'canViewRevenue', adminOnly: true },
    { id: 'posts', label: 'Quản Lý Bài Viết', icon: FileText, path: '/admin/posts', count: posts.length, perm: 'canManagePosts' },
    { id: 'new-post', label: 'Soạn Thảo Bài Mới', icon: PlusCircle, path: '/admin/posts/new', perm: 'canManagePosts' },
    { id: 'categories', label: 'Chuyên Mục & Desks', icon: FolderTree, path: '/admin/categories', perm: 'canManageCategories' },
    { id: 'staff', label: 'Nhân Sự & Bảng Lương', icon: Users, path: '/admin/staff', count: staffList?.length || 4, perm: 'canManageStaff' },
    { id: 'adsense', label: 'Google AdSense Ads', icon: DollarSign, path: '/admin/adsense', highlight: true, perm: 'canViewRevenue' },
    { id: 'comments', label: 'Quản Lý Bình Luận', icon: MessageSquare, path: '/admin/comments', perm: 'canManageComments' },
    { id: 'subscribers', label: 'Email Đăng Ký Tin', icon: Mail, path: '/admin/subscribers', perm: 'canManageSettings' },
    { id: 'authors', label: 'Ban Biên Tập (E-E-A-T)', icon: Users, path: '/admin/authors', perm: 'canManageSettings' },
    { id: 'settings', label: 'Cài Đặt & Cấu Hình SEO', icon: Settings, path: '/admin/settings', perm: 'canManageSettings' },
  ];

  // Dynamic filter by individual staff permissions
  const navItems = allNavItems.filter(item => {
    if (userRole === 'admin' || currentUser?.role === 'admin') return true;
    return hasPermission(item.perm);
  });

  return (
    <div className="min-h-screen bg-[#090d16] text-neutral-100 flex flex-col lg:flex-row admin-view font-admin animate-fadeIn dark">
      {/* Admin Sidebar */}
      <aside className="w-full lg:w-72 bg-[#0d131f] border-r border-[#1a2333] flex flex-col justify-between p-4 flex-shrink-0">
        <div className="space-y-6">
          {/* Brand & Logged-in Staff Badge */}
          <div className="px-2 py-3 border-b border-[#1a2333]">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-serif font-black flex items-center justify-center text-base shadow-md shadow-blue-500/20">
                H
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-serif font-bold text-sm leading-tight text-white tracking-wide truncate">
                  {settings?.siteName || 'THE HORI CLICK'}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold truncate ${
                    userRole === 'admin' || currentUser?.role === 'admin'
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                      : 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                  }`}>
                    {currentUser ? `${currentUser.name} (${currentUser.roleName || currentUser.role})` : (userRole === 'admin' ? '👑 TỔNG BIÊN TẬP' : '✍️ BIÊN TẬP VIÊN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Items (Permission-Filtered) */}
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
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 font-bold' 
                      : 'text-neutral-400 hover:bg-[#151e30] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-amber-400' : 'text-neutral-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.count !== undefined && !isActive && (
                    <span className="px-2 py-0.5 rounded-full bg-[#182234] text-neutral-400 text-[10px] font-mono border border-neutral-800">
                      {item.count}
                    </span>
                  )}

                  {item.highlight && !isActive && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 text-[10px] font-mono font-bold">
                      ADSENSE
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom: Reader Site & Current User Profile */}
        <div className="pt-4 border-t border-[#1a2333] space-y-2">
          {currentUser && (
            <div className="p-2.5 bg-[#151e30] rounded-xl border border-[#1e293b] flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 min-w-0">
                <img 
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200'} 
                  alt={currentUser.name} 
                  className="w-7 h-7 rounded-full object-cover border border-[#2a3a54] flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-bold text-white text-[11px] truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-neutral-400 font-mono truncate">{currentUser.email}</p>
                </div>
              </div>
              {currentUser.refCode && (
                <span className="px-1.5 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 rounded text-[9px] font-mono font-bold">
                  ?ref={currentUser.refCode}
                </span>
              )}
            </div>
          )}

          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-300 hover:bg-[#151e30] hover:text-white rounded-xl transition-colors border border-[#1a2333]"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span>Xem Trang Độc Giả</span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.5 rounded font-bold">
              Live
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area with Top Bar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Admin Bar with Logout at Top Right Corner */}
        <header className="h-14 bg-[#0d131f] border-b border-[#1a2333] px-4 sm:px-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500">Quản Trị</span>
            <span className="text-neutral-700">/</span>
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              {navItems.find(n => n.id === currentTab)?.label || 'Bảng Tổng Quan'}
            </span>
          </div>

          {/* Right Action Tools: Staff status badge and Logout */}
          <div className="flex items-center space-x-3">
            {currentUser && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#182234] border border-[#2a3a54] text-neutral-300 rounded-xl text-xs font-mono">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>{currentUser.name}</span>
              </span>
            )}

            <button
              onClick={logoutAdmin}
              className="px-3.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 border border-rose-800/60 active:scale-95 shadow-sm"
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
