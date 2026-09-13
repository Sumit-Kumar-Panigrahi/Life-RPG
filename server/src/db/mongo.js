import mongoose from 'mongoose';
import { CONFIG } from '../config.js';
import { seedMongoShopCatalog } from './models.js';

let isConnected = false;

export async function connectMongoDB() {
  if (!CONFIG.MONGODB_URI) {
    console.log('[Database] MONGODB_URI not configured. Using local persistent SQLite fallback.');
    return false;
  }

  if (isConnected) return true;

  try {
    await mongoose.connect(CONFIG.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });

    isConnected = true;
    console.log('[Database] 🚀 Successfully connected to MongoDB Atlas Cloud Cluster!');

    // Seed default shop items if first time
    await seedMongoShopCatalog();
    return true;
  } catch (error) {
    console.error('[Database Error] Failed to connect to MongoDB Atlas:', error.message);
    console.log('[Database] Falling back to local persistent SQLite database.');
    return false;
  }
}

export function isMongoActive() {
  return isConnected && mongoose.connection.readyState === 1;
}
