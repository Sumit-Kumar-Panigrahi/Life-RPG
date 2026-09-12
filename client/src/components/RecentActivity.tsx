import React from 'react';
import {
  CheckCircle2,
  TrendingUp,
  ShoppingBag,
  Flame,
  Award,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Quest } from '../types';

interface RecentActivityProps {
  completedQuests: Quest[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ completedQuests }) => {
  const { character, inventory } = useAuth();

  // Combine completed quests, shop purchases, and streak milestones
  const activities: Array<{
    id: string;
    title: string;
    detail: string;
    time: string;
    icon: React.ElementType;
    color: string;
    badge?: string;
  }> = [];

  // Add recent completed quests
  completedQuests.slice(0, 3).forEach((q, idx) => {
    activities.push({
      id: `quest-${q.id}`,
      title: `Completed: ${q.title}`,
      detail: `+${q.xp_reward} XP • +${q.gold_reward} Gold`,
      time: q.completed_at ? new Date(q.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `${(idx + 1) * 20}m ago`,
      icon: CheckCircle2,
      color: '#10b981',
      badge: 'Quest'
    });
  });

  // Add level up entry if level > 1
  if ((character?.level || 1) >= 2) {
    activities.push({
      id: 'level-up',
      title: `Leveled up to Level ${character?.level || 2}!`,
      detail: '+100 XP Max Potential Unlocked',
      time: 'Earlier today',
      icon: TrendingUp,
      color: 'var(--accent-gold)',
      badge: 'Level Up'
    });
  }

  // Add recent inventory purchase if any
  if (inventory.length > 0) {
    const lastItem = inventory[inventory.length - 1];
    activities.push({
      id: `item-${lastItem.item_id}`,
      title: `Acquired: ${lastItem.name}`,
      detail: `${lastItem.category} unlocked in Armory`,
      time: 'Recently',
      icon: ShoppingBag,
      color: 'var(--accent-xp)',
      badge: 'Shop'
    });
  }

  // Add streak milestone
  if ((character?.current_streak || 0) > 0) {
    activities.push({
      id: 'streak-event',
      title: `Streak Maintained: ${character?.current_streak} Days`,
      detail: 'Daily consistency bonus active',
      time: 'Today',
      icon: Flame,
      color: '#ef4444',
      badge: 'Streak'
    });
  }

  // Fallback defaults if brand new account
  if (activities.length === 0) {
    activities.push(
      {
        id: 'starter-1',
        title: 'Awakened in Life RPG Realm',
        detail: 'Character initialized with 50 Gold starter treasury',
        time: 'Just now',
        icon: Award,
        color: 'var(--accent-gold)',
        badge: 'Realm'
      }
    );
  }

  return (
    <div className="glass-panel activity-card" aria-label="Recent Activity Log">
      <div className="card-header-row">
        <h3 className="section-title">Recent Activity</h3>
        <span className="card-header-sub">
          <Clock size={13} />
          <span>Live Log</span>
        </span>
      </div>

      <div className="activity-list">
        {activities.slice(0, 4).map(act => {
          const Icon = act.icon;
          return (
            <div key={act.id} className="activity-item">
              <div
                className="activity-icon-wrap"
                style={{
                  background: `rgba(255, 255, 255, 0.05)`,
                  color: act.color,
                  border: `1px solid ${act.color}40`
                }}
              >
                <Icon size={16} />
              </div>
              <div className="activity-info">
                <div className="activity-title-row">
                  <span className="activity-title">{act.title}</span>
                  <span className="activity-time">{act.time}</span>
                </div>
                <div className="activity-detail">{act.detail}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
