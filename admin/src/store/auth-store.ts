import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * The shape mirrors the server's `SafeUser`. `isAdmin` is reserved for a
 * future server change (see design.md §10.3) — until then every signed-in
 * user is treated as an admin in single-tenant mode.
 */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  locale: 'en' | 'bn' | 'ar';
  timezone: string;
  avatarUrl?: string;
  hasPassword?: boolean;
  hasGoogle?: boolean;
  isAdmin?: boolean;
  role?: 'user' | 'admin';
  suspended?: boolean;
  createdAt?: string;
}

interface AuthState {
  user: AdminUser | null;
  hasHydrated: boolean;
  setUser: (user: AdminUser | null) => void;
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
      name: 'ibadah-admin-auth',
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
