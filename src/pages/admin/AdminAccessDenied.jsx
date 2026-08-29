import React from 'react';
import { useBlog } from '../../context/BlogContext';
import { ShieldAlert, ArrowLeft, User, Lock, Home, FileText } from 'lucide-react';

export const AdminAccessDenied = ({ requiredPermission = 'canManageStaff', featureName = 'Nhân Sự & Bảng Lương' }) => {
  const { currentUser, userRole, navigate, hasPermission } = useBlog();

  const getPermissionLabel = (perm) => {
    switch (perm) {
      case 'canManageStaff':
        return 'Quản Lý Nhân Sự & Bảng Lương (/admin/staff)';
      case 'canManagePosts':
        return 'Quản Lý & Soạn Thảo Bài Viết (/admin/posts)';
      case 'canManageCategories':
        return 'Quản Lý Chuyên Mục & Danh Mục (/admin/categories)';
      case 'canViewRevenue':
        return 'Xem Doanh Thu & Báo Cáo Google AdSense (/admin/adsense)';
      case 'canManageComments':
        return 'Kiểm Duyệt Bình Luận (/admin/comments)';
      case 'canManageSettings':
        return 'Cài Đặt Hệ Thống & Cấu Hình SEO (/admin/settings)';
      default:
        return featureName || 'Chức năng quản trị nâng cao';
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 text-center animate-fadeIn font-admin">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-8 sm:p-12 space-y-6">
        {/* Shield Icon */}
        <div className="w-16 h-16 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Title & Badges */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-mono font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>403 FORBIDDEN • GIỚI HẠN QUYỀN TRUY CẬP</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Bạn Không Có Quyền Truy Cập Trang Này
          </h2>

          <p className="text-sm text-neutral-600 max-w-lg mx-auto leading-relaxed">
            Chức năng <strong className="text-neutral-900">{getPermissionLabel(requiredPermission)}</strong> chỉ dành riêng cho tài khoản được Tổng Biên Tập (Admin) phân quyền quản trị.
          </p>
        </div>

        {/* User Account Details Card */}
        {currentUser && (
          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-left flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <img 
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200'} 
                alt={currentUser.name} 
                className="w-10 h-10 rounded-full object-cover border border-neutral-200"
              />
              <div>
                <p className="font-bold text-neutral-900">{currentUser.name}</p>
                <p className="text-neutral-500 font-mono text-[11px]">{currentUser.email}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg font-mono font-bold text-[11px]">
                {currentUser.roleName || currentUser.role || 'Cộng tác viên'}
              </span>
              <p className="text-[10px] text-neutral-400 mt-1 font-mono">Quyền hạn bị giới hạn</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          {hasPermission('canManagePosts') && (
            <button
              onClick={() => navigate('/admin/posts')}
              className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <FileText className="w-4 h-4" />
              <span>Về Quản Lý Bài Viết</span>
            </button>
          )}

          <button
            onClick={() => navigate('/admin/profile')}
            className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <User className="w-4 h-4" />
            <span>Xem Trang Hồ Sơ Cá Nhân</span>
          </button>

          <button
            onClick={() => navigate('/')}
            className="px-4 py-2.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <Home className="w-4 h-4" />
            <span>Về Trang Chủ Độc Giả</span>
          </button>
        </div>
      </div>
    </div>
  );
};
