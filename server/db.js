import mongoose from 'mongoose';
import { Post } from './models/Post.js';
import { Category } from './models/Category.js';
import { Author } from './models/Author.js';
import { Setting } from './models/Setting.js';
import { Comment } from './models/Comment.js';
import { Subscriber } from './models/Subscriber.js';
import { 
  initialCategories, 
  initialAuthors, 
  initialPosts, 
  initialComments, 
  initialSubscribers, 
  initialSettings,
  initialActivityLogs
} from './seedData.js';
import { Staff } from './models/Staff.js';
import { ActivityLog } from './models/ActivityLog.js';
import { hashPassword } from './auth.js';

let isConnected = false;
let isInMemoryFallback = false;
let connectionPromise = null;

// In-Memory dynamic cache for 100% resilient fallback
export const memoryStore = {
  posts: [...initialPosts],
  categories: [...initialCategories],
  authors: [...initialAuthors],
  settings: { ...initialSettings },
  comments: [...initialComments],
  subscribers: [...initialSubscribers],
  staff: [],
  activityLogs: [...initialActivityLogs],
  shortLinks: []
};

export async function connectDB() {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    isConnected = true;
    isInMemoryFallback = false;
    return { isConnected: true, isInMemoryFallback: false };
  }

  if (connectionPromise && mongoose.connection && mongoose.connection.readyState === 2) {
    return connectionPromise;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    isConnected = false;
    isInMemoryFallback = true;
    return { isConnected: false, isInMemoryFallback: true };
  }

  connectionPromise = (async () => {
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });

      isConnected = true;
      isInMemoryFallback = false;
      console.log('[MongoDB] Connected successfully to MongoDB Database!');
      await seedDatabase();
    } catch (err) {
      console.warn(`[MongoDB Warning] Could not connect to MongoDB (${err.message}). Auth and writes are unavailable.`);
      isConnected = false;
      isInMemoryFallback = true;
    } finally {
      connectionPromise = null;
    }
    return { isConnected, isInMemoryFallback };
  })();

  return connectionPromise;
}

export async function seedDatabase() {
  if (isInMemoryFallback) return;

  try {
    const postCount = await Post.countDocuments();
    if (postCount === 0) {
      console.log('[MongoDB Seeder] Seeding initial US Editorial posts...');
      await Post.insertMany(initialPosts);
    }

    const catCount = await Category.countDocuments();
    if (catCount === 0) {
      console.log('[MongoDB Seeder] Seeding initial Categories...');
      await Category.insertMany(initialCategories);
    }

    const authorCount = await Author.countDocuments();
    if (authorCount === 0) {
      console.log('[MongoDB Seeder] Seeding initial Authors...');
      await Author.insertMany(initialAuthors);
    }

    const settingCount = await Setting.countDocuments();
    if (settingCount === 0) {
      console.log('[MongoDB Seeder] Seeding initial Settings...');
      await Setting.create(initialSettings);
    }

    const commentCount = await Comment.countDocuments();
    if (commentCount === 0) {
      console.log('[MongoDB Seeder] Seeding initial Comments...');
      await Comment.insertMany(initialComments);
    }

    const subscriberCount = await Subscriber.countDocuments();
    if (subscriberCount === 0) {
      console.log('[MongoDB Seeder] Seeding initial Subscribers...');
      await Subscriber.insertMany(initialSubscribers);
    }

    const staffCount = await Staff.countDocuments();
    if (staffCount === 0) {
      const seedPass = process.env.STAFF_SEED_PASSWORD;
      if (seedPass && String(seedPass).trim().length >= 6) {
        await Staff.create({
          id: 'staff-1',
          name: 'Administrator',
          username: process.env.STAFF_SEED_USERNAME || 'admin',
          password: hashPassword(String(seedPass).trim()),
          email: process.env.STAFF_SEED_EMAIL || 'admin@localhost',
          role: 'admin',
          roleName: 'Administrator',
          status: 'active',
          tokenVersion: 0,
          permissions: {
            canManagePosts: true,
            canPublishPosts: true,
            canManageCategories: true,
            canViewRevenue: true,
            canManageStaff: true,
            canManagePayroll: true,
            canManageSettings: true
          }
        });
        console.log('[MongoDB Seeder] Bootstrapped admin staff from STAFF_SEED_PASSWORD.');
      } else {
        console.warn('[MongoDB Seeder] Staff collection is empty. Set STAFF_SEED_PASSWORD to bootstrap an admin. Existing databases are not modified.');
      }
    }

    const logCount = await ActivityLog.countDocuments();
    if (logCount === 0) {
      console.log('[MongoDB Seeder] Seeding initial Activity Logs...');
      await ActivityLog.insertMany(initialActivityLogs);
    }

    console.log('[MongoDB Seeder] All collections verified and ready.');
  } catch (error) {
    console.error('[MongoDB Seeder Error]', error);
  }
}

export function getDbStatus() {
  return {
    connected: isConnected,
    mode: isInMemoryFallback ? 'Embedded In-Memory Engine (Ready)' : 'Live MongoDB Server (Connected)',
    driver: 'Mongoose 8+ / MongoDB Native'
  };
}
