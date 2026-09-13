import type {
  User,
  Character,
  Attribute,
  Quest,
  ShopItem,
  InventoryItem,
  CompletionRewards
} from '../types';

const API_BASE = '/api';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    },
    credentials: 'include'
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.error || `Request failed with status ${response.status}`, response.status);
  }

  return data as T;
}

export const api = {
  auth: {
    signup: (body: {
      username: string;
      email: string;
      password: string;
      characterName?: string;
      avatarClass?: string;
    }) =>
      request<{
        user: User;
        character: Character;
        attributes: Attribute[];
        token: string;
      }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(body)
      }),

    login: (body: { emailOrUsername: string; password: string }) =>
      request<{
        user: User;
        character: Character;
        attributes: Attribute[];
        token: string;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(body)
      }),

    logout: () =>
      request<{ message: string }>('/auth/logout', {
        method: 'POST'
      }),

    getMe: () =>
      request<{
        user: User;
        character: Character;
        attributes: Attribute[];
        inventory: InventoryItem[];
      }>('/auth/me'),

    getGoogleStatus: () =>
      request<{ configured: boolean }>('/auth/google/status'),

    simulateGoogleLogin: (body: { email: string; name?: string; sub: string }) =>
      request<{
        user: User;
        character: Character;
        attributes: Attribute[];
        token: string;
      }>('/auth/google/simulate-callback', {
        method: 'POST',
        body: JSON.stringify(body)
      }),

    updateProfile: (body: { username?: string; email?: string }) =>
      request<{
        message: string;
        user: User;
        character: Character;
      }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(body)
      }),

    forgotPassword: (body: { emailOrUsername: string }) =>
      request<{
        message: string;
        code?: string;
        username?: string;
      }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(body)
      }),

    resetPassword: (body: { emailOrUsername: string; token: string; newPassword: string }) =>
      request<{
        message: string;
      }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(body)
      }),

    changePassword: (body: { currentPassword?: string; newPassword: string }) =>
      request<{
        message: string;
      }>('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify(body)
      })
  },

  quests: {
    getQuests: (filters?: { status?: string; category?: string; difficulty?: string; search?: string }) => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.difficulty) params.append('difficulty', filters.difficulty);
      if (filters?.search) params.append('search', filters.search);

      const qs = params.toString();
      return request<{ quests: Quest[] }>(`/quests${qs ? `?${qs}` : ''}`);
    },

    createQuest: (body: {
      title: string;
      description?: string;
      category: string;
      difficulty: string;
      priority?: string;
      due_date?: string | null;
    }) =>
      request<{ quest: Quest }>('/quests', {
        method: 'POST',
        body: JSON.stringify(body)
      }),

    updateQuest: (
      id: number,
      body: {
        title?: string;
        description?: string;
        category?: string;
        difficulty?: string;
        priority?: string;
        due_date?: string | null;
      }
    ) =>
      request<{ quest: Quest }>(`/quests/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      }),

    deleteQuest: (id: number) =>
      request<{ message: string }>(`/quests/${id}`, {
        method: 'DELETE'
      }),

    completeQuest: (id: number) =>
      request<{
        quest: Quest;
        rewards: CompletionRewards;
        character: Character;
        attributes: Attribute[];
      }>(`/quests/${id}/complete`, {
        method: 'POST'
      })
  },

  character: {
    getCharacter: () =>
      request<{
        character: Character;
        attributes: Attribute[];
        stats: { totalQuests: number; completedQuests: number; activeQuests: number };
      }>('/character'),

    updateCharacter: (body: {
      characterName?: string;
      avatarClass?: string;
      activeTitle?: string;
      activeTheme?: string;
    }) =>
      request<{ character: Character; attributes: Attribute[] }>('/character', {
        method: 'PUT',
        body: JSON.stringify(body)
      })
  },

  shop: {
    getItems: () =>
      request<{
        items: ShopItem[];
        goldBalance: number;
        activeTheme: string;
        activeTitle: string;
      }>('/shop/items'),

    purchaseItem: (itemId: string) =>
      request<{
        message: string;
        item: ShopItem;
        remainingGold: number;
      }>('/shop/purchase', {
        method: 'POST',
        body: JSON.stringify({ itemId })
      }),

    equipItem: (itemId: string) =>
      request<{
        message: string;
        character: Character;
      }>('/shop/equip', {
        method: 'POST',
        body: JSON.stringify({ itemId })
      })
  }
};
