import fs from 'fs';
import path from 'path';

let errorsCount = 0;

function checkDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      if (f.name !== 'node_modules' && f.name !== 'dist' && f.name !== '.git') {
        checkDir(full);
      }
    } else if (f.name.endsWith('.jsx') || f.name.endsWith('.js')) {
      const code = fs.readFileSync(full, 'utf8');
      
      // Look for lucide icons or components used in JSX
      const usedElements = [...code.matchAll(/<([A-Z][a-zA-Z0-9]+)/g)].map(m => m[1]);
      
      const commonGlobal = [
        'React', 'Fragment', 'StrictMode', 'App', 'AppContent', 'BlogProvider',
        'Header', 'Footer', 'Toast', 'SearchModal', 'StickyBottomAd',
        'HomePage', 'PostDetailPage', 'CategoryPage', 'TagPage', 'AboutPage',
        'ContactPage', 'PrivacyPolicyPage', 'TermsPage', 'DisclaimerPage',
        'AdminAuthModal', 'AdminLayout', 'AdminDashboard', 'AdminPostsList',
        'AdminPostEditor', 'AdminCategories', 'AdminAdSense', 'AdminComments',
        'AdminSubscribers', 'AdminAuthors', 'AdminSettings', 'AdminStaff',
        'HeroFeatured', 'ArticleCard', 'NewsletterBox', 'AdSenseUnit', 'Badge',
        'ReturningReaderBanner', 'AffiliateShowcaseBox', 'AdSenseSticky', 'ImageIcon'
      ];

      for (const el of usedElements) {
        if (!commonGlobal.includes(el)) {
          // Check if defined or imported in this file
          const isImported = code.includes(el);
          const isDeclared = code.includes(`const ${el}`) || code.includes(`function ${el}`) || code.includes(`class ${el}`);
          if (!isImported && !isDeclared) {
            console.error(`❌ Missing Identifier: ${el} in ${full}`);
            errorsCount++;
          }
        }
      }
    }
  }
}

checkDir(path.join(process.cwd(), 'src'));
console.log(`Scan finished. Total missing imports found: ${errorsCount}`);
if (errorsCount > 0) process.exit(1);
