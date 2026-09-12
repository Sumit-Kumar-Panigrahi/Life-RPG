import React, { useState } from 'react';
import {
  Shield,
  Coins,
  Flame,
  ShoppingBag,
  User,
  Volume2,
  VolumeX,
  LogOut,
  Sparkles,
  Swords
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/sound';

interface HeaderProps {
  onOpenProfile: () => void;
  onOpenShop: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenProfile, onOpenShop }) => {
  const { user, character, logout } = useAuth();
  const [isMuted, setIsMuted] = useState(sound.isMuted());

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      sound.playClick();
    }
  };

  const currentXp = character?.current_xp || 0;
  const requiredXp = character?.requiredXp || 100;
  const xpPercent = Math.min(100, Math.round((currentXp / requiredXp) * 100));

  return (
    <header className="hud-header">
      <div className="hud-content">
        {/* Brand & Character Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="hud-brand">
            <Swords style={{ color: 'var(--accent-gold)' }} size={24} />
            <span>LIFE RPG</span>
            <span className="brand-badge">TZPSv2</span>
          </div>

          {character?.active_title && (
            <div
              className="stat-chip"
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                borderStyle: 'dashed'
              }}
              title="Equipped Title"
            >
              <Sparkles size={13} style={{ color: 'var(--accent-gold)' }} />
              <span>{character.active_title}</span>
            </div>
          )}
        </div>

        {/* Character HUD Stats */}
        {character && (
          <div className="hud-stats">
            {/* Level Chip */}
            <div className="stat-chip level-chip" title="Character Level">
              <Shield size={16} />
              <span>LVL {character.level}</span>
            </div>

            {/* XP Bar */}
            <div className="xp-container" title={`${currentXp} / ${requiredXp} XP (${xpPercent}%)`}>
              <div className="xp-label-row">
                <span>XP</span>
                <span>
                  {currentXp}/{requiredXp} ({xpPercent}%)
                </span>
              </div>
              <div className="xp-bar-track">
                <div
                  className="xp-bar-fill"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>

            {/* Gold Balance */}
            <div
              className="stat-chip gold-chip"
              style={{ cursor: 'pointer' }}
              onClick={onOpenShop}
              title="Gold Balance - Click to visit Reward Emporium"
            >
              <Coins size={16} />
              <span>{character.gold} G</span>
            </div>

            {/* Streak Counter */}
            <div
              className="stat-chip streak-chip"
              title={`Current Streak: ${character.current_streak} days (Record: ${character.longest_streak} days)`}
            >
              <Flame size={16} className="flame-icon" />
              <span>{character.current_streak}d</span>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              sound.playClick();
              onOpenShop();
            }}
            aria-label="Open Reward Emporium"
            title="Reward Emporium (Shop)"
            style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem' }}
          >
            <ShoppingBag size={16} style={{ color: 'var(--accent-gold)' }} />
            <span className="hide-mobile">Shop</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              sound.playClick();
              onOpenProfile();
            }}
            aria-label="View Hero Attributes"
            title="Hero Attributes & Stats"
            style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem' }}
          >
            <User size={16} style={{ color: 'var(--accent-xp)' }} />
            <span className="hide-mobile">{character?.character_name || 'Hero'}</span>
          </button>

          <button
            type="button"
            className="btn btn-icon"
            onClick={handleToggleMute}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            title={isMuted ? 'Unmute 8-Bit Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          {user && (
            <button
              type="button"
              className="btn btn-icon"
              onClick={() => {
                sound.playClick();
                logout();
              }}
              aria-label="Sign Out"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
