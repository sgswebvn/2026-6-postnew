import React, { useState } from 'react';
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
  User,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  TrendingUp
} from 'lucide-react';

export const AdminLayout = ({ children, currentTab = 'dashboard' }) => {
  const { logoutAdmin, navigate, settings, posts, staffList, userRole, currentUser, hasPermission } = useBlog();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('horizon_admin_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('horizon_admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  const allNavItems = [
    { id: 'dashboard', label: 'Bảng Tổng Quan', icon: LayoutDashboard, path: '/admin', perm: 'canViewRevenue', adminOnly: true },
    { id: 'posts', label: 'Quản Lý Bài Viết', icon: FileText, path: '/admin/posts', count: posts.length, perm: 'canManagePosts' },
    { id: 'new-post', label: 'Soạn Thảo Bài Mới', icon: PlusCircle, path: '/admin/posts/new', perm: 'canManagePosts' },
    { id: 'categories', label: 'Chuyên Mục & Desks', icon: FolderTree, path: '/admin/categories', perm: 'canManageCategories' },
    { id: 'staff', label: 'Nhân Sự & Bảng Lương', icon: Users, path: '/admin/staff', count: staffList?.length || 4, perm: 'canManageStaff' },
    { id: 'adsense', label: 'Google AdSense Ads', icon: DollarSign, path: '/admin/adsense', highlight: true, perm: 'canViewRevenue' },
    { id: 'profile', label: 'Hồ Sơ & Tiếp Thị Seeding', icon: User, path: '/admin/profile' },
    { id: 'comments', label: 'Quản Lý Bình Luận', icon: MessageSquare, path: '/admin/comments', perm: 'canManageComments' },
    { id: 'subscribers', label: 'Email Đăng Ký Tin', icon: Mail, path: '/admin/subscribers', perm: 'canManageSettings' },
    { id: 'authors', label: 'Ban Biên Tập (E-E-A-T)', icon: Users, path: '/admin/authors', perm: 'canManageSettings' },
    { id: 'settings', label: 'Cài Đặt & Cấu Hình SEO', icon: Settings, path: '/admin/settings', perm: 'canManageSettings' },
  ];

  // Dynamic filter by individual staff permissions
  const navItems = allNavItems.filter(item => {
    if (userRole === 'admin' || currentUser?.role === 'admin') return true;
    if (item.id === 'profile') return true;
    return hasPermission(item.perm);
  });

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#1C1917] flex flex-col lg:flex-row admin-view font-admin animate-fadeIn">
      {/* Admin Sidebar with Collapsible Rail on Desktop */}
      <aside className={`w-full ${isCollapsed ? 'lg:w-20' : 'lg:w-72'} bg-[#F1ECE4] border-r border-[#E2DAD0] flex flex-col justify-between p-3.5 flex-shrink-0 transition-all duration-300`}>
        <div className="space-y-5">
          {/* Brand & Toggle Button */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} pb-3 border-b border-[#E2DAD0]`}>
            {!isCollapsed ? (
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2D2823] to-[#44403C] text-white font-serif font-black flex items-center justify-center text-base shadow-md shadow-neutral-900/15 flex-shrink-0">
                  H
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-serif font-bold text-sm leading-tight text-[#1C1917] tracking-wide truncate">
                    {settings?.siteName || 'THE HORI CLICK'}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold truncate ${
                      userRole === 'admin' || currentUser?.role === 'admin'
                        ? 'bg-[#E8E2D7] text-[#44403C] border border-[#D8CFC2]'
                        : 'bg-[#EDE7DE] text-[#57534E] border border-[#DDD5C7]'
                    }`}>
                      {currentUser ? `${currentUser.name} (${currentUser.roleName || currentUser.role})` : (userRole === 'admin' ? '👑 TỔNG BIÊN TẬP' : '✍️ BIÊN TẬP VIÊN')}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2D2823] to-[#44403C] text-white font-serif font-black flex items-center justify-center text-lg shadow-md shadow-neutral-900/15">
                H
              </span>
            )}

            {/* Desktop Collapse Toggle */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex p-1.5 hover:bg-[#E5DDD2] text-[#78716C] hover:text-[#1C1917] rounded-xl transition-colors"
              title={isCollapsed ? 'Mở rộng thanh menu (Ctrl+B)' : 'Thu gọn thanh menu để có thêm không gian làm việc'}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4 text-blue-600" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
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
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-3 py-2.5'} rounded-xl text-xs font-semibold transition-all ${
                    isActive 
                      ? 'bg-[#2D2823] text-white shadow-md shadow-neutral-900/10 font-bold' 
                      : 'text-[#57534E] hover:bg-[#E8E2D7] hover:text-[#1C1917]'
                  }`}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-amber-600' : 'text-[#78716C]'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isCollapsed && item.count !== undefined && !isActive && (
                    <span className="px-2 py-0.5 rounded-full bg-[#E8E1D5] text-[#57534E] text-[10px] font-mono border border-[#DDD5C7]">
                      {item.count}
                    </span>
                  )}

                  {!isCollapsed && item.highlight && !isActive && (
                    <span className="px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] text-[10px] font-mono font-bold">
                      ADSENSE
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom: User Profile & Reader Site */}
        <div className="pt-3 border-t border-[#E2DAD0] space-y-2">
          {currentUser && (
            <div 
              onClick={() => navigate('/admin/profile')}
              className={`p-2 bg-[#FAF7F2] hover:bg-[#EFE9DF] cursor-pointer rounded-xl border border-[#E2DAD0] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} text-xs transition-colors`}
              title="Xem trang Hồ sơ cá nhân"
            >
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2'} min-w-0`}>
                <img 
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200'} 
                  alt={currentUser.name} 
                  className="w-8 h-8 rounded-full object-cover border border-[#D8CFC2] flex-shrink-0"
                />
                {!isCollapsed && (
                  <div className="min-w-0">
                    <p className="font-bold text-[#1C1917] text-[11px] truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-[#78716C] font-mono truncate">{currentUser.email}</p>
                  </div>
                )}
              </div>
              {!isCollapsed && currentUser.refCode && (
                <span className="px-1.5 py-0.5 bg-[#F3E8FF] text-[#7E22CE] border border-[#E9D5FF] rounded text-[9px] font-mono font-bold">
                  ?ref={currentUser.refCode}
                </span>
              )}
            </div>
          )}

          <button
            onClick={() => navigate('/')}
            title={isCollapsed ? 'Xem Trang Độc Giả' : undefined}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center py-2' : 'justify-between px-3 py-2'} text-xs font-semibold text-[#44403C] hover:bg-[#E8E2D7] rounded-xl transition-colors border border-[#E2DAD0] bg-white`}
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              {!isCollapsed && <span>Xem Trang Độc Giả</span>}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] font-mono bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] px-1.5 py-0.5 rounded font-bold">
                Live
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area with Top Bar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Admin Bar with Collapse Toggle & User Profile Links */}
        <header className="h-14 bg-[#FAF8F5] border-b border-[#E2DAD0] px-4 sm:px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSidebar}
              className="p-1.5 hover:bg-[#E5DDD2] text-[#78716C] hover:text-[#1C1917] rounded-lg transition-colors mr-1"
              title={isCollapsed ? 'Mở rộng thanh menu' : 'Thu gọn thanh menu để có thêm không gian'}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4 text-blue-600" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            <span className="text-xs font-semibold text-[#78716C] hidden sm:inline">Quản Trị</span>
            <span className="text-[#D8CFC2] hidden sm:inline">/</span>
            <span className="text-xs font-bold text-[#1C1917] uppercase tracking-wider font-mono truncate max-w-[200px] sm:max-w-none">
              {navItems.find(n => n.id === currentTab)?.label || 'Bảng Điều Khiển'}
            </span>
          </div>

          {/* Right Action Tools: Live Status Pill, Staff Profile link and Logout */}
          <div className="flex items-center space-x-2.5">
            {/* Realtime System & Storage CDN Live Status Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-[11px] font-mono text-[#047857] shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-bold">Trạng Thái: Trực Tuyến</span>
              <span className="text-[#A7F3D0]">•</span>
              <span className="text-[#047857] text-[10px]">Cloud MongoDB Ready</span>
            </div>

            {currentUser && (
              <button
                onClick={() => navigate('/admin/profile')}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F1ECE4] hover:bg-[#E8E2D7] border border-[#E2DAD0] text-[#1C1917] rounded-xl text-xs font-mono transition-colors"
                title="Xem và chỉnh sửa hồ sơ cá nhân"
              >
                <img 
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200'} 
                  alt={currentUser.name} 
                  className="w-4 h-4 rounded-full object-cover"
                />
                <span className="font-bold hidden md:inline">{currentUser.name}</span>
                {currentUser.refCode && (
                  <span className="px-1 py-0.2 bg-[#F3E8FF] text-[#7E22CE] rounded text-[9px] font-bold">
                    ?ref={currentUser.refCode}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={logoutAdmin}
              className="px-3 py-1.5 bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#BE123C] rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 border border-[#FECDD3] active:scale-95 shadow-xs"
              title="Đăng xuất khỏi bảng quản trị"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đăng Xuất</span>
            </button>
          </div>
        </header>

        {/* Content Wrapper (Maximized when collapsed) */}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto ${isCollapsed ? 'max-w-full' : 'max-w-7xl'} w-full mx-auto transition-all`}>
          {children}
        </main>
      </div>
    </div>
  );
};
