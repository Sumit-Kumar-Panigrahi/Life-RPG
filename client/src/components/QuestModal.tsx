import React, { useState, useEffect } from 'react';
import { X, Sparkles, Coins, Zap } from 'lucide-react';
import type { Quest, QuestCategory, QuestDifficulty, QuestPriority } from '../types';
import { sound } from '../utils/sound';

interface QuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    category: QuestCategory;
    difficulty: QuestDifficulty;
    priority: QuestPriority;
    due_date: string | null;
  }) => Promise<void>;
  initialQuest?: Quest | null;
}

const REWARD_MATRIX: Record<QuestDifficulty, { xp: number; gold: number; attr: number }> = {
  TRIVIAL: { xp: 15, gold: 5, attr: 3 },
  EASY: { xp: 30, gold: 10, attr: 6 },
  MEDIUM: { xp: 65, gold: 25, attr: 12 },
  HARD: { xp: 140, gold: 55, attr: 25 },
  EPIC: { xp: 300, gold: 120, attr: 50 }
};

const CATEGORIES: Array<{ id: QuestCategory; label: string; attr: string }> = [
  { id: 'KNOWLEDGE', label: 'Knowledge (Coding / Study)', attr: 'Intellect' },
  { id: 'FITNESS', label: 'Fitness (Gym / Health)', attr: 'Strength' },
  { id: 'MINDFULNESS', label: 'Mindfulness (Meditation / Habits)', attr: 'Discipline' },
  { id: 'CREATIVITY', label: 'Creativity (Design / Writing)', attr: 'Creativity' },
  { id: 'SOCIAL', label: 'Social (Community / Family)', attr: 'Charisma' },
  { id: 'VITALITY', label: 'Vitality (Chores / Admin)', attr: 'Endurance' }
];

export const QuestModal: React.FC<QuestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialQuest
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<QuestCategory>('KNOWLEDGE');
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('MEDIUM');
  const [priority, setPriority] = useState<QuestPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialQuest) {
      setTitle(initialQuest.title);
      setDescription(initialQuest.description || '');
      setCategory(initialQuest.category);
      setDifficulty(initialQuest.difficulty);
      setPriority(initialQuest.priority);
      setDueDate(initialQuest.due_date ? initialQuest.due_date.split('T')[0] : '');
    } else {
      setTitle('');
      setDescription('');
      setCategory('KNOWLEDGE');
      setDifficulty('MEDIUM');
      setPriority('MEDIUM');
      setDueDate('');
    }
    setError(null);
  }, [initialQuest, isOpen]);

  if (!isOpen) return null;

  const currentRewards = REWARD_MATRIX[difficulty] || REWARD_MATRIX.MEDIUM;
  const currentCategoryMeta = CATEGORIES.find(c => c.id === category);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for this heroic endeavor.');
      return;
    }

    setError(null);
    setSubmitting(true);
    sound.playClick();

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        difficulty,
        priority,
        due_date: dueDate || null
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save quest.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quest-modal-title"
      onKeyDown={e => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="modal-card">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 id="quest-modal-title" style={{ fontSize: '1.3rem', fontWeight: 800 }}>
            {initialQuest ? 'Edit Quest' : 'Forge New Quest'}
          </h2>
          <button
            type="button"
            className="btn btn-icon"
            onClick={onClose}
            aria-label="Close Modal"
          >
            <X size={18} />
          </button>
        </div>

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

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="quest-title">
              Quest Objective *
            </label>
            <input
              id="quest-title"
              type="text"
              className="form-input"
              placeholder="e.g. Implement user authorization middleware"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="quest-desc">
              Context & Notes
            </label>
            <textarea
              id="quest-desc"
              className="form-textarea"
              rows={2}
              placeholder="Optional tactical briefing or completion criteria..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Category & Priority Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="quest-category">
                Realm / Category
              </label>
              <select
                id="quest-category"
                className="form-select"
                value={category}
                onChange={e => setCategory(e.target.value as QuestCategory)}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="quest-priority">
                Urgency Priority
              </label>
              <select
                id="quest-priority"
                className="form-select"
                value={priority}
                onChange={e => setPriority(e.target.value as QuestPriority)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent ⚡</option>
              </select>
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="form-group">
            <label className="form-label">Difficulty Level</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}>
              {(['TRIVIAL', 'EASY', 'MEDIUM', 'HARD', 'EPIC'] as QuestDifficulty[]).map(diff => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  style={{
                    padding: '0.5rem 0.2rem',
                    textAlign: 'center',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: difficulty === diff ? 'var(--accent-gold)' : 'var(--bg-base)',
                    color: difficulty === diff ? '#000' : 'var(--text-secondary)',
                    border: difficulty === diff ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="quest-due">
              Target Deadline (Optional)
            </label>
            <input
              id="quest-due"
              type="date"
              className="form-input"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>

          {/* Live Rewards Calculator Banner */}
          <div
            style={{
              padding: '0.85rem 1rem',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px dashed var(--accent-gold)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              Estimated Rewards Upon Vanquishing
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: 'var(--font-stats)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent-xp)' }}>
                <Zap size={16} />
                <span style={{ fontWeight: 800 }}>+{currentRewards.xp} XP</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent-gold)' }}>
                <Coins size={16} />
                <span style={{ fontWeight: 800 }}>+{currentRewards.gold} Gold</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-primary)' }}>
                <Sparkles size={16} />
                <span style={{ fontWeight: 700 }}>+{currentRewards.attr} {currentCategoryMeta?.attr}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Inscribing...' : initialQuest ? 'Update Quest' : 'Inscribe Quest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
