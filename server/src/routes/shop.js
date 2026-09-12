import express from 'express';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

export const shopRouter = express.Router();

shopRouter.use(requireAuth);

// GET /api/shop/items - List all catalog items with user's ownership and equipped status
shopRouter.get('/items', (req, res) => {
  try {
    const character = db.prepare('SELECT active_theme, active_title, gold FROM character_stats WHERE user_id = ?').get(req.user.id);
    const userInventory = db.prepare('SELECT item_id FROM user_inventory WHERE user_id = ?').all(req.user.id);
    const ownedItemIds = new Set(userInventory.map(i => i.item_id));

    const items = db.prepare('SELECT * FROM shop_items ORDER BY cost ASC').all();

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
shopRouter.post('/purchase', (req, res) => {
  try {
    const { itemId } = req.body;
    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required.' });
    }

    db.exec('BEGIN TRANSACTION;');
    try {
      const item = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(itemId);
      if (!item) {
        db.exec('ROLLBACK;');
        return res.status(404).json({ error: 'Item not found in catalog.' });
      }

      // Check if already owned
      const alreadyOwned = db.prepare('SELECT id FROM user_inventory WHERE user_id = ? AND item_id = ?').get(req.user.id, itemId);
      if (alreadyOwned) {
        db.exec('ROLLBACK;');
        return res.status(400).json({ error: 'You already possess this legendary treasure!' });
      }

      // Check gold balance
      const character = db.prepare('SELECT gold FROM character_stats WHERE user_id = ?').get(req.user.id);
      if (character.gold < item.cost) {
        db.exec('ROLLBACK;');
        return res.status(400).json({
          error: `Insufficient gold. Requires ${item.cost} Gold, but you only have ${character.gold} Gold.`
        });
      }

      // Deduct gold
      const remainingGold = character.gold - item.cost;
      db.prepare("UPDATE character_stats SET gold = ?, updated_at = datetime('now') WHERE user_id = ?").run(remainingGold, req.user.id);

      // Insert into inventory
      db.prepare('INSERT INTO user_inventory (user_id, item_id) VALUES (?, ?)').run(req.user.id, itemId);

      db.exec('COMMIT;');

      return res.json({
        message: `Successfully acquired ${item.name}!`,
        item,
        remainingGold
      });
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  } catch (error) {
    console.error('[Shop Purchase Error]', error);
    return res.status(500).json({ error: 'Failed to complete purchase.' });
  }
});

// POST /api/shop/equip - Equip an owned theme or title
shopRouter.post('/equip', (req, res) => {
  try {
    const { itemId } = req.body;
    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required.' });
    }

    const item = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    // Verify ownership
    const owned = db.prepare('SELECT id FROM user_inventory WHERE user_id = ? AND item_id = ?').get(req.user.id, itemId);
    if (!owned) {
      return res.status(403).json({ error: 'You must purchase this item before equipping it.' });
    }

    if (item.category === 'THEME') {
      db.prepare("UPDATE character_stats SET active_theme = ?, updated_at = datetime('now') WHERE user_id = ?").run(item.id, req.user.id);
    } else if (item.category === 'TITLE') {
      db.prepare("UPDATE character_stats SET active_title = ?, updated_at = datetime('now') WHERE user_id = ?").run(item.name, req.user.id);
    } else {
      return res.status(400).json({ error: 'Only themes and titles can be equipped.' });
    }

    const updatedCharacter = db.prepare('SELECT * FROM character_stats WHERE user_id = ?').get(req.user.id);

    return res.json({
      message: `Equipped ${item.name}!`,
      character: updatedCharacter
    });
  } catch (error) {
    console.error('[Shop Equip Error]', error);
    return res.status(500).json({ error: 'Failed to equip item.' });
  }
});
