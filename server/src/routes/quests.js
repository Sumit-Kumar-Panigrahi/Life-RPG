import express from 'express';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import {
  CATEGORY_ATTRIBUTE_MAP,
  DIFFICULTY_REWARDS,
  calculateProgression,
  calculateStreak,
  getRequiredXpForNextLevel
} from '../utils/rpgEngine.js';

export const questsRouter = express.Router();

// Apply requireAuth to all quest routes
questsRouter.use(requireAuth);

// GET /api/quests - Retrieve user's quests with filtering
questsRouter.get('/', (req, res) => {
  try {
    const { status, category, difficulty, search } = req.query;

    let query = 'SELECT * FROM quests WHERE user_id = ?';
    const params = [req.user.id];

    if (status === 'active') {
      query += ' AND is_completed = 0';
    } else if (status === 'completed') {
      query += ' AND is_completed = 1';
    }

    if (category && category !== 'ALL') {
      query += ' AND category = ?';
      params.push(category.toUpperCase());
    }

    if (difficulty && difficulty !== 'ALL') {
      query += ' AND difficulty = ?';
      params.push(difficulty.toUpperCase());
    }

    if (search && search.trim()) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    query += ' ORDER BY is_completed ASC, created_at DESC';

    const quests = db.prepare(query).all(...params);
    return res.json({ quests });
  } catch (error) {
    console.error('[Get Quests Error]', error);
    return res.status(500).json({ error: 'Failed to retrieve quests.' });
  }
});

// POST /api/quests - Create a new quest
questsRouter.post('/', (req, res) => {
  try {
    const { title, description, category, difficulty, priority, due_date } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Quest title is required.' });
    }

    const cleanTitle = title.trim();
    const cleanCategory = (category || 'KNOWLEDGE').toUpperCase();
    const cleanDifficulty = (difficulty || 'MEDIUM').toUpperCase();
    const cleanPriority = (priority || 'MEDIUM').toUpperCase();

    if (!CATEGORY_ATTRIBUTE_MAP[cleanCategory]) {
      return res.status(400).json({ error: 'Invalid quest category.' });
    }

    if (!DIFFICULTY_REWARDS[cleanDifficulty]) {
      return res.status(400).json({ error: 'Invalid quest difficulty level.' });
    }

    const rewards = DIFFICULTY_REWARDS[cleanDifficulty];
    const attributeTarget = CATEGORY_ATTRIBUTE_MAP[cleanCategory];

    const stmt = db.prepare(`
      INSERT INTO quests (user_id, title, description, category, difficulty, priority, due_date, xp_reward, gold_reward, attribute_target)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      req.user.id,
      cleanTitle,
      description?.trim() || '',
      cleanCategory,
      cleanDifficulty,
      cleanPriority,
      due_date || null,
      rewards.xp,
      rewards.gold,
      attributeTarget
    );

    const newQuest = db.prepare('SELECT * FROM quests WHERE id = ?').get(Number(result.lastInsertRowid));
    return res.status(201).json({ quest: newQuest });
  } catch (error) {
    console.error('[Create Quest Error]', error);
    return res.status(500).json({ error: 'Failed to create quest.' });
  }
});

// PUT /api/quests/:id - Update an existing quest
questsRouter.put('/:id', (req, res) => {
  try {
    const questId = Number(req.params.id);
    const { title, description, category, difficulty, priority, due_date } = req.body;

    const existing = db.prepare('SELECT * FROM quests WHERE id = ? AND user_id = ?').get(questId, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Quest not found.' });
    }

    if (existing.is_completed) {
      return res.status(400).json({ error: 'Cannot modify an already completed quest.' });
    }

    const cleanTitle = title ? title.trim() : existing.title;
    const cleanCategory = category ? category.toUpperCase() : existing.category;
    const cleanDifficulty = difficulty ? difficulty.toUpperCase() : existing.difficulty;
    const cleanPriority = priority ? priority.toUpperCase() : existing.priority;

    const rewards = DIFFICULTY_REWARDS[cleanDifficulty] || DIFFICULTY_REWARDS.MEDIUM;
    const attributeTarget = CATEGORY_ATTRIBUTE_MAP[cleanCategory] || 'INTELLECT';

    const stmt = db.prepare(`
      UPDATE quests
      SET title = ?, description = ?, category = ?, difficulty = ?, priority = ?, due_date = ?,
          xp_reward = ?, gold_reward = ?, attribute_target = ?
      WHERE id = ? AND user_id = ?
    `);

    stmt.run(
      cleanTitle,
      description !== undefined ? description.trim() : existing.description,
      cleanCategory,
      cleanDifficulty,
      cleanPriority,
      due_date !== undefined ? due_date : existing.due_date,
      rewards.xp,
      rewards.gold,
      attributeTarget,
      questId,
      req.user.id
    );

    const updated = db.prepare('SELECT * FROM quests WHERE id = ?').get(questId);
    return res.json({ quest: updated });
  } catch (error) {
    console.error('[Update Quest Error]', error);
    return res.status(500).json({ error: 'Failed to update quest.' });
  }
});

// DELETE /api/quests/:id - Remove quest
questsRouter.delete('/:id', (req, res) => {
  try {
    const questId = Number(req.params.id);
    const existing = db.prepare('SELECT id FROM quests WHERE id = ? AND user_id = ?').get(questId, req.user.id);

    if (!existing) {
      return res.status(404).json({ error: 'Quest not found.' });
    }

    db.prepare('DELETE FROM quests WHERE id = ? AND user_id = ?').run(questId, req.user.id);
    return res.json({ message: 'Quest vanquished successfully.' });
  } catch (error) {
    console.error('[Delete Quest Error]', error);
    return res.status(500).json({ error: 'Failed to delete quest.' });
  }
});

// POST /api/quests/:id/complete - Complete quest & atomically disburse XP, Gold, Attributes, Streak
questsRouter.post('/:id/complete', (req, res) => {
  try {
    const questId = Number(req.params.id);

    db.exec('BEGIN TRANSACTION;');
    try {
      const quest = db.prepare('SELECT * FROM quests WHERE id = ? AND user_id = ?').get(questId, req.user.id);

      if (!quest) {
        db.exec('ROLLBACK;');
        return res.status(404).json({ error: 'Quest not found.' });
      }

      if (quest.is_completed) {
        db.exec('ROLLBACK;');
        return res.status(400).json({ error: 'Quest has already been completed. Duplicate rewards prevented.' });
      }

      // Mark quest as completed
      const markCompleted = db.prepare(`
        UPDATE quests
        SET is_completed = 1, completed_at = ?
        WHERE id = ? AND user_id = ? AND is_completed = 0
      `);
      const updateResult = markCompleted.run(new Date().toISOString(), questId, req.user.id);

      if (updateResult.changes === 0) {
        db.exec('ROLLBACK;');
        return res.status(400).json({ error: 'Quest was already completed.' });
      }

      // Fetch character
      const character = db.prepare('SELECT * FROM character_stats WHERE user_id = ?').get(req.user.id);

      // 1. Calculate Progression (XP, Level, Non-linear progression curve)
      const prog = calculateProgression(character.level, character.current_xp, quest.xp_reward);

      // 2. Calculate Streaks
      const streakInfo = calculateStreak(character.last_active_date, character.current_streak, character.longest_streak);

      // 3. Calculate Currency/Gold
      const newGold = character.gold + quest.gold_reward;

      // Update character_stats
      db.prepare(`
        UPDATE character_stats
        SET level = ?, current_xp = ?, gold = ?, current_streak = ?, longest_streak = ?, last_active_date = ?, updated_at = datetime('now')
        WHERE user_id = ?
      `).run(
        prog.newLevel,
        prog.newXp,
        newGold,
        streakInfo.currentStreak,
        streakInfo.longestStreak,
        streakInfo.lastActiveDate,
        req.user.id
      );

      // 4. Update Attribute points
      const diffRewards = DIFFICULTY_REWARDS[quest.difficulty] || { attrPoints: 10 };
      const currentAttr = db.prepare('SELECT * FROM attributes WHERE user_id = ? AND attribute_name = ?').get(req.user.id, quest.attribute_target);

      let newAttrLevel = 1;
      let newAttrPoints = diffRewards.attrPoints;

      if (currentAttr) {
        newAttrPoints = currentAttr.points + diffRewards.attrPoints;
        newAttrLevel = 1 + Math.floor(newAttrPoints / 50);
        db.prepare('UPDATE attributes SET points = ?, level = ? WHERE id = ?').run(newAttrPoints, newAttrLevel, currentAttr.id);
      } else {
        newAttrLevel = 1 + Math.floor(newAttrPoints / 50);
        db.prepare('INSERT INTO attributes (user_id, attribute_name, level, points) VALUES (?, ?, ?, ?)').run(req.user.id, quest.attribute_target, newAttrLevel, newAttrPoints);
      }

      db.exec('COMMIT;');

      // Fetch fresh state for response
      const updatedCharacter = db.prepare('SELECT * FROM character_stats WHERE user_id = ?').get(req.user.id);
      updatedCharacter.requiredXp = getRequiredXpForNextLevel(updatedCharacter.level);

      const allAttributes = db.prepare('SELECT attribute_name, level, points FROM attributes WHERE user_id = ?').all(req.user.id);
      const completedQuest = db.prepare('SELECT * FROM quests WHERE id = ?').get(questId);

      return res.json({
        quest: completedQuest,
        rewards: {
          xpGained: quest.xp_reward,
          goldGained: quest.gold_reward,
          attribute: quest.attribute_target,
          attributePointsGained: diffRewards.attrPoints,
          levelsGained: prog.levelsGained,
          isLevelUp: prog.levelsGained > 0,
          newLevel: prog.newLevel,
          streak: streakInfo.currentStreak
        },
        character: updatedCharacter,
        attributes: allAttributes
      });
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  } catch (error) {
    console.error('[Complete Quest Error]', error);
    return res.status(500).json({ error: 'Failed to complete quest.' });
  }
});
