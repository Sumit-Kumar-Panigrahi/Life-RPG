import express from 'express';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { getRequiredXpForNextLevel } from '../utils/rpgEngine.js';

export const characterRouter = express.Router();

characterRouter.use(requireAuth);

// GET /api/character - Retrieve character details, stats, attributes
characterRouter.get('/', (req, res) => {
  try {
    const character = db.prepare('SELECT * FROM character_stats WHERE user_id = ?').get(req.user.id);
    if (!character) {
      return res.status(404).json({ error: 'Character not found.' });
    }

    character.requiredXp = getRequiredXpForNextLevel(character.level);

    const attributes = db.prepare('SELECT attribute_name, level, points FROM attributes WHERE user_id = ?').all(req.user.id);

    // Get quest counts for statistics
    const stats = db.prepare(`
      SELECT
        COUNT(*) as totalQuests,
        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completedQuests,
        SUM(CASE WHEN is_completed = 0 THEN 1 ELSE 0 END) as activeQuests
      FROM quests
      WHERE user_id = ?
    `).get(req.user.id);

    return res.json({
      character,
      attributes,
      stats: {
        totalQuests: stats.totalQuests || 0,
        completedQuests: stats.completedQuests || 0,
        activeQuests: stats.activeQuests || 0
      }
    });
  } catch (error) {
    console.error('[Get Character Error]', error);
    return res.status(500).json({ error: 'Failed to retrieve character.' });
  }
});

// PUT /api/character - Customize character profile & equipment
characterRouter.put('/', (req, res) => {
  try {
    const { characterName, avatarClass, activeTitle, activeTheme } = req.body;
    const existing = db.prepare('SELECT * FROM character_stats WHERE user_id = ?').get(req.user.id);

    if (!existing) {
      return res.status(404).json({ error: 'Character not found.' });
    }

    let cleanName = existing.character_name;
    if (characterName !== undefined) {
      const trimmed = characterName.trim();
      if (trimmed.length < 2 || trimmed.length > 32) {
        return res.status(400).json({ error: 'Character name must be between 2 and 32 characters.' });
      }
      cleanName = trimmed;
    }

    let cleanClass = existing.avatar_class;
    if (avatarClass !== undefined) {
      const validClasses = ['WARRIOR', 'MAGE', 'ROGUE', 'PALADIN'];
      if (!validClasses.includes(avatarClass.toUpperCase())) {
        return res.status(400).json({ error: 'Invalid avatar class. Choose Warrior, Mage, Rogue, or Paladin.' });
      }
      cleanClass = avatarClass.toUpperCase();
    }

    let cleanTitle = existing.active_title;
    if (activeTitle !== undefined && activeTitle !== existing.active_title) {
      // Verify ownership in shop_items and user_inventory (or default novice)
      if (activeTitle !== 'Novice Adventurer') {
        const item = db.prepare('SELECT id FROM shop_items WHERE name = ? AND category = "TITLE"').get(activeTitle);
        if (!item) {
          return res.status(400).json({ error: 'Title does not exist in realm catalog.' });
        }
        const owned = db.prepare('SELECT id FROM user_inventory WHERE user_id = ? AND item_id = ?').get(req.user.id, item.id);
        if (!owned) {
          return res.status(403).json({ error: 'You do not own this heroic title.' });
        }
      }
      cleanTitle = activeTitle;
    }

    let cleanTheme = existing.active_theme;
    if (activeTheme !== undefined && activeTheme !== existing.active_theme) {
      // Verify ownership in shop_items and user_inventory (or default obsidian)
      if (activeTheme !== 'theme-obsidian') {
        const item = db.prepare('SELECT id FROM shop_items WHERE id = ? AND category = "THEME"').get(activeTheme);
        if (!item) {
          return res.status(400).json({ error: 'Theme does not exist in realm catalog.' });
        }
        const owned = db.prepare('SELECT id FROM user_inventory WHERE user_id = ? AND item_id = ?').get(req.user.id, item.id);
        if (!owned) {
          return res.status(403).json({ error: 'You do not own this visual armor theme.' });
        }
      }
      cleanTheme = activeTheme;
    }

    db.prepare(`
      UPDATE character_stats
      SET character_name = ?, avatar_class = ?, active_title = ?, active_theme = ?, updated_at = datetime('now')
      WHERE user_id = ?
    `).run(cleanName, cleanClass, cleanTitle, cleanTheme, req.user.id);

    const updated = db.prepare('SELECT * FROM character_stats WHERE user_id = ?').get(req.user.id);
    updated.requiredXp = getRequiredXpForNextLevel(updated.level);
    const attributes = db.prepare('SELECT attribute_name, level, points FROM attributes WHERE user_id = ?').all(req.user.id);

    return res.json({ character: updated, attributes });
  } catch (error) {
    console.error('[Update Character Error]', error);
    return res.status(500).json({ error: 'Failed to update character.' });
  }
});
