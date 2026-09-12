import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CONFIG = {
  PORT: process.env.PORT || 4000,
  CLIENT_PORT: process.env.CLIENT_PORT || 5173,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'liferpg_super_secret_jwt_key_tzpsv2_hackathon_2026',
  JWT_EXPIRES_IN: '7d',
  DB_PATH: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'liferpg.db'),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173'
};
