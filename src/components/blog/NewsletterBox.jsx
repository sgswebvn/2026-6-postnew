import React, { useState } from 'react';
import { storageService } from '../../services/storageService';
import { useBlog } from '../../context/BlogContext';
import { Mail, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export const NewsletterBox = ({ compact = false }) => {
  const { showToast } = useBlog();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    storageService.addSubscriber(email);
    setSubscribed(true);
    showToast('Subscribed to The Horizon Post Morning Executive Brief!');
  };

  if (subscribed) {
    return (
      <div className="p-8 bg-emerald-950/40 border border-emerald-500/30 rounded-3xl text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
        <h3 className="text-xl font-bold text-white">You are on the Executive Dispatch</h3>
        <p className="text-sm text-neutral-300">
          Check your inbox every Tuesday & Friday for exclusive wealth memos and tech intelligence.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="p-6 bg-gradient-to-br from-neutral-900 to-[#111622] text-white rounded-2xl border border-neutral-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-blue-400 text-xs font-mono font-bold uppercase">
          <Mail className="w-4 h-4" />
          <span>Executive Brief</span>
        </div>
        <h3 className="font-serif text-lg font-bold">Never Miss a High-Yield Signal</h3>
        <p className="text-xs text-neutral-400">
          Join 42,000+ investors, founders, and engineers receiving our curated market digest.
        </p>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="email"
            placeholder="Enter your executive email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
            required
          />
          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <span>Subscribe Free</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
        <div className="flex items-center justify-center gap-1 text-[10px] text-neutral-500 font-mono">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span>Zero spam • One-click unsubscribe</span>
        </div>
      </div>
    );
  }

  return (
    <section id="newsletter-section" className="my-16 relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-950 via-[#0d131f] to-neutral-900 text-white p-8 sm:p-12 border border-neutral-800 shadow-2xl">
      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono uppercase font-bold tracking-wider">
          <Mail className="w-3.5 h-3.5" />
          <span>The Horizon Post Executive Dispatch</span>
        </div>

        <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
          Institutional-Grade Intelligence, Delivered Twice Weekly.
        </h2>

        <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
          Join 42,000+ portfolio managers, technology executives, and forward-thinking investors who rely on our proprietary research briefs, asset allocation blueprints, and frontier AI teardowns.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="name@company.com or personal email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-900/90 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            required
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 flex-shrink-0"
          >
            <span>Subscribe Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-500 font-mono pt-2">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            No Sponsored Clutter
          </span>
          <span>•</span>
          <span>Strict Privacy Protection</span>
          <span>•</span>
          <span>Unsubscribe Anytime</span>
        </div>
      </div>
    </section>
  );
};
