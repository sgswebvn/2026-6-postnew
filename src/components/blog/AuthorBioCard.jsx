import React from 'react';
import { ShieldCheck, Award, CheckCircle, Globe } from 'lucide-react';

const TwitterIcon = () => (
  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedinIcon = () => (
  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
  </svg>
);

export const AuthorBioCard = ({ author, factChecker }) => {
  if (!author) return null;

  return (
    <div className="my-10 p-6 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
      {/* Primary Author */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <img 
          src={author.avatar} 
          alt={author.name}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-blue-500/20 flex-shrink-0" 
        />
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono uppercase font-bold text-blue-600 dark:text-blue-400">
              Written By
            </span>
            <h4 className="font-serif text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              {author.name}
              {author.verified && (
                <CheckCircle className="w-4 h-4 text-blue-500 inline-block" title="Verified Editorial Contributor" />
              )}
            </h4>
          </div>
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            {author.role}
          </p>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
            {author.bio}
          </p>
          <div className="flex items-center space-x-3 pt-1 text-xs text-neutral-400 font-mono">
            {author.twitter && (
              <span className="flex items-center gap-1 hover:text-blue-400 cursor-pointer">
                <TwitterIcon /> {author.twitter}
              </span>
            )}
            {author.linkedin && (
              <span className="flex items-center gap-1 hover:text-blue-400 cursor-pointer">
                <LinkedinIcon /> LinkedIn
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Fact Checker Sub-Box (E-E-A-T Guarantee) */}
      {factChecker && (
        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-start sm:items-center gap-3 bg-neutral-50 dark:bg-neutral-900/40 p-3.5 rounded-xl text-xs">
          <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <div className="space-y-0.5">
            <p className="text-neutral-800 dark:text-neutral-200">
              <strong className="text-emerald-700 dark:text-emerald-300">Fact-Checked & Verified:</strong> Reviewed by{' '}
              <span className="font-semibold text-neutral-900 dark:text-white">{factChecker.name}</span> ({factChecker.role}) for statistical accuracy, primary source integrity, and FTC compliance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
