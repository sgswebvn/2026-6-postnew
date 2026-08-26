import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { Users, Plus, Edit2, Trash2, Check, ShieldCheck, CheckCircle } from 'lucide-react';

export const AdminAuthors = () => {
  const { authors, updateAuthors, posts } = useBlog();
  const [editingId, setEditingId] = useState(null);
  const [newAuthor, setNewAuthor] = useState({
    name: '',
    role: '',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    bio: '',
    twitter: '@author_handle',
    verified: true
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newAuthor.name.trim() || !newAuthor.role.trim()) return;

    const slug = newAuthor.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
    const created = {
      ...newAuthor,
      id: `author-${Date.now()}`,
      slug
    };

    updateAuthors([...authors, created]);
    setNewAuthor({
      name: '',
      role: '',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
      bio: '',
      twitter: '@author_handle',
      verified: true
    });
  };

  const handleDelete = (id, name) => {
    if (authors.length <= 1) {
      alert('Bạn phải giữ lại ít nhất 1 tác giả.');
      return;
    }
    if (window.confirm(`Xóa tác giả "${name}"?`)) {
      updateAuthors(authors.filter(a => a.id !== id));
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl">
      <div className="pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-neutral-950 dark:text-neutral-50">
            Hồ Sơ Ban Biên Tập & Tác Giả (E-E-A-T)
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-mono font-bold">
            {authors.length} chuyên gia
          </span>
        </div>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Xây dựng tín hiệu tín nhiệm (Experience, Expertise, Authoritativeness, Trustworthiness) giúp Google đánh giá cao và duyệt AdSense nhanh nhất.
        </p>
      </div>

      {/* Add Author Card */}
      <form onSubmit={handleAdd} className="p-6 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-mono">
          <Plus className="w-4 h-4" />
          <span>Thêm Biên Tập Viên / Chuyên Gia Mới</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
              Họ Tên Tác Giả & Bằng Cấp (Ví dụ: CFA, MD, PhD) *
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Sarah Jenkins, CFA"
              value={newAuthor.name}
              onChange={(e) => setNewAuthor({ ...newAuthor, name: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
              Chức Danh Biên Tập (Role) *
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Trưởng Ban Phân Tích Tài Chính Cấp Cao"
              value={newAuthor.role}
              onChange={(e) => setNewAuthor({ ...newAuthor, role: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
              Tiểu Sử & Kinh Nghiệm Chuyên Môn (Bio E-E-A-T)
            </label>
            <textarea
              rows="2"
              placeholder="Mô tả kinh nghiệm thực tế tại Phố Wall, các tập đoàn công nghệ lớn hoặc viện nghiên cứu y khoa..."
              value={newAuthor.bio}
              onChange={(e) => setNewAuthor({ ...newAuthor, bio: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
              Ảnh Đại Diện (URL)
            </label>
            <input
              type="text"
              value={newAuthor.avatar}
              onChange={(e) => setNewAuthor({ ...newAuthor, avatar: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
              Tài Khoản X / Twitter / LinkedIn
            </label>
            <input
              type="text"
              value={newAuthor.twitter}
              onChange={(e) => setNewAuthor({ ...newAuthor, twitter: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow"
          >
            <span>Thêm Tác Giả</span>
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Existing Authors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {authors.map(a => {
          const authorPostCount = posts.filter(p => p.authorId === a.id).length;
          return (
            <div key={a.id} className="p-5 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-start gap-4 justify-between">
              <div className="flex items-start gap-3">
                <img 
                  src={a.avatar} 
                  alt={a.name}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-blue-500/20 flex-shrink-0" 
                />
                <div className="space-y-0.5">
                  <h4 className="font-serif text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1">
                    {a.name}
                    {a.verified && <CheckCircle className="w-3.5 h-3.5 text-blue-500 inline" />}
                  </h4>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{a.role}</p>
                  <p className="text-[11px] text-neutral-400 line-clamp-2">{a.bio}</p>
                  <span className="text-[10px] font-mono text-neutral-500 block pt-1">{authorPostCount} bài viết đã xuất bản</span>
                </div>
              </div>

              <button
                onClick={() => handleDelete(a.id, a.name)}
                className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-500 rounded-lg flex-shrink-0"
                title="Xóa tác giả"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
