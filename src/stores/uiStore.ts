import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  activeGuardShift: "Turno Activo" | "Guardia Pasiva" | "Receso";
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebar: (open: boolean) => void;
  setActiveGuardShift: (shift: "Turno Activo" | "Guardia Pasiva" | "Receso") => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      activeGuardShift: "Turno Activo",

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleMobileSidebar: () =>
        set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
      setMobileSidebar: (open) => set({ mobileSidebarOpen: open }),
      setActiveGuardShift: (shift) => set({ activeGuardShift: shift }),
    }),
    {
      name: "sstepi-ui-storage",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        activeGuardShift: state.activeGuardShift,
      }),
    }
  )
);
