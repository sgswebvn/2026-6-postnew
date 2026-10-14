import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Category } from './models/Category.js';
import { Post } from './models/Post.js';
import { Setting } from './models/Setting.js';
import fs from 'fs';
import path from 'path';

let isConnected = false;

const DEFAULT_CATEGORIES = [
  { id: 'cat-finance', name: 'Personal Finance & Wealth', slug: 'personal-finance', description: 'High-yield cash management, Treasury bills, and wealth building.', color: 'emerald', icon: 'TrendingUp' },
  { id: 'cat-tech', name: 'AI & Frontier Tech', slug: 'ai-frontier-tech', description: 'Multi-agent AI, semiconductor physics, and quantum computing.', color: 'blue', icon: 'Cpu' },
  { id: 'cat-health', name: 'Longevity & Biohacking', slug: 'longevity-biohacking', description: 'Continuous glucose telemetry, mitochondrial health, and biology.', color: 'rose', icon: 'Heart' },
  { id: 'cat-living', name: 'Smart Living & Design', slug: 'smart-living-design', description: 'Architectural minimalism, ergonomics, and smart home engineering.', color: 'amber', icon: 'Home' },
  { id: 'cat-venture', name: 'Venture & Economy', slug: 'venture-economy', description: 'Global macro liquidity, startup dynamics, and market analysis.', color: 'indigo', icon: 'DollarSign' },
  { id: 'cat-cyber', name: 'Cybersecurity & Privacy', slug: 'cybersecurity-privacy', description: 'Zero Trust architecture, cryptography, and digital asset custody.', color: 'cyan', icon: 'Shield' },
  { id: 'cat-energy', name: 'Clean Tech & Energy', slug: 'clean-tech-energy', description: 'Renewable grid infrastructure and advanced power distribution.', color: 'emerald', icon: 'Zap' }
];

export async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return { connected: true, dbName: mongoose.connection.db?.databaseName };
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not configured in .env');
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000
    });
    isConnected = true;
    const dbName = mongoose.connection.db?.databaseName || 'blogweb';
    console.log(`[MongoDB] Connected successfully to database: "${dbName}"`);

    // Ensure categories match the 30 posts if categories collection only has 1 or fewer
    const catCount = await Category.countDocuments();
    if (catCount <= 1) {
      console.log('[MongoDB] Populating standard categories matching existing posts...');
      for (const cat of DEFAULT_CATEGORIES) {
        await Category.updateOne(
          { $or: [{ id: cat.id }, { slug: cat.slug }] },
          { $setOnInsert: cat },
          { upsert: true }
        );
      }
    }

    // Ensure default settings exist
    const settingsDoc = await Setting.findOne({ key: 'global_settings' });
    if (!settingsDoc) {
      await Setting.create({ key: 'global_settings' });
    }

    return { connected: true, dbName };
  } catch (err) {
    isConnected = false;
    console.error('[MongoDB Error]', err.message);
    throw err;
  }
}

export function isDbConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}
