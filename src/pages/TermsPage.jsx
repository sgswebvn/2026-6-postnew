import React from 'react';
import { useBlog } from '../context/BlogContext';

export const TermsPage = () => {
  const { settings } = useBlog();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn space-y-8 text-neutral-800 dark:text-neutral-200">
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-6 space-y-2">
        <span className="text-xs font-mono font-bold uppercase text-blue-600 dark:text-blue-400">
          User Agreement
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-neutral-950 dark:text-neutral-50">
          Terms of Service
        </h1>
        <p className="text-xs font-mono text-neutral-400">Effective Date: August 26, 2026</p>
      </div>

      <div className="editorial-prose text-sm space-y-6">
        <p>
          Welcome to <strong>{settings?.siteName || 'The Horizon Post'}</strong>. By accessing or browsing our digital properties, you agree to comply with and be bound by the following terms and conditions of use.
        </p>

        <h2>1. Intellectual Property & Copyright</h2>
        <p>
          All editorial reporting, data models, charts, analysis, graphics, and proprietary software code published on this site are the copyrighted property of {settings?.siteName} Media Group LLC and are protected by United States and international copyright laws.
        </p>

        <h2>2. Permitted Use & Syndication</h2>
        <p>
          Readers may quote excerpts of up to 150 words provided full attribution is granted with a direct, followable hyperlink to the original article source URL. Systematic automated scraping, LLM retraining without licensing agreements, or wholesale republishing is strictly prohibited.
        </p>

        <h2>3. User Conduct in Forums & Comments</h2>
        <p>
          Comments submitted to our articles must remain civil, professional, and free from defamation, hate speech, automated spam, or unauthorized commercial solicitation.
        </p>

        <h2>4. Limitation of Liability</h2>
        <p>
          In no event shall {settings?.siteName}, its editors, correspondents, or parent entity be liable for any direct, indirect, incidental, or consequential damages resulting from the use of information published on this website.
        </p>
      </div>
    </div>
  );
};
