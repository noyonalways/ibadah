/**
 * Persistent UI state for the admin shell. Keeps the sidebar's
 * collapsed/expanded preference across page reloads via `localStorage`,
 * and exposes a transient `mobileOpen` flag for the off-canvas drawer
 * on small screens.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  /** When true, the rail is shown (icons-only). When false, expanded. */
  sidebarCollapsed: boolean;
  /** Mobile drawer state (NOT persisted). */
  mobileOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setMobileOpen: (v: boolean) => void;
  toggleMobile: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      mobileOpen: false,
      toggleSidebar: () =>
        set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setMobileOpen: (v) => set({ mobileOpen: v }),
      toggleMobile: () => set({ mobileOpen: !get().mobileOpen }),
    }),
    {
      name: 'ibadah-admin-ui',
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
    },
  ),
);
