import React from 'react';
import {
  Package,
  ArrowRight,
  Palette,
  Shield,
  Award,
  Zap,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/sound';

interface InventoryPreviewProps {
  onOpenInventory: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Palette,
  Shield,
  Award,
  Zap,
  Sparkles
};

export const InventoryPreview: React.FC<InventoryPreviewProps> = ({ onOpenInventory }) => {
  const { inventory } = useAuth();

  // Show user's inventory items or display default showcase items if sparse
  const displayItems = inventory.length > 0 ? inventory.slice(0, 4) : [
    { item_id: 'theme-obsidian', name: 'Obsidian Forge', category: 'THEME', icon: 'Palette', description: 'Dark armor aesthetic' },
    { item_id: 'title-novice', name: 'Novice Adventurer', category: 'TITLE', icon: 'Shield', description: 'Starting title' },
    { item_id: 'badge-genesis', name: 'Golden Badge', category: 'BADGE', icon: 'Award', description: 'Early pioneer honor' },
    { item_id: 'boost-xp', name: 'XP Boost (1h)', category: 'CONSUMABLE', icon: 'Zap', description: '+20% XP boost' }
  ];

  return (
    <div className="glass-panel inventory-card" id="inventory-section" aria-label="Inventory Showcase">
      <div className="card-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={18} style={{ color: 'var(--accent-gold)' }} />
          <h3 className="section-title">Inventory & Armory</h3>
        </div>
        <button
          type="button"
          className="view-all-link"
          onClick={() => {
            sound.playClick();
            onOpenInventory();
          }}
          aria-label="View all inventory items"
        >
          <span>View All</span>
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="inventory-grid">
        {displayItems.map(item => {
          const Icon = ICON_MAP[item.icon] || Sparkles;

          return (
            <div
              key={item.item_id}
              className="inventory-item-card"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                sound.playClick();
                onOpenInventory();
              }}
              role="button"
              tabIndex={0}
              aria-label={`Open inventory to manage ${item.name}`}
            >
              <div className="inv-icon-box">
                <Icon size={18} />
              </div>
              <div className="inv-info">
                <span className="inv-name">{item.name}</span>
                <span className="inv-category">{item.category}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
