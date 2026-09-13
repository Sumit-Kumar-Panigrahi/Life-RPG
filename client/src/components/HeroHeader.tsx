import React, { useState, useEffect, useRef } from 'react';
import {
  Coins,
  Gem,
  Shield,
  Bell,
  ChevronDown,
  Sparkles,
  Menu,
  User,
  Package,
  Settings as SettingsIcon,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/sound';
import { NotificationsPopover } from './NotificationsPopover';
import type { NotificationItem } from './NotificationsPopover';

interface HeroHeaderProps {
  onOpenProfile: () => void;
  onOpenShop: () => void;
  onOpenInventory: () => void;
  onOpenSettings: () => void;
  onToggleMobileMenu: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onClearAllNotifications: () => void;
}

export const HeroHeader: React.FC<HeroHeaderProps> = ({
  onOpenProfile,
  onOpenShop,
  onOpenInventory,
  onOpenSettings,
  onToggleMobileMenu,
  notifications,
  onMarkAllRead,
  onClearAllNotifications
}) => {
  const { character, user, logout } = useAuth();
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dynamic time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 18) return 'Good afternoon,';
    return 'Good evening,';
  };

  const playerName = character?.character_name || user?.username || 'Priyanshu';
  const currentXp = character?.current_xp || 0;
  const requiredXp = character?.requiredXp || 100;
  const xpPercent = Math.min(100, Math.round((currentXp / requiredXp) * 100));
  const goldBalance = character?.gold || 50;
  const level = character?.level || 1;
  const unreadNotifs = notifications.filter(n => !n.read).length;

  // Handle click outside profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <header className="hero-banner" aria-label="Player Profile Overview">
      <div className="hero-banner-bg" />
      <div className="hero-banner-overlay" />

      <div className="hero-banner-content">
        {/* Left Side: Avatar & Hero Info */}
        <div className="hero-left-section">
          {/* Mobile Menu Toggle (visible < 1024px) */}
          <button
            type="button"
            className="btn btn-icon mobile-menu-btn"
            onClick={() => {
              sound.playClick();
              onToggleMobileMenu();
            }}
            aria-label="Open Navigation Menu"
            title="Open Navigation Menu"
          >
            <Menu size={20} />
          </button>

          {/* Circular Avatar with Gold Ring & Glow */}
          <div
            className="hero-avatar-wrapper"
            onClick={() => {
              sound.playClick();
              onOpenProfile();
            }}
            role="button"
            tabIndex={0}
            aria-label="Open Hero Dossier"
          >
            <div className="avatar-gold-ring">
              <img
                src="/hero_avatar.png"
                alt={playerName}
                className="hero-avatar-img"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://api.dicebear.com/7.x/bottts/svg?seed=' + playerName;
                }}
              />
            </div>
            <div className="avatar-level-badge">
              <span>LVL {level}</span>
            </div>
          </div>

          {/* Hero Greeting & Details */}
          <div className="hero-details">
            <div className="hero-greeting-row">
              <span className="hero-greeting">{getGreeting()}</span>
              {character?.active_title && (
                <span className="hero-title-badge">
                  <Sparkles size={13} style={{ color: 'var(--accent-gold)' }} />
                  <span>{character.active_title}</span>
                </span>
              )}
            </div>

            <h2 className="hero-player-name">{playerName}</h2>
            <p className="hero-subtitle">Another day. Another quest.</p>

            {/* Large Horizontal XP Progress Bar */}
            <div className="hero-xp-section">
              <div className="hero-xp-labels">
                <span className="xp-metric-label">XP PROGRESSION</span>
                <span className="xp-metric-numbers">
                  <strong>{currentXp}</strong> / {requiredXp} XP ({xpPercent}%)
                </span>
              </div>
              <div className="hero-xp-bar-track">
                <div
                  className="hero-xp-bar-fill"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Currencies, Stats, Notification controls */}
        <div className="hero-right-section">
          <div className="hero-currency-pills horizontal-scroll">
            {/* Gold Balance Pill */}
            <button
              type="button"
              className="currency-pill gold-pill"
              onClick={() => {
                sound.playClick();
                onOpenShop();
              }}
              title="Gold Treasury - Click to Open Reward Emporium"
              aria-label={`Treasury: ${goldBalance} Gold`}
            >
              <Coins size={18} className="pill-icon gold-icon" />
              <div className="pill-text">
                <span className="pill-val">{goldBalance}</span>
                <span className="pill-unit">Gold</span>
              </div>
            </button>

            {/* Gem / Arcane Crystals Pill */}
            <button
              type="button"
              className="currency-pill gem-pill"
              onClick={() => {
                sound.playClick();
                onOpenShop();
              }}
              title="Arcane Gems - Click to Browse Premium Artifacts"
              aria-label="Arcane Gems"
            >
              <Gem size={18} className="pill-icon gem-icon" />
              <div className="pill-text">
                <span className="pill-val">12</span>
                <span className="pill-unit">Gems</span>
              </div>
            </button>

            {/* Level Indicator Pill */}
            <button
              type="button"
              className="currency-pill level-pill"
              onClick={() => {
                sound.playClick();
                onOpenProfile();
              }}
              title={`Level ${level} Hero - Click to Open Dossier`}
              aria-label={`Level ${level} Hero`}
            >
              <Shield size={18} className="pill-icon level-icon" />
              <div className="pill-text">
                <span className="pill-val">Lv. {level}</span>
                <span className="pill-unit">{character?.avatar_class || 'Warrior'}</span>
              </div>
            </button>
          </div>

          {/* User Controls & Bell */}
          <div className="hero-action-buttons" style={{ position: 'relative' }}>
            {/* Notifications Bell */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="hero-icon-btn"
                aria-label="Toggle notifications menu"
                title={unreadNotifs > 0 ? `${unreadNotifs} new notifications` : 'Notifications'}
                onClick={() => {
                  sound.playClick();
                  setIsNotifsOpen(prev => !prev);
                  setIsDropdownOpen(false);
                }}
              >
                <Bell size={18} />
                {unreadNotifs > 0 && (
                  <span className="notification-dot" />
                )}
              </button>

              <NotificationsPopover
                isOpen={isNotifsOpen}
                onClose={() => setIsNotifsOpen(false)}
                notifications={notifications}
                onMarkAllRead={onMarkAllRead}
                onClearAll={onClearAllNotifications}
              />
            </div>

            {/* Profile Dropdown */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="hero-profile-pill"
                onClick={() => {
                  sound.playClick();
                  setIsDropdownOpen(prev => !prev);
                  setIsNotifsOpen(false);
                }}
                aria-label="User Profile & Quick Actions Menu"
                aria-expanded={isDropdownOpen}
              >
                <img
                  src="/hero_avatar.png"
                  alt=""
                  className="mini-avatar"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://api.dicebear.com/7.x/bottts/svg?seed=' + playerName;
                  }}
                />
                <span className="hide-mobile">{playerName.split(' ')[0]}</span>
                <ChevronDown size={15} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {isDropdownOpen && (
                <div
                  className="glass-panel profile-dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: '46px',
                    right: 0,
                    width: '210px',
                    zIndex: 100,
                    borderRadius: 'var(--radius-md)',
                    padding: '0.4rem',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
                    border: '1px solid var(--border-glow)',
                    animation: 'slideUp 0.15s ease-out'
                  }}
                >
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      sound.playClick();
                      setIsDropdownOpen(false);
                      onOpenProfile();
                    }}
                  >
                    <User size={15} />
                    <span>Hero Dossier</span>
                  </button>

                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      sound.playClick();
                      setIsDropdownOpen(false);
                      onOpenInventory();
                    }}
                  >
                    <Package size={15} />
                    <span>Armory & Inventory</span>
                  </button>

                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      sound.playClick();
                      setIsDropdownOpen(false);
                      onOpenSettings();
                    }}
                  >
                    <SettingsIcon size={15} />
                    <span>Realm Settings</span>
                  </button>

                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.35rem 0' }} />

                  <button
                    type="button"
                    className="dropdown-item logout-item"
                    onClick={() => {
                      sound.playClick();
                      setIsDropdownOpen(false);
                      logout();
                    }}
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
