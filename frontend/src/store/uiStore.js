import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * UI Store - sidebar collapse state.
 *
 * There is deliberately no theme state here. The palette in `index.css` is a
 * single light theme and `dark:` is used nowhere, so a toggle would persist a
 * value that changes nothing on screen. Add `@custom-variant dark` plus the
 * `dark:` classes first, then reintroduce the toggle.
 */
export const useUIStore = create(
  persist(
    (set) => ({
      sidebarOpen: true,

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (val) => set({ sidebarOpen: val }),
    }),
    {
      name: "admin-ui",
      partialize: (s) => ({ sidebarOpen: s.sidebarOpen }),
    },
  ),
);
