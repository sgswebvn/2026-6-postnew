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
  initialSettings 
} from './seedData.js';

let isConnected = false;
let isInMemoryFallback = false;

// In-Memory dynamic cache for 100% resilient fallback
export const memoryStore = {
  posts: [...initialPosts],
  categories: [...initialCategories],
  authors: [...initialAuthors],
  settings: { ...initialSettings },
  comments: [...initialComments],
  subscribers: [...initialSubscribers]
};

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/horizon_blog';

  try {
    console.log(`[MongoDB] Connecting to database at: ${mongoUri.replace(/:\/\/.*@/, '://***@')} ...`);
    
    // Set 3 second timeout so fallback engages quickly if local mongod is not started
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });

    isConnected = true;
    isInMemoryFallback = false;
    console.log('[MongoDB] Connected successfully to MongoDB Database!');

    // Initialize & Seed Collections if needed
    await seedDatabase();
  } catch (err) {
    console.warn(`[MongoDB Warning] Could not connect to external MongoDB daemon (${err.message}).`);
    console.log('[MongoDB] Activating high-performance Embedded In-Memory Database Engine...');
    isConnected = true;
    isInMemoryFallback = true;
  }

  return { isConnected, isInMemoryFallback };
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
