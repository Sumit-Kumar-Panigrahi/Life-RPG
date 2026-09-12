import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  Coins,
  Check,
  Sparkles,
  Palette,
  Shield,
  Zap,
  Sun,
  Trees,
  Award,
  Swords,
  TrendingUp,
  FlaskConical,
  Wand2,
  Flame,
  Brain,
  Crown
} from 'lucide-react';
import type { ShopItem } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/sound';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Palette,
  Zap,
  Sun,
  Trees,
  Sparkles,
  Shield,
  Wand2,
  Flame,
  Brain,
  Crown,
  Award,
  Swords,
  TrendingUp,
  FlaskConical
};

export const ShopModal: React.FC<ShopModalProps> = ({ isOpen, onClose }) => {
  const { character, updateCharacterState } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [activeTab, setActiveTab] = useState<'THEME' | 'TITLE' | 'BADGE'>('THEME');
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchShopData = async () => {
    try {
      setLoading(true);
      const data = await api.shop.getItems();
      setItems(data.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchShopData();
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen || !character) return null;

  const handlePurchase = async (item: ShopItem) => {
    setError(null);
    setSuccessMsg(null);
    setActionInProgress(item.id);
    sound.playCoin();

    try {
      const res = await api.shop.purchaseItem(item.id);
      setSuccessMsg(`Acquired ${item.name}!`);
      // Update character gold in context
      updateCharacterState({ ...character, gold: res.remainingGold });
      await fetchShopData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to purchase item.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleEquip = async (item: ShopItem) => {
    setError(null);
    setSuccessMsg(null);
    setActionInProgress(item.id);
    sound.playEquip();

    try {
      const res = await api.shop.equipItem(item.id);
      setSuccessMsg(`Equipped ${item.name}!`);
      updateCharacterState(res.character);
      await fetchShopData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to equip item.');
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredItems = items.filter(i => i.category === activeTab);

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shop-modal-title"
      onKeyDown={e => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingBag size={24} style={{ color: 'var(--accent-gold)' }} />
            <h2 id="shop-modal-title" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
              REWARD EMPORIUM
            </h2>
          </div>
          <button type="button" className="btn btn-icon" onClick={onClose} aria-label="Close Shop">
            <X size={18} />
          </button>
        </div>

        {/* User Balance Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.25rem',
            background: 'var(--bg-base)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            marginBottom: '1.25rem'
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Available Treasury
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-gold)', fontWeight: 800, fontFamily: 'var(--font-stats)', fontSize: '1.15rem' }}>
            <Coins size={20} />
            <span>{character.gold} Gold</span>
          </div>
        </div>

        {/* Tab Filter */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-base)',
            borderRadius: 'var(--radius-md)',
            padding: '0.25rem',
            marginBottom: '1.25rem'
          }}
        >
          {(['THEME', 'TITLE', 'BADGE'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              className="btn"
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === tab ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === tab ? 'var(--accent-gold)' : 'var(--text-secondary)',
                border: activeTab === tab ? '1px solid var(--border-glow)' : 'none'
              }}
              onClick={() => {
                sound.playClick();
                setActiveTab(tab);
                setError(null);
                setSuccessMsg(null);
              }}
            >
              {tab === 'THEME' ? 'Themes' : tab === 'TITLE' ? 'Hero Titles' : 'Honor Badges'}
            </button>
          ))}
        </div>

        {/* Notifications */}
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
          >
            {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: '0.65rem 0.9rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              borderRadius: 'var(--radius-md)',
              color: '#6ee7b7',
              fontSize: '0.85rem',
              marginBottom: '1rem'
            }}
          >
            {successMsg}
          </div>
        )}

        {/* Item Cards List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Unveiling treasures...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
            {filteredItems.map(item => {
              const Icon = ICON_MAP[item.icon] || Sparkles;
              const isOwned = item.owned;
              const isEquipped = item.equipped;
              const canAfford = item.canAfford;

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    background: isEquipped ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-base)',
                    border: isEquipped ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                    <div
                      style={{
                        padding: '0.6rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 'var(--radius-sm)',
                        color: isEquipped ? 'var(--accent-gold)' : 'var(--text-primary)'
                      }}
                    >
                      <Icon size={22} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{item.name}</span>
                        {isEquipped && (
                          <span
                            className="badge"
                            style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-gold)' }}
                          >
                            Equipped
                          </span>
                        )}
                        {isOwned && !isEquipped && (
                          <span
                            className="badge"
                            style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}
                          >
                            Owned
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Buy / Equip Action */}
                  <div>
                    {isEquipped ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent-gold)', fontSize: '0.85rem', fontWeight: 700 }}>
                        <Check size={16} /> Active
                      </span>
                    ) : isOwned ? (
                      item.category !== 'BADGE' ? (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleEquip(item)}
                          disabled={actionInProgress === item.id}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        >
                          Equip
                        </button>
                      ) : (
                        <span style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: 600 }}>
                          Unlocked
                        </span>
                      )
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handlePurchase(item)}
                        disabled={!canAfford || actionInProgress === item.id}
                        style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                      >
                        <Coins size={14} />
                        <span>{item.cost === 0 ? 'Free' : `${item.cost} G`}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Leave Emporium
          </button>
        </div>
      </div>
    </div>
  );
};
