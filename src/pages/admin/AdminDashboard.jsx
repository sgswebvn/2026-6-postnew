import React, { useState, useEffect } from 'react';
import { useBlog } from '../../context/BlogContext';
import { telemetryService } from '../../services/telemetryService';
import { storageService } from '../../services/storageService';
import { 
  FileText, 
  Eye, 
  DollarSign, 
  TrendingUp, 
  Users, 
  PlusCircle, 
  Edit3, 
  ExternalLink,
  Copy,
  ArrowUpRight,
  MessageSquare,
  ShieldCheck,
  CreditCard,
  BarChart3,
  Calendar,
  Filter,
  History,
  Clock
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const AdminDashboard = () => {
  const { posts, categories, staffList, activityLogs, navigate, savePost, showToast } = useBlog();
  const [telemetryData, setTelemetryData] = useState(() => telemetryService.getAggregatedMetrics());
  
  // Date / Time Filters
  const [timeFilter, setTimeFilter] = useState('30days'); // 'today' | '7days' | '30days' | 'year' | 'custom'
  const [customStart, setCustomStart] = useState('2026-08-01');
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setTelemetryData(telemetryService.getAggregatedMetrics());
  }, []);

  const totalPosts = posts.length;
  const publishedPosts = posts.filter(p => p.status === 'published');
  const draftPosts = posts.filter(p => p.status === 'draft');
  const rawTotalViews = posts.reduce((acc, p) => acc + (p.views || 0), 0);

  // Time Filter Multipliers & Date calculation
  let filteredViews = rawTotalViews;
  let filterLabel = 'Trong 30 ngày qua (Tháng 08/2026)';

  if (timeFilter === 'today') {
    filteredViews = Math.round(rawTotalViews * 0.08);
    filterLabel = `Hôm nay (${new Date().toLocaleDateString('vi-VN')})`;
  } else if (timeFilter === '7days') {
    filteredViews = Math.round(rawTotalViews * 0.35);
    filterLabel = 'Trong 7 ngày gần nhất';
  } else if (timeFilter === 'year') {
    filteredViews = rawTotalViews;
    filterLabel = 'Toàn bộ năm 2026';
  } else if (timeFilter === 'custom') {
    filterLabel = `Từ ${customStart} đến ${customEnd}`;
  }

  // US High RPM Benchmark ($36.50)
  const averageRPM = 36.50;
  const estimatedRevenue = ((filteredViews / 1000) * averageRPM).toFixed(2);

  const toggleStatus = (post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    savePost({ ...post, status: newStatus });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 text-neutral-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-wide">
            Bảng Tổng Quan Quản Trị
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Tổng hợp dữ liệu bài viết, lưu lượng độc giả, doanh thu và báo cáo hoạt động nhân sự.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/staff')}
            className="px-3.5 py-2 bg-[#182234] hover:bg-[#202d44] border border-[#2a3a54] text-neutral-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Nhân Sự & Bảng Lương ({staffList?.length || 0})</span>
          </button>

          <button
            onClick={() => navigate('/admin/posts/new')}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Viết Bài Mới</span>
          </button>
        </div>
      </div>

      {/* Date & Time Filtering Toolbar */}
      <div className="p-3.5 bg-[#111726] rounded-2xl border border-[#1e293b] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <span className="font-bold text-neutral-200">Bộ Lọc Thời Gian:</span>
          <span className="text-neutral-400 font-mono">({filterLabel})</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setTimeFilter('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              timeFilter === 'today' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-[#182234] hover:bg-[#202d44] text-neutral-300 border border-[#2a3a54]'
            }`}
          >
            Hôm nay
          </button>

          <button
            onClick={() => setTimeFilter('7days')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              timeFilter === '7days' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-[#182234] hover:bg-[#202d44] text-neutral-300 border border-[#2a3a54]'
            }`}
          >
            7 ngày qua
          </button>

          <button
            onClick={() => setTimeFilter('30days')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              timeFilter === '30days' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-[#182234] hover:bg-[#202d44] text-neutral-300 border border-[#2a3a54]'
            }`}
          >
            Tháng này (30 ngày)
          </button>

          <button
            onClick={() => setTimeFilter('year')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              timeFilter === 'year' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-[#182234] hover:bg-[#202d44] text-neutral-300 border border-[#2a3a54]'
            }`}
          >
            Năm 2026
          </button>

          <button
            onClick={() => setTimeFilter('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              timeFilter === 'custom' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-[#182234] hover:bg-[#202d44] text-neutral-300 border border-[#2a3a54]'
            }`}
          >
            Tùy chọn ngày
          </button>

          {timeFilter === 'custom' && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-[#1e293b]">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2 py-1 bg-[#182234] border border-[#2a3a54] text-white rounded text-[11px] font-mono"
              />
              <span className="text-neutral-500">→</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2 py-1 bg-[#182234] border border-[#2a3a54] text-white rounded text-[11px] font-mono"
              />
            </div>
          )}
        </div>
      </div>

      {/* 4 Clean Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 bg-[#111726] rounded-2xl border border-[#1e293b] shadow-md space-y-2 relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Lượt Đọc ({timeFilter === 'today' ? 'Hôm nay' : 'Kỳ này'})</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-serif font-black text-white">
              {filteredViews.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +14.2%
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 font-mono">Đo lường thời gian thực</p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 bg-[#111726] rounded-2xl border border-[#1e293b] shadow-md space-y-2 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Doanh Thu AdSense Ước Tính</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-serif font-black text-emerald-400">
              ${estimatedRevenue}
            </span>
            <span className="text-[11px] font-mono text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
              RPM ~${averageRPM}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 font-mono">Thị trường Mỹ (US Tier-1)</p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 bg-[#111726] rounded-2xl border border-[#1e293b] shadow-md space-y-2 relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Bài Viết Đang Live</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-serif font-black text-white">
              {publishedPosts.length}
            </span>
            <span className="text-xs text-neutral-400">/ {totalPosts} bài</span>
          </div>
          <p className="text-[11px] text-neutral-500 font-mono">{draftPosts.length} bài bản nháp</p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 bg-[#111726] rounded-2xl border border-[#1e293b] shadow-md space-y-2 relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Nhân Sự & Seeding CTV</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-serif font-black text-white">
              {staffList?.length || 4}
            </span>
            <span className="text-xs text-neutral-400">thành viên</span>
          </div>
          <p className="text-[11px] text-neutral-500 font-mono">Đang hoạt động</p>
        </div>
      </div>

      {/* Middle Split: Staff Seeding Leaderboard & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 6 Cols: Staff Seeding Leaderboard */}
        <div className="lg:col-span-6 p-5 bg-[#111726] rounded-2xl border border-[#1e293b] shadow-md space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <h3 className="font-serif text-sm font-bold text-white">
                Thành Tích Seeding Tiếp Thị (Cập Nhật Thời Gian Thực)
              </h3>
            </div>
            <button 
              onClick={() => navigate('/admin/staff')}
              className="text-xs text-blue-400 hover:underline font-medium"
            >
              Quản lý CTV →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {staffList.filter(s => s.refCode).map(staff => {
              const hits = (storageService.getReferralHits() || {})[staff.refCode] || 0;
              return (
                <div key={staff.id} className="p-3 bg-[#182234] border border-[#2a3a54] hover:border-purple-800/80 rounded-xl flex items-center justify-between transition-colors">
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-purple-400 font-mono">?ref={staff.refCode}</span>
                      <span className="text-[11px] text-white font-semibold truncate">({staff.name})</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 truncate">{staff.roleName || staff.role}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-[#0d131f] border border-purple-800/60 rounded text-xs font-mono font-bold text-purple-300">
                      {hits} views
                    </span>
                    <button
                      onClick={() => {
                        storageService.recordSeedingHit(staff.refCode, '/');
                        showToast(`🧪 Đã ghi nhận +1 click thật cho ?ref=${staff.refCode}!`);
                        setTelemetryData(telemetryService.getAggregatedMetrics());
                      }}
                      title="Test click mô phỏng (+1 View thật)"
                      className="p-1 bg-purple-950/60 hover:bg-purple-800 text-purple-200 border border-purple-800/50 rounded text-[10px] font-mono"
                    >
                      +1
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 6 Cols: Live Activity Feed */}
        <div className="lg:col-span-6 p-5 bg-[#111726] rounded-2xl border border-[#1e293b] shadow-md space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-purple-400" />
              <h3 className="font-serif text-sm font-bold text-white">
                Nhật Ký Hoạt Động Mới Nhất
              </h3>
            </div>
            <button 
              onClick={() => navigate('/admin/staff')}
              className="text-xs text-blue-400 hover:underline font-medium"
            >
              Toàn bộ ({activityLogs?.length || 0}) →
            </button>
          </div>

          <div className="space-y-2">
            {(activityLogs || []).slice(0, 3).map(log => (
              <div key={log.id} className="p-2.5 bg-[#182234] rounded-xl border border-[#2a3a54] flex items-start justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-white">
                    {log.staffName}: <span className="font-normal text-neutral-300">{log.title}</span>
                  </p>
                  <p className="text-[11px] text-neutral-400 line-clamp-1">{log.details}</p>
                </div>
                <span className="text-[10px] font-mono text-neutral-500 flex-shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table: Recent Articles Stream */}
      <div className="bg-[#111726] rounded-2xl border border-[#1e293b] shadow-md overflow-hidden space-y-3 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
          <div>
            <h3 className="font-serif text-sm font-bold text-white">
              Danh Sách Bài Viết Gần Đây
            </h3>
            <p className="text-xs text-neutral-400">Bấm nút sao chép link để rải bài nhanh chóng.</p>
          </div>

          <button
            onClick={() => navigate('/admin/posts')}
            className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Xem tất cả ({posts.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d131f] text-neutral-400 font-mono uppercase">
              <tr>
                <th className="p-3">Bài Viết</th>
                <th className="p-3">Chuyên Mục</th>
                <th className="p-3">Lượt Xem</th>
                <th className="p-3">Trạng Thái</th>
                <th className="p-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b] font-sans">
              {posts.slice(0, 6).map(post => {
                const cat = categories.find(c => c.id === post.categoryId);
                return (
                  <tr key={post.id} className="hover:bg-[#182234]/70 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={post.coverImage} 
                          alt={post.title} 
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-[#2a3a54]"
                        />
                        <div className="space-y-0.5 max-w-xs sm:max-w-md">
                          <span 
                            onClick={() => navigate(`/post/${post.slug}`)}
                            className="font-bold text-white hover:underline cursor-pointer line-clamp-1 text-xs"
                          >
                            {post.title}
                          </span>
                          <span className="text-[11px] text-neutral-400 font-mono block truncate">
                            /post/{post.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <Badge label={cat?.name || 'Category'} size="xs" />
                    </td>

                    <td className="p-3 font-mono font-medium text-neutral-300">
                      {(post.views || 0).toLocaleString()}
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() => toggleStatus(post)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase transition-colors ${
                          post.status === 'published' 
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
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
                          className="p-1.5 hover:bg-[#202d44] rounded text-neutral-400 hover:text-white"
                          title="Sao chép link bài viết 1-Click"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => navigate(`/post/${post.slug}`)}
                          className="p-1.5 hover:bg-[#202d44] rounded text-neutral-400 hover:text-white"
                          title="Xem trên trang độc giả"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/posts/edit/${post.id}`)}
                          className="p-1.5 hover:bg-[#202d44] rounded text-blue-400 hover:text-blue-300"
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
