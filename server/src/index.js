import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { CONFIG } from './config.js';
import { initDatabase } from './db/database.js';
import { authRouter } from './routes/auth.js';
import { questsRouter } from './routes/quests.js';
import { characterRouter } from './routes/character.js';
import { shopRouter } from './routes/shop.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize persistent SQLite database tables and seed items
initDatabase();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: CONFIG.CORS_ORIGIN,
  credentials: true
}));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Life RPG API',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRouter);
app.use('/api/quests', questsRouter);
app.use('/api/character', characterRouter);
app.use('/api/shop', shopRouter);

// Serve static frontend assets if built
const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(CONFIG.PORT, () => {
  console.log(`⚔️  Life RPG Server running on http://localhost:${CONFIG.PORT}`);
  console.log(`🛡️  CORS allowed for: ${CONFIG.CORS_ORIGIN}`);
});

export default app;
