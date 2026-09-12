import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Crown, Sparkles, Swords, Zap } from 'lucide-react';
import { sound } from '../utils/sound';

interface LevelUpModalProps {
  isOpen: boolean;
  newLevel: number;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ isOpen, newLevel, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      sound.playLevelUp();

      // Launch multi-burst celebratory confetti
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 10000
      };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      };

      fire(0.25, {
        spread: 26,
        startVelocity: 55
      });
      fire(0.2, {
        spread: 60
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="levelup-title"
      style={{ zIndex: 999 }}
    >
      <div
        className="modal-card"
        style={{
          maxWidth: '460px',
          textAlign: 'center',
          padding: '2.5rem 1.5rem',
          border: '2px solid var(--accent-gold)',
          boxShadow: '0 0 50px var(--accent-gold-glow)'
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            padding: '1.25rem',
            background: 'linear-gradient(135deg, var(--accent-gold), #b45309)',
            borderRadius: '50%',
            color: '#000',
            marginBottom: '1rem',
            boxShadow: '0 0 30px var(--accent-gold-glow)'
          }}
        >
          <Crown size={48} />
        </div>

        <h2
          id="levelup-title"
          style={{
            fontSize: '2rem',
            fontWeight: 900,
            letterSpacing: '0.1em',
            color: 'var(--accent-gold)',
            textShadow: '0 0 20px var(--accent-gold-glow)'
          }}
        >
          LEVEL UP!
        </h2>

        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            margin: '0.5rem 0 1rem',
            fontFamily: 'var(--font-stats)'
          }}
        >
          YOU HAVE ATTAINED <span style={{ color: 'var(--accent-xp)' }}>LEVEL {newLevel}</span>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Your discipline in real-world endeavors resonates throughout the realm. Your maximum potential expands, and new legendary opportunities unlock!
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '1.75rem',
            fontSize: '0.85rem',
            color: 'var(--accent-gold)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Zap size={16} /> Max XP Boosted
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Swords size={16} /> Power Multiplied
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Sparkles size={16} /> Renown Raised
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.8rem', fontSize: '1rem' }}
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          autoFocus
        >
          Continue Conquering Quests
        </button>
      </div>
    </div>
  );
};
