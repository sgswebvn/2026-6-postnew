import React from 'react';
import { useBlog } from '../context/BlogContext';
import { FileQuestion, Home, Search, ArrowLeft, BookOpen, Compass, Sparkles } from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const NotFoundPage = ({ isAdmin = false }) => {
  const { navigate, categories, posts, setIsSearchOpen } = useBlog();

  const popularPosts = posts.slice(0, 4);

  return (
    <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 text-center animate-fadeIn">
      {/* 404 Visual Icon Box */}
      <div className="w-20 h-20 bg-blue-50 border border-blue-200 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xs">
        <FileQuestion className="w-10 h-10" />
      </div>

      {/* Main 404 Headline */}
      <div className="space-y-3">
        <span className="px-3.5 py-1 bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-full text-xs font-mono font-bold uppercase tracking-wider">
          Lỗi 404 • Page Not Found
        </span>

        <h1 className="font-serif text-3xl sm:text-5xl font-black text-neutral-900 tracking-tight">
          Không Tìm Thấy Trang Yêu Cầu
        </h1>

        <p className="text-base text-neutral-600 max-w-lg mx-auto leading-relaxed">
          {isAdmin 
            ? 'Đường dẫn quản trị bạn vừa truy cập không tồn tại hoặc đã được thay đổi trong hệ thống CMS.' 
            : 'Nội dung hoặc bài viết bạn đang tìm kiếm có thể đã được gỡ bỏ, đổi tên đường dẫn hoặc tạm thời không khả dụng.'}
        </p>
      </div>

      {/* Search Bar & Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => navigate(isAdmin ? '/admin' : '/')}
          className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all active:scale-95"
        >
          <Home className="w-4 h-4" />
          <span>{isAdmin ? 'Về Bảng Tổng Quan Admin' : 'Về Trang Chủ Độc Giả'}</span>
        </button>

        {!isAdmin && (
          <button
            onClick={() => setIsSearchOpen(true)}
            className="px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs"
          >
            <Search className="w-4 h-4" />
            <span>Tìm Kiếm Bài Viết</span>
          </button>
        )}
      </div>

      {/* Suggested Categories */}
      {!isAdmin && categories.length > 0 && (
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 mb-4">
            Khám phá các chuyên mục nổi bật:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {categories.slice(0, 6).map(cat => (
              <button
                key={cat.id}
                onClick={() => navigate(`/category/${cat.slug}`)}
                className="px-3.5 py-1.5 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-800 transition-all hover:border-blue-300 shadow-xs"
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Articles */}
      {!isAdmin && popularPosts.length > 0 && (
        <div className="mt-10 text-left bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Compass className="w-4 h-4 text-blue-600" />
            <h3 className="font-serif font-bold text-sm text-neutral-900">
              Có thể bạn đang tìm các bài viết sau:
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {popularPosts.map(post => (
              <div
                key={post.id}
                onClick={() => navigate(`/post/${post.slug}`)}
                className="p-3 bg-neutral-50 hover:bg-blue-50/50 border border-neutral-200 hover:border-blue-200 rounded-2xl cursor-pointer flex items-center space-x-3 transition-all"
              >
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-serif font-bold text-xs text-neutral-900 hover:text-blue-600 line-clamp-2 leading-snug">
                    {post.title}
                  </h4>
                  <span className="text-[10px] text-neutral-500 font-mono mt-1 block">
                    {post.readTime || '5 phút đọc'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
