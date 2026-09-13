import React, { useState, useEffect } from 'react';
import {
  X,
  Settings as SettingsIcon,
  User,
  Palette,
  Volume2,
  VolumeX,
  Bell,
  LogOut,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
  Radio
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { sound } from '../utils/sound';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, character, inventory, updateCharacterState, updateUserState, logout, setTheme } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'audio' | 'notifications' | 'account'>('profile');

  // Profile Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [avatarClass, setAvatarClass] = useState('WARRIOR');

  // Audio State
  const [isMuted, setIsMuted] = useState(sound.isMuted());
  const [volume, setVolume] = useState(Math.round(sound.getVolume() * 100));

  // Notification Preferences State (Stored in localStorage)
  const [questChimes, setQuestChimes] = useState(() => localStorage.getItem('liferpg_notif_quest_chimes') !== 'false');
  const [streakAlerts, setStreakAlerts] = useState(() => localStorage.getItem('liferpg_notif_streak_alerts') !== 'false');

  // Status & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user && character && isOpen) {
      setUsername(user.username);
      setEmail(user.email);
      setCharacterName(character.character_name);
      setAvatarClass(character.avatar_class || 'WARRIOR');
      setIsMuted(sound.isMuted());
      setVolume(Math.round(sound.getVolume() * 100));
      setError(null);
      setSuccess(null);
    }
  }, [user, character, isOpen]);

  if (!isOpen || !user || !character) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    sound.playClick();

    try {
      // 1. Update Auth Profile (username, email)
      const userRes = await api.auth.updateProfile({
        username: username.trim(),
        email: email.trim()
      });
      updateUserState(userRes.user);

      // 2. Update Character Profile (characterName, avatarClass)
      const charRes = await api.character.updateCharacter({
        characterName: characterName.trim(),
        avatarClass
      });
      updateCharacterState(charRes.character, charRes.attributes);

      setSuccess('Hero codex and account settings saved successfully!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleThemeChange = async (themeId: string) => {
    sound.playClick();
    setTheme(themeId);
    try {
      await api.character.updateCharacter({ activeTheme: themeId });
      setSuccess('Visual armor theme equipped!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to equip theme.');
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    sound.setVolume(newVol / 100);
    if (newVol > 0 && isMuted) {
      sound.setMuted(false);
      setIsMuted(false);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      sound.playClick();
    }
  };

  const handleSavePreferences = () => {
    sound.playClick();
    localStorage.setItem('liferpg_notif_quest_chimes', String(questChimes));
    localStorage.setItem('liferpg_notif_streak_alerts', String(streakAlerts));
    setSuccess('Notification preferences saved.');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Extract owned themes from user inventory
  const ownedThemes = inventory.filter(i => i.category === 'THEME');
  // Always include default Obsidian Forge
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

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onKeyDown={e => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: '640px', padding: '1.75rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <SettingsIcon size={22} style={{ color: 'var(--accent-gold)' }} />
            <h2 id="settings-title" style={{ fontSize: '1.3rem', fontWeight: 800 }}>
              REALM SETTINGS
            </h2>
          </div>
          <button type="button" className="btn btn-icon" onClick={onClose} aria-label="Close Settings">
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div
          style={{
            display: 'flex',
            gap: '0.35rem',
            background: 'var(--bg-base)',
            borderRadius: 'var(--radius-md)',
            padding: '0.25rem',
            overflowX: 'auto',
            marginBottom: '1.25rem'
          }}
        >
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'appearance', label: 'Themes', icon: Palette },
            { id: 'audio', label: 'Audio & SFX', icon: Volume2 },
            { id: 'notifications', label: 'Alerts', icon: Bell },
            { id: 'account', label: 'Account', icon: Shield }
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className="btn"
                style={{
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? 'var(--bg-surface)' : 'transparent',
                  color: isSelected ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  border: isSelected ? '1px solid var(--border-glow)' : 'none',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => {
                  sound.playClick();
                  setActiveTab(tab.id as typeof activeTab);
                  setError(null);
                  setSuccess(null);
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Messages */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 'var(--radius-sm)', color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: 'var(--radius-sm)', color: '#10b981', fontSize: '0.85rem', marginBottom: '1rem' }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {/* Tab 1: Profile */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label className="form-label" htmlFor="settings-username">
                Account Username (Codex ID)
              </label>
              <input
                id="settings-username"
                type="text"
                className="form-input"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={24}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="settings-char-name">
                Hero Display Name
              </label>
              <input
                id="settings-char-name"
                type="text"
                className="form-input"
                value={characterName}
                onChange={e => setCharacterName(e.target.value)}
                required
                minLength={2}
                maxLength={32}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="settings-class">
                Character Class Archetype
              </label>
              <select
                id="settings-class"
                className="form-select"
                value={avatarClass}
                onChange={e => setAvatarClass(e.target.value)}
              >
                <option value="WARRIOR">Warrior (Strength & Physical Vigor)</option>
                <option value="MAGE">Mage (Intellect & Deep Knowledge)</option>
                <option value="ROGUE">Rogue (Discipline, Agility & Speed)</option>
                <option value="PALADIN">Paladin (Charisma & Noble Deeds)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Save size={16} />
                <span>{submitting ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Appearance & Themes */}
        {activeTab === 'appearance' && (
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Select from your unlocked visual armor themes to change your realm atmosphere.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.85rem' }}>
              {ownedThemes.map(t => {
                const isEquipped = (character.active_theme || 'theme-obsidian') === t.item_id;

                return (
                  <div
                    key={t.item_id}
                    style={{
                      padding: '1rem',
                      background: 'var(--bg-base)',
                      borderRadius: 'var(--radius-md)',
                      border: isEquipped ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)',
                      boxShadow: isEquipped ? '0 0 15px var(--accent-gold-glow)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.6rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t.name}</span>
                        {isEquipped && (
                          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-gold)' }}>
                            Active
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        {t.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      className={`btn ${isEquipped ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', alignSelf: 'flex-start' }}
                      disabled={isEquipped}
                      onClick={() => handleThemeChange(t.item_id)}
                    >
                      {isEquipped ? 'Equipped' : 'Equip Theme'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Audio & SFX */}
        {activeTab === 'audio' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block' }}>
                  Retro Synthesizer Sound Effects
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Tactile 8-bit chimes for quest completions, coins, and clicks
                </span>
              </div>
              <button
                type="button"
                className={`btn ${isMuted ? 'btn-secondary' : 'btn-primary'}`}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                onClick={handleToggleMute}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                <span>{isMuted ? 'Muted' : 'Enabled'}</span>
              </button>
            </div>

            <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                <span>Master Volume</span>
                <span style={{ fontFamily: 'var(--font-stats)', color: 'var(--accent-gold)' }}>{volume}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={e => handleVolumeChange(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem' }}
                onClick={() => sound.playClick()}
              >
                Test Click Chime
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem' }}
                onClick={() => sound.playCoin()}
              >
                Test Gold Chime
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem' }}
                onClick={() => sound.playQuestComplete()}
              >
                Test Victory Chime
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Notifications & Alerts */}
        {activeTab === 'notifications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block' }}>
                  Quest Complete Sound Cues
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Play celebratory fanfare when checking off daily tasks
                </span>
              </div>
              <input
                type="checkbox"
                checked={questChimes}
                onChange={e => setQuestChimes(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block' }}>
                  Streak Reminder Cues
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Highlight streak cards when consecutive momentum is at risk
                </span>
              </div>
              <input
                type="checkbox"
                checked={streakAlerts}
                onChange={e => setStreakAlerts(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSavePreferences}
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}

        {/* Tab 5: Account & Security */}
        {activeTab === 'account' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ padding: '1rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                <Radio size={16} style={{ color: '#10b981' }} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Account Session Information</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Email: <strong>{user.email}</strong><br />
                User ID: <strong>#{user.id}</strong><br />
                Codex Created: <strong>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}</strong>
              </p>
            </div>

            {/* Change Password Form */}
            <div style={{ padding: '1rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                <Shield size={16} style={{ color: 'var(--accent-gold)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Security & Password Management</span>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const curPass = (form.elements.namedItem('currentPass') as HTMLInputElement)?.value;
                  const newPass = (form.elements.namedItem('newPass') as HTMLInputElement)?.value;
                  setError(null);
                  setSuccess(null);
                  setSubmitting(true);
                  sound.playClick();
                  try {
                    const res = await api.auth.changePassword({ currentPassword: curPass, newPassword: newPass });
                    setSuccess(res.message);
                    form.reset();
                  } catch (err: unknown) {
                    setError(err instanceof Error ? err.message : 'Failed to update password.');
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Current Password</label>
                  <input
                    name="currentPass"
                    type="password"
                    className="form-input"
                    placeholder="Enter current password"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>New Password</label>
                  <input
                    name="newPass"
                    type="password"
                    className="form-input"
                    placeholder="Enter new password (min 6 chars)"
                    minLength={6}
                    required
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                  disabled={submitting}
                >
                  <Save size={14} />
                  <span>Update Password</span>
                </button>
              </form>
            </div>

            <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.35rem' }}>
                Leave Realm Session
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                Safely disconnect and clear your current local session cookie.
              </p>
              <button
                type="button"
                className="btn"
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  fontSize: '0.85rem'
                }}
                onClick={() => {
                  sound.playClick();
                  onClose();
                  logout();
                }}
              >
                <LogOut size={16} />
                <span>Sign Out of Life RPG</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
