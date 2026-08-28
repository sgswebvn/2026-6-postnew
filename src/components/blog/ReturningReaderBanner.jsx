import React, { useState, useEffect } from 'react';
import { useBlog } from '../../context/BlogContext';
import { telemetryService } from '../../services/telemetryService';
import { Bookmark, Sparkles, X, ArrowRight, BookOpen } from 'lucide-react';

export const ReturningReaderBanner = () => {
  const { bookmarks, navigate } = useBlog();
  const [session, setSession] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const s = telemetryService.getSessionInfo();
    setSession(s);
  }, []);

  if (dismissed || !session || (session.visitCount <= 1 && bookmarks.length === 0)) {
    return null;
  }

  const handleOpenBookmarks = () => {
    window.dispatchEvent(new CustomEvent('filter-bookmarks'));
    setDismissed(true);
  };

  return (
    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-900/10 via-indigo-900/5 to-purple-900/10 dark:from-blue-950/60 dark:via-[#111622] dark:to-purple-950/40 border border-blue-200 dark:border-blue-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-fadeIn">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-600 text-white rounded-xl flex-shrink-0">
          <BookOpen className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            Welcome back to The Horizon Post!
            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/80 text-blue-700 dark:text-blue-300 font-mono text-[10px]">
              Session #{session.visitCount}
            </span>
          </span>
          <p className="text-neutral-600 dark:text-neutral-300 text-[11px] mt-0.5">
            {bookmarks.length > 0
              ? `You have ${bookmarks.length} saved article${bookmarks.length > 1 ? 's' : ''} in your executive reading queue.`
              : 'Catch up on our latest macroeconomic dispatches and emerging AI analysis.'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 self-end sm:self-center">
        {bookmarks.length > 0 && (
          <button
            onClick={handleOpenBookmarks}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center gap-1 transition-all shadow-xs"
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
            <span>View Saved ({bookmarks.length})</span>
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
