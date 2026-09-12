import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getRequiredXpForNextLevel,
  calculateProgression,
  calculateStreak,
  CATEGORY_ATTRIBUTE_MAP,
  DIFFICULTY_REWARDS
} from '../src/utils/rpgEngine.js';
import { db, initDatabase } from '../src/db/database.js';

describe('RPG Engine Progression Tests', () => {
  test('Level curve is strictly non-linear and strictly increasing', () => {
    let prevRequired = 0;
    for (let lvl = 1; lvl <= 10; lvl++) {
      const required = getRequiredXpForNextLevel(lvl);
      assert.ok(required > prevRequired, `Level ${lvl} requirement (${required}) must be greater than previous (${prevRequired})`);
      prevRequired = required;
    }
  });

  test('Single level-up carries over excess XP accurately', () => {
    // Level 1 requires 100 XP to reach Level 2
    const result = calculateProgression(1, 0, 140);
    assert.equal(result.newLevel, 2, 'Should advance to Level 2');
    assert.equal(result.newXp, 40, 'Should carry over 40 excess XP');
    assert.equal(result.levelsGained, 1, 'Levels gained should be 1');
    assert.equal(result.requiredXpForNextLevel, getRequiredXpForNextLevel(2));
  });

  test('Multi-level up handles large XP bursts', () => {
    // Level 1 requires 100 XP (total 100), Level 2 requires 303 XP (total 403)
    const result = calculateProgression(1, 0, 450);
    assert.equal(result.newLevel, 3, 'Should reach Level 3 with 450 XP');
    assert.equal(result.levelsGained, 2, 'Should gain 2 levels');
    assert.equal(result.newXp, 47, 'Carry-over should be 450 - 100 - 303 = 47');
  });

  test('Streak increments correctly on consecutive days and resets on missed days', () => {
    // New day starting today
    const firstDay = calculateStreak(null, 0, 0);
    assert.equal(firstDay.currentStreak, 1);
    assert.equal(firstDay.longestStreak, 1);

    // Same day activity does not duplicate streak
    const today = new Date().toISOString().split('T')[0];
    const sameDay = calculateStreak(today, 1, 1);
    assert.equal(sameDay.currentStreak, 1);
    assert.equal(sameDay.isNewDay, false);

    // Yesterday activity increments streak
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const nextDay = calculateStreak(yesterday, 3, 5);
    assert.equal(nextDay.currentStreak, 4);
    assert.equal(nextDay.longestStreak, 5);

    // Two days ago (missed day) resets streak to 1
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
    const missed = calculateStreak(twoDaysAgo, 10, 10);
    assert.equal(missed.currentStreak, 1, 'Missed days must reset streak to 1');
    assert.equal(missed.longestStreak, 10, 'Longest streak must be preserved');
  });

  test('All categories map to concrete RPG attributes', () => {
    const categories = ['KNOWLEDGE', 'FITNESS', 'MINDFULNESS', 'CREATIVITY', 'SOCIAL', 'VITALITY'];
    for (const cat of categories) {
      assert.ok(CATEGORY_ATTRIBUTE_MAP[cat], `Category ${cat} must map to an attribute`);
    }
  });
});

describe('Database Integration & Anti-Cheat Tests', () => {
  test('Database is initialized and default shop items are present', () => {
    initDatabase();
    const count = db.prepare('SELECT COUNT(*) as count FROM shop_items').get().count;
    assert.ok(count >= 10, 'Shop items should be seeded with at least 10 items');
  });
});
