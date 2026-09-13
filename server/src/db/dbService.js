import { db } from './database.js';
import { isMongoActive } from './mongo.js';
import {
  UserDoc,
  CharacterStatsDoc,
  AttributeDoc,
  QuestDoc,
  ShopItemDoc,
  UserInventoryDoc
} from './models.js';

// ==========================================
// USER DB OPERATORS
// ==========================================
export async function dbFindUserById(id) {
  if (isMongoActive()) {
    return await UserDoc.findById(id).lean();
  }
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

export async function dbFindUserByEmail(email) {
  if (isMongoActive()) {
    return await UserDoc.findOne({ email: email.toLowerCase() }).lean();
  }
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
}

export async function dbFindUserByUsername(username) {
  if (isMongoActive()) {
    return await UserDoc.findOne({ username: username.toLowerCase() }).lean();
  }
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username.toLowerCase());
}

export async function dbFindUserByGoogleId(googleId) {
  if (isMongoActive()) {
    return await UserDoc.findOne({ google_id: googleId }).lean();
  }
  return db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);
}

export async function dbFindUserByResetToken(token) {
  if (isMongoActive()) {
    return await UserDoc.findOne({ reset_token: token }).lean();
  }
  return db.prepare('SELECT * FROM users WHERE reset_token = ?').get(token);
}

export async function dbInitializeUserAccount({ username, email, password_hash, google_id, avatar_url, characterName, avatarClass }) {
  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();
  const heroName = characterName?.trim() || username.trim();
  const heroClass = ['WARRIOR', 'MAGE', 'ROGUE', 'PALADIN'].includes(avatarClass) ? avatarClass : 'WARRIOR';

  if (isMongoActive()) {
    const user = await UserDoc.create({
      username: cleanUsername,
      email: cleanEmail,
      password_hash: password_hash || null,
      google_id: google_id || null,
      avatar_url: avatar_url || null
    });
    const userId = user._id;

    await CharacterStatsDoc.create({
      user_id: userId,
      character_name: heroName,
      avatar_class: heroClass,
      level: 1,
      current_xp: 0,
      gold: 50,
      current_streak: 0,
      longest_streak: 0,
      active_theme: 'theme-obsidian',
      active_title: 'Novice Adventurer'
    });

    const attributes = ['INTELLECT', 'STRENGTH', 'DISCIPLINE', 'CREATIVITY', 'CHARISMA', 'ENDURANCE'];
    for (const attr of attributes) {
      await AttributeDoc.create({ user_id: userId, attribute_name: attr, level: 1, points: 0 });
    }

    await UserInventoryDoc.create({ user_id: userId, item_id: 'theme-obsidian' });
    await UserInventoryDoc.create({ user_id: userId, item_id: 'title-novice' });

    await QuestDoc.create({
      user_id: userId,
      title: 'Awaken Your Inner Hero',
      description: 'Complete your very first real-life task and explore the Life RPG interface.',
      category: 'MINDFULNESS',
      difficulty: 'EASY',
      priority: 'HIGH',
      xp_reward: 30,
      gold_reward: 10,
      attribute_target: 'DISCIPLINE'
    });

    await QuestDoc.create({
      user_id: userId,
      title: 'Code or Study for 30 Minutes',
      description: 'Engage in deep focus work or learn a new technical concept.',
      category: 'KNOWLEDGE',
      difficulty: 'MEDIUM',
      priority: 'HIGH',
      xp_reward: 65,
      gold_reward: 25,
      attribute_target: 'INTELLECT'
    });

    await QuestDoc.create({
      user_id: userId,
      title: 'Hydrate and Exercise',
      description: 'Drink 500ml water and complete 20 pushups or a 15-minute stretch.',
      category: 'FITNESS',
      difficulty: 'EASY',
      priority: 'MEDIUM',
      xp_reward: 30,
      gold_reward: 10,
      attribute_target: 'STRENGTH'
    });

    const userObj = user.toObject();
    userObj.id = user._id.toString();
    return userObj;
  }

  db.exec('BEGIN TRANSACTION;');
  try {
    const insertUser = db.prepare('INSERT INTO users (username, email, password_hash, google_id, avatar_url) VALUES (?, ?, ?, ?, ?)');
    const userResult = insertUser.run(cleanUsername, cleanEmail, password_hash || null, google_id || null, avatar_url || null);
    const userId = Number(userResult.lastInsertRowid);

    db.prepare(`
      INSERT INTO character_stats (user_id, character_name, avatar_class, level, current_xp, gold, current_streak, longest_streak)
      VALUES (?, ?, ?, 1, 0, 50, 0, 0)
    `).run(userId, heroName, heroClass);

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

    return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

export async function dbUpdateUser(id, fields) {
  if (isMongoActive()) {
    return await UserDoc.findByIdAndUpdate(id, fields, { new: true }).lean();
  }
  const keys = Object.keys(fields);
  const assignments = keys.map(k => `${k} = ?`).join(', ');
  const values = Object.values(fields);
  db.prepare(`UPDATE users SET ${assignments} WHERE id = ?`).run(...values, id);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

// ==========================================
// CHARACTER STATS OPERATORS
// ==========================================
export async function dbGetCharacterByUserId(userId) {
  if (isMongoActive()) {
    const char = await CharacterStatsDoc.findOne({ user_id: userId }).lean();
    if (char) char.id = char._id;
    return char;
  }
  return db.prepare('SELECT * FROM character_stats WHERE user_id = ?').get(userId);
}

export async function dbCreateCharacter({ user_id, character_name, avatar_class }) {
  if (isMongoActive()) {
    const char = await CharacterStatsDoc.create({
      user_id,
      character_name,
      avatar_class: avatar_class || 'WARRIOR'
    });
    return char.toObject();
  }
  db.prepare(`
    INSERT INTO character_stats (user_id, character_name, avatar_class)
    VALUES (?, ?, ?)
  `).run(user_id, character_name, avatar_class || 'WARRIOR');

  return db.prepare('SELECT * FROM character_stats WHERE user_id = ?').get(user_id);
}

export async function dbUpdateCharacter(userId, fields) {
  if (isMongoActive()) {
    return await CharacterStatsDoc.findOneAndUpdate({ user_id: userId }, fields, { new: true }).lean();
  }
  const keys = Object.keys(fields);
  const assignments = keys.map(k => `${k} = ?`).join(', ');
  const values = Object.values(fields);
  db.prepare(`UPDATE character_stats SET ${assignments}, updated_at = datetime('now') WHERE user_id = ?`).run(...values, userId);
  return db.prepare('SELECT * FROM character_stats WHERE user_id = ?').get(userId);
}

// ==========================================
// ATTRIBUTE OPERATORS
// ==========================================
export async function dbGetAttributesByUserId(userId) {
  if (isMongoActive()) {
    return await AttributeDoc.find({ user_id: userId }).lean();
  }
  return db.prepare('SELECT attribute_name, level, points FROM attributes WHERE user_id = ?').all(userId);
}

export async function dbUpsertAttribute(userId, attrName, addPoints) {
  if (isMongoActive()) {
    const existing = await AttributeDoc.findOne({ user_id: userId, attribute_name: attrName });
    let newPoints = addPoints;
    let newLevel = 1 + Math.floor(newPoints / 50);

    if (existing) {
      newPoints = existing.points + addPoints;
      newLevel = 1 + Math.floor(newPoints / 50);
      existing.points = newPoints;
      existing.level = newLevel;
      await existing.save();
    } else {
      await AttributeDoc.create({
        user_id: userId,
        attribute_name: attrName,
        points: newPoints,
        level: newLevel
      });
    }
    return { attribute_name: attrName, level: newLevel, points: newPoints };
  }

  const currentAttr = db.prepare('SELECT * FROM attributes WHERE user_id = ? AND attribute_name = ?').get(userId, attrName);
  let newAttrPoints = addPoints;
  let newAttrLevel = 1 + Math.floor(newAttrPoints / 50);

  if (currentAttr) {
    newAttrPoints = currentAttr.points + addPoints;
    newAttrLevel = 1 + Math.floor(newAttrPoints / 50);
    db.prepare('UPDATE attributes SET points = ?, level = ? WHERE id = ?').run(newAttrPoints, newAttrLevel, currentAttr.id);
  } else {
    db.prepare('INSERT INTO attributes (user_id, attribute_name, level, points) VALUES (?, ?, ?, ?)').run(userId, attrName, newAttrLevel, newAttrPoints);
  }

  return { attribute_name: attrName, level: newAttrLevel, points: newAttrPoints };
}

// ==========================================
// QUEST OPERATORS
// ==========================================
export async function dbGetQuests(userId, filters = {}) {
  const { status, category, difficulty, search } = filters;

  if (isMongoActive()) {
    const query = { user_id: userId };
    if (status === 'active') query.is_completed = 0;
    if (status === 'completed') query.is_completed = 1;
    if (category && category !== 'ALL') query.category = category.toUpperCase();
    if (difficulty && difficulty !== 'ALL') query.difficulty = difficulty.toUpperCase();
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }
    const quests = await QuestDoc.find(query).sort({ is_completed: 1, created_at: -1 }).lean();
    return quests.map(q => ({ ...q, id: q._id.toString() }));
  }

  let queryStr = 'SELECT * FROM quests WHERE user_id = ?';
  const params = [userId];

  if (status === 'active') queryStr += ' AND is_completed = 0';
  if (status === 'completed') queryStr += ' AND is_completed = 1';
  if (category && category !== 'ALL') { queryStr += ' AND category = ?'; params.push(category.toUpperCase()); }
  if (difficulty && difficulty !== 'ALL') { queryStr += ' AND difficulty = ?'; params.push(difficulty.toUpperCase()); }
  if (search && search.trim()) {
    queryStr += ' AND (title LIKE ? OR description LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }

  queryStr += ' ORDER BY is_completed ASC, created_at DESC';
  return db.prepare(queryStr).all(...params);
}

export async function dbGetQuestById(id, userId) {
  if (isMongoActive()) {
    const q = await QuestDoc.findOne({ _id: id, user_id: userId }).lean();
    if (q) q.id = q._id.toString();
    return q;
  }
  return db.prepare('SELECT * FROM quests WHERE id = ? AND user_id = ?').get(id, userId);
}

export async function dbCreateQuest(questData) {
  if (isMongoActive()) {
    const newQ = await QuestDoc.create(questData);
    const obj = newQ.toObject();
    obj.id = obj._id.toString();
    return obj;
  }
  const stmt = db.prepare(`
    INSERT INTO quests (user_id, title, description, category, difficulty, priority, due_date, xp_reward, gold_reward, attribute_target)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    questData.user_id,
    questData.title,
    questData.description,
    questData.category,
    questData.difficulty,
    questData.priority,
    questData.due_date,
    questData.xp_reward,
    questData.gold_reward,
    questData.attribute_target
  );
  return db.prepare('SELECT * FROM quests WHERE id = ?').get(Number(result.lastInsertRowid));
}

export async function dbUpdateQuest(id, userId, fields) {
  if (isMongoActive()) {
    const updated = await QuestDoc.findOneAndUpdate({ _id: id, user_id: userId }, fields, { new: true }).lean();
    if (updated) updated.id = updated._id.toString();
    return updated;
  }
  const keys = Object.keys(fields);
  const assignments = keys.map(k => `${k} = ?`).join(', ');
  const values = Object.values(fields);
  db.prepare(`UPDATE quests SET ${assignments} WHERE id = ? AND user_id = ?`).run(...values, id, userId);
  return db.prepare('SELECT * FROM quests WHERE id = ?').get(id);
}

export async function dbDeleteQuest(id, userId) {
  if (isMongoActive()) {
    const res = await QuestDoc.deleteOne({ _id: id, user_id: userId });
    return res.deletedCount > 0;
  }
  const existing = db.prepare('SELECT id FROM quests WHERE id = ? AND user_id = ?').get(id, userId);
  if (!existing) return false;
  db.prepare('DELETE FROM quests WHERE id = ? AND user_id = ?').run(id, userId);
  return true;
}

// ==========================================
// SHOP & INVENTORY OPERATORS
// ==========================================
export async function dbGetShopItems() {
  if (isMongoActive()) {
    return await ShopItemDoc.find().sort({ cost: 1 }).lean();
  }
  return db.prepare('SELECT * FROM shop_items ORDER BY cost ASC').all();
}

export async function dbGetShopItemById(itemId) {
  if (isMongoActive()) {
    return await ShopItemDoc.findOne({ id: itemId }).lean();
  }
  return db.prepare('SELECT * FROM shop_items WHERE id = ?').get(itemId);
}

export async function dbGetUserInventory(userId) {
  if (isMongoActive()) {
    const inv = await UserInventoryDoc.find({ user_id: userId }).lean();
    const itemIds = inv.map(i => i.item_id);
    const shopItems = await ShopItemDoc.find({ id: { $in: itemIds } }).lean();
    const shopMap = new Map(shopItems.map(s => [s.id, s]));

    return inv.map(i => {
      const item = shopMap.get(i.item_id) || {};
      return {
        id: i._id.toString(),
        user_id: userId,
        item_id: i.item_id,
        acquired_at: i.acquired_at,
        name: item.name || i.item_id,
        description: item.description || '',
        category: item.category || 'ITEM',
        cost: item.cost || 0,
        icon: item.icon || 'Package'
      };
    });
  }

  return db.prepare(`
    SELECT ui.id, ui.user_id, ui.item_id, ui.acquired_at,
           si.name, si.description, si.category, si.cost, si.icon
    FROM user_inventory ui
    JOIN shop_items si ON ui.item_id = si.id
    WHERE ui.user_id = ?
    ORDER BY ui.acquired_at DESC
  `).all(userId);
}

export async function dbAddInventoryItem(userId, itemId) {
  if (isMongoActive()) {
    return await UserInventoryDoc.create({ user_id: userId, item_id: itemId });
  }
  return db.prepare('INSERT INTO user_inventory (user_id, item_id) VALUES (?, ?)').run(userId, itemId);
}
