import React from 'react';
import {
  LayoutDashboard,
  Swords,
  PlusCircle,
  User,
  ShoppingBag,
  Package,
  Settings,
  LogOut,
  Volume2,
  VolumeX,
  Radio,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/sound';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCreateQuest: () => void;
  onOpenCharacter: () => void;
  onOpenShop: () => void;
  onOpenInventory: () => void;
  onOpenSettings: () => void;
  onToggleSound: () => void;
  isMuted: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreateQuest,
  onOpenCharacter,
  onOpenShop,
  onOpenInventory,
  onOpenSettings,
  onToggleSound,
  isMuted,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, action: () => onSelectTab('dashboard') },
    { id: 'quests', label: 'Quest Board', icon: Swords, action: () => onSelectTab('quests') },
    { id: 'create', label: 'Create Quest', icon: PlusCircle, action: onOpenCreateQuest, isAction: true },
    { id: 'character', label: 'Character', icon: User, action: onOpenCharacter, isAction: true },
    { id: 'shop', label: 'Shop', icon: ShoppingBag, action: onOpenShop, isAction: true },
    { id: 'inventory', label: 'Inventory', icon: Package, action: onOpenInventory, isAction: true },
    { id: 'settings', label: 'Settings', icon: Settings, action: onOpenSettings, isAction: true }
  ];

  const handleItemClick = (item: typeof navItems[0]) => {
    sound.playClick();
    item.action();
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Backdrop for mobile drawer */}
      {isMobileOpen && (
        <div
          className="sidebar-mobile-overlay"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`rpg-sidebar ${isMobileOpen ? 'mobile-open' : ''}`} aria-label="Main Navigation">
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo-wrap">
            <Swords className="brand-icon" size={26} />
          </div>
          <div style={{ flex: 1 }}>
            <h1 className="brand-title">LIFE RPG</h1>
            <p className="brand-tagline">Your Life. Your Quest. Your Level.</p>
          </div>
          {isMobileOpen && onCloseMobile && (
            <button
              type="button"
              className="btn btn-icon"
              onClick={onCloseMobile}
              aria-label="Close Navigation"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => handleItemClick(item)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={19} className="nav-icon" />
                <span>{item.label}</span>
                {item.id === 'shop' && (
                  <span className="nav-badge">NEW</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {/* Realm Status */}
          <div className="realm-status">
            <span className="status-indicator">
              <Radio size={14} className="status-ping" />
            </span>
            <div className="status-info">
              <span className="status-label">Realm Online</span>
              <span className="status-sub">TZPSv2 Season 1</span>
            </div>
          </div>

          {/* Audio Sound Toggle & Logout */}
          <div className="sidebar-user-row">
            <button
              type="button"
              className="sidebar-action-btn"
              onClick={() => {
                sound.playClick();
                onToggleSound();
              }}
              aria-label={isMuted ? 'Unmute Realm Audio' : 'Mute Realm Audio'}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
              <span>{isMuted ? 'Audio Muted' : 'Audio On'}</span>
            </button>

            {user && (
              <button
                type="button"
                className="sidebar-action-btn logout-btn"
                onClick={() => {
                  sound.playClick();
                  if (onCloseMobile) onCloseMobile();
                  logout();
                }}
                aria-label="Leave Realm"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
