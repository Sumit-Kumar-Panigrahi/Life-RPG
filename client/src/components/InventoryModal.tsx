import React, { useState } from 'react';
import {
  X,
  Package,
  Sparkles,
  Palette,
  Shield,
  Award,
  Zap,
  Check,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { sound } from '../utils/sound';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShop: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Palette,
  Shield,
  Award,
  Zap,
  Sparkles
};

export const InventoryModal: React.FC<InventoryModalProps> = ({ isOpen, onClose, onOpenShop }) => {
  const { character, inventory, updateCharacterState, setTheme } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !character) return null;

  // Combine real database inventory with default starter items if not present
  const fullInventory = [...inventory];
  if (!fullInventory.some(i => i.item_id === 'theme-obsidian')) {
    fullInventory.unshift({
      item_id: 'theme-obsidian',
      name: 'Obsidian Forge',
      description: 'Default dark knight obsidian armor aesthetic',
      category: 'THEME',
      icon: 'Palette',
      acquired_at: new Date().toISOString()
    });
  }
  if (!fullInventory.some(i => i.item_id === 'title-novice')) {
    fullInventory.unshift({
      item_id: 'title-novice',
      name: 'Novice Adventurer',
      description: 'Every legend starts from humble beginnings',
      category: 'TITLE',
      icon: 'Shield',
      acquired_at: new Date().toISOString()
    });
  }

  const filteredItems = fullInventory.filter(item => {
    if (activeCategory === 'ALL') return true;
    return item.category === activeCategory;
  });

  const handleEquip = async (itemId: string, category: string, name: string) => {
    setActionInProgress(itemId);
    setSuccessMsg(null);
    setErrorMsg(null);
    sound.playEquip();

    try {
      if (category === 'THEME') {
        const res = await api.character.updateCharacter({ activeTheme: itemId });
        setTheme(itemId);
        updateCharacterState(res.character, res.attributes);
        setSuccessMsg(`Theme '${name}' equipped!`);
      } else if (category === 'TITLE') {
        const res = await api.character.updateCharacter({ activeTitle: name });
        updateCharacterState(res.character, res.attributes);
        setSuccessMsg(`Title '${name}' equipped!`);
      }
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to equip item.');
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inventory-modal-title"
      onKeyDown={e => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: '680px', padding: '1.75rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Package size={24} style={{ color: 'var(--accent-gold)' }} />
            <div>
              <h2 id="inventory-modal-title" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                HERO ARMORY & INVENTORY
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Equip themes, titles, and honor badges acquired across your journey.
              </p>
            </div>
          </div>
          <button type="button" className="btn btn-icon" onClick={onClose} aria-label="Close Inventory">
            <X size={18} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.35rem',
            background: 'var(--bg-base)',
            borderRadius: 'var(--radius-md)',
            padding: '0.25rem',
            marginBottom: '1.25rem',
            overflowX: 'auto'
          }}
        >
          {['ALL', 'THEME', 'TITLE', 'BADGE', 'CONSUMABLE'].map(cat => {
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                className="btn"
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? 'var(--bg-surface)' : 'transparent',
                  color: isSelected ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  border: isSelected ? '1px solid var(--border-glow)' : 'none',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => {
                  sound.playClick();
                  setActiveCategory(cat);
                }}
              >
                {cat === 'ALL' ? 'All Items' : cat.charAt(0) + cat.slice(1).toLowerCase() + 's'}
              </button>
            );
          })}
        </div>

        {/* Feedback Messages */}
        {successMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: 'var(--radius-sm)', color: '#10b981', fontSize: '0.85rem', marginBottom: '1rem' }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 'var(--radius-sm)', color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Inventory Items Grid */}
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
            <Package size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              No {activeCategory.toLowerCase()} items found
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Visit the Reward Emporium to unlock custom themes, hero titles, and badges with Gold!
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onClose();
                onOpenShop();
              }}
            >
              <span>Visit Shop</span>
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem',
              maxHeight: '52vh',
              overflowY: 'auto',
              paddingRight: '0.25rem'
            }}
          >
            {filteredItems.map(item => {
              const Icon = ICON_MAP[item.icon] || Sparkles;
              const isEquippedTheme = item.category === 'THEME' && (character.active_theme || 'theme-obsidian') === item.item_id;
              const isEquippedTitle = item.category === 'TITLE' && (character.active_title || 'Novice Adventurer') === item.name;
              const isEquipped = isEquippedTheme || isEquippedTitle;

              return (
                <div
                  key={item.item_id}
                  style={{
                    padding: '1.1rem',
                    background: 'var(--bg-base)',
                    borderRadius: 'var(--radius-md)',
                    border: isEquipped ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)',
                    boxShadow: isEquipped ? '0 0 15px var(--accent-gold-glow)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.85rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--accent-gold)'
                          }}
                        >
                          <Icon size={18} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{item.name}</h4>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            {item.category}
                          </span>
                        </div>
                      </div>

                      {isEquipped && (
                        <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-gold)' }}>
                          <Check size={12} /> Active
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {item.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.65rem', borderTop: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={12} />
                      {item.acquired_at ? new Date(item.acquired_at).toLocaleDateString() : 'Starter Item'}
                    </span>

                    {(item.category === 'THEME' || item.category === 'TITLE') ? (
                      <button
                        type="button"
                        className={`btn ${isEquipped ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                        disabled={isEquipped || actionInProgress === item.item_id}
                        onClick={() => handleEquip(item.item_id, item.category, item.name)}
                      >
                        {isEquipped ? 'Equipped' : actionInProgress === item.item_id ? 'Equipping...' : 'Equip'}
                      </button>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' }}>
                        Honored
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              onClose();
              onOpenShop();
            }}
          >
            <span>Visit Shop for More Items</span>
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close Armory
          </button>
        </div>
      </div>
    </div>
  );
};
