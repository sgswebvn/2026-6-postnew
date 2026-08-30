import React from 'react';
import { Sparkles, ExternalLink, ShieldCheck, ArrowRight, Star } from 'lucide-react';
import { telemetryService } from '../../services/telemetryService';
import { useBlog } from '../../context/BlogContext';

export const AffiliateShowcaseBox = ({ categorySlug = 'personal-finance' }) => {
  const { showToast } = useBlog();
  const affiliateOffers = {
    'personal-finance': {
      tag: 'EDITOR’S TOP YIELD PICK',
      title: 'SoFi Automated High-Yield Cash Account (4.60% APY)',
      rating: '4.9 / 5.0',
      description: 'Maximize emergency reserves with up to $2M in FDIC insurance through network banks, no minimum balance requirements, and automated recurring transfers.',
      perks: [
        'Earn up to 4.60% APY on all cash deposits',
        'Zero monthly account maintenance fees',
        'Early paycheck direct deposit access (2 days early)'
      ],
      partner: 'SoFi Bank, N.A. (Member FDIC)',
      cta: 'Explore Account Benefits',
      linkText: 'Terms & Disclosures Apply'
    },
    'ai-frontier-tech': {
      tag: 'ENTERPRISE AI PLATFORM',
      title: 'Anthropic Claude 3.5 Sonnet & AWS Bedrock Infrastructure',
      rating: '4.95 / 5.0',
      description: 'Deploy state-of-the-art coding and multimodal reasoning agents with zero server management, enterprise VPC security, and token caching discounts.',
      perks: [
        '200K token context window with sub-second latency',
        'SOC2 Type II & HIPAA compliant infrastructure',
        '$1,000 AWS cloud credits for qualified developers'
      ],
      partner: 'Amazon Web Services & Anthropic PBC',
      cta: 'Claim Developer Credits',
      linkText: 'Free Tier Available'
    },
    'default': {
      tag: 'RECOMMENDED WEALTH STRATEGY',
      title: 'Vanguard Personal Advisor Fiduciary Portfolio',
      rating: '4.85 / 5.0',
      description: 'Customized index-driven global asset allocation with transparent 0.30% advisory fees and dedicated Certified Financial Planner (CFP®) access.',
      perks: [
        'Fiduciary duty standard on all asset accounts',
        'Automated tax-loss harvesting algorithm',
        'Direct indexing and fractional share rebalancing'
      ],
      partner: 'The Vanguard Group, Inc.',
      cta: 'Review Investment Plan',
      linkText: 'Fiduciary Certified'
    }
  };

  const offer = affiliateOffers[categorySlug] || affiliateOffers.default;

  const handleAffiliateClick = () => {
    telemetryService.trackEvent('affiliate_recommendation_clicked', {
      partner: offer.partner,
      title: offer.title,
      category: categorySlug
    });
    showToast(`Navigating to verified partner: ${offer.partner}. Verified commission tracking tag active.`, 'info');
  };

  return (
    <div className="my-8 p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-blue-900/5 via-slate-900/10 to-indigo-900/5 dark:from-blue-950/40 dark:via-[#111622] dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-800/60 shadow-sm relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Tag */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            {offer.tag}
          </span>
          <span className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-current" /> {offer.rating}
          </span>
        </div>
        <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> FTC Sponsored Disclosure
        </span>
      </div>

      {/* Main Content */}
      <div className="space-y-3">
        <h4 className="font-serif text-xl sm:text-2xl font-bold text-neutral-950 dark:text-neutral-50">
          {offer.title}
        </h4>
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans">
          {offer.description}
        </p>

        {/* Feature List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          {offer.perks.map((perk, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
              <span>{perk}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Footer */}
      <div className="mt-6 pt-4 border-t border-blue-200/60 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
            {offer.partner}
          </span>
          <span className="text-[11px] text-neutral-500 font-mono">
            {offer.linkText}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAffiliateClick}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span>{offer.cta}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
