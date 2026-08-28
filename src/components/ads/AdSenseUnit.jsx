import React, { useEffect, useRef } from 'react';
import { useBlog } from '../../context/BlogContext';
import { Sparkles, ExternalLink } from 'lucide-react';

export const AdSenseUnit = ({ 
  slotType = 'inArticleTop', 
  customClass = '',
  customLabel = ''
}) => {
  const { settings, showToast } = useBlog();
  const adRef = useRef(null);

  const isEnabled = Boolean(settings?.adsense?.enabled);
  const slotConfig = settings?.adsense?.slots?.[slotType];
  const isSlotEnabled = Boolean(slotConfig?.enabled);
  const isSandbox = Boolean(settings?.adsense?.sandboxMode);
  const publisherId = settings?.adsense?.publisherId || 'ca-pub-9876543210123456';
  const slotId = slotConfig?.slotId || '1234567890';

  useEffect(() => {
    if (isEnabled && isSlotEnabled && !isSandbox && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
  }, [isEnabled, isSlotEnabled, isSandbox, slotId]);

  if (!isEnabled || !isSlotEnabled) {
    return null;
  }

  // Demo creative mockups for realistic US audience monetization visualization
  const demoCreatives = {
    headerLeaderboard: {
      headline: 'Vanguard Personal Advisor: Wealth Management for Forward Thinkers',
      sub: 'Get customized index-driven portfolios with 0.30% advisory fees. Fiduciary standards.',
      brand: 'Vanguard Wealth',
      cta: 'Explore Portfolios',
      bg: 'from-amber-950/20 via-neutral-900/40 to-neutral-900',
      badge: 'SPONSORED LEADERBOARD • 728x90',
    },
    inArticleTop: {
      headline: 'SoFi High-Yield Savings: Earn Up to 4.60% APY with Direct Deposit',
      sub: 'FDIC insured up to $2M. No account fees. Automate your cash reserve growth today.',
      brand: 'SoFi Bank, N.A.',
      cta: 'Open Account',
      bg: 'from-blue-950/30 via-neutral-900/40 to-neutral-900',
      badge: 'GOOGLE ADSENSE • IN-ARTICLE HIGH CTR',
    },
    inArticleMid: {
      headline: 'Scale Autonomous AI Agents with Anthropic Claude & AWS Bedrock',
      sub: 'Deploy enterprise-grade reasoning models with zero infrastructure overhead.',
      brand: 'AWS Cloud & AI',
      cta: 'Start Free Tier',
      bg: 'from-indigo-950/30 via-neutral-900/40 to-neutral-900',
      badge: 'GOOGLE ADSENSE • IN-CONTENT DISPLAY',
    },
    sidebarSticky: {
      headline: 'Oura Ring Gen 4: Precision Sleep & Recovery Biomarkers',
      sub: 'Track HRV, circadian temperature trends, and cardiovascular age with clinical precision.',
      brand: 'Oura Health Tech',
      cta: 'Claim $50 Off',
      bg: 'from-emerald-950/30 via-neutral-900/40 to-neutral-900',
      badge: 'ADSENSE • STICKY HALF-PAGE (300x600)',
    },
    multiplexBottom: {
      headline: 'Interactive Brokers: Global Stock, Option & Treasury Trading with Ultra-Low Margin Rates',
      sub: 'Trade across 150 global markets with institutional execution and high-interest cash balances.',
      brand: 'Interactive Brokers LLC',
      cta: 'Learn More',
      bg: 'from-purple-950/30 via-neutral-900/40 to-neutral-900',
      badge: 'MULTIPLEX MATCHED CONTENT',
    },
    mobileAnchor: {
      headline: 'Chase Sapphire Preferred: Earn 60,000 Bonus Points',
      sub: 'Premium travel rewards with 3x points on dining and annual hotel credits.',
      brand: 'Chase Credit Cards',
      cta: 'Apply Now',
      bg: 'from-sky-950/40 to-neutral-900',
      badge: 'MOBILE STICKY ANCHOR',
    }
  };

  const currentMock = demoCreatives[slotType] || demoCreatives.inArticleTop;

  return (
    <div className={`my-6 w-full flex flex-col items-center justify-center ${customClass}`}>
      {/* Top Disclaimer for AdSense Compliance */}
      <div className="w-full max-w-4xl flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 px-2 py-1 uppercase tracking-wider font-mono">
        <span className="flex items-center gap-1.5 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          {customLabel || slotConfig?.name || 'Advertisement'}
        </span>
        <span className="flex items-center gap-1 opacity-75">
          Google AdSense • Slot #{slotId.slice(-4)}
        </span>
      </div>

      {isSandbox ? (
        /* Rich Simulated AdSense Container */
        <div 
          className={`w-full max-w-4xl border border-neutral-300 dark:border-neutral-700/80 rounded-xl overflow-hidden shadow-ad bg-gradient-to-r ${currentMock.bg} bg-[#f8fafc] dark:bg-[#111622] p-4 sm:p-5 relative group hover:border-blue-500/40 transition-all duration-300`}
        >
          {/* AdSense Official Watermark Pill */}
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 dark:bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800">
            <Sparkles className="w-3 h-3 text-blue-500" />
            <span>AdSense Sandbox</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5 pr-8">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {currentMock.brand}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">Sponsored</span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                {currentMock.headline}
              </h4>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2 max-w-2xl">
                {currentMock.sub}
              </p>
            </div>

            <div className="flex-shrink-0 self-end sm:self-center">
              <button 
                type="button"
                onClick={() => showToast(`Mô phỏng tương tác Google AdSense cho ${currentMock.brand}. Trong chế độ Live, lượt nhấp sẽ chuyển đến trang nhà tài trợ qua mạng lưới Google.`, 'info')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
              >
                <span>{currentMock.cta}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Real Live AdSense Script Container */
        <div className="w-full max-w-4xl min-h-[90px] flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-2">
          <ins
            ref={adRef}
            className="adsbygoogle block w-full"
            style={{ display: 'block', textAlign: 'center' }}
            data-ad-client={publisherId}
            data-ad-slot={slotId}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      )}
    </div>
  );
};
