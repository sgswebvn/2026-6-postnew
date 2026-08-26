import React from 'react';
import { useBlog } from '../../context/BlogContext';
import { 
  FileText, 
  Eye, 
  DollarSign, 
  TrendingUp, 
  Users, 
  PlusCircle, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  Sparkles,
  Layers,
  ShieldCheck,
  BarChart3,
  ArrowUpRight,
  MessageSquare
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const AdminDashboard = () => {
  const { posts, categories, settings, navigate, savePost } = useBlog();

  const totalPosts = posts.length;
  const publishedPosts = posts.filter(p => p.status === 'published');
  const draftPosts = posts.filter(p => p.status === 'draft');
  const totalViews = posts.reduce((acc, p) => acc + (p.views || 0), 0);

  // US Market High RPM Simulation ($36.50 average RPM)
  const averageRPM = 36.50;
  const estimatedRevenue = ((totalViews / 1000) * averageRPM).toFixed(2);

  const toggleStatus = (post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    savePost({ ...post, status: newStatus });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-neutral-950 dark:text-neutral-50">
              Bảng Tổng Quan Quản Trị & Doanh Thu
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-mono font-bold">
              US Market Hub
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Theo dõi lưu lượng độc giả, kiểm soát vị trí quảng cáo Google AdSense và quản lý tiến độ xuất bản bài viết.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('#/admin/adsense')}
            className="px-4 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
          >
            <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Cấu Hình AdSense</span>
          </button>

          <button
            onClick={() => navigate('#/admin/posts/new')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Soạn Thảo Bài Mới</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Tổng số bài viết */}
        <div className="p-5 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-neutral-400">Tổng Số Bài Viết</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="font-serif text-3xl font-black text-neutral-900 dark:text-white">{totalPosts}</h3>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              {publishedPosts.length} đã xuất bản • {draftPosts.length} bản nháp
            </span>
          </div>
        </div>

        {/* Card 2: Lượt xem trang */}
        <div className="p-5 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-neutral-400">Tổng Lượt Xem (Impressions)</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="font-serif text-3xl font-black text-neutral-900 dark:text-white">{totalViews.toLocaleString()}</h3>
            <span className="text-xs font-mono text-blue-600 dark:text-blue-400 flex items-center gap-0.5 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" /> Độc giả US/Tier-1
            </span>
          </div>
        </div>

        {/* Card 3: RPM Trung Bình Thị Trường Mỹ */}
        <div className="p-5 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-neutral-400">RPM Trung Bình Dự Kiến</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="font-serif text-3xl font-black text-amber-600 dark:text-amber-400">${averageRPM.toFixed(2)}</h3>
            <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-semibold">
              Niche Tài Chính / AI Tech
            </span>
          </div>
        </div>

        {/* Card 4: Doanh thu ước tính */}
        <div className="p-5 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-neutral-400">Doanh Thu AdSense Ước Tính</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="font-serif text-3xl font-black text-emerald-600 dark:text-emerald-400">
              ${estimatedRevenue}
            </h3>
            <span className="text-xs font-mono text-neutral-400">
              Doanh thu lũy kế
            </span>
          </div>
        </div>
      </div>

      {/* AdSense Live Status Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-950/40 via-neutral-900/60 to-neutral-900 border border-blue-500/30 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start sm:items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-2xl flex-shrink-0 shadow-md">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Trạng Thái Kiếm Tiền Google AdSense: {settings?.adsense?.enabled ? 'Đang Hoạt Động (Active)' : 'Đã Tắt'}
              </h4>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                settings?.adsense?.sandboxMode ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                {settings?.adsense?.sandboxMode ? 'CHẾ ĐỘ MÔ PHỎNG (SANDBOX)' : 'CHẾ ĐỘ LIVE ADSENSE'}
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Mã Publisher ID: <span className="font-mono text-neutral-200 font-bold">{settings?.adsense?.publisherId}</span> • 6 vị trí quảng cáo chiến lược đã sẵn sàng.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('#/admin/adsense')}
          className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap shadow transition-all flex items-center gap-1.5"
        >
          <span>Quản Lý Vị Trí Ads</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Performance Analytics & Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1 & 2: Traffic & RPM Insights */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <h3 className="font-serif text-base font-bold text-neutral-900 dark:text-neutral-100">
                Phân Bổ Lượng Đọc Theo Chuyên Mục (Beats)
              </h3>
            </div>
            <span className="text-xs font-mono text-neutral-400">Lưu lượng thực tế</span>
          </div>

          <div className="space-y-3">
            {categories.map(cat => {
              const catPosts = posts.filter(p => p.categoryId === cat.id);
              const catViews = catPosts.reduce((sum, p) => sum + (p.views || 0), 0);
              const percent = totalViews > 0 ? Math.round((catViews / totalViews) * 100) : 20;

              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">{cat.name} ({catPosts.length} bài)</span>
                    <span className="font-mono text-neutral-500">{catViews.toLocaleString()} views ({percent}%)</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        cat.color === 'emerald' ? 'bg-emerald-500' :
                        cat.color === 'blue' ? 'bg-blue-500' :
                        cat.color === 'rose' ? 'bg-rose-500' :
                        cat.color === 'amber' ? 'bg-amber-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.max(percent, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Col 3: Quick Action Hub */}
        <div className="p-6 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-serif text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Thao Tác Nhanh Quản Trị</span>
            </h3>
            <p className="text-xs text-neutral-500">
              Các lối tắt tối ưu giúp bạn cập nhật bài viết và theo dõi tương tác nhanh nhất.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => navigate('#/admin/posts/new')}
                className="w-full p-2.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors text-left"
              >
                <PlusCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span>Viết bài phân tích mới (Chuẩn SEO)</span>
              </button>

              <button
                onClick={() => navigate('#/admin/comments')}
                className="w-full p-2.5 bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors text-left"
              >
                <MessageSquare className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Duyệt bình luận độc giả</span>
              </button>

              <button
                onClick={() => navigate('#/admin/subscribers')}
                className="w-full p-2.5 bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors text-left"
              >
                <Users className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <span>Xem danh sách email nhận tin</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400 font-mono flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Bảo mật hệ thống hoạt động 100%</span>
          </div>
        </div>
      </div>

      {/* Recent Articles Table */}
      <div className="bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Danh Sách Bài Viết Gần Đây
            </h3>
            <p className="text-xs text-neutral-500">Quản lý nhanh trạng thái xuất bản và kiểm soát hiển thị quảng cáo.</p>
          </div>

          <button
            onClick={() => navigate('#/admin/posts')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Xem toàn bộ ({posts.length} bài)</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-900/60 text-neutral-500 font-mono uppercase">
              <tr>
                <th className="p-3">Bài Viết & Tiêu Đề</th>
                <th className="p-3">Chuyên Mục</th>
                <th className="p-3">Lượt Xem</th>
                <th className="p-3">Trạng Thái</th>
                <th className="p-3">Quảng Cáo Trong Bài</th>
                <th className="p-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {posts.slice(0, 5).map(post => {
                const cat = categories.find(c => c.id === post.categoryId);
                return (
                  <tr key={post.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={post.coverImage} 
                          alt={post.title} 
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="space-y-0.5 max-w-xs sm:max-w-md">
                          <span 
                            onClick={() => navigate(`#/post/${post.slug}`)}
                            className="font-bold text-neutral-900 dark:text-neutral-100 hover:text-blue-600 cursor-pointer line-clamp-1"
                          >
                            {post.title}
                          </span>
                          <span className="text-[11px] text-neutral-400 font-mono">
                            /{post.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <Badge label={cat?.name || 'Category'} color={cat?.color || 'blue'} size="xs" />
                    </td>

                    <td className="p-3 font-mono font-semibold">
                      {(post.views || 0).toLocaleString()}
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() => toggleStatus(post)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase transition-colors ${
                          post.status === 'published' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                        title="Bấm để chuyển đổi trạng thái Xuất bản / Bản nháp"
                      >
                        {post.status === 'published' ? 'Đã Xuất Bản' : 'Bản Nháp'}
                      </button>
                    </td>

                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-mono font-semibold ${post.enableAds ? 'text-emerald-500' : 'text-neutral-400'}`}>
                        {post.enableAds ? '● Bật Ads' : '○ Đang Tắt'}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`#/post/${post.slug}`)}
                          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                          title="Xem trên trang độc giả"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => navigate(`#/admin/posts/edit/${post.id}`)}
                          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-blue-500 hover:text-blue-600"
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
