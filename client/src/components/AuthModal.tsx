import React, { useState } from 'react';
import { Sparkles, User, Key, Mail, Swords, Zap, Heart, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/sound';

export const AuthModal: React.FC = () => {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [avatarClass, setAvatarClass] = useState<'WARRIOR' | 'MAGE' | 'ROGUE' | 'PALADIN'>('WARRIOR');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        sound.playClick();
        await login({ emailOrUsername: username || email, password });
      } else {
        sound.playLevelUp();
        await signup({
          username,
          email,
          password,
          characterName: characterName || username,
          avatarClass
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setError(null);
    setLoading(true);
    sound.playClick();
    const demoUser = `hero_${Math.floor(Math.random() * 8999 + 1000)}`;
    try {
      await signup({
        username: demoUser,
        email: `${demoUser}@liferpg.realm`,
        password: 'password123',
        characterName: 'Valiant Adventurer',
        avatarClass: 'WARRIOR'
      });
      sound.playLevelUp();
    } catch {
      // If already exists, fallback to login
      try {
        await login({ emailOrUsername: demoUser, password: 'password123' });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Demo login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className="modal-card" style={{ maxWidth: '440px' }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '0.75rem',
              background: 'rgba(245, 158, 11, 0.1)',
              borderRadius: '50%',
              color: 'var(--accent-gold)',
              marginBottom: '0.5rem'
            }}
          >
            <Swords size={32} />
          </div>
          <h2 id="auth-title" style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.05em' }}>
            {isLogin ? 'ENTER THE REALM' : 'CREATE YOUR HERO'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {isLogin
              ? 'Resume your heroic journey and conquer daily quests.'
              : 'Turn real-world habits into non-linear RPG progression.'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-base)',
            borderRadius: 'var(--radius-md)',
            padding: '0.25rem',
            marginBottom: '1.25rem'
          }}
        >
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              background: isLogin ? 'var(--bg-surface)' : 'transparent',
              color: isLogin ? 'var(--accent-gold)' : 'var(--text-secondary)',
              border: isLogin ? '1px solid var(--border-glow)' : 'none'
            }}
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              background: !isLogin ? 'var(--bg-surface)' : 'transparent',
              color: !isLogin ? 'var(--accent-gold)' : 'var(--text-secondary)',
              border: !isLogin ? '1px solid var(--border-glow)' : 'none'
            }}
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
          >
            New Hero
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '0.65rem 0.9rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: 'var(--radius-md)',
              color: '#fca5a5',
              fontSize: '0.85rem',
              marginBottom: '1rem'
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              {isLogin ? 'Username or Email' : 'Username'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="username"
                type="text"
                className="form-input"
                style={{ width: '100%', paddingLeft: '2.4rem' }}
                placeholder={isLogin ? 'adventurer or email@domain.com' : 'e.g. shadow_blade'}
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
              <User
                size={16}
                style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
            </div>
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '2.4rem' }}
                    placeholder="hero@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  <Mail
                    size={16}
                    style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="characterName">
                  Hero Name (Optional)
                </label>
                <input
                  id="characterName"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sir Reginald the Focused"
                  value={characterName}
                  onChange={e => setCharacterName(e.target.value)}
                />
              </div>

              {/* Class Selection */}
              <div className="form-group">
                <label className="form-label">Hero Class</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {[
                    { id: 'WARRIOR', name: 'Warrior', icon: Swords, desc: 'Bonus Grit & Strength' },
                    { id: 'MAGE', name: 'Mage', icon: Zap, desc: 'Bonus Intellect' },
                    { id: 'ROGUE', name: 'Rogue', icon: Flame, desc: 'Bonus Discipline' },
                    { id: 'PALADIN', name: 'Paladin', icon: Heart, desc: 'Bonus Endurance' }
                  ].map(cls => {
                    const Icon = cls.icon;
                    const isSelected = avatarClass === cls.id;
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => setAvatarClass(cls.id as typeof avatarClass)}
                        style={{
                          padding: '0.6rem 0.5rem',
                          background: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-base)',
                          border: isSelected ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          color: isSelected ? 'var(--accent-gold)' : 'var(--text-primary)'
                        }}
                      >
                        <Icon size={18} />
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{cls.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{cls.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type="password"
                className="form-input"
                style={{ width: '100%', paddingLeft: '2.4rem' }}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <Key
                size={16}
                style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? 'Communing with Realm...' : isLogin ? 'Enter Realm' : 'Embark on Journey'}
          </button>
        </form>

        {/* Quick Demo Button */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', fontSize: '0.85rem', gap: '0.5rem' }}
            onClick={handleQuickDemo}
            disabled={loading}
          >
            <Sparkles size={16} style={{ color: 'var(--accent-gold)' }} />
            <span>Instant Demo Account (1-Click)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
