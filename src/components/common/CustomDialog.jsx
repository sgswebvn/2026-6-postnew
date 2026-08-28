import React from 'react';
import { useBlog } from '../../context/BlogContext';
import { AlertTriangle, HelpCircle, CheckCircle2, Info, X } from 'lucide-react';

export const CustomDialog = () => {
  const { dialog, closeDialog } = useBlog();

  if (!dialog) return null;

  const isPrompt = dialog.type === 'prompt';
  const isDanger = dialog.variant === 'danger' || dialog.type === 'danger';

  const handleConfirm = () => {
    if (isPrompt) {
      const inputEl = document.getElementById('custom-dialog-input');
      const val = inputEl ? inputEl.value : '';
      if (dialog.onConfirm) dialog.onConfirm(val);
    } else {
      if (dialog.onConfirm) dialog.onConfirm();
    }
    closeDialog();
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#0f172a] border border-[#334155] rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-scaleUp text-white">
        {/* Header Icon & Title */}
        <div className="flex items-start justify-between gap-3 pb-2 border-b border-[#1e293b]">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              isDanger 
                ? 'bg-rose-950/80 text-rose-400 border border-rose-800/60' 
                : isPrompt 
                ? 'bg-blue-950/80 text-blue-400 border border-blue-800/60' 
                : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
            }`}>
              {isDanger ? (
                <AlertTriangle className="w-6 h-6" />
              ) : isPrompt ? (
                <Info className="w-6 h-6" />
              ) : (
                <HelpCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="font-sans text-base sm:text-lg font-bold text-white tracking-tight">
                {dialog.title || (isPrompt ? 'Nhập Thông Tin' : isDanger ? 'Xác Nhận Hành Động' : 'Thông Báo Hệ Thống')}
              </h3>
              <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                {isDanger ? 'Cảnh Báo Quan Trọng' : 'Yêu Cầu Tương Tác'}
              </span>
            </div>
          </div>

          <button
            onClick={closeDialog}
            className="p-1 hover:bg-[#1e293b] rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Body */}
        <div className="text-sm text-neutral-300 leading-relaxed">
          {dialog.message}
        </div>

        {/* Optional Prompt Input */}
        {isPrompt && (
          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1.5 font-mono">
              {dialog.inputLabel || 'Dữ liệu đầu vào:'}
            </label>
            <input
              id="custom-dialog-input"
              type="text"
              defaultValue={dialog.defaultValue || ''}
              placeholder={dialog.placeholder || 'Nhập tại đây...'}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm();
                if (e.key === 'Escape') closeDialog();
              }}
              className="w-full px-3.5 py-2.5 bg-[#182234] border border-[#334155] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500 shadow-inner"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e293b]">
          {dialog.showCancel !== false && (
            <button
              type="button"
              onClick={closeDialog}
              className="px-4 py-2.5 bg-[#1e293b] hover:bg-[#28354b] text-neutral-300 rounded-xl text-xs font-bold transition-all"
            >
              {dialog.cancelText || 'Hủy Bỏ'}
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-lg active:scale-95 transition-all ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{dialog.confirmText || 'Xác Nhận'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
