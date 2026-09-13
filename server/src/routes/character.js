import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getRequiredXpForNextLevel } from '../utils/rpgEngine.js';
import {
  dbGetCharacterByUserId,
  dbUpdateCharacter,
  dbGetAttributesByUserId,
  dbGetQuests,
  dbGetShopItemById,
  dbGetShopItems,
  dbGetUserInventory
} from '../db/dbService.js';

export const characterRouter = express.Router();

characterRouter.use(requireAuth);

// GET /api/character - Retrieve character details, stats, attributes
characterRouter.get('/', async (req, res) => {
  try {
    const character = await dbGetCharacterByUserId(req.user.id);
    if (!character) {
      return res.status(404).json({ error: 'Character not found.' });
    }

    character.requiredXp = getRequiredXpForNextLevel(character.level);

    const attributes = await dbGetAttributesByUserId(req.user.id);
    const quests = await dbGetQuests(req.user.id);

    const totalQuests = quests.length;
    const completedQuests = quests.filter(q => q.is_completed === 1).length;
    const activeQuests = totalQuests - completedQuests;

    return res.json({
      character,
      attributes,
      stats: {
        totalQuests,
        completedQuests,
        activeQuests
      }
    });
  } catch (error) {
    console.error('[Get Character Error]', error);
    return res.status(500).json({ error: 'Failed to retrieve character.' });
  }
});

// PUT /api/character - Customize character profile & equipment
characterRouter.put('/', async (req, res) => {
  try {
    const { characterName, avatarClass, activeTitle, activeTheme } = req.body;
    const existing = await dbGetCharacterByUserId(req.user.id);

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
      if (activeTitle !== 'Novice Adventurer') {
        const allItems = await dbGetShopItems();
        const item = allItems.find(i => i.name === activeTitle && i.category === 'TITLE');
        if (!item) {
          return res.status(400).json({ error: 'Title does not exist in realm catalog.' });
        }
        const userInventory = await dbGetUserInventory(req.user.id);
        const owned = userInventory.some(i => i.item_id === item.id);
        if (!owned) {
          return res.status(403).json({ error: 'You do not own this heroic title.' });
        }
      }
      cleanTitle = activeTitle;
    }

    let cleanTheme = existing.active_theme;
    if (activeTheme !== undefined && activeTheme !== existing.active_theme) {
      if (activeTheme !== 'theme-obsidian') {
        const item = await dbGetShopItemById(activeTheme);
        if (!item || item.category !== 'THEME') {
          return res.status(400).json({ error: 'Theme does not exist in realm catalog.' });
        }
        const userInventory = await dbGetUserInventory(req.user.id);
        const owned = userInventory.some(i => i.item_id === item.id);
        if (!owned) {
          return res.status(403).json({ error: 'You do not own this visual armor theme.' });
        }
      }
      cleanTheme = activeTheme;
    }

    const updated = await dbUpdateCharacter(req.user.id, {
      character_name: cleanName,
      avatar_class: cleanClass,
      active_title: cleanTitle,
      active_theme: cleanTheme
    });

    updated.requiredXp = getRequiredXpForNextLevel(updated.level);
    const attributes = await dbGetAttributesByUserId(req.user.id);

    return res.json({ character: updated, attributes });
  } catch (error) {
    console.error('[Update Character Error]', error);
    return res.status(500).json({ error: 'Failed to update character.' });
  }
});
