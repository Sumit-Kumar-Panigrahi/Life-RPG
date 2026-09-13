import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { CONFIG } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { getRequiredXpForNextLevel } from '../utils/rpgEngine.js';
import {
  dbFindUserById,
  dbFindUserByEmail,
  dbFindUserByUsername,
  dbFindUserByGoogleId,
  dbFindUserByResetToken,
  dbInitializeUserAccount,
  dbUpdateUser,
  dbGetCharacterByUserId,
  dbGetAttributesByUserId,
  dbGetUserInventory
} from '../db/dbService.js';

export const authRouter = express.Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: CONFIG.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

function generateToken(user) {
  const userId = user.id || user._id;
  return jwt.sign(
    { id: userId, username: user.username, email: user.email },
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
    const existingUser = await dbFindUserByUsername(cleanUsername);
    if (existingUser) {
      return res.status(409).json({ error: 'Username is already taken.' });
    }
    const existingEmail = await dbFindUserByEmail(cleanEmail);
    if (existingEmail) {
      return res.status(409).json({ error: 'Email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await dbInitializeUserAccount({
      username: cleanUsername,
      email: cleanEmail,
      password_hash: passwordHash,
      characterName,
      avatarClass
    });

    const userId = user.id || user._id;
    const token = generateToken({ id: userId, username: user.username, email: user.email });
    res.cookie('token', token, COOKIE_OPTIONS);

    const character = await dbGetCharacterByUserId(userId);
    character.requiredXp = getRequiredXpForNextLevel(character.level);

    const userAttributes = await dbGetAttributesByUserId(userId);

    return res.status(201).json({
      user: { id: userId, username: user.username, email: user.email },
      character,
      attributes: userAttributes,
      token
    });
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
    let user = await dbFindUserByEmail(identifier);
    if (!user) {
      user = await dbFindUserByUsername(identifier);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash || '');
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Password incorrect.' });
    }

    const userId = user.id || user._id;
    const token = generateToken({ id: userId, username: user.username, email: user.email });
    res.cookie('token', token, COOKIE_OPTIONS);

    const character = await dbGetCharacterByUserId(userId);
    character.requiredXp = getRequiredXpForNextLevel(character.level);

    const userAttributes = await dbGetAttributesByUserId(userId);

    return res.json({
      user: { id: userId, username: user.username, email: user.email },
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
authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await dbFindUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const character = await dbGetCharacterByUserId(req.user.id);
    if (!character) {
      return res.status(404).json({ error: 'Character data missing.' });
    }
    character.requiredXp = getRequiredXpForNextLevel(character.level);

    const attributes = await dbGetAttributesByUserId(req.user.id);
    const inventory = await dbGetUserInventory(req.user.id);

    const userId = user.id || user._id;
    return res.json({
      user: { id: userId, username: user.username, email: user.email, created_at: user.created_at },
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
authRouter.put('/profile', requireAuth, async (req, res) => {
  try {
    const { username, email } = req.body;
    const currentUser = await dbFindUserById(req.user.id);
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

      const existingUser = await dbFindUserByUsername(cleanUsername);
      const existingId = existingUser ? (existingUser.id || existingUser._id?.toString()) : null;
      if (existingUser && existingId !== req.user.id.toString()) {
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

      const existingEmail = await dbFindUserByEmail(cleanEmail);
      const existingId = existingEmail ? (existingEmail.id || existingEmail._id?.toString()) : null;
      if (existingEmail && existingId !== req.user.id.toString()) {
        return res.status(409).json({ error: 'This email address is already registered.' });
      }
      newEmail = cleanEmail;
    }

    const updatedUser = await dbUpdateUser(req.user.id, { username: newUsername, email: newEmail });

    const token = generateToken({ id: req.user.id, username: newUsername, email: newEmail });
    res.cookie('token', token, COOKIE_OPTIONS);

    const updatedChar = await dbGetCharacterByUserId(req.user.id);
    if (updatedChar) {
      updatedChar.requiredXp = getRequiredXpForNextLevel(updatedChar.level);
    }

    const userId = updatedUser.id || updatedUser._id;
    return res.json({
      message: 'Account profile updated successfully.',
      user: { id: userId, username: updatedUser.username, email: updatedUser.email },
      character: updatedChar
    });
  } catch (error) {
    console.error('[Update Profile Error]', error);
    return res.status(500).json({ error: 'Failed to update account profile.' });
  }
});

// POST /api/auth/forgot-password - Request 6-digit password reset code
authRouter.post('/forgot-password', async (req, res) => {
  try {
    const { emailOrUsername } = req.body;
    if (!emailOrUsername || !emailOrUsername.trim()) {
      return res.status(400).json({ error: 'Please enter your username or email address.' });
    }

    const identifier = emailOrUsername.trim().toLowerCase();
    let user = await dbFindUserByEmail(identifier);
    if (!user) {
      user = await dbFindUserByUsername(identifier);
    }

    if (!user) {
      return res.status(404).json({ error: 'No adventurer account found with that username or email.' });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = (Date.now() + 15 * 60 * 1000).toString();

    const userId = user.id || user._id;
    await dbUpdateUser(userId, { reset_token: resetCode, reset_token_expires: expiresAt });

    console.log(`[Auth Reset Password Code] User: ${user.username} (${user.email}) -> Reset Code: ${resetCode}`);

    return res.json({
      message: `Password reset code generated for ${user.username}. Use code: ${resetCode}`,
      code: resetCode,
      username: user.username
    });
  } catch (error) {
    console.error('[Forgot Password Error]', error);
    return res.status(500).json({ error: 'Failed to process password reset request.' });
  }
});

// POST /api/auth/reset-password - Verify reset code and set new password
authRouter.post('/reset-password', async (req, res) => {
  try {
    const { emailOrUsername, token, newPassword } = req.body;

    if (!emailOrUsername || !token || !newPassword) {
      return res.status(400).json({ error: 'Username/email, reset code, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const identifier = emailOrUsername.trim().toLowerCase();
    let user = await dbFindUserByEmail(identifier);
    if (!user) {
      user = await dbFindUserByUsername(identifier);
    }

    if (!user || !user.reset_token) {
      return res.status(400).json({ error: 'Invalid password reset request or code expired.' });
    }

    const cleanToken = token.trim();
    if (user.reset_token !== cleanToken) {
      return res.status(400).json({ error: 'Incorrect 6-digit reset code. Please check and try again.' });
    }

    const now = Date.now();
    const expiresTime = Number(user.reset_token_expires || 0);
    if (now > expiresTime) {
      return res.status(400).json({ error: 'Password reset code has expired. Please request a new code.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const userId = user.id || user._id;
    await dbUpdateUser(userId, { password_hash: passwordHash, reset_token: null, reset_token_expires: null });

    return res.json({ message: 'Your password has been successfully reset! You can now sign in.' });
  } catch (error) {
    console.error('[Reset Password Error]', error);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// PUT /api/auth/change-password - Authenticated user password update
authRouter.put('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const user = await dbFindUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    if (user.password_hash) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Please enter your current password.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await dbUpdateUser(req.user.id, { password_hash: passwordHash });

    return res.json({ message: 'Password updated successfully!' });
  } catch (error) {
    console.error('[Change Password Error]', error);
    return res.status(500).json({ error: 'Failed to change password.' });
  }
});

// GET /api/auth/google/status
authRouter.get('/google/status', (req, res) => {
  const isConfigured = Boolean(CONFIG.GOOGLE_CLIENT_ID && CONFIG.GOOGLE_CLIENT_SECRET);
  return res.json({ configured: isConfigured });
});

// GET /api/auth/google
authRouter.get('/google', (req, res) => {
  if (!CONFIG.GOOGLE_CLIENT_ID || !CONFIG.GOOGLE_CLIENT_SECRET) {
    return res.redirect('/?auth_error=google_not_configured');
  }

  const state = crypto.randomBytes(24).toString('hex');
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: CONFIG.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000
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

// GET /api/auth/google/callback
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
      return res.redirect(`/?auth_error=${encodeURIComponent(parsed.error || 'token_exchange_failed')}&error_desc=${encodeURIComponent(parsed.error_description || '')}`);
    }

    const tokens = await tokenRes.json();
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

    const userResult = await resolveGoogleUser(googleUser);
    const token = generateToken(userResult);
    res.cookie('token', token, COOKIE_OPTIONS);

    return res.redirect('/?auth=success');
  } catch (err) {
    console.error('[Google Callback Error]', err);
    return res.redirect('/?auth_error=server_error');
  }
});

async function resolveGoogleUser(googleUser) {
  const email = googleUser.email.trim().toLowerCase();
  const sub = googleUser.sub;

  let user = await dbFindUserByGoogleId(sub);
  if (!user) {
    user = await dbFindUserByEmail(email);
    if (user) {
      const userId = user.id || user._id;
      user = await dbUpdateUser(userId, { google_id: sub, avatar_url: googleUser.picture || user.avatar_url });
    }
  }

  if (user) {
    const userId = user.id || user._id;
    return { id: userId, username: user.username, email: user.email };
  }

  let baseUsername = (googleUser.name || email.split('@')[0])
    .replace(/[^a-zA-Z0-9_]/g, '')
    .slice(0, 14);
  if (baseUsername.length < 3) baseUsername = 'hero_' + Math.floor(1000 + Math.random() * 9000);

  let finalUsername = baseUsername;
  let counter = 1;
  while (await dbFindUserByUsername(finalUsername)) {
    finalUsername = `${baseUsername.slice(0, 11)}_${counter++}`;
  }

  const dummyHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
  const newUser = await dbInitializeUserAccount({
    username: finalUsername,
    email,
    password_hash: dummyHash,
    google_id: sub,
    avatar_url: googleUser.picture || null,
    characterName: googleUser.name || finalUsername,
    avatarClass: 'WARRIOR'
  });

  const userId = newUser.id || newUser._id;
  return { id: userId, username: finalUsername, email };
}

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

      const character = await dbGetCharacterByUserId(user.id);
      character.requiredXp = getRequiredXpForNextLevel(character.level);
      const attributes = await dbGetAttributesByUserId(user.id);

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
