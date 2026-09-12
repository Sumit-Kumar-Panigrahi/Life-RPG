import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';
import { CONFIG } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { getRequiredXpForNextLevel } from '../utils/rpgEngine.js';

export const authRouter = express.Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: CONFIG.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    CONFIG.JWT_SECRET,
    { expiresIn: CONFIG.JWT_EXPIRES_IN }
  );
}

// POST /api/auth/signup
authRouter.post('/signup', async (req, res) => {
  try {
    const { username, email, password, characterName, avatarClass } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return res.status(400).json({ error: 'Username must be between 3 and 20 characters.' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return res.status(400).json({ error: 'Username may only contain letters, numbers, and underscores.' });
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check duplicate
    const existing = db.prepare('SELECT id, username, email FROM users WHERE username = ? OR email = ?').get(cleanUsername, cleanEmail);
    if (existing) {
      if (existing.username.toLowerCase() === cleanUsername.toLowerCase()) {
        return res.status(409).json({ error: 'Username is already taken.' });
      }
      return res.status(409).json({ error: 'Email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const heroName = characterName?.trim() || cleanUsername;
    const heroClass = ['WARRIOR', 'MAGE', 'ROGUE', 'PALADIN'].includes(avatarClass) ? avatarClass : 'WARRIOR';

    // Execute atomic user and character creation in a transaction
    db.exec('BEGIN TRANSACTION;');
    try {
      const insertUser = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');
      const userResult = insertUser.run(cleanUsername, cleanEmail, passwordHash);
      const userId = Number(userResult.lastInsertRowid);

      const insertStats = db.prepare(`
        INSERT INTO character_stats (user_id, character_name, avatar_class, level, current_xp, gold, current_streak, longest_streak)
        VALUES (?, ?, ?, 1, 0, 50, 0, 0)
      `);
      insertStats.run(userId, heroName, heroClass);

      // Initialize all 6 attributes
      const attributes = ['INTELLECT', 'STRENGTH', 'DISCIPLINE', 'CREATIVITY', 'CHARISMA', 'ENDURANCE'];
      const insertAttr = db.prepare('INSERT INTO attributes (user_id, attribute_name, level, points) VALUES (?, ?, 1, 0)');
      for (const attr of attributes) {
        insertAttr.run(userId, attr);
      }

      // Grant default items
      const insertInv = db.prepare('INSERT OR IGNORE INTO user_inventory (user_id, item_id) VALUES (?, ?)');
      insertInv.run(userId, 'theme-obsidian');
      insertInv.run(userId, 'title-novice');

      // Seed starter welcome quests for the new adventurer
      const insertQuest = db.prepare(`
        INSERT INTO quests (user_id, title, description, category, difficulty, priority, xp_reward, gold_reward, attribute_target)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertQuest.run(userId, 'Awaken Your Inner Hero', 'Complete your very first real-life task and explore the Life RPG interface.', 'MINDFULNESS', 'EASY', 'HIGH', 30, 10, 'DISCIPLINE');
      insertQuest.run(userId, 'Code or Study for 30 Minutes', 'Engage in deep focus work or learn a new technical concept.', 'KNOWLEDGE', 'MEDIUM', 'HIGH', 65, 25, 'INTELLECT');
      insertQuest.run(userId, 'Hydrate and Exercise', 'Drink 500ml water and complete 20 pushups or a 15-minute stretch.', 'FITNESS', 'EASY', 'MEDIUM', 30, 10, 'STRENGTH');

      db.exec('COMMIT;');

      const token = generateToken({ id: userId, username: cleanUsername, email: cleanEmail });
      res.cookie('token', token, COOKIE_OPTIONS);

      const character = db.prepare('SELECT * FROM character_stats WHERE user_id = ?').get(userId);
      character.requiredXp = getRequiredXpForNextLevel(character.level);

      const userAttributes = db.prepare('SELECT attribute_name, level, points FROM attributes WHERE user_id = ?').all(userId);

      return res.status(201).json({
        user: { id: userId, username: cleanUsername, email: cleanEmail },
        character,
        attributes: userAttributes,
        token
      });
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  } catch (error) {
    console.error('[Auth Signup Error]', error);
    return res.status(500).json({ error: 'Server error during signup. Please try again.' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Username/email and password are required.' });
    }

    const identifier = emailOrUsername.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?').get(identifier, identifier);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Password incorrect.' });
    }

    const token = generateToken(user);
    res.cookie('token', token, COOKIE_OPTIONS);

    const character = db.prepare('SELECT * FROM character_stats WHERE user_id = ?').get(user.id);
    character.requiredXp = getRequiredXpForNextLevel(character.level);

    const userAttributes = db.prepare('SELECT attribute_name, level, points FROM attributes WHERE user_id = ?').all(user.id);

    return res.json({
      user: { id: user.id, username: user.username, email: user.email },
      character,
      attributes: userAttributes,
      token
    });
  } catch (error) {
    console.error('[Auth Login Error]', error);
    return res.status(500).json({ error: 'Server error during login. Please try again.' });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  return res.json({ message: 'Successfully signed out.' });
});

// GET /api/auth/me (Full profile & persistence verification)
authRouter.get('/me', requireAuth, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const character = db.prepare('SELECT * FROM character_stats WHERE user_id = ?').get(req.user.id);
    if (!character) {
      return res.status(404).json({ error: 'Character data missing.' });
    }
    character.requiredXp = getRequiredXpForNextLevel(character.level);

    const attributes = db.prepare('SELECT attribute_name, level, points FROM attributes WHERE user_id = ?').all(req.user.id);
    const inventory = db.prepare(`
      SELECT i.item_id, s.name, s.description, s.category, s.icon, i.acquired_at
      FROM user_inventory i
      JOIN shop_items s ON i.item_id = s.id
      WHERE i.user_id = ?
    `).all(req.user.id);

    return res.json({
      user,
      character,
      attributes,
      inventory
    });
  } catch (error) {
    console.error('[Auth Me Error]', error);
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});
