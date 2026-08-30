import React from 'react';
import { useBlog } from '../../context/BlogContext';
import { 
  FileText, 
  Users, 
  PlusCircle, 
  Edit3, 
  ExternalLink,
  Copy,
  ArrowUpRight,
  ShieldCheck,
  BarChart3,
  Calendar,
  Layers,
  Activity,
  History
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const AdminDashboard = () => {
  const { posts, categories, staffList, authors, activityLogs, navigate, savePost, showToast } = useBlog();

  const totalPosts = posts.length;
  const publishedPosts = posts.filter(p => p.status === 'published');
  const draftPosts = posts.filter(p => p.status === 'draft');

  const toggleStatus = (post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    savePost({ ...post, status: newStatus });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 text-neutral-900 font-admin admin-view">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 tracking-wide">
            Bảng Tổng Quan Quản Trị
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Giám sát ấn bản tòa soạn, đội ngũ nhân sự, phân mục tin tức và kết nối Google Analytics 4.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/staff')}
            className="px-3.5 py-2 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Nhân Sự & CTV ({staffList?.length || 0})</span>
          </button>

          <button
            onClick={() => navigate('/admin/posts/new')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Viết Bài Mới</span>
          </button>
        </div>
      </div>

      {/* 4 Clean Operational Metric Cards (No Fake Views) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Published Articles */}
        <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-2 relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500 font-medium">Bài Viết Đang Live</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-serif font-black text-neutral-900">
              {publishedPosts.length}
            </span>
            <span className="text-xs text-neutral-500">/ {totalPosts} bài</span>
          </div>
          <p className="text-[11px] text-neutral-400 font-mono">{draftPosts.length} bài bản nháp</p>
        </div>

        {/* Metric 2: Staff & Seeding Team */}
        <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-2 relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500 font-medium">Nhân Sự & CTV Seeding</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-serif font-black text-emerald-600">
              {staffList?.length || 0}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              Thành viên
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 font-mono">Đang phân quyền hoạt động</p>
        </div>

        {/* Metric 3: Editorial Desks & Categories */}
        <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-2 relative overflow-hidden group hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500 font-medium">Chuyên Mục Tòa Soạn</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-serif font-black text-neutral-900">
              {categories.length}
            </span>
            <span className="text-xs text-neutral-500">chuyên mục</span>
          </div>
          <p className="text-[11px] text-neutral-400 font-mono">Phân loại nội dung chuẩn SEO</p>
        </div>

        {/* Metric 4: GA4 Telemetry & AdSense Status */}
        <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-2 relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500 font-medium">Google Analytics 4 & Ads</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-sm font-bold font-mono text-neutral-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              G-MZ34K70519
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 font-mono">Quản lý View & Seeding trên GA4</p>
        </div>
      </div>

      {/* Middle Split: Staff Seeding Team & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 6 Cols: Staff Seeding Team */}
        <div className="lg:col-span-6 p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h3 className="font-serif text-sm font-bold text-neutral-900">
                Danh Sách Nhân Sự & Mã Tiếp Thị (Seeding)
              </h3>
            </div>
            <button 
              onClick={() => navigate('/admin/staff')}
              className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Quản lý CTV →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(staffList || []).filter(s => s.refCode).map(staff => (
              <div key={staff.id} className="p-3 bg-neutral-50 border border-neutral-200 hover:border-purple-300 rounded-xl flex items-center justify-between transition-colors">
                <div className="min-w-0 flex-1 mr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-purple-700 font-mono">?ref={staff.refCode}</span>
                    <span className="text-[11px] text-neutral-900 font-semibold truncate">({staff.name})</span>
                  </div>
                  <p className="text-[10px] text-neutral-500 truncate">{staff.roleName || staff.role}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-white border border-purple-200 rounded text-[10px] font-mono font-bold text-purple-700">
                    GA4 Tag Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 6 Cols: Live Activity Feed */}
        <div className="lg:col-span-6 p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-purple-600" />
              <h3 className="font-serif text-sm font-bold text-neutral-900">
                Nhật Ký Hoạt Động Tòa Soạn
              </h3>
            </div>
            <button 
              onClick={() => navigate('/admin/staff')}
              className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Toàn bộ ({activityLogs?.length || 0}) →
            </button>
          </div>

          <div className="space-y-2">
            {(activityLogs || []).slice(0, 4).map(log => (
              <div key={log.id} className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 flex items-start justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-neutral-900">
                    {log.staffName}: <span className="font-normal text-neutral-700">{log.title}</span>
                  </p>
                  <p className="text-[11px] text-neutral-500 line-clamp-1">{log.details}</p>
                </div>
                <span className="text-[10px] font-mono text-neutral-400 flex-shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table: Recent Articles Stream (Without Views Column) */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden space-y-3 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div>
            <h3 className="font-serif text-sm font-bold text-neutral-900">
              Danh Sách Bài Viết Mới Nhất
            </h3>
            <p className="text-xs text-neutral-500">Quản lý và sao chép đường dẫn bài viết trực tiếp.</p>
          </div>

          <button
            onClick={() => navigate('/admin/posts')}
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Xem tất cả ({posts.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-600 font-mono uppercase">
              <tr>
                <th className="p-3">Bài Viết</th>
                <th className="p-3">Người Tạo</th>
                <th className="p-3">Chuyên Mục</th>
                <th className="p-3">Trạng Thái</th>
                <th className="p-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-sans">
              {posts.slice(0, 6).map(post => {
                const cat = categories.find(c => c.id === post.categoryId);
                const staffCreator = (staffList || []).find(s => 
                  (post.createdById && s.id === post.createdById) ||
                  (post.createdByName && (s.name === post.createdByName || s.username === post.createdByName))
                );
                const authorCreator = (authors || []).find(a => a.id === post.authorId);
                const creatorName = post.createdByName || staffCreator?.name || post.authorName || authorCreator?.name || 'Ban Biên Tập';
                const refCode = staffCreator?.refCode || '';

                return (
                  <tr key={post.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={post.coverImage} 
                          alt={post.title} 
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-neutral-200"
                        />
                        <div className="space-y-0.5 max-w-xs sm:max-w-md">
                          <span 
                            onClick={() => navigate(`/post/${post.slug}`)}
                            className="font-bold text-neutral-900 hover:underline cursor-pointer line-clamp-1 text-xs"
                          >
                            {post.title}
                          </span>
                          <span className="text-[11px] text-neutral-400 font-mono block truncate">
                            /post/{post.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Creator */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-neutral-900 block truncate max-w-[120px]">
                          {creatorName}
                        </span>
                        {refCode && (
                          <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[9px] font-mono font-bold">
                            {refCode}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3">
                      <Badge label={cat?.name || 'Category'} size="xs" />
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() => toggleStatus(post)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                          post.status === 'published' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                        }`}
                      >
                        {post.status}
                      </button>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => {
                            const postUrl = `${window.location.origin}/post/${post.slug}`;
                            navigator.clipboard.writeText(postUrl);
                            showToast('Đã sao chép liên kết bài viết vào clipboard!');
                          }}
                          className="p-1.5 hover:bg-neutral-100 rounded text-neutral-500 hover:text-neutral-900 cursor-pointer"
                          title="Sao chép link bài viết 1-Click"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => navigate(`/post/${post.slug}`)}
                          className="p-1.5 hover:bg-neutral-100 rounded text-neutral-500 hover:text-neutral-900 cursor-pointer"
                          title="Xem trên trang độc giả"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/posts/edit/${post.id}`)}
                          className="p-1.5 hover:bg-blue-50 rounded text-blue-600 hover:text-blue-800 cursor-pointer"
                          title="Chỉnh sửa nội dung"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
