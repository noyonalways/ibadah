import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  locale: 'en' | 'bn' | 'ar';
  timezone: string;
  avatarUrl?: string;
  hasPassword?: boolean;
  hasGoogle?: boolean;
  role?: 'user' | 'admin';
  createdAt?: string;
}

interface AuthState {
  user: AuthUser | null;
  hasHydrated: boolean;
  setUser: (user: AuthUser | null) => void;
  setHydrated: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hasHydrated: false,
      setUser: (user) => set({ user }),
      setHydrated: () => set({ hasHydrated: true }),
      reset: () => set({ user: null }),
    }),
    {
      name: 'ibadah-auth',
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
