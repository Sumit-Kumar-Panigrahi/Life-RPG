import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server folder or root repository folder
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

export const CONFIG = {
  PORT: process.env.PORT || 4000,
  CLIENT_PORT: process.env.CLIENT_PORT || 5173,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'liferpg_super_secret_jwt_key_tzpsv2_hackathon_2026',
  JWT_EXPIRES_IN: '7d',
  DB_PATH: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'liferpg.db'),
  MONGODB_URI: process.env.MONGODB_URI || '',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/google/callback'
};
