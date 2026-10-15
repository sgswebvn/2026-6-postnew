import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { connectDB } from './db.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import publicRoutes from './routes/public.js';
import { Post } from './models/Post.js';
import { Category } from './models/Category.js';
import { Setting } from './models/Setting.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security & Parsing Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Global API rate limiter (protecting serverless invocations & prevent abuse)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 240,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again shortly.' }
});
app.use('/api', apiLimiter);

// Serverless Database Connection Middleware:
// Guarantees MongoDB Atlas is connected before executing any database query
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[Database Middleware Error]', err.message);
    if (req.path.startsWith('/api') || req.path === '/sitemap.xml') {
      return res.status(500).json({
        error: 'Database connection failed. Please ensure MONGODB_URI is configured in Vercel Environment Variables.'
      });
    }
    next();
  }
});

// Health check endpoints (supports both with and without /api prefix)
const healthHandler = (req, res) => {
  res.json({
    status: 'online',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Mount API Routes (Both /api and direct prefix for Vercel rewrite resiliency)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/admin', adminRoutes);
// Note: We don't mount adminRoutes on /admin directly so client-side SPA route /admin is never shadowed

app.use('/api', publicRoutes);

// Dynamic robots.txt for SEO crawlers
const robotsHandler = async (req, res) => {
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
};
app.get('/robots.txt', robotsHandler);
app.get('/api/robots.txt', robotsHandler);

// Dynamic sitemap.xml for SEO indexing
const sitemapHandler = async (req, res) => {
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
};
app.get('/sitemap.xml', sitemapHandler);
app.get('/api/sitemap.xml', sitemapHandler);

// Dynamic ads.txt for Google AdSense verification
const adsTxtHandler = async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: 'global_settings' });
    const pubId = setting?.adsense?.publisherId;

    let adsTxtContent = '# Google AdSense Verification File\n';
    if (pubId && typeof pubId === 'string' && pubId.trim()) {
      let numericPub = pubId.trim().replace(/^ca-/, '');
      if (!numericPub.startsWith('pub-') && /^\d+$/.test(numericPub)) {
        numericPub = `pub-${numericPub}`;
      }
      if (numericPub.startsWith('pub-')) {
        adsTxtContent += `google.com, ${numericPub}, DIRECT, f08c47fec0942fa0\n`;
      } else {
        adsTxtContent += '# Publisher ID not configured or pending approval\n';
      }
    } else {
      adsTxtContent += '# Publisher ID not configured or pending approval\n';
    }

    res.header('Content-Type', 'text/plain');
    res.send(adsTxtContent);
  } catch (err) {
    res.header('Content-Type', 'text/plain');
    res.send('# Error retrieving ads.txt configuration\n');
  }
};
app.get('/ads.txt', adsTxtHandler);
app.get('/api/ads.txt', adsTxtHandler);

// Static assets & SPA fallback for traditional node servers (e.g. local dev / container)
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// SPA catch-all route for frontend client navigation (like /admin, /admin/posts, /category/...)
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
  const indexFile = path.join(distPath, 'index.html');
  if (fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }
  next();
});

// Centralized Error Handler (No stack trace leakage to client)
app.use((err, req, res, next) => {
  console.error('[Internal Error]', err);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error occurred.'
    : err.message || 'Internal server error';
  res.status(status).json({ error: message });
});

export default app;
