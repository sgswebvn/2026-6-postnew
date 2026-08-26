import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storageService';
import { useBlog } from '../../context/BlogContext';
import { Mail, Trash2, Download, Copy, Check, Users, ShieldCheck } from 'lucide-react';

export const AdminSubscribers = () => {
  const { showToast } = useBlog();
  const [subscribers, setSubscribers] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSubscribers(storageService.getSubscribers());
  }, []);

  const handleDelete = (email) => {
    if (window.confirm(`Xóa email ${email} khỏi danh sách?`)) {
      const updated = storageService.deleteSubscriber(email);
      setSubscribers(updated);
      showToast('Đã xóa người đăng ký');
    }
  };

  const handleCopyAll = () => {
    const list = subscribers.map(s => s.email).join(', ');
    navigator.clipboard.writeText(list);
    setCopied(true);
    showToast('Đã sao chép danh sách email vào bộ nhớ đệm!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleExportCSV = () => {
    const headers = 'Email,Ngay Dang Ky,Nguon\n';
    const rows = subscribers.map(s => `"${s.email}","${s.date || ''}","${s.source || 'Website'}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `the_horizon_post_subscribers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất file CSV danh sách độc giả!');
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl">
      <div className="pb-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-neutral-950 dark:text-neutral-50">
              Danh Sách Độc Giả Nhận Bản Tin (Newsletter)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-mono font-bold">
              {subscribers.length} độc giả
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Nguồn Lead chất lượng cao để gửi email marketing hoặc kéo traffic quay lại website tăng lượt hiển thị AdSense.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyAll}
            className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Sao Chép Toàn Bộ</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất File CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-50 dark:bg-neutral-900/60 text-neutral-500 font-mono uppercase">
            <tr>
              <th className="p-3.5">Email Độc Giả</th>
              <th className="p-3.5">Ngày Đăng Ký</th>
              <th className="p-3.5">Nguồn Đăng Ký</th>
              <th className="p-3.5 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {subscribers.map((s, idx) => {
              const formatted = new Intl.DateTimeFormat('vi-VN', {
                month: 'numeric',
                day: 'numeric',
                year: 'numeric'
              }).format(new Date(s.date || Date.now()));

              return (
                <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                  <td className="p-3.5 font-mono font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                    <span>{s.email}</span>
                  </td>
                  <td className="p-3.5 text-neutral-500 font-mono">{formatted}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-semibold">
                      {s.source || 'Website'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleDelete(s.email)}
                      className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-500 rounded-lg"
                      title="Xóa email"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
