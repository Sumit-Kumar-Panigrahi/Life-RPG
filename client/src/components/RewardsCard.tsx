import React from 'react';
import { Sparkles, ArrowRight, Gift } from 'lucide-react';
import { sound } from '../utils/sound';

interface RewardsCardProps {
  onOpenShop: () => void;
}

export const RewardsCard: React.FC<RewardsCardProps> = ({ onOpenShop }) => {
  return (
    <div className="glass-panel rewards-card" aria-label="Rewards & Shop Showcase">
      <div className="rewards-card-glow" />

      <div className="rewards-header-row">
        <div className="rewards-icon-box">
          <Gift size={24} className="rewards-icon" />
        </div>
        <div>
          <h3 className="rewards-title">Your Rewards</h3>
          <p className="rewards-subtitle">Unlock powerful items, themes and badges.</p>
        </div>
      </div>

      <div className="rewards-badges-preview">
        <span className="reward-chip"><Sparkles size={12} /> Custom Themes</span>
        <span className="reward-chip"><Sparkles size={12} /> Hero Titles</span>
        <span className="reward-chip"><Sparkles size={12} /> Badges</span>
      </div>

      <button
        type="button"
        className="btn btn-primary rewards-cta-btn"
        onClick={() => {
          sound.playClick();
          onOpenShop();
        }}
      >
        <span>Visit Shop</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
};
