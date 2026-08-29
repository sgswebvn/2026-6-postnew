import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';
import { connectDB, memoryStore } from './db.js';
import { Post } from './models/Post.js';
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

// 1. Social Sharing & Open Graph Crawler Handler for /post/:slug
app.get('/post/:slug', async (req, res, next) => {
  try {
    const slug = req.params.slug;
    let post = null;

    try {
      if (Post) {
        post = await Post.findOne({ slug });
      }
    } catch (e) {
      // fallback
    }

    if (!post) {
      post = (memoryStore.posts || []).find(p => p.slug === slug) || initialPosts.find(p => p.slug === slug);
    }

    // Locate HTML file (dist/index.html or root index.html)
    const distHtmlPath = path.resolve(__dirname, '../dist/index.html');
    const rootHtmlPath = path.resolve(__dirname, '../index.html');
    const htmlFilePath = fs.existsSync(distHtmlPath) ? distHtmlPath : (fs.existsSync(rootHtmlPath) ? rootHtmlPath : null);

    if (htmlFilePath && post) {
      let html = fs.readFileSync(htmlFilePath, 'utf8');

      const title = `${escapeHtml(post.title)} | THE HORI CLICK`;
      const description = escapeHtml(post.excerpt || post.metaDescription || post.title);
      const imageUrl = post.coverImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200';
      const postUrl = `https://www.thehori.click/post/${post.slug}`;

      // Replace standard Title & Meta
      html = html.replace(/<title>.*?<\/title>/gi, `<title>${title}</title>`);
      html = html.replace(/<meta name="title" content=".*?" \/>/gi, `<meta name="title" content="${title}" />`);
      html = html.replace(/<meta name="description" content=".*?" \/>/gi, `<meta name="description" content="${description}" />`);
      html = html.replace(/<link rel="canonical" href=".*?" \/>/gi, `<link rel="canonical" href="${postUrl}" />`);

      // Replace Open Graph / Facebook / Zalo / Telegram / Messenger tags
      html = html.replace(/<meta property="og:title" content=".*?" \/>/gi, `<meta property="og:title" content="${title}" />`);
      html = html.replace(/<meta property="og:description" content=".*?" \/>/gi, `<meta property="og:description" content="${description}" />`);
      html = html.replace(/<meta property="og:image" content=".*?" \/>/gi, `<meta property="og:image" content="${imageUrl}" /><meta property="og:image:secure_url" content="${imageUrl}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" />`);
      html = html.replace(/<meta property="og:url" content=".*?" \/>/gi, `<meta property="og:url" content="${postUrl}" />`);
      html = html.replace(/<meta property="og:type" content=".*?" \/>/gi, `<meta property="og:type" content="article" />`);

      // Replace Twitter Card tags
      html = html.replace(/<meta property="twitter:title" content=".*?" \/>/gi, `<meta property="twitter:title" content="${title}" />`);
      html = html.replace(/<meta property="twitter:description" content=".*?" \/>/gi, `<meta property="twitter:description" content="${description}" />`);
      html = html.replace(/<meta property="twitter:url" content=".*?" \/>/gi, `<meta property="twitter:url" content="${postUrl}" />`);

      // In case Twitter image is present
      if (html.includes('twitter:image')) {
        html = html.replace(/<meta (?:property|name)="twitter:image" content=".*?" \/>/gi, `<meta name="twitter:image" content="${imageUrl}" />`);
      } else {
        html = html.replace('</head>', `  <meta name="twitter:image" content="${imageUrl}" />\n</head>`);
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    next();
  } catch (error) {
    console.error('[OpenGraph SSR Middleware Error]', error);
    next();
  }
});

// Mount API Router
app.use('/api', apiRouter);

// Serve static assets from dist folder if built
const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

// Fallback for SPA routing
app.get('*', (req, res) => {
  const distHtml = path.resolve(__dirname, '../dist/index.html');
  const rootHtml = path.resolve(__dirname, '../index.html');
  if (fs.existsSync(distHtml)) {
    return res.sendFile(distHtml);
  }
  if (fs.existsSync(rootHtml)) {
    return res.sendFile(rootHtml);
  }
  res.json({
    name: 'The Horizon Post - US Editorial Blog MongoDB API Server',
    version: '2.0.0'
  });
});

// Start Server and Connect DB
const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 [Server] The Horizon Post API running on port ${PORT}`);
  console.log(`🔗 [Endpoint] http://localhost:${PORT}/api/status`);
  console.log(`=======================================================`);
});

connectDB().catch(err => {
  console.warn('[MongoDB Atlas] Background connection notice:', err.message);
});

export default app;
