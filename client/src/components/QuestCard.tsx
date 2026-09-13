import React from 'react';
import {
  CheckCircle2,
  Calendar,
  Trash2,
  Edit3,
  Brain,
  Dumbbell,
  Sparkles,
  Palette,
  Users,
  Heart,
  Coins,
  ShieldAlert
} from 'lucide-react';
import type { Quest } from '../types';
import { sound } from '../utils/sound';

interface QuestCardProps {
  quest: Quest;
  onComplete: (questId: number, event: React.MouseEvent) => void;
  onEdit: (quest: Quest) => void;
  onDelete: (questId: number) => void;
  isCompleting?: boolean;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  KNOWLEDGE: { label: 'Intellect', icon: Brain, color: 'var(--attr-intellect)' },
  FITNESS: { label: 'Strength', icon: Dumbbell, color: 'var(--attr-strength)' },
  MINDFULNESS: { label: 'Discipline', icon: Sparkles, color: 'var(--attr-discipline)' },
  CREATIVITY: { label: 'Creativity', icon: Palette, color: 'var(--attr-creativity)' },
  SOCIAL: { label: 'Charisma', icon: Users, color: 'var(--attr-charisma)' },
  VITALITY: { label: 'Endurance', icon: Heart, color: 'var(--attr-endurance)' }
};

export const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  onComplete,
  onEdit,
  onDelete,
  isCompleting = false
}) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);

  const catConfig = CATEGORY_CONFIG[quest.category] || CATEGORY_CONFIG.KNOWLEDGE;
  const CategoryIcon = catConfig.icon;
  const isCompleted = quest.is_completed === 1;

  const getDifficultyBadgeClass = (diff: string) => {
    switch (diff) {
      case 'TRIVIAL': return 'badge-trivial';
      case 'EASY': return 'badge-easy';
      case 'MEDIUM': return 'badge-medium';
      case 'HARD': return 'badge-hard';
      case 'EPIC': return 'badge-epic';
      default: return 'badge-medium';
    }
  };

  const handleCompleteClick = (e: React.MouseEvent) => {
    sound.playQuestComplete();
    onComplete(quest.id, e);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    setIsConfirmingDelete(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    setIsConfirmingDelete(false);
    onDelete(quest.id);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    setIsConfirmingDelete(false);
  };

  return (
    <article
      className="glass-panel"
      style={{
        padding: '1.25rem',
        opacity: isCompleted ? 0.65 : 1,
        borderLeft: `4px solid ${catConfig.color}`,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '1rem',
        transition: 'transform var(--transition-fast), border-color var(--transition-fast)'
      }}
      aria-label={`Quest: ${quest.title}`}
    >
      {/* Top Meta Bar */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              className="badge"
              style={{
                background: `rgba(255, 255, 255, 0.06)`,
                color: catConfig.color,
                border: `1px solid ${catConfig.color}`
              }}
            >
              <CategoryIcon size={13} />
              <span>{catConfig.label}</span>
            </span>

            <span className={`badge ${getDifficultyBadgeClass(quest.difficulty)}`}>
              {quest.difficulty}
            </span>

            {quest.priority === 'URGENT' && (
              <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                <ShieldAlert size={12} />
                <span>URGENT</span>
              </span>
            )}
          </div>

          {/* Due date if active */}
          {quest.due_date && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-stats)'
              }}
            >
              <Calendar size={13} />
              <span>{new Date(quest.due_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Title and Description */}
        <h3
          style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            textDecoration: isCompleted ? 'line-through' : 'none',
            color: isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
            marginBottom: '0.35rem'
          }}
        >
          {quest.title}
        </h3>

        {quest.description && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {quest.description}
          </p>
        )}
      </div>

      {/* Footer: Rewards & Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-color)'
        }}
      >
        {/* Rewards Breakdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontFamily: 'var(--font-stats)', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--accent-xp)', fontWeight: 700 }}>
            +{quest.xp_reward} XP
          </span>
          <span style={{ color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 700 }}>
            <Coins size={14} />
            +{quest.gold_reward} G
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {isConfirmingDelete ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(239, 68, 68, 0.15)', padding: '0.25rem 0.45rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
              <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 800 }}>Delete?</span>
              <button
                type="button"
                className="btn"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', background: '#ef4444', color: '#ffffff', minHeight: 'auto' }}
                onClick={handleConfirmDelete}
              >
                Yes
              </button>
              <button
                type="button"
                className="btn"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)', minHeight: 'auto' }}
                onClick={handleCancelDelete}
              >
                No
              </button>
            </div>
          ) : !isCompleted ? (
            <>
              <button
                type="button"
                className="btn btn-icon"
                onClick={(e) => { e.stopPropagation(); onEdit(quest); }}
                aria-label={`Edit ${quest.title}`}
                title="Edit Quest"
              >
                <Edit3 size={15} />
              </button>

              <button
                type="button"
                className="btn btn-icon"
                onClick={handleDeleteClick}
                aria-label={`Abandon ${quest.title}`}
                title="Vanquish Quest from Board"
              >
                <Trash2 size={15} />
              </button>

              <button
                type="button"
                className="btn btn-vanquish"
                onClick={handleCompleteClick}
                disabled={isCompleting}
                aria-label={`Complete Quest: ${quest.title}`}
              >
                <CheckCircle2 size={16} />
                <span>{isCompleting ? 'Claiming...' : 'Complete'}</span>
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  color: '#10b981',
                  fontSize: '0.8rem',
                  fontWeight: 700
                }}
              >
                <CheckCircle2 size={16} />
                <span>Conquered</span>
              </span>
              <button
                type="button"
                className="btn btn-icon"
                onClick={handleDeleteClick}
                title="Delete quest history"
                aria-label="Delete completed quest"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
