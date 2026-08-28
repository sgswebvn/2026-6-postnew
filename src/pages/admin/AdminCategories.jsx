import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { Badge } from '../../components/common/Badge';
import { FolderTree, Plus, Edit2, Trash2, Check, Sparkles } from 'lucide-react';

export const AdminCategories = () => {
  const { categories, updateCategories, posts, showToast, showConfirm } = useBlog();
  const [editingId, setEditingId] = useState(null);
  const [newCat, setNewCat] = useState({ name: '', slug: '', description: '', color: 'blue' });
  const [editForm, setEditForm] = useState({ name: '', slug: '', description: '', color: 'blue' });

  const colors = [
    { key: 'emerald', label: 'Xanh Lá (Emerald)' },
    { key: 'blue', label: 'Xanh Dương (Blue)' },
    { key: 'rose', label: 'Đỏ Hồng (Rose)' },
    { key: 'amber', label: 'Vàng Hổ Phách (Amber)' },
    { key: 'indigo', label: 'Tím Chàm (Indigo)' },
    { key: 'neutral', label: 'Xám Trung Tính (Neutral)' }
  ];

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newCat.name.trim()) return;

    const slug = newCat.slug || newCat.name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]/g, '-');

    const created = {
      id: `cat-${Date.now()}`,
      name: newCat.name,
      slug,
      description: newCat.description || 'Chuyên mục phân tích chuyên sâu về chủ đề này.',
      color: newCat.color,
      icon: 'Layers',
      featured: true,
      postCount: 0
    };

    updateCategories([...categories, created]);
    setNewCat({ name: '', slug: '', description: '', color: 'blue' });
    showToast(`Đã tạo chuyên mục "${created.name}" thành công!`, 'success');
  };

  const handleStartEdit = (cat) => {
    setEditingId(cat.id);
    setEditForm({ name: cat.name, slug: cat.slug, description: cat.description, color: cat.color });
  };

  const handleSaveEdit = (id) => {
    const updated = categories.map(c => c.id === id ? { ...c, ...editForm } : c);
    updateCategories(updated);
    setEditingId(null);
    showToast('Đã lưu thay đổi chuyên mục!', 'success');
  };

  const handleDelete = (id, name) => {
    if (categories.length <= 1) {
      showToast('Bạn phải giữ ít nhất 1 chuyên mục trong hệ thống.', 'warning');
      return;
    }
    showConfirm({
      title: 'Xóa Chuyên Mục',
      message: `Bạn có chắc muốn xóa chuyên mục "${name}"? Các bài viết thuộc chuyên mục này có thể cần được phân loại lại.`,
      confirmText: 'Xóa Chuyên Mục',
      variant: 'danger',
      onConfirm: () => {
        const filtered = categories.filter(c => c.id !== id);
        updateCategories(filtered);
        showToast(`Đã xóa chuyên mục "${name}"`, 'info');
      }
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl">
      <div className="pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-neutral-950 dark:text-neutral-50">
            Quản Lý Chuyên Mục & Desks
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-mono font-bold">
            {categories.length} chuyên mục
          </span>
        </div>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Tổ chức các chủ đề phân tích RPM cao tại thị trường Mỹ và tối ưu SEO cho từng trang lưu trữ chuyên mục.
        </p>
      </div>

      {/* Add Category Card */}
      <form onSubmit={handleAdd} className="p-6 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-mono">
          <Plus className="w-4 h-4" />
          <span>Thêm Chuyên Mục Mới</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
              Tên Chuyên Mục *
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Công Nghệ Bất Động Sản"
              value={newCat.name}
              onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
              Đường Dẫn (Slug URL)
            </label>
            <input
              type="text"
              placeholder="cong-nghe-bat-dong-san"
              value={newCat.slug}
              onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
              Màu Sắc Badge
            </label>
            <select
              value={newCat.color}
              onChange={(e) => setNewCat({ ...newCat, color: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs"
            >
              {colors.map(col => (
                <option key={col.key} value={col.key}>{col.label}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
              Mô Tả Chuyên Mục (Hiển thị trang lưu trữ & Tối ưu Google SEO)
            </label>
            <input
              type="text"
              placeholder="Báo cáo phân tích chuyên sâu về thị trường địa ốc, REITs, và công nghệ quản lý bất động sản thông minh."
              value={newCat.description}
              onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow active:scale-95 transition-all"
          >
            <span>Tạo Chuyên Mục</span>
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Existing Categories List */}
      <div className="bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800">
        {categories.map(cat => {
          const count = posts.filter(p => p.categoryId === cat.id).length;
          const isEditing = editingId === cat.id;

          return (
            <div key={cat.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {isEditing ? (
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-900 border rounded-lg text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={editForm.slug}
                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                    className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-900 border rounded-lg text-xs font-mono"
                  />
                  <select
                    value={editForm.color}
                    onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                    className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-900 border rounded-lg text-xs"
                  >
                    {colors.map(col => (
                      <option key={col.key} value={col.key}>{col.label}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge label={cat.name} color={cat.color} size="sm" />
                    <span className="text-xs font-mono text-neutral-400">/{cat.slug}</span>
                    <span className="text-xs text-neutral-500 font-mono font-semibold">({count} bài viết)</span>
                  </div>
                  <p className="text-xs text-neutral-500 max-w-xl">
                    {cat.description}
                  </p>
                </div>
              )}

              <div className="flex items-center space-x-2 self-end sm:self-center">
                {isEditing ? (
                  <button
                    onClick={() => handleSaveEdit(cat.id)}
                    className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 shadow"
                    title="Lưu thay đổi"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartEdit(cat)}
                    className="p-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-blue-500 rounded-lg"
                    title="Sửa chuyên mục"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="p-2 bg-neutral-100 dark:bg-neutral-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg"
                  title="Xóa chuyên mục"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
