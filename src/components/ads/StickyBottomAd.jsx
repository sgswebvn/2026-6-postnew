import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { X, Sparkles, ExternalLink } from 'lucide-react';

export const StickyBottomAd = () => {
  const { settings } = useBlog();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !settings?.adsense?.enabled || !settings?.adsense?.slots?.mobileAnchor?.enabled) {
    return null;
  }

  const isSandbox = settings.adsense.sandboxMode;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-2 bg-white/95 dark:bg-[#0c1017]/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 shadow-2xl transition-transform duration-300">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 relative">
        <button
          onClick={() => setDismissed(true)}
          className="absolute -top-7 right-2 bg-neutral-800 text-neutral-300 hover:text-white px-2 py-0.5 rounded-t text-[11px] flex items-center gap-1 shadow"
          title="Dismiss ad"
        >
          <span>Close Ad</span>
          <X className="w-3 h-3" />
        </button>

        <div className="flex-1 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-mono rounded uppercase font-semibold">
              AdSense Anchor
            </span>
            <div>
              <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                Chase Sapphire Preferred: 60,000 Points Welcome Offer ($750 Value)
              </p>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-300 hidden md:block">
                Top-rated US travel credit card with 3x points on dining and annual $50 hotel credit.
              </p>
            </div>
          </div>

          <div className="flex-shrink-0 flex items-center gap-2">
            <button
              onClick={() => alert('Simulated Google AdSense anchor click')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-md shadow flex items-center gap-1"
            >
              <span>Apply</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
