import React, { useState, useEffect } from 'react';
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
  Trophy,
  Edit3,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { sound } from '../utils/sound';

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
  const { character, attributes, inventory, updateCharacterState, setTheme } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [characterName, setCharacterName] = useState('');
  const [avatarClass, setAvatarClass] = useState('WARRIOR');
  const [activeTitle, setActiveTitle] = useState('Novice Adventurer');
  const [activeTheme, setActiveTheme] = useState('theme-obsidian');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (character && isOpen) {
      setCharacterName(character.character_name);
      setAvatarClass(character.avatar_class || 'WARRIOR');
      setActiveTitle(character.active_title || 'Novice Adventurer');
      setActiveTheme(character.active_theme || 'theme-obsidian');
      setIsEditing(false);
      setError(null);
      setSuccess(null);
    }
  }, [character, isOpen]);

  if (!isOpen || !character) return null;

  // Owned titles list
  const ownedTitles = inventory.filter(i => i.category === 'TITLE').map(i => i.name);
  if (!ownedTitles.includes('Novice Adventurer')) {
    ownedTitles.unshift('Novice Adventurer');
  }

  // Owned themes list
  const ownedThemes = inventory.filter(i => i.category === 'THEME');
  if (!ownedThemes.some(t => t.item_id === 'theme-obsidian')) {
    ownedThemes.unshift({
      item_id: 'theme-obsidian',
      name: 'Obsidian Forge',
      description: 'Default dark knight obsidian armor aesthetic',
      category: 'THEME',
      icon: 'Palette',
      acquired_at: new Date().toISOString()
    });
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!characterName.trim()) {
      setError('Character name cannot be empty.');
      return;
    }

    setError(null);
    setSuccess(null);
    setSubmitting(true);
    sound.playEquip();

    try {
      const res = await api.character.updateCharacter({
        characterName: characterName.trim(),
        avatarClass,
        activeTitle,
        activeTheme
      });

      setTheme(activeTheme);
      updateCharacterState(res.character, res.attributes);
      setSuccess('Hero dossier updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update hero dossier.');
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="modal-card" style={{ maxWidth: '640px', maxHeight: '88vh', overflowY: 'auto' }}>
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

        {/* Feedback alerts */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 'var(--radius-sm)', color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: 'var(--radius-sm)', color: '#10b981', fontSize: '0.85rem', marginBottom: '1rem' }}>
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Hero Card Overview */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.25rem',
            padding: '1.25rem',
            background: 'var(--bg-base)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '1.25rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                boxShadow: '0 0 20px var(--accent-gold-glow)'
              }}
            >
              <Swords size={32} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{character.character_name}</h3>
                <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent-xp)' }}>
                  {character.avatar_class}
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', marginTop: '0.2rem', fontWeight: 600 }}>
                Title: {character.active_title}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>Level: <strong>{character.level}</strong></span>
                <span>Total XP: <strong>{character.current_xp}</strong></span>
                <span>Gold: <strong>{character.gold}</strong></span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => {
              sound.playClick();
              setIsEditing(prev => !prev);
              setError(null);
            }}
          >
            <Edit3 size={14} />
            <span>{isEditing ? 'Cancel Edit' : 'Customize Hero'}</span>
          </button>
        </div>

        {/* Customization Form */}
        {isEditing && (
          <form
            onSubmit={handleSave}
            style={{
              padding: '1.25rem',
              background: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem'
            }}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '0.85rem' }}>
              CUSTOMIZE HERO PERSONA
            </h4>

            <div className="form-group">
              <label className="form-label" htmlFor="char-name-input">Hero Name</label>
              <input
                id="char-name-input"
                type="text"
                className="form-input"
                value={characterName}
                onChange={e => setCharacterName(e.target.value)}
                required
                minLength={2}
                maxLength={32}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="char-class-select">RPG Class</label>
                <select
                  id="char-class-select"
                  className="form-select"
                  value={avatarClass}
                  onChange={e => setAvatarClass(e.target.value)}
                >
                  <option value="WARRIOR">Warrior (STR)</option>
                  <option value="MAGE">Mage (INT)</option>
                  <option value="ROGUE">Rogue (DIS)</option>
                  <option value="PALADIN">Paladin (CHA)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="char-title-select">Active Hero Title</label>
                <select
                  id="char-title-select"
                  className="form-select"
                  value={activeTitle}
                  onChange={e => setActiveTitle(e.target.value)}
                >
                  {ownedTitles.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="char-theme-select">Visual Armor Theme</label>
                <select
                  id="char-theme-select"
                  className="form-select"
                  value={activeTheme}
                  onChange={e => setActiveTheme(e.target.value)}
                >
                  {ownedThemes.map(t => (
                    <option key={t.item_id} value={t.item_id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Save size={15} />
                <span>{submitting ? 'Saving...' : 'Save Hero'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Streaks & Vigor Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
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
                Longest Record
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
