import { create } from 'zustand';
import { User } from '../types/api.types';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  fetchUser: async () => {
    try {
      const user = await authService.me();
      set({ user, loading: false });
    } catch {
      await authService.logout().catch(() => {});
      set({ user: null, loading: false });
    }
  },
  logout: async () => {
    await authService.logout();
    set({ user: null });
  },
}));
