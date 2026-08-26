import React from 'react';
import { useBlog } from '../../context/BlogContext';
import { ShieldCheck } from 'lucide-react';

export const Footer = () => {
  const { settings, categories, navigate } = useBlog();

  return (
    <footer className="w-full bg-[#111622] text-neutral-300 border-t border-neutral-800 pt-12 pb-24 sm:pb-16 mt-16 transition-colors font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-neutral-800">
          {/* Col 1 & 2: Brand Info & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="cursor-pointer" onClick={() => navigate('#/')}>
              <h2 className="font-serif text-2xl font-bold tracking-tight text-white">
                {settings?.siteName || 'THE HORIZON POST'}
              </h2>
              <p className="text-xs uppercase tracking-widest text-neutral-400 font-sans mt-0.5">
                {settings?.tagline || 'US Editorial Journal of Wealth & Technology'}
              </p>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-md">
              {settings?.description || 'Delivering rigorous, independent reporting on personal finance architectures, frontier artificial intelligence, longevity science, and macroeconomic trends.'}
            </p>
            <div className="flex items-center space-x-3 text-xs text-emerald-400 font-mono bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-800 w-fit">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Independent Editorial Standards • Verified Sources</span>
            </div>
          </div>

          {/* Col 3: Topics / Categories */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Editorial Desks
            </h3>
            <ul className="space-y-2 text-sm text-neutral-400">
              {categories.map(cat => (
                <li key={cat.id}>
                  <button
                    onClick={() => navigate(`#/category/${cat.slug}`)}
                    className="hover:text-white transition-colors"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Trust & Compliance (Essential for AdSense Approval) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Trust & Governance (E-E-A-T)
            </h3>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <button onClick={() => navigate('#/about')} className="hover:text-white transition-colors">
                  Editorial Board & Standards
                </button>
              </li>
              <li>
                <button onClick={() => navigate('#/privacy-policy')} className="hover:text-white transition-colors">
                  Privacy Policy & Cookies
                </button>
              </li>
              <li>
                <button onClick={() => navigate('#/terms')} className="hover:text-white transition-colors">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => navigate('#/disclaimer')} className="hover:text-white transition-colors">
                  Ad & Financial Disclosures
                </button>
              </li>
              <li>
                <button onClick={() => navigate('#/contact')} className="hover:text-white transition-colors">
                  Contact Newsroom
                </button>
              </li>
            </ul>
          </div>

          {/* Col 5: Editorial Contact Bureau */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Newsroom Bureau
            </h3>
            <div className="text-xs text-neutral-400 space-y-2">
              <p className="font-semibold text-neutral-200">The Horizon Post Bureau</p>
              <p>{settings?.businessAddress || '742 Evergreen Terrace, Suite 400, Austin, TX 78701, United States'}</p>
              <p className="font-mono text-neutral-300">{settings?.contactEmail || 'editor@thehorizonpost.com'}</p>
              <p className="font-mono text-neutral-400">{settings?.phone || '+1 (512) 890-4421'}</p>
            </div>
          </div>
        </div>

        {/* AdSense & FTC Compliance Disclosure Banner */}
        <div className="py-6 border-b border-neutral-800 text-[11px] text-neutral-500 leading-relaxed space-y-2">
          <p>
            <strong className="text-neutral-400">Advertising & Editorial Disclosure:</strong> {settings?.siteName || 'The Horizon Post'} is monetized through third-party programmatic advertising networks including Google AdSense. Third-party vendors, including Google, use cookies to serve ads based on prior user visits. We maintain strict editorial separation between sponsorships and our independent investigative journalism.
          </p>
          <p>
            <strong className="text-neutral-400">Financial & Health Disclaimer:</strong> Content published on this digital platform is for educational, analytical, and informational purposes only and does not constitute formal fiduciary, legal, tax, or medical advice.
          </p>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <p>© {new Date().getFullYear()} {settings?.siteName || 'The Horizon Post'} Media Group LLC. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <button onClick={() => navigate('#/privacy-policy')} className="hover:text-neutral-300">Privacy</button>
            <button onClick={() => navigate('#/terms')} className="hover:text-neutral-300">Terms</button>
            <button onClick={() => navigate('#/disclaimer')} className="hover:text-neutral-300">Disclosures</button>
            <button onClick={() => navigate('#/contact')} className="hover:text-neutral-300">Contact</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
