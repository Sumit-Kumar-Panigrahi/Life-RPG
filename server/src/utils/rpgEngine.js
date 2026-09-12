/**
 * Life RPG Progression Engine
 * Authoritative backend calculations for XP, Levels, Attributes, and Streaks.
 */

export const CATEGORY_ATTRIBUTE_MAP = {
  KNOWLEDGE: 'INTELLECT',
  FITNESS: 'STRENGTH',
  MINDFULNESS: 'DISCIPLINE',
  CREATIVITY: 'CREATIVITY',
  SOCIAL: 'CHARISMA',
  VITALITY: 'ENDURANCE'
};

export const DIFFICULTY_REWARDS = {
  TRIVIAL: { xp: 15, gold: 5, attrPoints: 3 },
  EASY: { xp: 30, gold: 10, attrPoints: 6 },
  MEDIUM: { xp: 65, gold: 25, attrPoints: 12 },
  HARD: { xp: 140, gold: 55, attrPoints: 25 },
  EPIC: { xp: 300, gold: 120, attrPoints: 50 }
};

/**
 * Non-linear XP curve: Each subsequent level requires strictly more XP than the previous.
 * Level 1 requires 100 XP to level up to 2.
 * Level 2 requires 303 XP to level up to 3.
 * Level 3 requires 580 XP to level up to 4.
 */
export function getRequiredXpForNextLevel(currentLevel) {
  if (currentLevel < 1) currentLevel = 1;
  return Math.floor(100 * Math.pow(currentLevel, 1.6));
}

/**
 * Calculates updated level and carry-over XP given current stats and XP gain.
 * Handles single or multiple level-ups gracefully.
 */
export function calculateProgression(currentLevel, currentXp, xpGain) {
  let level = currentLevel;
  let xp = currentXp + xpGain;
  let levelsGained = 0;

  while (true) {
    const requiredXp = getRequiredXpForNextLevel(level);
    if (xp >= requiredXp) {
      xp -= requiredXp;
      level += 1;
      levelsGained += 1;
    } else {
      break;
    }
  }

  return {
    newLevel: level,
    newXp: xp,
    levelsGained,
    requiredXpForNextLevel: getRequiredXpForNextLevel(level)
  };
}

/**
 * Computes updated streak based on the current UTC date and previous active date.
 */
export function calculateStreak(lastActiveDateStr, currentStreak, longestStreak) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  if (!lastActiveDateStr) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(1, longestStreak || 0),
      lastActiveDate: today,
      isNewDay: true
    };
  }

  if (lastActiveDateStr === today) {
    return {
      currentStreak: currentStreak || 1,
      longestStreak: Math.max(currentStreak || 1, longestStreak || 0),
      lastActiveDate: today,
      isNewDay: false
    };
  }

  const lastDate = new Date(lastActiveDateStr);
  const currDate = new Date(today);
  const diffTime = currDate.getTime() - lastDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let newCurrentStreak = 1;
  if (diffDays === 1) {
    // Exactly consecutive day
    newCurrentStreak = (currentStreak || 0) + 1;
  } else {
    // Missed 1 or more days -> streak resets to 1
    newCurrentStreak = 1;
  }

  const newLongest = Math.max(newCurrentStreak, longestStreak || 0);

  return {
    currentStreak: newCurrentStreak,
    longestStreak: newLongest,
    lastActiveDate: today,
    isNewDay: true
  };
}
