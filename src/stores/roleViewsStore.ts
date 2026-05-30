import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RoleViewDefinition {
  id: string;
  label: string;
  icon: string;
  color: string;
  permissions: string[];
}

const ROLE_VIEWS: RoleViewDefinition[] = [
  {
    id: "administrador",
    label: "Administrador",
    icon: "ShieldCheck",
    color: "text-accent-violet bg-accent-violet/10 border-accent-violet/20",
    permissions: [
      "acceso.dashboard", "acceso.pacientes", "acceso.admision",
      "acceso.estacion-enfermeria", "acceso.nutricion", "acceso.medicamentos",
      "acceso.hospital", "acceso.usuarios-roles",
      "acceso.mis-pacientes", "acceso.panel-internacion"
    ],
  },
  {
    id: "medico",
    label: "Médico",
    icon: "Stethoscope",
    color: "text-primary bg-primary/10 border-primary/20",
    permissions: [
      "acceso.dashboard", "acceso.pacientes", "acceso.admision",
      "acceso.estacion-enfermeria", "acceso.hospital",
      "acceso.mis-pacientes", "acceso.panel-internacion"
    ],
  },
  {
    id: "enfermeria",
    label: "Enfermería",
    icon: "Heart",
    color: "text-accent-teal bg-accent-teal/10 border-accent-teal/20",
    permissions: [
      "acceso.dashboard", "acceso.pacientes", "acceso.estacion-enfermeria",
      "acceso.panel-internacion"
    ],
  },
  {
    id: "nutricion",
    label: "Nutrición",
    icon: "Apple",
    color: "text-accent-amber bg-accent-amber/10 border-accent-amber/20",
    permissions: [
      "acceso.dashboard", "acceso.pacientes", "acceso.mis-pacientes", "acceso.nutricion", "acceso.panel-internacion"
    ],
  },
  {
    id: "farmacia",
    label: "Farmacia",
    icon: "Pill",
    color: "text-accent-violet bg-accent-violet/10 border-accent-violet/20",
    permissions: [
      "acceso.dashboard", "acceso.medicamentos",
    ],
  },
  {
    id: "admision",
    label: "Admisión",
    icon: "UserPlus",
    color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
    permissions: [
      "acceso.dashboard", "acceso.pacientes", "acceso.admision",
    ],
  },
];

interface RoleViewsState {
  activeRoleView: string | null;
  roleViews: RoleViewDefinition[];
  setActiveRoleView: (roleId: string | null) => void;
  resetToOriginalRole: () => void;
  getViewPermissions: () => string[];
  isRoleViewActive: () => boolean;
  getActiveViewLabel: () => string;
}

export const useRoleViewsStore = create<RoleViewsState>()(
  persist(
    (set, get) => ({
      activeRoleView: null,
      roleViews: ROLE_VIEWS,

      setActiveRoleView: (roleId) => set({ activeRoleView: roleId }),

      resetToOriginalRole: () => set({ activeRoleView: null }),

      getViewPermissions: () => {
        const { activeRoleView, roleViews } = get();
        if (!activeRoleView) return [];
        const view = roleViews.find((v) => v.id === activeRoleView);
        return view?.permissions ?? [];
      },

      isRoleViewActive: () => get().activeRoleView !== null,

      getActiveViewLabel: () => {
        const { activeRoleView, roleViews } = get();
        if (!activeRoleView) return "";
        const view = roleViews.find((v) => v.id === activeRoleView);
        return view?.label ?? "";
      },
    }),
    {
      name: "sstepi-roleviews-storage",
      partialize: (state) => ({
        activeRoleView: state.activeRoleView,
      }),
    }
  )
);
