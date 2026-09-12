import React from 'react';
import { Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const StreakCard: React.FC = () => {
  const { character } = useAuth();
  const currentStreak = character?.current_streak || 0;
  const longestStreak = character?.longest_streak || 0;

  // Days of week
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
            <span className="streak-number">{currentStreak}</span>
            <span className="streak-text">Day Streak</span>
          </div>
          <span className="streak-sub">Record: {longestStreak} days</span>
        </div>
      </div>

      {/* Weekday Circular Indicators */}
      <div className="streak-days-row">
        {days.map((d, index) => {
          // If streak > 0, highlight active days based on recent completion
          const isToday = d.dayIndex === todayIndex;
          const isCompleted = currentStreak > 0 && index < (currentStreak % 7 === 0 ? 7 : currentStreak % 7);

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
