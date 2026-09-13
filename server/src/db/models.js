import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String },
  google_id: { type: String, sparse: true, unique: true },
  avatar_url: { type: String },
  reset_token: { type: String },
  reset_token_expires: { type: Date },
  created_at: { type: Date, default: Date.now }
});

const CharacterStatsSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  character_name: { type: String, required: true },
  avatar_class: { type: String, default: 'WARRIOR' },
  level: { type: Number, default: 1 },
  current_xp: { type: Number, default: 0 },
  gold: { type: Number, default: 50 },
  current_streak: { type: Number, default: 0 },
  longest_streak: { type: Number, default: 0 },
  last_active_date: { type: String },
  active_theme: { type: String, default: 'theme-obsidian' },
  active_title: { type: String, default: 'Novice Adventurer' },
  updated_at: { type: Date, default: Date.now }
});

const AttributeSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attribute_name: { type: String, required: true },
  level: { type: Number, default: 1 },
  points: { type: Number, default: 0 }
});
AttributeSchema.index({ user_id: 1, attribute_name: 1 }, { unique: true });

const QuestSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, required: true },
  difficulty: { type: String, required: true },
  priority: { type: String, default: 'MEDIUM' },
  due_date: { type: String, default: null },
  is_completed: { type: Number, default: 0 }, // 0 or 1 for contract consistency
  completed_at: { type: String, default: null },
  xp_reward: { type: Number, required: true },
  gold_reward: { type: Number, required: true },
  attribute_target: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

const ShopItemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Slug ID e.g. theme-obsidian
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  cost: { type: Number, required: true },
  icon: { type: String, required: true }
});

const UserInventorySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  item_id: { type: String, required: true },
  acquired_at: { type: Date, default: Date.now }
});
UserInventorySchema.index({ user_id: 1, item_id: 1 }, { unique: true });

export const UserDoc = mongoose.models.User || mongoose.model('User', UserSchema);
export const CharacterStatsDoc = mongoose.models.CharacterStats || mongoose.model('CharacterStats', CharacterStatsSchema);
export const AttributeDoc = mongoose.models.Attribute || mongoose.model('Attribute', AttributeSchema);
export const QuestDoc = mongoose.models.Quest || mongoose.model('Quest', QuestSchema);
export const ShopItemDoc = mongoose.models.ShopItem || mongoose.model('ShopItem', ShopItemSchema);
export const UserInventoryDoc = mongoose.models.UserInventory || mongoose.model('UserInventory', UserInventorySchema);

export async function seedMongoShopCatalog() {
  const count = await ShopItemDoc.countDocuments();
  if (count === 0) {
    const defaultItems = [
      { id: 'theme-obsidian', name: 'Obsidian Forge', description: 'Dark, sleek, obsidian armor styling for focused discipline', category: 'THEME', cost: 0, icon: 'Palette' },
      { id: 'theme-cyberpunk', name: 'Cyberpunk Neon', description: 'Electric cyan and violet HUD aesthetics for cyber operatives', category: 'THEME', cost: 100, icon: 'Zap' },
      { id: 'theme-solarized', name: 'Solarized Guild', description: 'Warm amber and gold parchment theme of royal knights', category: 'THEME', cost: 180, icon: 'Sun' },
      { id: 'theme-emerald', name: 'Emerald Glade', description: 'Lush woodland fantasy theme radiating vitality and renewal', category: 'THEME', cost: 150, icon: 'Trees' },
      { id: 'theme-vaporwave', name: 'Vaporwave Synth', description: 'Retro aesthetic synthwave gradient inspired by late 80s arcade glory', category: 'THEME', cost: 250, icon: 'Sparkles' },

      { id: 'title-novice', name: 'Novice Adventurer', description: 'Every legend starts from humble beginnings', category: 'TITLE', cost: 0, icon: 'Shield' },
      { id: 'title-code-wizard', name: 'Code Wizard', description: 'Conjurer of resilient algorithms and bug-free codebases', category: 'TITLE', cost: 75, icon: 'Wand2' },
      { id: 'title-iron-will', name: 'Iron Will', description: 'Forged through relentless consistency and grit', category: 'TITLE', cost: 120, icon: 'Flame' },
      { id: 'title-mind-monk', name: 'Mindful Monk', description: 'Master of inner tranquility and unshakeable discipline', category: 'TITLE', cost: 160, icon: 'Brain' },
      { id: 'title-grandmaster', name: 'Mythic Grandmaster', description: 'A paragon who conquered life quests across all realms', category: 'TITLE', cost: 400, icon: 'Crown' },

      { id: 'badge-genesis', name: 'Genesis Hero', description: 'Awarded to early pioneers of the Life RPG realm', category: 'BADGE', cost: 25, icon: 'Award' },
      { id: 'badge-dragon', name: 'Dragon Slayer', description: 'Proof of slaying monumental obstacles and deadlines', category: 'BADGE', cost: 150, icon: 'Swords' },
      { id: 'badge-marathoner', name: 'Streak Sentinel', description: 'Guardian of relentless daily habits and rituals', category: 'BADGE', cost: 220, icon: 'TrendingUp' },
      { id: 'badge-alchemist', name: 'Grand Alchemist', description: 'Transforms chaotic chores into crystalline productivity', category: 'BADGE', cost: 300, icon: 'FlaskConical' }
    ];

    await ShopItemDoc.insertMany(defaultItems);
    console.log('[MongoDB Atlas] Shop catalog seeded successfully.');
  }
}
