import React, { useEffect, useRef } from 'react';
import {
  Bell,
  CheckCircle2,
  TrendingUp,
  Flame,
  ShoppingBag,
  Award,
  Trash2,
  CheckCheck
} from 'lucide-react';
import { sound } from '../utils/sound';

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  time: string;
  type: 'quest' | 'level' | 'streak' | 'shop' | 'system';
  read: boolean;
}

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onClearAll
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'quest': return <CheckCircle2 size={15} style={{ color: '#10b981' }} />;
      case 'level': return <TrendingUp size={15} style={{ color: 'var(--accent-gold)' }} />;
      case 'streak': return <Flame size={15} style={{ color: '#ef4444' }} />;
      case 'shop': return <ShoppingBag size={15} style={{ color: 'var(--accent-xp)' }} />;
      default: return <Award size={15} style={{ color: 'var(--accent-gold)' }} />;
    }
  };

  return (
    <div
      ref={popoverRef}
      className="glass-panel notifications-popover"
      style={{
        position: 'absolute',
        top: '52px',
        right: '0',
        width: 'min(340px, calc(100vw - 1.5rem))',
        maxWidth: 'calc(100vw - 1.5rem)',
        zIndex: 100,
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.75)',
        border: '1px solid var(--border-glow)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem',
        animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      role="region"
      aria-label="Recent notifications"
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Bell size={15} style={{ color: 'var(--accent-gold)' }} />
          <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>Notifications</span>
          {unreadCount > 0 && (
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                background: '#ef4444',
                color: '#fff',
                padding: '0.1rem 0.35rem',
                borderRadius: '9999px'
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {unreadCount > 0 && (
            <button
              type="button"
              className="btn btn-icon"
              style={{ width: '26px', height: '26px' }}
              title="Mark all as read"
              onClick={() => {
                sound.playClick();
                onMarkAllRead();
              }}
            >
              <CheckCheck size={14} />
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              className="btn btn-icon"
              style={{ width: '26px', height: '26px' }}
              title="Clear all"
              onClick={() => {
                sound.playClick();
                onClearAll();
              }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            No recent activity alerts. Conquering quests will notify you here!
          </div>
        ) : (
          notifications.map(item => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                padding: '0.55rem',
                borderRadius: 'var(--radius-sm)',
                background: item.read ? 'rgba(0, 0, 0, 0.2)' : 'rgba(245, 158, 11, 0.08)',
                border: item.read ? '1px solid rgba(255, 255, 255, 0.03)' : '1px solid rgba(245, 158, 11, 0.25)',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ marginTop: '0.1rem', flexShrink: 0 }}>
                {getIcon(item.type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: item.read ? 600 : 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  {item.detail}
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                  {item.time}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
