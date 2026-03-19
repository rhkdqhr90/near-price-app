import { create } from 'zustand';
import { storage, STORAGE_KEYS } from '../utils/storage';
import type { AuthTokens } from '../types/api.types';

export type AuthUser = AuthTokens['user'];

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  restoreAuth: () => Promise<void>;
}

const noop = () => undefined;

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,

  setTokens: (accessToken, refreshToken) => {
    set({ accessToken, refreshToken, isAuthenticated: true });
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken).catch(noop);
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken).catch(noop);
  },

  setUser: (user) => {
    set({ user });
    storage.set(STORAGE_KEYS.USER, user).catch(noop);
  },

  logout: () => {
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
    storage.remove(STORAGE_KEYS.ACCESS_TOKEN).catch(noop);
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN).catch(noop);
    storage.remove(STORAGE_KEYS.USER).catch(noop);
  },

  restoreAuth: async () => {
    const accessToken = await storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = await storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN);
    const user = await storage.get<AuthUser>(STORAGE_KEYS.USER);
    if (accessToken && refreshToken) {
      set({ accessToken, refreshToken, user, isAuthenticated: true });
    }
  },
}));
