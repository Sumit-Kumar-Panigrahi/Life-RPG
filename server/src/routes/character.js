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

// PUT /api/character - Customize character profile
characterRouter.put('/', (req, res) => {
  try {
    const { characterName, avatarClass } = req.body;
    const existing = db.prepare('SELECT * FROM character_stats WHERE user_id = ?').get(req.user.id);

    if (!existing) {
      return res.status(404).json({ error: 'Character not found.' });
    }

    const cleanName = characterName?.trim() || existing.character_name;
    const cleanClass = ['WARRIOR', 'MAGE', 'ROGUE', 'PALADIN'].includes(avatarClass) ? avatarClass : existing.avatar_class;

    db.prepare(`
      UPDATE character_stats
      SET character_name = ?, avatar_class = ?, updated_at = datetime('now')
      WHERE user_id = ?
    `).run(cleanName, cleanClass, req.user.id);

    const updated = db.prepare('SELECT * FROM character_stats WHERE user_id = ?').get(req.user.id);
    updated.requiredXp = getRequiredXpForNextLevel(updated.level);

    return res.json({ character: updated });
  } catch (error) {
    console.error('[Update Character Error]', error);
    return res.status(500).json({ error: 'Failed to update character.' });
  }
});
