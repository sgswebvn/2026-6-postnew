import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';
import { connectDB, memoryStore } from './db.js';
import { Post } from './models/Post.js';
import { ShortLink } from './models/ShortLink.js';
import { initialPosts } from './seedData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper to escape HTML characters
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

  const distHtmlPath = path.resolve(__dirname, '../dist/index.html');
  const rootHtmlPath = path.resolve(__dirname, '../index.html');
  const htmlFilePath = fs.existsSync(distHtmlPath) ? distHtmlPath : (fs.existsSync(rootHtmlPath) ? rootHtmlPath : null);

  if (htmlFilePath) {
    let html = fs.readFileSync(htmlFilePath, 'utf8');

    html = html.replace(/<title>.*?<\/title>/gi, `<title>${title}</title>`);
    html = html.replace(/<meta name="title" content=".*?" \/>/gi, `<meta name="title" content="${title}" />`);
    html = html.replace(/<meta name="description" content=".*?" \/>/gi, `<meta name="description" content="${cleanExcerpt}" />`);
    html = html.replace(/<link rel="canonical" href=".*?" \/>/gi, `<link rel="canonical" href="${postUrl}" />`);

    html = html.replace(/<meta property="og:type" content=".*?" \/>/gi, `<meta property="og:type" content="article" />`);
    html = html.replace(/<meta property="og:url" content=".*?" \/>/gi, `<meta property="og:url" content="${postUrl}" />`);
    html = html.replace(/<meta property="og:title" content=".*?" \/>/gi, `<meta property="og:title" content="${title}" />`);
    html = html.replace(/<meta property="og:description" content=".*?" \/>/gi, `<meta property="og:description" content="${cleanExcerpt}" />`);
    html = html.replace(
      /<meta property="og:image" content=".*?" \/>/gi, 
      `<meta property="og:image" content="${imageUrl}" />\n    <meta property="og:image:secure_url" content="${imageUrl}" />\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />\n    <meta property="og:image:type" content="image/jpeg" />`
    );

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

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${cleanExcerpt}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:url" content="${postUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${imageUrl}" />
  <meta http-equiv="refresh" content="0;url=${postUrl}" />
</head>
<body><script>window.location.href = "${postUrl}";</script></body>
</html>`;
};

// 1. Social Sharing & Open Graph Crawler Handler for /post/:slug
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
      post = (memoryStore.posts || []).find(p => p.slug === slug || p.id === slug) || initialPosts.find(p => p.slug === slug || p.id === slug);
    }

    if (post) {
      const html = buildPostHtml(post, req.originalUrl, refCode);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    next();
  } catch (error) {
    console.error('[OpenGraph SSR Middleware Error]', error);
    next();
  }
});

// 2. Short Link Resolver for /s/:code
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
      try {
        if (ShortLink) await ShortLink.updateOne({ code }, { $inc: { clicks: 1 } });
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

    return res.redirect(302, `https://www.thehori.click/?ref=${code.toUpperCase()}`);
  } catch (err) {
    return res.redirect(302, 'https://www.thehori.click/');
  }
});

// 3. API Routes
app.use('/api', apiRouter);

// Serve static assets from React dist
app.use(express.static(path.resolve(__dirname, '../dist')));

// Fallback SPA routing
app.get('*', (req, res) => {
  const distHtml = path.resolve(__dirname, '../dist/index.html');
  if (fs.existsSync(distHtml)) {
    return res.sendFile(distHtml);
  }
  return res.sendFile(path.resolve(__dirname, '../index.html'));
});

// Boot Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 [Production Server] Running at: http://localhost:${PORT}`);
  });
});
