import React, { useState } from 'react';
import { Sparkles, User, Key, Mail, Swords, Zap, Heart, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/sound';

export const AuthModal: React.FC = () => {
  const { login, signup, oauthError, clearOauthError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [avatarClass, setAvatarClass] = useState<'WARRIOR' | 'MAGE' | 'ROGUE' | 'PALADIN'>('WARRIOR');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = () => {
    sound.playClick();
    setGoogleLoading(true);
    setError(null);
    clearOauthError();
    // Redirect to backend Google OAuth entrypoint
    window.location.href = '/api/auth/google';
  };

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

        {/* Google Authentication Button */}
        <div style={{ marginBottom: '1.25rem' }}>
          <button
            type="button"
            className="btn btn-google"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            aria-label="Continue with Google"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '0.65rem 1rem',
              background: '#ffffff',
              color: '#1f2937',
              border: '1px solid #d1d5db',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.9rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              cursor: googleLoading ? 'wait' : 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            {/* Official Google G Logo */}
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24Z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"/>
            </svg>
            <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              margin: '1.25rem 0',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.05em'
            }}
          >
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            <span style={{ padding: '0 0.75rem' }}>OR CONTINUE WITH REALM CREDENTIALS</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>
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
              clearOauthError();
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
              clearOauthError();
            }}
          >
            New Hero
          </button>
        </div>

        {/* Error Alert */}
        {(error || oauthError) && (
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
            {error || oauthError}
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
