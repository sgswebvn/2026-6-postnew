import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { Badge } from '../../components/common/Badge';
import { 
  PlusCircle, 
  Search, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Eye, 
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileText,
  Copy
} from 'lucide-react';

export const AdminPostsList = () => {
  const { posts, categories, navigate, deletePost, savePost, showToast, showConfirm, userRole, currentUser } = useBlog();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Admin sees all posts. Staff only sees and manages their own posts!
  const isGlobalAdmin = userRole === 'admin' || currentUser?.role === 'admin';
  const visiblePosts = isGlobalAdmin
    ? posts
    : posts.filter(p => 
        (p.createdById && p.createdById === currentUser?.id) || 
        (p.authorId && (p.authorId === currentUser?.id || p.authorId === currentUser?.authorId)) ||
        (p.authorName && currentUser?.name && p.authorName.toLowerCase() === currentUser?.name.toLowerCase())
      );

  const filteredPosts = visiblePosts.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === 'all' || p.categoryId === selectedCat;
    const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  // Pagination calculation
  const totalItems = filteredPosts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

  const handleDelete = (id, title) => {
    showConfirm({
      title: 'Xóa Bài Viết Khỏi Tòa Soạn',
      message: `Bạn có chắc chắn muốn xóa bài viết "${title}" không? Dữ liệu bài viết này sẽ bị gỡ bỏ hoàn toàn khỏi hệ thống.`,
      confirmText: 'Xóa Bài Viết',
      variant: 'danger',
      onConfirm: () => {
        deletePost(id);
      }
    });
  };

  const toggleStatus = (post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    savePost({ ...post, status: newStatus });
  };

  const toggleAds = (post) => {
    savePost({ ...post, enableAds: !post.enableAds });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-admin admin-view pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-neutral-950 dark:text-neutral-50">
              {isGlobalAdmin ? 'Quản Lý Kho Bài Viết (Toàn Bộ)' : 'Bài Viết Của Tôi'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-mono font-bold">
              {isGlobalAdmin ? `Tổng số: ${posts.length} bài` : `Của bạn: ${visiblePosts.length} bài`}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            {isGlobalAdmin 
              ? 'Tài khoản Quản Trị Viên (Admin) có toàn quyền chỉnh sửa và quản lý tất cả bài viết của tòa soạn.'
              : `Bạn đang quản lý các bài viết do chính bạn (${currentUser?.name || 'Cộng tác viên'}) biên soạn và đăng tải.`}
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/posts/new')}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all active:scale-95 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Soạn Thảo Bài Mới</span>
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="p-4 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm kiếm bài viết theo tiêu đề, từ khóa hoặc đường dẫn slug..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCat}
            onChange={(e) => { setSelectedCat(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="all">Tất cả chuyên mục</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="published">Đã xuất bản (Published)</option>
            <option value="draft">Bản nháp (Draft)</option>
          </select>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-900/60 text-neutral-500 font-mono uppercase">
              <tr>
                <th className="p-3.5 text-center w-12">STT</th>
                <th className="p-3.5">Bài Viết & Tiêu Đề</th>
                <th className="p-3.5">Chuyên Mục</th>
                <th className="p-3.5">Lượt Xem</th>
                <th className="p-3.5">Trạng Thái</th>
                <th className="p-3.5">AdSense Ads</th>
                <th className="p-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-sans">
              {paginatedPosts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-neutral-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>Không tìm thấy bài viết nào phù hợp với bộ lọc hiện tại.</p>
                  </td>
                </tr>
              ) : (
                paginatedPosts.map((post, idx) => {
                  const cat = categories.find(c => c.id === post.categoryId);
                  const ordinalNumber = startIndex + idx + 1;

                  return (
                    <tr key={post.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40 transition-colors">
                      {/* Ordinal STT */}
                      <td className="p-3.5 text-center font-mono font-bold text-neutral-500">
                        {ordinalNumber}
                      </td>

                      {/* Title & Slug */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-3">
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-neutral-200 dark:border-neutral-700"
                          />
                          <div className="max-w-md">
                            <h3 
                              onClick={() => navigate(`/admin/posts/edit/${post.id}`)}
                              className="font-bold text-neutral-900 dark:text-neutral-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer line-clamp-1 text-sm"
                            >
                              {post.title}
                            </h3>
                            <span className="text-[11px] font-mono text-neutral-400 block truncate">
                              /post/{post.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5">
                        <Badge label={cat?.name || 'Category'} color={cat?.color || 'blue'} size="xs" />
                      </td>

                      {/* Views Count */}
                      <td className="p-3.5 font-mono text-neutral-600 dark:text-neutral-300">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{(post.views || 0).toLocaleString()}</span>
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="p-3.5">
                        <button
                          onClick={() => toggleStatus(post)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase transition-all ${
                            post.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                          }`}
                        >
                          {post.status}
                        </button>
                      </td>

                      {/* Enable Ads Toggle */}
                      <td className="p-3.5">
                        <button
                          onClick={() => toggleAds(post)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold border transition-all ${
                            post.enableAds
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                              : 'bg-neutral-100 text-neutral-400 border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700'
                          }`}
                          title="Bấm để bật/tắt quảng cáo AdSense trong bài này"
                        >
                          {post.enableAds ? '● Bật Ads' : '○ Tắt Ads'}
                        </button>
                      </td>

                      {/* Action Tools */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              const postUrl = `${window.location.origin}/post/${post.slug}`;
                              navigator.clipboard.writeText(postUrl);
                              showToast('Đã sao chép liên kết bài viết vào clipboard!');
                            }}
                            className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded text-emerald-600 dark:text-emerald-400"
                            title="Sao chép link bài viết 1-Click (để rải link / seeding)"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/post/${post.slug}`)}
                            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-500 hover:text-neutral-900"
                            title="Xem trên trang độc giả"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/posts/edit/${post.id}`)}
                            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-blue-500 hover:text-blue-600"
                            title="Chỉnh sửa nội dung"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(post.id, post.title)}
                            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-rose-500 hover:text-rose-600"
                            title="Xóa bài viết"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-neutral-50/60 dark:bg-neutral-900/40 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-neutral-500 font-mono">
              Hiển thị từ <span className="font-bold text-neutral-900 dark:text-neutral-100">{startIndex + 1}</span> đến <span className="font-bold text-neutral-900 dark:text-neutral-100">{endIndex}</span> trên tổng số <span className="font-bold text-blue-600 dark:text-blue-400">{totalItems} bài viết</span>
            </div>

            <div className="flex items-center space-x-1.5">
              {/* Previous Page */}
              <button
                onClick={() => handlePageChange(validPage - 1)}
                disabled={validPage <= 1}
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                title="Trang trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Page Number Buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all ${
                    page === validPage
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  {page}
                </button>
              ))}

              {/* Next Page */}
              <button
                onClick={() => handlePageChange(validPage + 1)}
                disabled={validPage >= totalPages}
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                title="Trang sau"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
