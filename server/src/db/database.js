import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { CONFIG } from '../config.js';

// Ensure data folder exists
const dbDir = path.dirname(CONFIG.DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(CONFIG.DB_PATH);

// Enable WAL mode and foreign keys for high performance and integrity
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS character_stats (
      user_id INTEGER PRIMARY KEY,
      character_name TEXT NOT NULL,
      avatar_class TEXT DEFAULT 'WARRIOR',
      level INTEGER DEFAULT 1,
      current_xp INTEGER DEFAULT 0,
      gold INTEGER DEFAULT 50,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_active_date TEXT,
      active_theme TEXT DEFAULT 'theme-obsidian',
      active_title TEXT DEFAULT 'Novice Adventurer',
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attributes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      attribute_name TEXT NOT NULL,
      level INTEGER DEFAULT 1,
      points INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, attribute_name)
    );

    CREATE TABLE IF NOT EXISTS quests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      priority TEXT DEFAULT 'MEDIUM',
      due_date TEXT,
      is_completed INTEGER DEFAULT 0,
      completed_at TEXT,
      xp_reward INTEGER NOT NULL,
      gold_reward INTEGER NOT NULL,
      attribute_target TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shop_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      cost INTEGER NOT NULL,
      icon TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_id TEXT NOT NULL,
      acquired_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES shop_items(id) ON DELETE CASCADE,
      UNIQUE(user_id, item_id)
    );
  `);

  // Seed default shop catalog if empty
  const itemCount = db.prepare('SELECT COUNT(*) as count FROM shop_items').get().count;
  if (itemCount === 0) {
    const insertItem = db.prepare(`
      INSERT INTO shop_items (id, name, description, category, cost, icon)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const defaultItems = [
      // Themes
      ['theme-obsidian', 'Obsidian Forge', 'Dark, sleek, obsidian armor styling for focused discipline', 'THEME', 0, 'Palette'],
      ['theme-cyberpunk', 'Cyberpunk Neon', 'Electric cyan and violet HUD aesthetics for cyber operatives', 'THEME', 100, 'Zap'],
      ['theme-solarized', 'Solarized Guild', 'Warm amber and gold parchment theme of royal knights', 'THEME', 180, 'Sun'],
      ['theme-emerald', 'Emerald Glade', 'Lush woodland fantasy theme radiating vitality and renewal', 'THEME', 150, 'Trees'],
      ['theme-vaporwave', 'Vaporwave Synth', 'Retro aesthetic synthwave gradient inspired by late 80s arcade glory', 'THEME', 250, 'Sparkles'],

      // Titles
      ['title-novice', 'Novice Adventurer', 'Every legend starts from humble beginnings', 'TITLE', 0, 'Shield'],
      ['title-code-wizard', 'Code Wizard', 'Conjurer of resilient algorithms and bug-free codebases', 'TITLE', 75, 'Wand2'],
      ['title-iron-will', 'Iron Will', 'Forged through relentless consistency and grit', 'TITLE', 120, 'Flame'],
      ['title-mind-monk', 'Mindful Monk', 'Master of inner tranquility and unshakeable discipline', 'TITLE', 160, 'Brain'],
      ['title-grandmaster', 'Mythic Grandmaster', 'A paragon who conquered life quests across all realms', 'TITLE', 400, 'Crown'],

      // Badges
      ['badge-genesis', 'Genesis Hero', 'Awarded to early pioneers of the Life RPG realm', 'BADGE', 25, 'Award'],
      ['badge-dragon', 'Dragon Slayer', 'Proof of slaying monumental obstacles and deadlines', 'BADGE', 150, 'Swords'],
      ['badge-marathoner', 'Streak Sentinel', 'Guardian of relentless daily habits and rituals', 'BADGE', 220, 'TrendingUp'],
      ['badge-alchemist', 'Grand Alchemist', 'Transforms chaotic chores into crystalline productivity', 'BADGE', 300, 'FlaskConical']
    ];

    for (const item of defaultItems) {
      insertItem.run(...item);
    }
  }

  console.log('[Database] Persistent SQLite initialized successfully at', CONFIG.DB_PATH);
}
