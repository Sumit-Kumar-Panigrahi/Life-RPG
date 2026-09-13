import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  dbGetCharacterByUserId,
  dbUpdateCharacter,
  dbGetShopItems,
  dbGetShopItemById,
  dbGetUserInventory,
  dbAddInventoryItem
} from '../db/dbService.js';

export const shopRouter = express.Router();

shopRouter.use(requireAuth);

// GET /api/shop/items - List all catalog items with user's ownership and equipped status
shopRouter.get('/items', async (req, res) => {
  try {
    const character = await dbGetCharacterByUserId(req.user.id);
    if (!character) {
      return res.status(404).json({ error: 'Character not found.' });
    }

    const userInventory = await dbGetUserInventory(req.user.id);
    const ownedItemIds = new Set(userInventory.map(i => i.item_id));

    // Ensure starter defaults are marked as owned
    ownedItemIds.add('theme-obsidian');
    ownedItemIds.add('title-novice');

    const items = await dbGetShopItems();

    const enrichedItems = items.map(item => {
      const isOwned = ownedItemIds.has(item.id);
      let isEquipped = false;
      if (item.category === 'THEME' && character.active_theme === item.id) {
        isEquipped = true;
      } else if (item.category === 'TITLE' && character.active_title === item.name) {
        isEquipped = true;
      }

      return {
        ...item,
        owned: isOwned,
        equipped: isEquipped,
        canAfford: character.gold >= item.cost
      };
    });

    return res.json({
      items: enrichedItems,
      goldBalance: character.gold,
      activeTheme: character.active_theme,
      activeTitle: character.active_title
    });
  } catch (error) {
    console.error('[Get Shop Items Error]', error);
    return res.status(500).json({ error: 'Failed to retrieve shop items.' });
  }
});

// POST /api/shop/purchase - Secure transaction to purchase a virtual item
shopRouter.post('/purchase', async (req, res) => {
  try {
    const { itemId } = req.body;
    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required.' });
    }

    const item = await dbGetShopItemById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found in catalog.' });
    }

    // Check if already owned
    const userInventory = await dbGetUserInventory(req.user.id);
    const alreadyOwned = userInventory.some(i => i.item_id === itemId);
    if (alreadyOwned) {
      return res.status(400).json({ error: 'You already possess this legendary treasure!' });
    }

    // Check gold balance
    const character = await dbGetCharacterByUserId(req.user.id);
    if (character.gold < item.cost) {
      return res.status(400).json({
        error: `Insufficient gold. Requires ${item.cost} Gold, but you only have ${character.gold} Gold.`
      });
    }

    // Deduct gold
    const remainingGold = character.gold - item.cost;
    await dbUpdateCharacter(req.user.id, { gold: remainingGold });

    // Insert into inventory
    await dbAddInventoryItem(req.user.id, itemId);

    return res.json({
      message: `Successfully acquired ${item.name}!`,
      item,
      remainingGold
    });
  } catch (error) {
    console.error('[Shop Purchase Error]', error);
    return res.status(500).json({ error: 'Failed to complete purchase.' });
  }
});

// POST /api/shop/equip - Equip an owned theme or title
shopRouter.post('/equip', async (req, res) => {
  try {
    const { itemId } = req.body;
    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required.' });
    }

    const item = await dbGetShopItemById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    // Verify ownership (starter items theme-obsidian and title-novice are always accessible)
    if (itemId !== 'theme-obsidian' && itemId !== 'title-novice') {
      const userInventory = await dbGetUserInventory(req.user.id);
      const owned = userInventory.some(i => i.item_id === itemId);
      if (!owned) {
        return res.status(403).json({ error: 'You must purchase this item before equipping it.' });
      }
    }

    if (item.category === 'THEME') {
      await dbUpdateCharacter(req.user.id, { active_theme: item.id });
    } else if (item.category === 'TITLE') {
      await dbUpdateCharacter(req.user.id, { active_title: item.name });
    } else {
      return res.status(400).json({ error: 'Only themes and titles can be equipped.' });
    }

    const updatedCharacter = await dbGetCharacterByUserId(req.user.id);

    return res.json({
      message: `Equipped ${item.name}!`,
      character: updatedCharacter
    });
  } catch (error) {
    console.error('[Shop Equip Error]', error);
    return res.status(500).json({ error: 'Failed to equip item.' });
  }
});
