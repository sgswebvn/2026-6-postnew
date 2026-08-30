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

// Ensure database connection in serverless lifecycle
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Helper: Escape HTML
const escapeHtml = (unsafe = '') => {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Helper: Build Full Open Graph HTML for Social Crawlers
const buildPostHtml = (post, reqUrl, refCode = '') => {
  const title = `${escapeHtml(post.title)} | THE HORI CLICK`;
  const cleanExcerpt = escapeHtml(post.excerpt || post.metaDescription || post.title);
  const imageUrl = post.coverImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200';
  const postUrl = `https://www.thehori.click/post/${post.slug}${refCode ? `?ref=${refCode}` : ''}`;

  return `<!doctype html>
<html lang="vi" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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

  <!-- Google Analytics Tracking -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-MZ34K70519"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-MZ34K70519');
    ${refCode ? `gtag('event', 'seeding_referral_click', { staff_code: '${refCode}', post_slug: '${post.slug}' });` : ''}
  </script>
</head>
<body style="font-family: sans-serif; padding: 2rem; text-align: center; background: #faf9f6; color: #111;">
  <h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">${escapeHtml(post.title)}</h1>
  <p style="font-size: 1rem; color: #555; max-width: 600px; margin: 0 auto 1.5rem;">${cleanExcerpt}</p>
  <img src="${imageUrl}" alt="${escapeHtml(post.title)}" style="max-width: 600px; width: 100%; border-radius: 12px; margin: 0 auto; display: block;" />
</body>
</html>`;
};

// ==========================================
// 1. Dynamic Open Graph for /post/:slug (Bot Crawlers)
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
    try {
      if (Post) {
        post = await Post.findOne({
          $or: [
            { slug: slug },
            { slug: new RegExp(`^${slug}$`, 'i') },
            { id: slug }
          ]
        });
      }
    } catch (e) {}

    if (!post) {
      post = (memoryStore.posts || []).find(p => 
        (p.slug && p.slug.toLowerCase().trim() === slug) || 
        (p.id && p.id.toLowerCase().trim() === slug)
      ) || initialPosts.find(p => 
        (p.slug && p.slug.toLowerCase().trim() === slug) || 
        (p.id && p.id.toLowerCase().trim() === slug)
      );
    }

    // 2. Try fetching from Supabase CDN
    if (!post && slug) {
      try {
        const supabaseRes = await fetch(`https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/posts/${slug}.json`);
        if (supabaseRes.ok) {
          post = await supabaseRes.json();
        }
      } catch (sbErr) {
        console.warn('Supabase post lookup failed:', sbErr);
      }
    }

    // 3. Fallback: Generate smart title from slug if post not in DB
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
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
      return res.send(html);
    }

    const defaultHtml = buildPostHtml({
      title: 'THE HORI CLICK | Independent US Finance, Tech & Modern Lifestyle Journal',
      slug: slug || '',
      excerpt: 'In-depth analysis, expert guides, and daily insights on personal finance, emerging AI, and modern digital lifestyle.',
      coverImage: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200'
    }, req.originalUrl, refCode);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(defaultHtml);
  } catch (err) {
    console.error('[OG Serverless Error]', err);
    return res.redirect(302, 'https://www.thehori.click/');
  }
};

app.get('/post/:slug', handlePostCrawler);
app.get('/post/*', handlePostCrawler);

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

      if (isCrawler && post) {
        const html = buildPostHtml(post, req.originalUrl, shortLink.staffCode);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      }

      const targetUrl = shortLink.originalUrl || (post ? `https://www.thehori.click/post/${post.slug}${shortLink.staffCode ? `?ref=${shortLink.staffCode}` : ''}` : 'https://www.thehori.click/');
      return res.redirect(302, targetUrl);
    }

    // Fallback: Check if code matches a staff refCode directly (e.g. /s/qb -> /?ref=QB)
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
