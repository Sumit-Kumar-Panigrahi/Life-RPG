import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  CATEGORY_ATTRIBUTE_MAP,
  DIFFICULTY_REWARDS,
  calculateProgression,
  calculateStreak,
  getRequiredXpForNextLevel
} from '../utils/rpgEngine.js';
import {
  dbGetQuests,
  dbGetQuestById,
  dbCreateQuest,
  dbUpdateQuest,
  dbDeleteQuest,
  dbGetCharacterByUserId,
  dbUpdateCharacter,
  dbGetAttributesByUserId,
  dbUpsertAttribute
} from '../db/dbService.js';

export const questsRouter = express.Router();

questsRouter.use(requireAuth);

// GET /api/quests - Retrieve user's quests with filtering
questsRouter.get('/', async (req, res) => {
  try {
    const { status, category, difficulty, search } = req.query;
    const quests = await dbGetQuests(req.user.id, { status, category, difficulty, search });
    return res.json({ quests });
  } catch (error) {
    console.error('[Get Quests Error]', error);
    return res.status(500).json({ error: 'Failed to retrieve quests.' });
  }
});

// POST /api/quests - Create a new quest
questsRouter.post('/', async (req, res) => {
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

    const newQuest = await dbCreateQuest({
      user_id: req.user.id,
      title: cleanTitle,
      description: description?.trim() || '',
      category: cleanCategory,
      difficulty: cleanDifficulty,
      priority: cleanPriority,
      due_date: due_date || null,
      xp_reward: rewards.xp,
      gold_reward: rewards.gold,
      attribute_target: attributeTarget
    });

    return res.status(201).json({ quest: newQuest });
  } catch (error) {
    console.error('[Create Quest Error]', error);
    return res.status(500).json({ error: 'Failed to create quest.' });
  }
});

// PUT /api/quests/:id - Update an existing quest
questsRouter.put('/:id', async (req, res) => {
  try {
    const questId = req.params.id;
    const { title, description, category, difficulty, priority, due_date } = req.body;

    const existing = await dbGetQuestById(questId, req.user.id);
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

    const updated = await dbUpdateQuest(questId, req.user.id, {
      title: cleanTitle,
      description: description !== undefined ? description.trim() : existing.description,
      category: cleanCategory,
      difficulty: cleanDifficulty,
      priority: cleanPriority,
      due_date: due_date !== undefined ? due_date : existing.due_date,
      xp_reward: rewards.xp,
      gold_reward: rewards.gold,
      attribute_target: attributeTarget
    });

    return res.json({ quest: updated });
  } catch (error) {
    console.error('[Update Quest Error]', error);
    return res.status(500).json({ error: 'Failed to update quest.' });
  }
});

// DELETE /api/quests/:id - Remove quest
questsRouter.delete('/:id', async (req, res) => {
  try {
    const questId = req.params.id;
    const deleted = await dbDeleteQuest(questId, req.user.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Quest not found.' });
    }

    return res.json({ message: 'Quest vanquished successfully.' });
  } catch (error) {
    console.error('[Delete Quest Error]', error);
    return res.status(500).json({ error: 'Failed to delete quest.' });
  }
});

// POST /api/quests/:id/complete - Complete quest & atomically disburse XP, Gold, Attributes, Streak
questsRouter.post('/:id/complete', async (req, res) => {
  try {
    const questId = req.params.id;

    const quest = await dbGetQuestById(questId, req.user.id);
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found.' });
    }

    if (quest.is_completed) {
      return res.status(400).json({ error: 'Quest has already been completed. Duplicate rewards prevented.' });
    }

    // Mark quest as completed
    const completedAt = new Date().toISOString();
    const updatedQuest = await dbUpdateQuest(questId, req.user.id, {
      is_completed: 1,
      completed_at: completedAt
    });

    // Fetch character
    const character = await dbGetCharacterByUserId(req.user.id);

    // 1. Calculate Progression (XP, Level)
    const prog = calculateProgression(character.level, character.current_xp, quest.xp_reward);

    // 2. Calculate Streaks
    const streakInfo = calculateStreak(character.last_active_date, character.current_streak, character.longest_streak);

    // 3. Calculate Gold
    const newGold = character.gold + quest.gold_reward;

    // Update character stats
    const updatedCharacter = await dbUpdateCharacter(req.user.id, {
      level: prog.newLevel,
      current_xp: prog.newXp,
      gold: newGold,
      current_streak: streakInfo.currentStreak,
      longest_streak: streakInfo.longestStreak,
      last_active_date: streakInfo.lastActiveDate
    });

    updatedCharacter.requiredXp = getRequiredXpForNextLevel(updatedCharacter.level);

    // 4. Update Attribute points
    const diffRewards = DIFFICULTY_REWARDS[quest.difficulty] || { attrPoints: 10 };
    await dbUpsertAttribute(req.user.id, quest.attribute_target, diffRewards.attrPoints);

    const allAttributes = await dbGetAttributesByUserId(req.user.id);

    return res.json({
      quest: updatedQuest,
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
  } catch (error) {
    console.error('[Complete Quest Error]', error);
    return res.status(500).json({ error: 'Failed to complete quest.' });
  }
});
