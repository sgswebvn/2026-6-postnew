import React from 'react';
import { useBlog } from '../context/BlogContext';
import { ShieldCheck, Award, Users, BookOpen, CheckCircle, Globe, Mail } from 'lucide-react';

export const AboutPage = () => {
  const { authors, settings, navigate } = useBlog();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn space-y-12">
      {/* Masthead Header */}
      <div className="text-center space-y-4">
        <span className="px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-mono font-bold uppercase tracking-wider">
          Editorial Governance & Mission
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-neutral-950 dark:text-neutral-50 tracking-tight">
          About {settings?.siteName || 'The Horizon Post'}
        </h1>
        <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto leading-relaxed">
          An independent digital publication dedicated to rigorous analysis of wealth architectures, artificial intelligence frontiers, and human performance.
        </p>
      </div>

      {/* Core Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
          <Award className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-neutral-100">
            Fiduciary Rigor
          </h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            We evaluate financial instruments, index architectures, and tax strategies strictly with objective mathematical modeling—free from promotional bias.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
          <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-neutral-100">
            Fact-Checking Mandate
          </h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Every statistic, Federal Reserve statement, and health claim is audited against primary regulatory filings and peer-reviewed journals before publication.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
          <BookOpen className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-neutral-100">
            Transparent Monetization
          </h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Our newsroom operates with clear wall separation between our editorial staff and programmatic advertising networks (Google AdSense).
          </p>
        </div>
      </div>

      {/* Editorial Team (E-E-A-T Guarantee) */}
      <section className="space-y-6">
        <div className="border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <h2 className="font-serif text-2xl font-bold text-neutral-950 dark:text-neutral-50 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            <span>The Editorial Board & Senior Correspondents</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Meet the domain specialists, former financial analysts, and tech journalists behind our coverage.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {authors.map(author => (
            <div key={author.id} className="p-6 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-start gap-4">
              <img 
                src={author.avatar} 
                alt={author.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/20 flex-shrink-0" 
              />
              <div className="space-y-1">
                <h4 className="font-serif text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1">
                  {author.name}
                  {author.verified && <CheckCircle className="w-3.5 h-3.5 text-blue-500 inline" />}
                </h4>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {author.role}
                </p>
                <p className="text-xs text-neutral-500 line-clamp-3">
                  {author.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Editorial Policy Details */}
      <section className="p-8 bg-neutral-100 dark:bg-[#111622] rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-4 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
        <h3 className="font-serif text-xl font-bold text-neutral-950 dark:text-neutral-50">
          Our Editorial Integrity & Correction Policy
        </h3>
        <p>
          At <strong>{settings?.siteName || 'The Horizon Post'}</strong>, we are committed to absolute journalistic transparency. When statistical inaccuracies or errors of fact occur, we issue immediate, transparent corrections at the top of the affected article with a clear explanation of what was changed and when.
        </p>
        <p>
          If you believe an article contains factual discrepancies, please contact our corrections desk directly at{' '}
          <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{settings?.contactEmail || 'corrections@thehori.click'}</span>.
        </p>
      </section>
    </div>
  );
};
