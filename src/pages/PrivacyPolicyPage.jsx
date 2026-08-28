import React from 'react';
import { useBlog } from '../context/BlogContext';
import { Shield, Lock, Cookie, Eye, Globe } from 'lucide-react';

export const PrivacyPolicyPage = () => {
  const { settings } = useBlog();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn space-y-8 text-neutral-800 dark:text-neutral-200">
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-6 space-y-2">
        <span className="text-xs font-mono font-bold uppercase text-blue-600 dark:text-blue-400">
          Legal & Compliance Documentation
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-neutral-950 dark:text-neutral-50">
          Privacy & Cookie Policy
        </h1>
        <p className="text-xs font-mono text-neutral-400">
          Last Updated: August 26, 2026 • Compliant with Google AdSense, GDPR, CCPA & CalOPPA
        </p>
      </div>

      <div className="editorial-prose text-sm space-y-6">
        <p>
          At <strong>{settings?.siteName || 'The Horizon Post'}</strong>, accessible from our primary digital domains, the privacy and security of our readers and subscribers is of paramount importance. This Privacy Policy outlines the types of information collected and how it is utilized.
        </p>

        <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border-l-4 border-blue-600 rounded-r-lg">
          <h4 className="font-bold text-blue-950 dark:text-blue-200">1. Google AdSense & DoubleClick DART Cookies (Mandatory Disclosure)</h4>
          <p className="text-xs text-blue-900 dark:text-blue-300 mt-1">
            Google is a third-party vendor on our site. It uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our website and other sites on the internet. Readers may choose to decline the use of DART cookies by visiting the Google Ad and Content Network Privacy Policy at <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer" className="underline font-bold">https://policies.google.com/technologies/ads</a>.
          </p>
        </div>

        <h2>2. Information We Collect</h2>
        <ul>
          <li><strong>Log Files:</strong> Like standard digital publishers, we utilize log files. The information inside log files includes IP addresses, browser type, Internet Service Provider (ISP), date/time stamps, referring/exit pages, and click counts to analyze trends and administer the site.</li>
          <li><strong>Voluntary Reader Information:</strong> When you subscribe to our Executive Dispatch newsletter or submit a contact inquiry, we collect your email address and name.</li>
        </ul>

        <h2>3. Third-Party Advertising Partners</h2>
        <p>
          Some of our advertising partners may use cookies and web beacons on our site. Our primary advertising partner is <strong>Google AdSense</strong>. Third-party ad servers or ad networks use technology in their respective advertisements and links that appear on {settings?.siteName}, which are sent directly to your browser.
        </p>

        <h2>4. California Consumer Privacy Act (CCPA) Rights</h2>
        <p>
          Under the CCPA, California consumers have the right to request disclosure of categories and specific pieces of personal data collected, request deletion of personal data, and request that a business not sell the consumer's personal data ("Do Not Sell My Personal Information").
        </p>

        <h2>5. General Data Protection Regulation (GDPR) Rights</h2>
        <p>
          Every European Economic Area (EEA) reader is entitled to the right of access, rectification, erasure, restriction of processing, objection to processing, and data portability.
        </p>

        <h2>6. Contacting the Data Protection Officer</h2>
        <p>
          If you have questions or require more information regarding our Privacy Policy, contact us at <span className="font-mono text-blue-600">{settings?.contactEmail || 'privacy@thehori.click'}</span>.
        </p>
      </div>
    </div>
  );
};
