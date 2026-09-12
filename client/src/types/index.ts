export type AvatarClass = 'WARRIOR' | 'MAGE' | 'ROGUE' | 'PALADIN';

export type QuestCategory = 'KNOWLEDGE' | 'FITNESS' | 'MINDFULNESS' | 'CREATIVITY' | 'SOCIAL' | 'VITALITY';

export type QuestDifficulty = 'TRIVIAL' | 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';

export type QuestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface Character {
  user_id: number;
  character_name: string;
  avatar_class: AvatarClass;
  level: number;
  current_xp: number;
  requiredXp: number;
  gold: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  active_theme: string;
  active_title: string;
  updated_at: string;
}

export interface Attribute {
  attribute_name: 'INTELLECT' | 'STRENGTH' | 'DISCIPLINE' | 'CREATIVITY' | 'CHARISMA' | 'ENDURANCE';
  level: number;
  points: number;
}

export interface Quest {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  priority: QuestPriority;
  due_date: string | null;
  is_completed: number; // 0 or 1
  completed_at: string | null;
  xp_reward: number;
  gold_reward: number;
  attribute_target: string;
  created_at: string;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: 'THEME' | 'TITLE' | 'BADGE' | 'CONSUMABLE';
  cost: number;
  icon: string;
  owned?: boolean;
  equipped?: boolean;
  canAfford?: boolean;
}

export interface InventoryItem {
  item_id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  acquired_at: string;
}

export interface CompletionRewards {
  xpGained: number;
  goldGained: number;
  attribute: string;
  attributePointsGained: number;
  levelsGained: number;
  isLevelUp: boolean;
  newLevel: number;
  streak: number;
}
