import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useRoleViewsStore } from "@/stores/roleViewsStore";

export interface Permission {
  id: number;
  name: string;
  pivot?: {
    permitido: boolean;
  };
}

export interface Role {
  id: number;
  name: string;
  permissions: string[];
}

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role?: Role;
  permissions?: Permission[];
}

export interface Hospital {
  id: number;
  name: string;
  address?: string;
  telephone?: string;
}

interface AuthState {
  user: User | null;
  realUser: User | null;
  token: string | null;
  hospital: Hospital | null;
  loading: boolean;
  setSession: (user: User | null, token: string | null) => void;
  setHospital: (hospital: Hospital | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  hasPermission: (permissionName: string) => boolean;
  refreshSession: () => Promise<void>;
  syncSimulation: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      realUser: null,
      token: null,
      hospital: null,
      loading: false,

      setSession: (user, token) => set({ user, realUser: user, token }),
      setHospital: (hospital) => set({ hospital }),
      setLoading: (loading) => set({ loading }),
      logout: () => set({ user: null, realUser: null, token: null, hospital: null }),

      refreshSession: async () => {
        const { token } = get();
        if (!token) return;

        // ⚡ Si el token es de demostración local, no llamar al backend para evitar 401 y deslogueos indeseados
        if (token.startsWith("mock-")) {
          return;
        }

        try {
          const { default: api } = await import("@/services/api");
          const response = await api.get<{ user: any }>("/me");
          const rawUser = response.data?.user;
          
          if (rawUser) {
            // ✅ Normalizar la estructura de Laravel a la interfaz de Zustand del frontend
            const mappedUser: User = {
              id: rawUser.id,
              name: rawUser.nombre && rawUser.apellidos 
                ? `${rawUser.nombre} ${rawUser.apellidos}` 
                : (rawUser.name || "Personal Clínico"),
              username: rawUser.email,
              email: rawUser.email,
              role: rawUser.rol ? {
                id: rawUser.rol.id,
                name: rawUser.rol.nombre,
                permissions: rawUser.rol.permissions?.map((p: any) => p.nombre || p.name) || [],
              } : undefined,
              permissions: rawUser.permissions || [],
            };
            set({ user: mappedUser, realUser: mappedUser });
            get().syncSimulation();
          }
        } catch (error) {
          console.error("🔥 Error al refrescar sesión en Laravel:", error);
          // Si el servidor responde con 401, el interceptor en api.ts
          // se encargará automáticamente del deslogueo y redirección.
        }
      },

      syncSimulation: () => {
        const { realUser, user, token } = get();

        // ⚡ No sincronizar si estamos en una sesión de demostración mock
        // (el RoleSwitcher del admin podría sobreescribir los permisos del rol demo)
        if (token && token.startsWith("mock-")) {
          return;
        }

        const actualRealUser = realUser || user;
        if (!actualRealUser) return;

        const rvState = useRoleViewsStore.getState();
        if (rvState.activeRoleView) {
          const view = rvState.roleViews.find((v) => v.id === rvState.activeRoleView);
          if (view) {
            set({
              realUser: actualRealUser,
              user: {
                ...actualRealUser,
                role: {
                  id: actualRealUser.role?.id ?? 0,
                  name: view.id,
                  permissions: view.permissions,
                },
              },
            });
          }
        } else {
          set({
            user: actualRealUser,
            realUser: actualRealUser,
          });
        }
      },

      hasPermission: (permissionName: string) => {
        const { user } = get();
        if (!user) return false;

        // 0. Role View Switcher: si el admin está visualizando como otro rol,
        //    evaluar contra los permisos del rol activo en lugar del real.
        const rvState = useRoleViewsStore.getState();
        if (rvState.activeRoleView) {
          const viewPermissions = rvState.getViewPermissions();
          return viewPermissions.includes(permissionName);
        }

        // 1. Direct permission overrides evaluation (user-specific pivot)
        if (user.permissions && Array.isArray(user.permissions)) {
          const directOverride = user.permissions.find((p: any) => {
            const name = typeof p === "string" ? p : (p.name || p.nombre);
            return name === permissionName;
          });
          if (directOverride && typeof directOverride === "object" && "pivot" in directOverride) {
            const pivot = (directOverride as any).pivot;
            if (pivot && typeof pivot.permitido !== "undefined") {
              return !!pivot.permitido; // true or false override
            }
          }
        }

        // 2. Role-based inherited permissions evaluation (soporta rol/role y strings/objetos)
        const role = user.role || (user as any).rol;
        if (role && role.permissions) {
          return role.permissions.some((p: any) => {
            const name = typeof p === "string" ? p : (p.nombre || p.name);
            return name === permissionName;
          });
        }

        return false;
      },
    }),
    {
      name: "sstepi-auth-storage",
      partialize: (state) => ({
        user: state.user,
        realUser: state.realUser,
        token: state.token,
        hospital: state.hospital,
      }),
    }
  )
);
