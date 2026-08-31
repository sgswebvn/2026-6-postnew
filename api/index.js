import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from '../server/routes/api.js';
import { connectDB, memoryStore } from '../server/db.js';
import { Post } from '../server/models/Post.js';
import { ShortLink } from '../server/models/ShortLink.js';
import { initialPosts } from '../server/seedData.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Non-blocking database connection in background
connectDB().catch(() => {});

// Helper: Escape HTML
const escapeHtml = (unsafe = '') => {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Helper: Build Full Rich Editorial HTML for Mobile Readers & Social Crawlers
const buildPostHtml = (post, reqUrl, refCode = '') => {
  const title = `${escapeHtml(post.title)} | THE HORI CLICK`;
  const cleanExcerpt = escapeHtml(post.excerpt || post.metaDescription || post.title);
  const imageUrl = post.coverImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200';
  const postUrl = `https://www.thehori.click/post/${post.slug}${refCode ? `?ref=${refCode}` : ''}`;
  const authorName = escapeHtml(post.authorName || post.createdByName || 'THE HORI CLICK Editorial Board');
  const authorAvatar = post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200';
  const categoryName = escapeHtml(post.category || 'Featured');
  
  // Format Date (US English Format)
  const rawDate = post.publishedAt || post.createdAt || post.date || new Date().toISOString();
  let formattedDate = 'Aug 31, 2026';
  try {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      formattedDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
    }
  } catch(e) {}

  const fullContent = post.content || `<p>${cleanExcerpt}</p>`;

  return `<!doctype html>
<html lang="en" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
  <title>${title}</title>
  <meta name="title" content="${title}" />
  <meta name="description" content="${cleanExcerpt}" />
  <link rel="canonical" href="${postUrl}" />

  <!-- Open Graph / Facebook / Zalo / Telegram -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="THE HORI CLICK" />
  <meta property="og:url" content="${postUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${cleanExcerpt}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:secure_url" content="${imageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/jpeg" />

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${postUrl}" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${cleanExcerpt}" />
  <meta name="twitter:image" content="${imageUrl}" />

  <!-- Fonts & Responsive Styles -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&display=swap" rel="stylesheet">

  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #faf9f6;
      color: #1a1a1a;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .header-nav {
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      z-index: 100;
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .brand-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
    }
    .brand-badge {
      background: #2563eb;
      color: #ffffff;
      font-weight: 900;
      border-radius: 8px;
      width: 32px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }
    .brand-title {
      font-weight: 900;
      color: #0f172a;
      font-size: 17px;
      letter-spacing: -0.5px;
    }
    .home-btn {
      background: #f1f5f9;
      color: #1e293b;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
      border: 1px solid #e2e8f0;
      transition: all 0.2s;
    }
    .home-btn:hover { background: #e2e8f0; }
    .main-container {
      max-width: 740px;
      margin: 0 auto;
      padding: 1.5rem 1rem 4rem;
    }
    .category-badge {
      display: inline-block;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 0.75rem;
    }
    .article-title {
      font-family: 'Merriweather', Georgia, serif;
      font-size: 1.85rem;
      font-weight: 900;
      line-height: 1.35;
      color: #0f172a;
      margin-bottom: 1rem;
    }
    @media (max-width: 640px) {
      .article-title { font-size: 1.45rem; line-height: 1.3; }
    }
    .author-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-bottom: 1.25rem;
      margin-bottom: 1.25rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .author-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #e2e8f0;
    }
    .author-name {
      font-weight: 700;
      color: #1e293b;
      font-size: 13px;
      display: block;
    }
    .meta-date {
      font-size: 11px;
      color: #64748b;
    }
    .lead-excerpt {
      font-size: 1.05rem;
      line-height: 1.65;
      color: #334155;
      font-style: italic;
      border-left: 3px solid #2563eb;
      padding-left: 1rem;
      margin-bottom: 1.5rem;
      background: #f8fafc;
      padding: 0.75rem 1rem;
      border-radius: 0 8px 8px 0;
    }
    .cover-img-wrapper {
      margin-bottom: 2rem;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
      background: #e2e8f0;
    }
    .cover-img {
      width: 100%;
      max-height: 460px;
      object-fit: cover;
      display: block;
    }
    .article-content {
      font-family: 'Merriweather', Georgia, serif;
      font-size: 1.08rem;
      line-height: 1.85;
      color: #1e293b;
    }
    .article-content p {
      margin-bottom: 1.4rem;
    }
    .article-content h2, .article-content h3 {
      font-family: 'Inter', sans-serif;
      font-weight: 800;
      color: #0f172a;
      margin: 2rem 0 1rem;
      line-height: 1.35;
    }
    .article-content h2 { font-size: 1.4rem; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.4rem; }
    .article-content h3 { font-size: 1.2rem; }
    .article-content img {
      max-width: 100%;
      height: auto;
      border-radius: 10px;
      margin: 1.5rem auto;
      display: block;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .article-content blockquote {
      border-left: 4px solid #3b82f6;
      padding: 0.75rem 1.25rem;
      background: #eff6ff;
      border-radius: 0 8px 8px 0;
      margin: 1.5rem 0;
      font-style: italic;
      color: #1e40af;
    }
    .share-bar {
      margin: 2.5rem 0;
      padding: 1.25rem;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .share-title { font-size: 13px; font-weight: 700; color: #475569; }
    .share-btns { display: flex; gap: 0.5rem; }
    .share-btn {
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
      color: #ffffff;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .share-zalo { background: #0068ff; }
    .share-fb { background: #1877f2; }
    .cta-explore {
      display: block;
      text-align: center;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      padding: 14px;
      border-radius: 12px;
      font-weight: 800;
      text-decoration: none;
      margin-top: 2rem;
      box-shadow: 0 4px 12px rgba(37,99,235,0.25);
    }
    .footer {
      text-align: center;
      padding: 2rem 1rem;
      font-size: 12px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      background: #ffffff;
      margin-top: 3rem;
    }
  </style>

  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-MZ34K70519"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-MZ34K70519');
    ${refCode ? `gtag('event', 'seeding_referral_click', { staff_code: '${refCode}', post_slug: '${post.slug}' });` : ''}
  </script>
</head>
<body>
  <!-- Header -->
  <header class="header-nav">
    <a href="/" class="brand-link">
      <span class="brand-badge">H</span>
      <span class="brand-title">THE HORI CLICK</span>
    </a>
    <a href="/" class="home-btn">🏠 Home</a>
  </header>

  <!-- Main Article Body -->
  <main class="main-container">
    <span class="category-badge">${categoryName}</span>
    <h1 class="article-title">${escapeHtml(post.title)}</h1>

    <div class="author-meta">
      <img src="${authorAvatar}" alt="${authorName}" class="author-avatar" />
      <div>
        <span class="author-name">${authorName}</span>
        <span class="meta-date">Published: ${formattedDate} • 5 min read</span>
      </div>
    </div>

    ${cleanExcerpt ? `<div class="lead-excerpt">${cleanExcerpt}</div>` : ''}

    <div class="cover-img-wrapper">
      <img src="${imageUrl}" alt="${escapeHtml(post.title)}" class="cover-img" />
    </div>

    <article class="article-content">
      ${fullContent}
    </article>

    <!-- Social Share Tools -->
    <div class="share-bar">
      <span class="share-title">Share this article:</span>
      <div class="share-btns">
        <a href="https://zalo.me/share?url=${encodeURIComponent(postUrl)}" target="_blank" rel="noopener" class="share-btn share-zalo">Zalo</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}" target="_blank" rel="noopener" class="share-btn share-fb">Facebook</a>
      </div>
    </div>

    <!-- Explore More -->
    <a href="/" class="cta-explore">
      Explore More In-Depth Articles On THE HORI CLICK →
    </a>
  </main>

  <footer class="footer">
    <p>© 2026 THE HORI CLICK. Independent US Finance, Technology & Modern Lifestyle Journal.</p>
  </footer>
</body>
</html>`;
};

// ==========================================
// 1. Dynamic Open Graph & Fast Reader for /post/:slug
// ==========================================
const handlePostCrawler = async (req, res) => {
  try {
    let rawPath = req.path || req.url || req.originalUrl || '';
    let extractedSlug = req.params.slug;
    
    if (!extractedSlug) {
      const match = rawPath.match(/\/post\/([^/?#]+)/i);
      if (match) {
        extractedSlug = match[1];
      }
    }

    const slug = decodeURIComponent(extractedSlug || '')
      .toLowerCase()
      .trim()
      .replace(/^\/+|\/+$/g, '')
      .replace(/-+$/, '');

    const refCode = (req.query.ref || req.query.utm_source || '').toUpperCase();

    let post = null;

    // 1. Fast look-up: Supabase CDN (Ultra-fast <50ms response)
    if (slug) {
      try {
        const supabaseRes = await fetch(`https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/posts/${slug}.json`, {
          signal: AbortSignal.timeout(1500)
        });
        if (supabaseRes.ok) {
          post = await supabaseRes.json();
        }
      } catch (e) {}
    }

    // 2. Fallback to MongoDB Atlas
    if (!post) {
      try {
        if (Post) {
          post = await Post.findOne({
            $or: [
              { slug: slug },
              { slug: new RegExp(`^${slug}$`, 'i') },
              { id: slug }
            ]
          }).maxTimeMS(2000);
        }
      } catch (e) {}
    }

    // 3. Fallback to In-Memory Seed Store
    if (!post) {
      post = (memoryStore.posts || []).find(p => 
        (p.slug && p.slug.toLowerCase().trim() === slug) || 
        (p.id && p.id.toLowerCase().trim() === slug)
      ) || initialPosts.find(p => 
        (p.slug && p.slug.toLowerCase().trim() === slug) || 
        (p.id && p.id.toLowerCase().trim() === slug)
      );
    }

    // 4. Fallback: Generate smart title from slug if post not found
    if (!post && slug) {
      const generatedTitle = slug
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      post = {
        title: generatedTitle,
        slug: slug,
        excerpt: `Read the full investigative coverage and analysis for "${generatedTitle}" on THE HORI CLICK.`,
        coverImage: 'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_24.jpg'
      };
    }

    if (post) {
      const html = buildPostHtml(post, req.originalUrl, refCode);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=600, stale-while-revalidate=86400');
      return res.send(html);
    }

    const defaultHtml = buildPostHtml({
      title: 'THE HORI CLICK | Independent US Finance, Technology & Modern Lifestyle Journal',
      slug: slug || '',
      excerpt: 'In-depth analysis, expert guides, and daily insights on personal finance, emerging AI, and modern digital lifestyle.',
      coverImage: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200'
    }, req.originalUrl, refCode);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(defaultHtml);
  } catch (err) {
    console.error('[Post Serverless Error]', err);
    return res.redirect(302, 'https://www.thehori.click/');
  }
};

app.get('/post/:slug', handlePostCrawler);
app.use('/post', handlePostCrawler);

// ==========================================
// 2. Short Link Resolver for /s/:code
// ==========================================
app.get('/s/:code', async (req, res) => {
  try {
    const code = req.params.code.toLowerCase().trim();
    const ua = (req.headers['user-agent'] || '').toLowerCase();
    const isCrawler = (
      ua.includes('facebookexternalhit') ||
      ua.includes('facebot') ||
      ua.includes('zalo') ||
      ua.includes('twitterbot') ||
      ua.includes('telegrambot') ||
      ua.includes('slackbot') ||
      ua.includes('whatsapp') ||
      ua.includes('linkedinbot') ||
      ua.includes('discordbot') ||
      ua.includes('googlebot')
    );

    let shortLink = null;
    try {
      if (ShortLink) {
        shortLink = await ShortLink.findOne({ code });
      }
    } catch (e) {}

    if (!shortLink) {
      shortLink = (memoryStore.shortLinks || []).find(l => l.code === code);
    }

    // Lookup in Supabase CDN
    if (!shortLink) {
      try {
        const sbRes = await fetch(`https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/shortlinks/${code}.json`);
        if (sbRes.ok) {
          shortLink = await sbRes.json();
        }
      } catch (e) {}
    }

    if (shortLink) {
      // Increment click count
      try {
        if (ShortLink) {
          await ShortLink.updateOne({ code }, { $inc: { clicks: 1 } });
        }
        shortLink.clicks = (shortLink.clicks || 0) + 1;
      } catch (e) {}

      let post = null;
      if (shortLink.postSlug) {
        try {
          if (Post) post = await Post.findOne({ slug: shortLink.postSlug });
        } catch (e) {}
        if (!post) {
          post = (memoryStore.posts || []).find(p => p.slug === shortLink.postSlug) ||
                 initialPosts.find(p => p.slug === shortLink.postSlug);
        }
      }

      if (!post && shortLink.postTitle) {
        post = {
          title: shortLink.postTitle,
          slug: shortLink.postSlug || code,
          coverImage: shortLink.coverImage || 'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_24.jpg',
          excerpt: `Read the full analysis for "${shortLink.postTitle}" on THE HORI CLICK.`
        };
      }

      if (isCrawler && post) {
        const html = buildPostHtml(post, req.originalUrl, shortLink.staffCode);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      }

      const targetUrl = shortLink.originalUrl || (post ? `https://www.thehori.click/post/${post.slug}${shortLink.staffCode ? `?ref=${shortLink.staffCode}` : ''}` : 'https://www.thehori.click/');
      return res.redirect(302, targetUrl);
    }

    // Fallback: If code is not found, check if code matches a staff refCode directly (e.g. /s/qb -> /?ref=QB)
    return res.redirect(302, `https://www.thehori.click/?ref=${code.toUpperCase()}`);
  } catch (err) {
    console.error('[ShortLink Error]', err);
    return res.redirect(302, 'https://www.thehori.click/');
  }
});

// ==========================================
// 3. API Router
// ==========================================
app.use('/api', apiRouter);

// Root Status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    platform: 'Vercel Serverless',
    timestamp: new Date().toISOString()
  });
});

export default app;
