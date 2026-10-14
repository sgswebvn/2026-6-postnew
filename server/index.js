import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './db.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import publicRoutes from './routes/public.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Global API rate limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 180, // Max 180 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again shortly.' }
});
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

import { Post } from './models/Post.js';
import { Category } from './models/Category.js';
import { Setting } from './models/Setting.js';

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);

// Dynamic robots.txt for SEO crawlers
app.get('/robots.txt', async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: 'global_settings' });
    const siteUrl = setting?.siteUrl || `${req.protocol}://${req.get('host')}`;
    const cleanUrl = siteUrl.replace(/\/+$/, '');

    const robotsContent = [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /admin/*',
      'Disallow: /api/admin/',
      '',
      `Sitemap: ${cleanUrl}/sitemap.xml`
    ].join('\n');

    res.header('Content-Type', 'text/plain');
    res.send(robotsContent);
  } catch (e) {
    res.header('Content-Type', 'text/plain');
    res.send('User-agent: *\nAllow: /\nDisallow: /admin\n');
  }
});

// Dynamic sitemap.xml for SEO indexing
app.get('/sitemap.xml', async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: 'global_settings' });
    const siteUrl = setting?.siteUrl || `${req.protocol}://${req.get('host')}`;
    const cleanUrl = siteUrl.replace(/\/+$/, '');

    const [posts, categories] = await Promise.all([
      Post.find({ status: 'published' }).select('slug updatedAt publishedAt createdAt'),
      Category.find().select('slug id updatedAt')
    ]);

    const staticRoutes = [
      { loc: cleanUrl, changefreq: 'daily', priority: '1.0' },
      { loc: `${cleanUrl}/about`, changefreq: 'monthly', priority: '0.6' },
      { loc: `${cleanUrl}/contact`, changefreq: 'monthly', priority: '0.6' },
      { loc: `${cleanUrl}/privacy-policy`, changefreq: 'yearly', priority: '0.4' },
      { loc: `${cleanUrl}/terms`, changefreq: 'yearly', priority: '0.4' },
      { loc: `${cleanUrl}/cookie-policy`, changefreq: 'yearly', priority: '0.4' }
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Static pages
    for (const route of staticRoutes) {
      xml += '  <url>\n';
      xml += `    <loc>${route.loc}</loc>\n`;
      xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
      xml += `    <priority>${route.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    // Categories
    for (const cat of categories) {
      const catSlug = cat.slug || cat.id;
      xml += '  <url>\n';
      xml += `    <loc>${cleanUrl}/category/${encodeURIComponent(catSlug)}</loc>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    // Published Posts
    for (const post of posts) {
      const lastMod = (post.updatedAt || post.publishedAt || post.createdAt || new Date()).toISOString();
      xml += '  <url>\n';
      xml += `    <loc>${cleanUrl}/post/${encodeURIComponent(post.slug)}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.9</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error('[Sitemap Generation Error]', err);
    res.status(500).send('Error generating sitemap');
  }
});

// Dynamic ads.txt for Google AdSense verification
app.get('/ads.txt', async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: 'global_settings' });
    const pubId = setting?.adsense?.publisherId;

    let adsTxtContent = '# Google AdSense Verification File\n';
    if (pubId && pubId.startsWith('ca-pub-')) {
      const numericPub = pubId.replace('ca-', '');
      adsTxtContent += `google.com, ${numericPub}, DIRECT, f08c47fec0942fa0\n`;
    } else {
      adsTxtContent += '# Publisher ID not configured or pending approval\n';
    }

    res.header('Content-Type', 'text/plain');
    res.send(adsTxtContent);
  } catch (err) {
    res.header('Content-Type', 'text/plain');
    res.send('# Error retrieving ads.txt configuration\n');
  }
});

// In Production, serve built frontend from dist
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// SPA catch-all fallback
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found.' });
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('Website Backend is active. Run Vite dev server for frontend UI.');
    }
  });
});

// Centralized Error Handler (No stack trace leakage)
app.use((err, req, res, next) => {
  console.error('[Internal Error]', err);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error occurred.'
    : err.message || 'Internal server error';
  res.status(status).json({ error: message });
});

// Start Server
async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Blogweb Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
