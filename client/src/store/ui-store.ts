/**
 * Persistent UI state for the dashboard shell. Currently keeps the
 * sidebar's collapsed/expanded preference across page reloads via
 * `localStorage` so opening the app feels predictable.
 *
 * Mobile bottom nav and topbar handle their own transient state — this
 * store deliberately does NOT manage those; the rail collapse is a
 * desktop-only concern.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  /** When true, the sidebar collapses to an icon-only rail. */
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
    }),
    {
      name: 'ibadah-ui',
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
    },
  ),
);
