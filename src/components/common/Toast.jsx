import React from 'react';
import { useBlog } from '../../context/BlogContext';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Sparkles, 
  X, 
  Clock,
  ShieldCheck
} from 'lucide-react';

export const Toast = () => {
  const { toasts, removeToast } = useBlog();

  if (!toasts || toasts.length === 0) return null;

  const getStyle = (type) => {
    switch (type) {
      case 'error':
      case 'danger':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 animate-pulse" />,
          badge: 'LỖI HỆ THỐNG',
          badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-800/60',
          borderClass: 'border-rose-700/60 shadow-rose-950/50',
          accentBar: 'bg-rose-500',
          glow: 'shadow-[0_0_25px_-5px_rgba(244,63,94,0.3)]'
        };
      case 'warning':
        return {
          icon: <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />,
          badge: 'CẢNH BÁO TÒA SOẠN',
          badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-800/60',
          borderClass: 'border-amber-700/60 shadow-amber-950/50',
          accentBar: 'bg-amber-500',
          glow: 'shadow-[0_0_25px_-5px_rgba(245,158,11,0.3)]'
        };
      case 'info':
      case 'system':
        return {
          icon: <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0" />,
          badge: 'THÔNG BÁO TÒA SOẠN',
          badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60',
          borderClass: 'border-cyan-700/60 shadow-cyan-950/50',
          accentBar: 'bg-cyan-500',
          glow: 'shadow-[0_0_25px_-5px_rgba(6,182,212,0.3)]'
        };
      case 'success':
      default:
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />,
          badge: 'THÀNH CÔNG',
          badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
          borderClass: 'border-emerald-700/60 shadow-emerald-950/50',
          accentBar: 'bg-emerald-500',
          glow: 'shadow-[0_0_25px_-5px_rgba(16,185,129,0.3)]'
        };
    }
  };

  return (
    <aside aria-label="System Notifications" className="fixed top-5 right-5 z-[99999] flex flex-col gap-3 max-w-sm w-[calc(100vw-2.5rem)] sm:w-96 pointer-events-none">
      {toasts.map((t) => {
        const style = getStyle(t.type);
        return (
          <div
            key={t.id}
            className={`pointer-events-auto bg-[#0d131f]/95 backdrop-blur-2xl border ${style.borderClass} ${style.glow} rounded-2xl p-4 shadow-2xl space-y-2.5 transition-all transform animate-slideInRight text-white relative overflow-hidden group`}
          >
            {/* Header: Badge & Timestamp & Close */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {style.icon}
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border ${style.badgeClass}`}>
                  {t.title || style.badge}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-neutral-500" />
                  <span>{t.timeStr || 'Vừa xong'}</span>
                </span>
                <button
                  onClick={() => removeToast(t.id)}
                  className="p-1 text-neutral-400 hover:text-white hover:bg-[#1e293b] rounded-lg transition-colors"
                  title="Đóng thông báo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Message Body */}
            <p className="text-xs text-neutral-200 leading-relaxed font-medium pl-1">
              {t.message}
            </p>

            {/* Animated Bottom Auto-Dismiss Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800/80 overflow-hidden">
              <div 
                className={`h-full ${style.accentBar} animate-toastProgress`} 
                style={{ animationDuration: `${t.duration || 4000}ms` }}
              />
            </div>
          </div>
        );
      })}
    </aside>
  );
};
