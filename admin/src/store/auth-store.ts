import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Admin user shape — mirrors the server's `SafeUser` payload exactly.
 * The admin panel inspects `role === 'admin'` on every guarded screen
 * and signs out non-admins automatically.
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
  role: 'user' | 'admin';
  suspended: boolean;
  lastActiveAt?: string;
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

export const isAdmin = (u: AdminUser | null | undefined): boolean =>
  !!u && u.role === 'admin' && !u.suspended;
