import React from 'react';
import { ArrowRight, Trophy, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/sound';

interface PromoBannerProps {
  onScrollToQuests: () => void;
  onOpenProfile: () => void;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({ onScrollToQuests, onOpenProfile }) => {
  const { character } = useAuth();
  const currentXp = character?.current_xp || 0;
  const requiredXp = character?.requiredXp || 100;
  const xpRemaining = Math.max(0, requiredXp - currentXp);
  const level = character?.level || 1;

  return (
    <section className="lower-dashboard-row" aria-label="Exploration & Progress Highlights">
      {/* Promotional Banner */}
      <div className="glass-panel promo-banner">
        <div className="promo-content">
          <span className="promo-tag">
            <Sparkles size={13} />
            <span>DAILY QUEST MOTIVATION</span>
          </span>
          <h3 className="promo-headline">
            Complete quests. Level up. Unlock rewards.
          </h3>
          <p className="promo-body">
            Build the best version of yourself, one day and one habit at a time.
          </p>
          <button
            type="button"
            className="btn btn-primary promo-btn"
            onClick={() => {
              sound.playClick();
              onScrollToQuests();
            }}
          >
            <span>Explore Quest Board</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Level Progress Card with Emblem */}
      <div className="glass-panel level-card-highlight" onClick={onOpenProfile} role="button" tabIndex={0}>
        <div className="level-card-header">
          <div className="emblem-box">
            <Trophy size={26} className="emblem-trophy" />
          </div>
          <div>
            <div className="level-title-large">Level {level}</div>
            <span className="level-sub-label">{character?.active_title || 'Novice Adventurer'}</span>
          </div>
        </div>

        <div className="level-xp-details">
          <div className="xp-row-text">
            <span>Progress to Lv. {level + 1}</span>
            <span><strong>{currentXp}</strong> / {requiredXp} XP</span>
          </div>

          <div className="level-bar-track">
            <div
              className="level-bar-fill"
              style={{
                width: `${Math.min(100, Math.round((currentXp / requiredXp) * 100))}%`
              }}
            />
          </div>

          <p className="xp-remaining-text">
            <strong>{xpRemaining} XP</strong> remaining until next level promotion
          </p>
        </div>
      </div>
    </section>
  );
};
