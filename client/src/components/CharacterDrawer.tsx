import React from 'react';
import {
  X,
  Shield,
  Brain,
  Dumbbell,
  Sparkles,
  Palette,
  Users,
  Heart,
  Flame,
  Swords,
  Trophy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CharacterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ATTRIBUTE_METADATA: Record<string, { label: string; icon: React.ElementType; color: string; desc: string }> = {
  INTELLECT: { label: 'Intellect', icon: Brain, color: 'var(--attr-intellect)', desc: 'Cultivated through coding, study, and deep learning' },
  STRENGTH: { label: 'Strength', icon: Dumbbell, color: 'var(--attr-strength)', desc: 'Forged via fitness, workouts, and physical vitality' },
  DISCIPLINE: { label: 'Discipline', icon: Sparkles, color: 'var(--attr-discipline)', desc: 'Honed through meditation, focus, and good habits' },
  CREATIVITY: { label: 'Creativity', icon: Palette, color: 'var(--attr-creativity)', desc: 'Sparked by writing, music, and inventive design' },
  CHARISMA: { label: 'Charisma', icon: Users, color: 'var(--attr-charisma)', desc: 'Enhanced by community, networking, and social bonds' },
  ENDURANCE: { label: 'Endurance', icon: Heart, color: 'var(--attr-endurance)', desc: 'Built by completing chores, stamina, and administrative grit' }
};

export const CharacterDrawer: React.FC<CharacterDrawerProps> = ({ isOpen, onClose }) => {
  const { character, attributes } = useAuth();

  if (!isOpen || !character) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hero-profile-title"
      onKeyDown={e => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: '620px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Shield size={24} style={{ color: 'var(--accent-gold)' }} />
            <h2 id="hero-profile-title" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
              HERO DOSSIER
            </h2>
          </div>
          <button type="button" className="btn btn-icon" onClick={onClose} aria-label="Close Dossier">
            <X size={18} />
          </button>
        </div>

        {/* Hero Card Overview */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            padding: '1.25rem',
            background: 'var(--bg-base)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '1.5rem'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-xp))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              fontWeight: 900,
              fontSize: '1.5rem',
              boxShadow: '0 0 20px var(--accent-gold-glow)'
            }}
          >
            <Swords size={32} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{character.character_name}</h3>
              <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent-xp)' }}>
                {character.avatar_class}
              </span>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', marginTop: '0.2rem', fontWeight: 600 }}>
              Title: {character.active_title}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>Level: <strong>{character.level}</strong></span>
              <span>Total XP: <strong>{character.current_xp}</strong></span>
              <span>Gold: <strong>{character.gold}</strong></span>
            </div>
          </div>
        </div>

        {/* Streaks & Vigor Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              padding: '0.9rem',
              background: 'var(--bg-base)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <Flame size={28} style={{ color: '#ef4444' }} className="flame-icon" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Current Streak
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-stats)' }}>
                {character.current_streak} {character.current_streak === 1 ? 'Day' : 'Days'}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '0.9rem',
              background: 'var(--bg-base)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <Trophy size={28} style={{ color: 'var(--accent-gold)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Longest Streak Record
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-stats)' }}>
                {character.longest_streak} {character.longest_streak === 1 ? 'Day' : 'Days'}
              </div>
            </div>
          </div>
        </div>

        {/* 6 Core RPG Attributes */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '0.05em' }}>
              CHARACTER ATTRIBUTES (6 PILLARS)
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Each 50 Pts = +1 Attribute Level
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
            {attributes.map(attr => {
              const meta = ATTRIBUTE_METADATA[attr.attribute_name] || {
                label: attr.attribute_name,
                icon: Shield,
                color: 'var(--accent-gold)',
                desc: ''
              };
              const Icon = meta.icon;
              const pointsInCurrentLevel = attr.points % 50;
              const percent = Math.min(100, Math.round((pointsInCurrentLevel / 50) * 100));

              return (
                <div
                  key={attr.attribute_name}
                  style={{
                    padding: '0.85rem',
                    background: 'var(--bg-base)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    borderLeft: `3px solid ${meta.color}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Icon size={16} style={{ color: meta.color }} />
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{meta.label}</span>
                    </div>
                    <span
                      className="badge"
                      style={{
                        background: `rgba(255, 255, 255, 0.08)`,
                        color: meta.color,
                        fontFamily: 'var(--font-stats)'
                      }}
                    >
                      LVL {attr.level}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                    {meta.desc}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontFamily: 'var(--font-stats)', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                    <span>Progress to next LVL</span>
                    <span>{pointsInCurrentLevel} / 50 pts ({percent}%)</span>
                  </div>

                  <div className="xp-bar-track" style={{ height: '6px' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${percent}%`,
                        background: meta.color,
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
