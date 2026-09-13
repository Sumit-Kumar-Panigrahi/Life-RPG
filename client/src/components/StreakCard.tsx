import React from 'react';
import { Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function getActiveStreakInfo(lastActiveDateStr?: string | null, rawStreak: number = 0) {
  if (!lastActiveDateStr || rawStreak <= 0) {
    return { activeStreak: 0, activeDays: new Set<number>() };
  }

  const dateOnly = lastActiveDateStr.split('T')[0];
  const [y, m, d] = dateOnly.split('-').map(Number);
  if (!y || !m || !d) {
    return { activeStreak: 0, activeDays: new Set<number>() };
  }

  const lastActive = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - lastActive.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // If last active was today (0) or yesterday (1), streak is intact
  if (diffDays > 1) {
    return { activeStreak: 0, activeDays: new Set<number>() };
  }

  const activeDays = new Set<number>();
  const countToHighlight = Math.min(rawStreak, 7);

  for (let i = 0; i < countToHighlight; i++) {
    const checkDate = new Date(lastActive);
    checkDate.setDate(checkDate.getDate() - i);
    activeDays.add(checkDate.getDay());
  }

  return { activeStreak: rawStreak, activeDays };
}

export const StreakCard: React.FC = () => {
  const { character } = useAuth();
  const rawStreak = character?.current_streak || 0;
  const longestStreak = character?.longest_streak || 0;

  const { activeStreak, activeDays } = getActiveStreakInfo(character?.last_active_date, rawStreak);

  // Days of week (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const days = [
    { label: 'Mon', dayIndex: 1 },
    { label: 'Tue', dayIndex: 2 },
    { label: 'Wed', dayIndex: 3 },
    { label: 'Thu', dayIndex: 4 },
    { label: 'Fri', dayIndex: 5 },
    { label: 'Sat', dayIndex: 6 },
    { label: 'Sun', dayIndex: 0 }
  ];

  // Current day of week (0 = Sun, 1 = Mon, etc.)
  const todayIndex = new Date().getDay();

  return (
    <div className="glass-panel streak-card" aria-label="Daily Streak Tracking">
      <div className="streak-header">
        <div className="streak-icon-wrap">
          <Flame size={28} className="flame-glow" />
        </div>
        <div>
          <div className="streak-count-row">
            <span className="streak-number">{activeStreak}</span>
            <span className="streak-text">Day Streak</span>
          </div>
          <span className="streak-sub">Record: {longestStreak} days</span>
        </div>
      </div>

      {/* Weekday Circular Indicators */}
      <div className="streak-days-row">
        {days.map((d) => {
          const isToday = d.dayIndex === todayIndex;
          const isCompleted = activeDays.has(d.dayIndex);

          return (
            <div key={d.label} className="streak-day-item">
              <div
                className={`streak-dot ${isCompleted ? 'active' : ''} ${isToday ? 'today' : ''}`}
                title={`${d.label} - ${isCompleted ? 'Conquered' : isToday ? 'Today' : 'Pending'}`}
              >
                {isCompleted ? (
                  <Flame size={12} className="dot-flame" />
                ) : (
                  <span className="dot-inner" />
                )}
              </div>
              <span className={`streak-day-label ${isToday ? 'today-label' : ''}`}>
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

