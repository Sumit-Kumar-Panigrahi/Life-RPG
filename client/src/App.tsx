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

// Core UI Components
import { Sidebar } from './components/Sidebar';
import { HeroHeader } from './components/HeroHeader';
import { StreakCard } from './components/StreakCard';
import { AttributeCards } from './components/AttributeCards';
import { RecentActivity } from './components/RecentActivity';
import { RewardsCard } from './components/RewardsCard';
import { InventoryPreview } from './components/InventoryPreview';
import { PromoBanner } from './components/PromoBanner';

// Modals & Interactive Overlays
import { AuthModal } from './components/AuthModal';
import { QuestCard } from './components/QuestCard';
import { QuestModal } from './components/QuestModal';
import { CharacterDrawer } from './components/CharacterDrawer';
import { ShopModal } from './components/ShopModal';
import { InventoryModal } from './components/InventoryModal';
import { SettingsModal } from './components/SettingsModal';
import { LevelUpModal } from './components/LevelUpModal';
import { FloatingFeedback } from './components/FloatingFeedback';
import type { FloatingItem } from './components/FloatingFeedback';
import type { NotificationItem } from './components/NotificationsPopover';

export const App: React.FC = () => {
  const { user, loading: authLoading, updateCharacterState } = useAuth();

  // Navigation & Routing State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted());

  // Quest List & Filters State
  const [quests, setQuests] = useState<Quest[]>([]);
  const [recentCompleted, setRecentCompleted] = useState<Quest[]>([]);
  const [loadingQuests, setLoadingQuests] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('active');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals Open State
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);

  // Dynamic Tactical Feedback & Notifications
  const [completingQuestId, setCompletingQuestId] = useState<number | null>(null);
  const [floatingItems, setFloatingItems] = useState<FloatingItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    return [
      {
        id: 'notif-welcome',
        title: 'Welcome to Life RPG',
        detail: 'Turn your real-world tasks into legendary character progression.',
        time: 'Just now',
        type: 'system',
        read: false
      }
    ];
  });

  // URL Route Sync Helper (HTML5 History API)
  const navigateTo = useCallback((path: string, pushHistory = true) => {
    if (pushHistory && window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }

    if (path === '/' || path === '/dashboard') {
      setCurrentTab('dashboard');
      setIsQuestModalOpen(false);
      setIsProfileOpen(false);
      setIsShopOpen(false);
      setIsInventoryOpen(false);
      setIsSettingsOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (path === '/quests') {
      setCurrentTab('quests');
      setIsQuestModalOpen(false);
      setIsProfileOpen(false);
      setIsShopOpen(false);
      setIsInventoryOpen(false);
      setIsSettingsOpen(false);
      document.getElementById('quest-board-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (path === '/create-quest') {
      setEditingQuest(null);
      setIsQuestModalOpen(true);
      setCurrentTab('create');
    } else if (path === '/character') {
      setIsProfileOpen(true);
      setCurrentTab('character');
    } else if (path === '/shop') {
      setIsShopOpen(true);
      setCurrentTab('shop');
    } else if (path === '/inventory') {
      setIsInventoryOpen(true);
      setCurrentTab('inventory');
    } else if (path === '/settings') {
      setIsSettingsOpen(true);
      setCurrentTab('settings');
    }
  }, []);

  // Sync Initial URL and Back/Forward Navigation
  useEffect(() => {
    const handlePopState = () => {
      navigateTo(window.location.pathname, false);
    };

    window.addEventListener('popstate', handlePopState);
    // Initialize view from current URL path
    navigateTo(window.location.pathname, false);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigateTo]);

  // Fetch Quests from Database with Active Filters
  const loadQuests = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingQuests(true);
      const [filteredRes, completedRes] = await Promise.all([
        api.quests.getQuests({
          status: filterStatus === 'all' ? undefined : filterStatus,
          category: filterCategory === 'ALL' ? undefined : filterCategory,
          difficulty: filterDifficulty === 'ALL' ? undefined : filterDifficulty,
          search: searchQuery || undefined
        }),
        api.quests.getQuests({ status: 'completed' })
      ]);

      setQuests(filteredRes.quests);
      setRecentCompleted(completedRes.quests);
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

  const handleToggleSound = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  };

  // Create or Update Quest
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

  // Delete Quest
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

  // Complete Quest with RPG Rewards & Animated Feedback
  const handleCompleteQuest = async (id: number, event: React.MouseEvent) => {
    if (completingQuestId === id) return; // Anti double-click guard
    setCompletingQuestId(id);

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

      // Add Notification item
      setNotifications(prev => [
        {
          id: `quest-${Date.now()}`,
          title: `Quest Conquered: ${res.quest.title}`,
          detail: `+${res.rewards.xpGained} XP • +${res.rewards.goldGained} Gold`,
          time: 'Just now',
          type: 'quest',
          read: false
        },
        ...prev
      ]);

      // Update character and attributes in AuthContext
      updateCharacterState(res.character, res.attributes);

      // Check level up celebration
      if (res.rewards.isLevelUp) {
        setLevelUpLevel(res.rewards.newLevel);
        setNotifications(prev => [
          {
            id: `level-${Date.now()}`,
            title: `LEVEL UP! Reached Level ${res.rewards.newLevel}`,
            detail: 'New stats and increased capability unlocked!',
            time: 'Just now',
            type: 'level',
            read: false
          },
          ...prev
        ]);
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

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
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
          gap: '1rem',
          backgroundColor: 'var(--bg-base)'
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
    <div className="app-shell">
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

      {/* Fixed Left Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'dashboard') navigateTo('/dashboard');
          else if (tab === 'quests') navigateTo('/quests');
        }}
        onOpenCreateQuest={() => navigateTo('/create-quest')}
        onOpenCharacter={() => navigateTo('/character')}
        onOpenShop={() => navigateTo('/shop')}
        onOpenInventory={() => navigateTo('/inventory')}
        onOpenSettings={() => navigateTo('/settings')}
        onToggleSound={handleToggleSound}
        isMuted={isMuted}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Dashboard Layout Area */}
      <div className="app-main-layout">
        {/* Cinematic Atmospheric Hero Banner */}
        <HeroHeader
          onOpenProfile={() => navigateTo('/character')}
          onOpenShop={() => navigateTo('/shop')}
          onOpenInventory={() => navigateTo('/inventory')}
          onOpenSettings={() => navigateTo('/settings')}
          onToggleMobileMenu={() => setIsMobileNavOpen(prev => !prev)}
          notifications={notifications}
          onMarkAllRead={handleMarkAllRead}
          onClearAllNotifications={handleClearAllNotifications}
        />

        {/* Daily Streak Tracker Card */}
        <StreakCard />

        {/* 4 Core Attribute Progress Cards */}
        <AttributeCards />

        {/* Middle Two-Column Grid: Active Quests & Right Widget Column */}
        <div className="dashboard-two-col" id="quest-board-section">
          {/* Left Column: Quick Actions, Toolbar & Quests List */}
          <section className="dashboard-left-col" aria-label="Active Quests Section">
            {/* Quick-Start Presets */}
            <div className="side-scroll-container">
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
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
            <div
              className="glass-panel"
              style={{ padding: '1rem' }}
              aria-label="Quest Filtering and Controls"
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.85rem'
                }}
              >
                {/* Status Tabs */}
                <div className="side-scroll-container" style={{ background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', padding: '0.2rem' }}>
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
                <div className="side-scroll-container">
                  {/* Search Bar */}
                  <div style={{ position: 'relative', minWidth: '160px' }}>
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
                      navigateTo('/create-quest');
                    }}
                    style={{ padding: '0.45rem 0.95rem' }}
                  >
                    <Plus size={16} />
                    <span>Forge Quest</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quest Cards Grid */}
            <div aria-label="Quest Cards Board">
              {loadingQuests ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Consulting Quest Log...
                </div>
              ) : quests.length === 0 ? (
                <div
                  className="glass-panel"
                  style={{
                    textAlign: 'center',
                    padding: '3.5rem 2rem',
                    border: '1px dashed var(--border-color)'
                  }}
                >
                  <Swords size={44} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
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
                        navigateTo('/create-quest');
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
                    gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
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
            </div>
          </section>

          {/* Right Column: Recent Activity Feed, Rewards Showcase, & Inventory */}
          <section className="dashboard-right-col" aria-label="Activity and Rewards Overview">
            <RecentActivity completedQuests={recentCompleted} />
            <RewardsCard onOpenShop={() => navigateTo('/shop')} />
            <InventoryPreview onOpenInventory={() => navigateTo('/inventory')} />
          </section>
        </div>

        {/* Lower Dashboard Row: Motivation Banner + Level Progress Highlight */}
        <PromoBanner
          onScrollToQuests={() => {
            document.getElementById('quest-board-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          onOpenProfile={() => navigateTo('/character')}
        />
      </div>

      {/* Modals & Overlays */}
      <QuestModal
        isOpen={isQuestModalOpen}
        onClose={() => {
          setIsQuestModalOpen(false);
          setEditingQuest(null);
          if (window.location.pathname === '/create-quest') {
            navigateTo('/dashboard');
          }
        }}
        onSubmit={handleSaveQuest}
        initialQuest={editingQuest}
      />

      <CharacterDrawer
        isOpen={isProfileOpen}
        onClose={() => {
          setIsProfileOpen(false);
          if (window.location.pathname === '/character') {
            navigateTo('/dashboard');
          }
        }}
      />

      <ShopModal
        isOpen={isShopOpen}
        onClose={() => {
          setIsShopOpen(false);
          if (window.location.pathname === '/shop') {
            navigateTo('/dashboard');
          }
        }}
      />

      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={() => {
          setIsInventoryOpen(false);
          if (window.location.pathname === '/inventory') {
            navigateTo('/dashboard');
          }
        }}
        onOpenShop={() => navigateTo('/shop')}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          if (window.location.pathname === '/settings') {
            navigateTo('/dashboard');
          }
        }}
      />
    </div>
  );
};
