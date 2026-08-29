import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRouter from '../server/routes/api.js';
import { connectDB, memoryStore } from '../server/db.js';
import { Post } from '../server/models/Post.js';
import { ShortLink } from '../server/models/ShortLink.js';
import { initialPosts } from '../server/seedData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Helper: Detect Social Media Crawlers
const isSocialCrawler = (userAgent = '') => {
  const ua = userAgent.toLowerCase();
  return (
    ua.includes('facebookexternalhit') ||
    ua.includes('facebot') ||
    ua.includes('zalo') ||
    ua.includes('twitterbot') ||
    ua.includes('telegrambot') ||
    ua.includes('slackbot') ||
    ua.includes('whatsapp') ||
    ua.includes('linkedinbot') ||
    ua.includes('pinterest') ||
    ua.includes('discordbot') ||
    ua.includes('googlebot') ||
    ua.includes('bingbot')
  );
};

// Helper: Build Full Open Graph HTML
const buildPostHtml = (post, reqUrl, refCode = '') => {
  const title = `${escapeHtml(post.title)} | THE HORI CLICK`;
  const cleanExcerpt = escapeHtml(post.excerpt || post.metaDescription || post.title);
  const imageUrl = post.coverImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200';
  const postUrl = `https://www.thehori.click/post/${post.slug}${refCode ? `?ref=${refCode}` : ''}`;

  // Try reading dist/index.html first
  const possiblePaths = [
    path.join(process.cwd(), 'dist/index.html'),
    path.resolve(__dirname, '../dist/index.html'),
    path.join(process.cwd(), 'index.html'),
    path.resolve(__dirname, '../index.html')
  ];

  let template = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        template = fs.readFileSync(p, 'utf8');
        if (template) break;
      } catch (e) {}
    }
  }

  if (template) {
    let html = template;
    // Replace standard tags
    html = html.replace(/<title>.*?<\/title>/gi, `<title>${title}</title>`);
    html = html.replace(/<meta name="title" content=".*?" \/>/gi, `<meta name="title" content="${title}" />`);
    html = html.replace(/<meta name="description" content=".*?" \/>/gi, `<meta name="description" content="${cleanExcerpt}" />`);
    html = html.replace(/<link rel="canonical" href=".*?" \/>/gi, `<link rel="canonical" href="${postUrl}" />`);

    // Replace or inject Open Graph tags
    html = html.replace(/<meta property="og:type" content=".*?" \/>/gi, `<meta property="og:type" content="article" />`);
    html = html.replace(/<meta property="og:url" content=".*?" \/>/gi, `<meta property="og:url" content="${postUrl}" />`);
    html = html.replace(/<meta property="og:title" content=".*?" \/>/gi, `<meta property="og:title" content="${title}" />`);
    html = html.replace(/<meta property="og:description" content=".*?" \/>/gi, `<meta property="og:description" content="${cleanExcerpt}" />`);
    html = html.replace(
      /<meta property="og:image" content=".*?" \/>/gi, 
      `<meta property="og:image" content="${imageUrl}" />\n    <meta property="og:image:secure_url" content="${imageUrl}" />\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />\n    <meta property="og:image:type" content="image/jpeg" />`
    );

    // Replace Twitter tags
    html = html.replace(/<meta property="twitter:title" content=".*?" \/>/gi, `<meta name="twitter:title" content="${title}" />`);
    html = html.replace(/<meta property="twitter:description" content=".*?" \/>/gi, `<meta name="twitter:description" content="${cleanExcerpt}" />`);
    html = html.replace(/<meta property="twitter:url" content=".*?" \/>/gi, `<meta name="twitter:url" content="${postUrl}" />`);
    if (html.includes('twitter:image')) {
      html = html.replace(/<meta (?:property|name)="twitter:image" content=".*?" \/>/gi, `<meta name="twitter:image" content="${imageUrl}" />`);
    } else {
      html = html.replace('</head>', `    <meta name="twitter:image" content="${imageUrl}" />\n</head>`);
    }

    return html;
  }

  // Fallback Full Standalone HTML Shell
  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="title" content="${title}" />
  <meta name="description" content="${cleanExcerpt}" />
  <link rel="canonical" href="${postUrl}" />

  <!-- Open Graph / Facebook / Zalo -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="THE HORI CLICK" />
  <meta property="og:url" content="${postUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${cleanExcerpt}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:secure_url" content="${imageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${postUrl}" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${cleanExcerpt}" />
  <meta name="twitter:image" content="${imageUrl}" />

  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-MZ34K70519"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-MZ34K70519');
    ${refCode ? `gtag('event', 'seeding_referral_click', { staff_code: '${refCode}', post_slug: '${post.slug}' });` : ''}
  </script>

  <meta http-equiv="refresh" content="0;url=${postUrl}" />
</head>
<body style="font-family: sans-serif; padding: 2rem; text-align: center; background: #faf9f6;">
  <h2>Đang chuyển hướng tới bài viết...</h2>
  <p><a href="${postUrl}">${post.title}</a></p>
  <script>window.location.href = "${postUrl}";</script>
</body>
</html>`;
};

// ==========================================
// 1. Dynamic Open Graph for /post/:slug
// ==========================================
app.get('/post/:slug', async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const refCode = (req.query.ref || req.query.utm_source || '').toUpperCase();

    let post = null;
    try {
      if (Post) {
        post = await Post.findOne({ $or: [{ slug }, { id: slug }] });
      }
    } catch (e) {}

    if (!post) {
      post = (memoryStore.posts || []).find(p => p.slug === slug || p.id === slug) ||
             initialPosts.find(p => p.slug === slug || p.id === slug);
    }

    if (post) {
      const html = buildPostHtml(post, req.originalUrl, refCode);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
      return res.send(html);
    }

    next();
  } catch (err) {
    console.error('[OG Serverless Error]', err);
    next();
  }
});

// ==========================================
// 2. Short Link Resolver for /s/:code
// ==========================================
app.get('/s/:code', async (req, res) => {
  try {
    const code = req.params.code.toLowerCase().trim();
    const userAgent = req.headers['user-agent'] || '';
    const isCrawler = isSocialCrawler(userAgent);

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
      // Async increment click count
      try {
        if (ShortLink) {
          await ShortLink.updateOne({ code }, { $inc: { clicks: 1 } });
        }
        shortLink.clicks = (shortLink.clicks || 0) + 1;
      } catch (e) {}

      // Find post for preview metadata
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

      // If regular browser user: Redirect directly to destination with staff referral
      const targetUrl = shortLink.originalUrl || (post ? `https://www.thehori.click/post/${post.slug}${shortLink.staffCode ? `?ref=${shortLink.staffCode}` : ''}` : 'https://www.thehori.click/');
      return res.redirect(302, targetUrl);
    }

    // Fallback: Check if code is a staff referral code directly (e.g. /s/qb -> /?ref=QB)
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
