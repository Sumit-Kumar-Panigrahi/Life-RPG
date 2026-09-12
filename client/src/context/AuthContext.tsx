import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Character, Attribute, InventoryItem } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  character: Character | null;
  attributes: Attribute[];
  inventory: InventoryItem[];
  loading: boolean;
  oauthError: string | null;
  clearOauthError: () => void;
  login: (credentials: { emailOrUsername: string; password: string }) => Promise<void>;
  signup: (data: {
    username: string;
    email: string;
    password: string;
    characterName?: string;
    avatarClass?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateCharacterState: (character: Character, attributes?: Attribute[]) => void;
  setTheme: (themeId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const applyTheme = (themeId: string) => {
    document.documentElement.setAttribute('data-theme', themeId || 'theme-obsidian');
  };

  const refreshProfile = async () => {
    try {
      const data = await api.auth.getMe();
      setUser(data.user);
      setCharacter(data.character);
      setAttributes(data.attributes);
      setInventory(data.inventory);
      if (data.character?.active_theme) {
        applyTheme(data.character.active_theme);
      }
    } catch {
      setUser(null);
      setCharacter(null);
      setAttributes([]);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authStatus = params.get('auth');
    const authErr = params.get('auth_error');

    if (authErr) {
      const errorDesc = params.get('error_desc');
      if (authErr === 'oauth_cancelled') {
        setOauthError('Google sign-in was cancelled by the user.');
      } else if (authErr === 'google_not_configured') {
        setOauthError('Google OAuth is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.');
      } else if (authErr === 'invalid_client') {
        setOauthError(
          errorDesc
            ? `Google OAuth Error (invalid_client): ${errorDesc}`
            : 'Google OAuth Error (invalid_client): The provided client secret is invalid.'
        );
      } else {
        setOauthError(
          errorDesc
            ? `Google authentication error (${authErr}): ${errorDesc}`
            : `Google authentication encountered an error (${authErr}).`
        );
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (authStatus === 'success') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    refreshProfile();
  }, []);

  const login = async (credentials: { emailOrUsername: string; password: string }) => {
    const data = await api.auth.login(credentials);
    setUser(data.user);
    setCharacter(data.character);
    setAttributes(data.attributes);
    if (data.character?.active_theme) {
      applyTheme(data.character.active_theme);
    }
    // Fetch full inventory
    const profile = await api.auth.getMe();
    setInventory(profile.inventory);
  };

  const signup = async (data: {
    username: string;
    email: string;
    password: string;
    characterName?: string;
    avatarClass?: string;
  }) => {
    const res = await api.auth.signup(data);
    setUser(res.user);
    setCharacter(res.character);
    setAttributes(res.attributes);
    if (res.character?.active_theme) {
      applyTheme(res.character.active_theme);
    }
    const profile = await api.auth.getMe();
    setInventory(profile.inventory);
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } finally {
      setUser(null);
      setCharacter(null);
      setAttributes([]);
      setInventory([]);
      applyTheme('theme-obsidian');
    }
  };

  const updateCharacterState = (newCharacter: Character, newAttributes?: Attribute[]) => {
    setCharacter(newCharacter);
    if (newAttributes) {
      setAttributes(newAttributes);
    }
    if (newCharacter.active_theme) {
      applyTheme(newCharacter.active_theme);
    }
  };

  const setTheme = (themeId: string) => {
    applyTheme(themeId);
    if (character) {
      setCharacter({ ...character, active_theme: themeId });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        character,
        attributes,
        inventory,
        loading,
        oauthError,
        clearOauthError: () => setOauthError(null),
        login,
        signup,
        logout,
        refreshProfile,
        updateCharacterState,
        setTheme
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
