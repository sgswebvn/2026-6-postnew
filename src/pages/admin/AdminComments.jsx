import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storageService';
import { useBlog } from '../../context/BlogContext';
import { MessageSquare, Trash2, CheckCircle2, ThumbsUp, ExternalLink, ShieldCheck } from 'lucide-react';

export const AdminComments = () => {
  const { posts, navigate, showToast } = useBlog();
  const [comments, setComments] = useState([]);

  useEffect(() => {
    setComments(storageService.getAllComments());
  }, []);

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      const updated = storageService.deleteComment(id);
      setComments(updated);
      showToast('Đã xóa bình luận thành công');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl">
      <div className="pb-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-neutral-950 dark:text-neutral-50">
              Kiểm Duyệt Bình Luận Độc Giả
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-mono font-bold">
              {comments.length} phản hồi
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Duyệt và kiểm soát các cuộc thảo luận chuyên sâu dưới các bài viết.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800">
        {comments.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 space-y-2">
            <MessageSquare className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-sm font-semibold">Chưa có bình luận nào cần kiểm duyệt.</p>
          </div>
        ) : (
          comments.map(c => {
            const post = posts.find(p => p.id === c.postId);
            const formatted = new Intl.DateTimeFormat('vi-VN', {
              month: 'numeric',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }).format(new Date(c.createdAt || Date.now()));

            return (
              <div key={c.id} className="p-5 flex flex-col sm:flex-row items-start justify-between gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <img 
                      src={c.avatar} 
                      alt={c.authorName}
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-neutral-300 dark:ring-neutral-700" 
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{c.authorName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">{c.authorRole}</span>
                      </div>
                      <span className="text-[11px] text-neutral-400">{formatted}</span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 pl-12 leading-relaxed">
                    "{c.content}"
                  </p>

                  {post && (
                    <div className="pl-12 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-mono">
                      <span>Thuộc bài:</span>
                      <button 
                        onClick={() => navigate(`/post/${post.slug}`)}
                        className="hover:underline font-bold truncate max-w-md text-left"
                      >
                        {post.title}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <span className="flex items-center gap-1 text-xs font-mono text-neutral-500 mr-2">
                    <ThumbsUp className="w-3.5 h-3.5" /> {c.likes || 1}
                  </span>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 rounded-lg text-xs"
                    title="Xóa bình luận"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
