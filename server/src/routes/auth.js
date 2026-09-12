import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
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

// PUT /api/auth/profile - Update account username and email
authRouter.put('/profile', requireAuth, (req, res) => {
  try {
    const { username, email } = req.body;
    const currentUser = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let newUsername = currentUser.username;
    if (username !== undefined) {
      const cleanUsername = username.trim();
      if (cleanUsername.length < 3 || cleanUsername.length > 24) {
        return res.status(400).json({ error: 'Username must be between 3 and 24 characters.' });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
        return res.status(400).json({ error: 'Username may only contain letters, numbers, and underscores.' });
      }

      // Check uniqueness against other users
      const existingUser = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?').get(cleanUsername, req.user.id);
      if (existingUser) {
        return res.status(409).json({ error: 'This hero username is already claimed.' });
      }
      newUsername = cleanUsername;
    }

    let newEmail = currentUser.email;
    if (email !== undefined) {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }

      // Check uniqueness against other users
      const existingEmail = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?').get(cleanEmail, req.user.id);
      if (existingEmail) {
        return res.status(409).json({ error: 'This email address is already registered.' });
      }
      newEmail = cleanEmail;
    }

    db.prepare('UPDATE users SET username = ?, email = ? WHERE id = ?').run(newUsername, newEmail, req.user.id);

    // Refresh JWT token with updated username/email
    const token = generateToken({ id: req.user.id, username: newUsername, email: newEmail });
    res.cookie('token', token, COOKIE_OPTIONS);

    const updatedUser = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(req.user.id);
    const updatedChar = db.prepare('SELECT * FROM character_stats WHERE user_id = ?').get(req.user.id);
    if (updatedChar) {
      updatedChar.requiredXp = getRequiredXpForNextLevel(updatedChar.level);
    }

    return res.json({
      message: 'Account profile updated successfully.',
      user: updatedUser,
      character: updatedChar
    });
  } catch (error) {
    console.error('[Update Profile Error]', error);
    return res.status(500).json({ error: 'Failed to update account profile.' });
  }
});

// GET /api/auth/google/status - Check if Google OAuth credentials are set
authRouter.get('/google/status', (req, res) => {
  const isConfigured = Boolean(CONFIG.GOOGLE_CLIENT_ID && CONFIG.GOOGLE_CLIENT_SECRET);
  return res.json({ configured: isConfigured });
});

// GET /api/auth/google - Initiate Google OAuth flow
authRouter.get('/google', (req, res) => {
  if (!CONFIG.GOOGLE_CLIENT_ID || !CONFIG.GOOGLE_CLIENT_SECRET) {
    return res.redirect('/?auth_error=google_not_configured');
  }

  const state = crypto.randomBytes(24).toString('hex');
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: CONFIG.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000 // 10 minutes
  });

  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = new URLSearchParams({
    redirect_uri: CONFIG.GOOGLE_CALLBACK_URL,
    client_id: CONFIG.GOOGLE_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'openid'
    ].join(' '),
    state
  });

  return res.redirect(`${rootUrl}?${options.toString()}`);
});

// GET /api/auth/google/callback - Complete Google OAuth flow
authRouter.get('/google/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      res.clearCookie('oauth_state');
      return res.redirect('/?auth_error=oauth_cancelled');
    }

    const storedState = req.cookies?.oauth_state;
    if (!state || !storedState || state !== storedState) {
      res.clearCookie('oauth_state');
      return res.redirect('/?auth_error=invalid_oauth_state');
    }
    res.clearCookie('oauth_state');

    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: CONFIG.GOOGLE_CLIENT_ID,
        client_secret: CONFIG.GOOGLE_CLIENT_SECRET,
        redirect_uri: CONFIG.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      let parsed = {};
      try { parsed = JSON.parse(errText); } catch {}
      console.error('[Google Token Exchange Failed Diagnostic]', {
        httpStatus: tokenRes.status,
        oauthError: parsed.error || 'unknown',
        errorDescription: parsed.error_description || errText,
        callbackUrlSent: CONFIG.GOOGLE_CALLBACK_URL,
        clientIdPresent: Boolean(CONFIG.GOOGLE_CLIENT_ID),
        clientIdMasked: CONFIG.GOOGLE_CLIENT_ID ? `${CONFIG.GOOGLE_CLIENT_ID.slice(0, 12)}...${CONFIG.GOOGLE_CLIENT_ID.slice(-25)}` : 'MISSING',
        clientSecretPresent: Boolean(CONFIG.GOOGLE_CLIENT_SECRET) ? 'YES' : 'NO',
        clientSecretLength: CONFIG.GOOGLE_CLIENT_SECRET ? CONFIG.GOOGLE_CLIENT_SECRET.length : 0,
        isPlaceholderSecret: CONFIG.GOOGLE_CLIENT_SECRET === 'YOUR_NEW_SECRET'
      });
      const errorCategory = parsed.error || 'token_exchange_failed';
      return res.redirect(`/?auth_error=${encodeURIComponent(errorCategory)}&error_desc=${encodeURIComponent(parsed.error_description || '')}`);
    }

    const tokens = await tokenRes.json();

    // Fetch user profile
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    if (!userinfoRes.ok) {
      return res.redirect('/?auth_error=userinfo_fetch_failed');
    }

    const googleUser = await userinfoRes.json();
    if (!googleUser.email) {
      return res.redirect('/?auth_error=no_email_provided');
    }

    // Process user in database
    const userResult = await resolveGoogleUser(googleUser);
    const token = generateToken(userResult);
    res.cookie('token', token, COOKIE_OPTIONS);

    return res.redirect('/?auth=success');
  } catch (err) {
    console.error('[Google Callback Error]', err);
    return res.redirect('/?auth_error=server_error');
  }
});

// Helper function to resolve or create Google authenticated user
async function resolveGoogleUser(googleUser) {
  const email = googleUser.email.trim().toLowerCase();
  const sub = googleUser.sub;

  let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(sub);

  if (!user) {
    user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(email);
    if (user) {
      db.prepare('UPDATE users SET google_id = ?, avatar_url = COALESCE(avatar_url, ?) WHERE id = ?')
        .run(sub, googleUser.picture || null, user.id);
    }
  }

  if (user) {
    return user;
  }

  // New user creation
  db.exec('BEGIN TRANSACTION;');
  try {
    let baseUsername = (googleUser.name || email.split('@')[0])
      .replace(/[^a-zA-Z0-9_]/g, '')
      .slice(0, 14);
    if (baseUsername.length < 3) baseUsername = 'hero_' + Math.floor(1000 + Math.random() * 9000);

    let finalUsername = baseUsername;
    let counter = 1;
    while (db.prepare('SELECT id FROM users WHERE LOWER(username) = ?').get(finalUsername.toLowerCase())) {
      finalUsername = `${baseUsername.slice(0, 11)}_${counter++}`;
    }

    const dummyHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
    const insertUser = db.prepare(`
      INSERT INTO users (username, email, password_hash, google_id, avatar_url)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertResult = insertUser.run(finalUsername, email, dummyHash, sub, googleUser.picture || null);
    const userId = Number(insertResult.lastInsertRowid);

    const heroName = googleUser.name || finalUsername;
    db.prepare(`
      INSERT INTO character_stats (user_id, character_name, avatar_class, level, current_xp, gold, current_streak, longest_streak)
      VALUES (?, ?, 'WARRIOR', 1, 0, 50, 0, 0)
    `).run(userId, heroName);

    const attributes = ['INTELLECT', 'STRENGTH', 'DISCIPLINE', 'CREATIVITY', 'CHARISMA', 'ENDURANCE'];
    const insertAttr = db.prepare('INSERT INTO attributes (user_id, attribute_name, level, points) VALUES (?, ?, 1, 0)');
    for (const attr of attributes) {
      insertAttr.run(userId, attr);
    }

    const insertInv = db.prepare('INSERT OR IGNORE INTO user_inventory (user_id, item_id) VALUES (?, ?)');
    insertInv.run(userId, 'theme-obsidian');
    insertInv.run(userId, 'title-novice');

    const insertQuest = db.prepare(`
      INSERT INTO quests (user_id, title, description, category, difficulty, priority, xp_reward, gold_reward, attribute_target)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertQuest.run(userId, 'Awaken Your Inner Hero', 'Complete your very first real-life task and explore the Life RPG interface.', 'MINDFULNESS', 'EASY', 'HIGH', 30, 10, 'DISCIPLINE');
    insertQuest.run(userId, 'Code or Study for 30 Minutes', 'Engage in deep focus work or learn a new technical concept.', 'KNOWLEDGE', 'MEDIUM', 'HIGH', 65, 25, 'INTELLECT');
    insertQuest.run(userId, 'Hydrate and Exercise', 'Drink 500ml water and complete 20 pushups or a 15-minute stretch.', 'FITNESS', 'EASY', 'MEDIUM', 30, 10, 'STRENGTH');

    db.exec('COMMIT;');

    return { id: userId, username: finalUsername, email };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

// Development/Testing endpoint to simulate Google OAuth callback securely
if (CONFIG.NODE_ENV !== 'production') {
  authRouter.post('/google/simulate-callback', async (req, res) => {
    try {
      const { email, name, sub } = req.body;
      if (!email || !sub) {
        return res.status(400).json({ error: 'email and sub are required.' });
      }

      const user = await resolveGoogleUser({
        email,
        name: name || email.split('@')[0],
        sub,
        picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${sub}`
      });

      const token = generateToken(user);
      res.cookie('token', token, COOKIE_OPTIONS);

      const character = db.prepare('SELECT * FROM character_stats WHERE user_id = ?').get(user.id);
      character.requiredXp = getRequiredXpForNextLevel(character.level);
      const attributes = db.prepare('SELECT attribute_name, level, points FROM attributes WHERE user_id = ?').all(user.id);

      return res.json({
        user: { id: user.id, username: user.username, email: user.email },
        character,
        attributes,
        token
      });
    } catch (err) {
      console.error('[Simulate Google Error]', err);
      return res.status(500).json({ error: 'Simulated OAuth failed' });
    }
  });
}

