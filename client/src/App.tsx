import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Sparkles,
  Swords,
  CheckCircle2,
  ListTodo,
  Zap
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import type { Quest, QuestCategory, QuestDifficulty, QuestPriority } from './types';
import { api } from './services/api';
import { sound } from './utils/sound';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { QuestCard } from './components/QuestCard';
import { QuestModal } from './components/QuestModal';
import { CharacterDrawer } from './components/CharacterDrawer';
import { ShopModal } from './components/ShopModal';
import { LevelUpModal } from './components/LevelUpModal';
import { FloatingFeedback } from './components/FloatingFeedback';
import type { FloatingItem } from './components/FloatingFeedback';

export const App: React.FC = () => {
  const { user, loading: authLoading, updateCharacterState } = useAuth();

  // Quest list & filters
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loadingQuests, setLoadingQuests] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('active');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);

  // Tactical animations & interaction state
  const [completingQuestId, setCompletingQuestId] = useState<number | null>(null);
  const [floatingItems, setFloatingItems] = useState<FloatingItem[]>([]);

  // Fetch quests with current filters
  const loadQuests = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingQuests(true);
      const res = await api.quests.getQuests({
        status: filterStatus === 'all' ? undefined : filterStatus,
        category: filterCategory === 'ALL' ? undefined : filterCategory,
        difficulty: filterDifficulty === 'ALL' ? undefined : filterDifficulty,
        search: searchQuery || undefined
      });
      setQuests(res.quests);
    } catch (err) {
      console.error('[Load Quests Error]', err);
    } finally {
      setLoadingQuests(false);
    }
  }, [user, filterStatus, filterCategory, filterDifficulty, searchQuery]);

  useEffect(() => {
    if (user) {
      loadQuests();
    }
  }, [user, loadQuests]);

  // Handle quest creation or update
  const handleSaveQuest = async (data: {
    title: string;
    description: string;
    category: QuestCategory;
    difficulty: QuestDifficulty;
    priority: QuestPriority;
    due_date: string | null;
  }) => {
    if (editingQuest) {
      await api.quests.updateQuest(editingQuest.id, data);
    } else {
      await api.quests.createQuest(data);
    }
    await loadQuests();
  };

  // Quick Preset Add
  const handleQuickAdd = async (title: string, category: QuestCategory, difficulty: QuestDifficulty) => {
    sound.playClick();
    try {
      await api.quests.createQuest({
        title,
        description: 'Quick adventure logged to strengthen daily real-life progression.',
        category,
        difficulty,
        priority: 'MEDIUM'
      });
      await loadQuests();
    } catch (err) {
      console.error('[Quick Add Error]', err);
    }
  };

  // Delete quest
  const handleDeleteQuest = async (id: number) => {
    sound.playClick();
    if (window.confirm('Vanquish this quest permanently from your records?')) {
      try {
        await api.quests.deleteQuest(id);
        await loadQuests();
      } catch (err) {
        console.error('[Delete Quest Error]', err);
      }
    }
  };

  // Complete quest with RPG rewards & feedback
  const handleCompleteQuest = async (id: number, event: React.MouseEvent) => {
    setCompletingQuestId(id);

    // Floating text coordinates
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;

    try {
      const res = await api.quests.completeQuest(id);

      // Trigger floating feedback numbers
      const itemId = String(Date.now());
      const newItems: FloatingItem[] = [
        { id: `${itemId}-xp`, x, y: y - 10, text: `+${res.rewards.xpGained} XP`, color: 'var(--accent-xp)' },
        { id: `${itemId}-gold`, x: x + 40, y: y - 30, text: `+${res.rewards.goldGained} Gold`, color: 'var(--accent-gold)' },
        { id: `${itemId}-attr`, x: x - 40, y: y - 20, text: `+${res.rewards.attributePointsGained} ${res.rewards.attribute}`, color: '#10b981' }
      ];

      setFloatingItems(prev => [...prev, ...newItems]);
      setTimeout(() => {
        setFloatingItems(prev => prev.filter(i => !i.id.startsWith(itemId)));
      }, 1300);

      // Update character and attributes in AuthContext
      updateCharacterState(res.character, res.attributes);

      // Check level up celebration
      if (res.rewards.isLevelUp) {
        setLevelUpLevel(res.rewards.newLevel);
      }

      // Reload quests
      await loadQuests();
    } catch (err) {
      console.error('[Complete Quest Error]', err);
      alert('Failed to complete quest.');
    } finally {
      setCompletingQuestId(null);
    }
  };

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem'
        }}
      >
        <Swords size={40} style={{ color: 'var(--accent-gold)', animation: 'flame-pulse 1.5s infinite ease-in-out' }} />
        <div style={{ fontFamily: 'var(--font-stats)', color: 'var(--text-secondary)' }}>
          Summoning Hero Codex...
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Auth Gateway if not authenticated */}
      {!user && <AuthModal />}

      {/* Floating Animated Feedback */}
      <FloatingFeedback items={floatingItems} />

      {/* Level-Up Celebration Overlay */}
      {levelUpLevel !== null && (
        <LevelUpModal
          isOpen={true}
          newLevel={levelUpLevel}
          onClose={() => setLevelUpLevel(null)}
        />
      )}

      {/* Hero HUD Header */}
      <Header
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenShop={() => setIsShopOpen(true)}
      />

      {/* Main Application Board */}
      <main className="main-content">
        {/* Quick-Start Presets */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            overflowX: 'auto',
            paddingBottom: '0.75rem',
            marginBottom: '1.25rem'
          }}
        >
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
            <Zap size={14} /> Quick Quests:
          </span>

          {[
            { title: 'Hydrate: Drink 500ml Water', cat: 'FITNESS' as QuestCategory, diff: 'TRIVIAL' as QuestDifficulty },
            { title: 'Focus: Read 10 Pages', cat: 'KNOWLEDGE' as QuestCategory, diff: 'EASY' as QuestDifficulty },
            { title: 'Zen: 10 Min Meditation', cat: 'MINDFULNESS' as QuestCategory, diff: 'EASY' as QuestDifficulty },
            { title: 'Physical: 25 Pushups', cat: 'FITNESS' as QuestCategory, diff: 'EASY' as QuestDifficulty },
            { title: 'Deep Work: 45m Coding', cat: 'KNOWLEDGE' as QuestCategory, diff: 'MEDIUM' as QuestDifficulty }
          ].map(preset => (
            <button
              key={preset.title}
              type="button"
              className="btn btn-secondary"
              style={{
                fontSize: '0.75rem',
                padding: '0.3rem 0.65rem',
                whiteSpace: 'nowrap',
                borderRadius: 'var(--radius-full)'
              }}
              onClick={() => handleQuickAdd(preset.title, preset.cat, preset.diff)}
            >
              + {preset.title}
            </button>
          ))}
        </div>

        {/* Toolbar & Filter Controls */}
        <section
          className="glass-panel"
          style={{ padding: '1rem', marginBottom: '1.5rem' }}
          aria-label="Quest Filtering and Controls"
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            {/* Status Tabs */}
            <div style={{ display: 'flex', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', padding: '0.2rem' }}>
              {[
                { id: 'active', label: 'Active Quests', icon: ListTodo },
                { id: 'completed', label: 'Conquered', icon: CheckCircle2 },
                { id: 'all', label: 'All', icon: Sparkles }
              ].map(tab => {
                const Icon = tab.icon;
                const isSelected = filterStatus === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className="btn"
                    style={{
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--bg-surface)' : 'transparent',
                      color: isSelected ? 'var(--accent-gold)' : 'var(--text-secondary)',
                      border: isSelected ? '1px solid var(--border-glow)' : 'none'
                    }}
                    onClick={() => {
                      sound.playClick();
                      setFilterStatus(tab.id as typeof filterStatus);
                    }}
                  >
                    <Icon size={15} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Actions & Filters */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', minWidth: '180px' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ padding: '0.45rem 0.75rem 0.45rem 2.1rem', fontSize: '0.85rem' }}
                  placeholder="Filter quests..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <Search
                  size={15}
                  style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                />
              </div>

              {/* Category Filter */}
              <select
                className="form-select"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                value={filterCategory}
                onChange={e => {
                  sound.playClick();
                  setFilterCategory(e.target.value);
                }}
                aria-label="Filter by Category"
              >
                <option value="ALL">All Realms</option>
                <option value="KNOWLEDGE">Knowledge (INT)</option>
                <option value="FITNESS">Fitness (STR)</option>
                <option value="MINDFULNESS">Mindfulness (DIS)</option>
                <option value="CREATIVITY">Creativity (CRE)</option>
                <option value="SOCIAL">Social (CHA)</option>
                <option value="VITALITY">Vitality (END)</option>
              </select>

              {/* Difficulty Filter */}
              <select
                className="form-select"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                value={filterDifficulty}
                onChange={e => {
                  sound.playClick();
                  setFilterDifficulty(e.target.value);
                }}
                aria-label="Filter by Difficulty"
              >
                <option value="ALL">All Tiers</option>
                <option value="TRIVIAL">Trivial</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
                <option value="EPIC">Epic</option>
              </select>

              {/* New Quest Button */}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  sound.playClick();
                  setEditingQuest(null);
                  setIsQuestModalOpen(true);
                }}
                style={{ padding: '0.45rem 0.95rem' }}
              >
                <Plus size={16} />
                <span>Forge Quest</span>
              </button>
            </div>
          </div>
        </section>

        {/* Quest Cards Grid */}
        <section aria-label="Quest Board">
          {loadingQuests ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Consulting Quest Log...
            </div>
          ) : quests.length === 0 ? (
            <div
              className="glass-panel"
              style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                border: '1px dashed var(--border-color)'
              }}
            >
              <Swords size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {filterStatus === 'completed' ? 'No Conquered Quests Yet' : 'No Active Quests in this Realm'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
                {filterStatus === 'completed'
                  ? 'Vanquish active tasks to record your glory, claim bountiful XP, and fuel your character level!'
                  : 'Inscribe a new real-world quest or pick a quick preset above to start leveling up.'}
              </p>
              {filterStatus !== 'completed' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    sound.playClick();
                    setEditingQuest(null);
                    setIsQuestModalOpen(true);
                  }}
                >
                  <Plus size={16} />
                  <span>Forge First Quest</span>
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.25rem'
              }}
            >
              {quests.map(quest => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  onComplete={handleCompleteQuest}
                  onEdit={q => {
                    sound.playClick();
                    setEditingQuest(q);
                    setIsQuestModalOpen(true);
                  }}
                  onDelete={handleDeleteQuest}
                  isCompleting={completingQuestId === quest.id}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modals & Drawers */}
      <QuestModal
        isOpen={isQuestModalOpen}
        onClose={() => setIsQuestModalOpen(false)}
        onSubmit={handleSaveQuest}
        initialQuest={editingQuest}
      />

      <CharacterDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <ShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
      />
    </div>
  );
};
