import React from 'react';
import { useBlog } from '../context/BlogContext';
import { AlertTriangle, ShieldCheck, DollarSign } from 'lucide-react';

export const DisclaimerPage = () => {
  const { settings } = useBlog();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn space-y-8 text-neutral-800 dark:text-neutral-200">
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-6 space-y-2">
        <span className="text-xs font-mono font-bold uppercase text-blue-600 dark:text-blue-400">
          Regulatory Disclosures
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-neutral-950 dark:text-neutral-50">
          Ad & Financial Disclaimer
        </h1>
        <p className="text-xs font-mono text-neutral-400">FTC Compliance & Editorial Independence</p>
      </div>

      <div className="editorial-prose text-sm space-y-6">
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 rounded-r-lg">
          <h4 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Financial & Investment Advisory Disclaimer
          </h4>
          <p className="text-xs text-amber-900 dark:text-amber-300 mt-1">
            The content provided on {settings?.siteName} is for educational, analytical, and informational purposes only. None of the articles, models, APY comparisons, or asset allocation breakdowns constitute personalized financial, tax, or legal advice.
          </p>
        </div>

        <h2>1. Advertising & Commercial Relationships (FTC Disclosure)</h2>
        <p>
          In accordance with the Federal Trade Commission (FTC) guidelines, please be advised that {settings?.siteName} displays programmatic advertising provided by Google AdSense and third-party advertising exchanges. We may receive compensation when readers interact with or view advertisements hosted on our digital properties.
        </p>

        <h2>2. Editorial Independence Guarantee</h2>
        <p>
          Commercial partnerships, advertising impressions, and sponsor relationships have zero influence over the editorial verdicts, ratings, or analyses produced by our correspondents. Our newsroom operates under strict journalistic firewalls.
        </p>

        <h2>3. Medical & Health Protocol Disclaimer</h2>
        <p>
          Health, longevity, and biohacking articles are based on published scientific literature and are not a substitute for clinical medical evaluation. Consult a board-certified physician before commencing any new supplement, fasting, or photobiology regimen.
        </p>
      </div>
    </div>
  );
};
