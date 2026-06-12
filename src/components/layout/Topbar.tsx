"use client";

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { useRoleViewsStore } from "@/stores/roleViewsStore";
import { useQueryClient } from "@tanstack/react-query";
import { RoleSwitcher } from "@/components/layout/RoleSwitcher";
import { toast } from "sonner";
import { 
  Clock, 
  Bell, 
  Sun, 
  Moon, 
  User, 
  LogOut, 
  Hospital,
  Menu
} from "lucide-react";

// Presets de usuarios para cambio rápido en demostración comercial
const DEMO_USERS = [
  {
    roleName: "Admin: Brayan Padilla",
    username: "admin",
    name: "Brayan Padilla",
    role: { id: 1, name: "Administrador General", permissions: [
      "acceso.dashboard", "acceso.pacientes", "acceso.admision", 
      "acceso.estacion-enfermeria", "acceso.nutricion", "acceso.medicamentos", 
      "acceso.hospital", "acceso.usuarios-roles"
    ]}
  },
  {
    roleName: "Médico: Dr. Vegas",
    username: "medico",
    name: "Dr. Vegas",
    role: { id: 2, name: "Médico de Guardia", permissions: [
      "acceso.dashboard", "acceso.pacientes", "acceso.admision", 
      "acceso.estacion-enfermeria", "acceso.hospital", "acceso.mis-pacientes"
    ]}
  },
  {
    roleName: "Enfermera: Lic. Clara",
    username: "enfermera",
    name: "Lic. Clara",
    role: { id: 3, name: "Lic. Enfermería", permissions: [
      "acceso.dashboard", "acceso.pacientes", "acceso.estacion-enfermeria"
    ]}
  },
  {
    roleName: "Nutricionista: Lic. Rivas",
    username: "nutri",
    name: "Lic. Rivas",
    role: { id: 4, name: "Nutricionista Clínico", permissions: [
      "acceso.dashboard", "acceso.nutricion"
    ]}
  }
];

export function Topbar() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const activeHospital = useAuthStore((state) => state.hospital);
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();
  
  const { 
    activeGuardShift, 
    setActiveGuardShift, 
    toggleMobileSidebar,
    toggleSidebar
  } = useUIStore();

  const handleDemoUserSwitch = async (userPreset: typeof DEMO_USERS[number]) => {
    // 1. Limpiar cualquier Role View Switcher activa (que podría sobreescribir permisos)
    useRoleViewsStore.getState().resetToOriginalRole();
    
    try {
      // Intentar iniciar sesión real en el backend Laravel usando Axios
      const { default: api } = await import("@/services/api");
      const response = await api.post("/login", {
        email: userPreset.username,
        password: "12345678",
      });

      const { access_token, user: backendUser } = response.data;

      const userSession = {
        id: backendUser.id,
        name: `${backendUser.nombre || userPreset.name} ${backendUser.apellidos || ""}`.trim(),
        username: backendUser.email,
        email: backendUser.email,
        role: {
          id: backendUser.rol?.id || backendUser.rol_id || userPreset.role.id,
          name: backendUser.rol?.nombre || userPreset.role.name,
          permissions: backendUser.rol?.permissions?.map((p: any) => p.nombre || p.name) || 
                       backendUser.permissions?.map((p: any) => p.nombre || p.name) || 
                       userPreset.role.permissions,
        },
        permissions: backendUser.permissions || [],
      };

      const hospitalSession = {
        id: backendUser.hospital_id || 1,
        name: backendUser.hospital?.nombre || "Hospital General SSTEPI",
      };

      // Guardar la sesión real de Laravel en el Zustand Store
      useAuthStore.setState({
        user: userSession,
        realUser: userSession,
        token: access_token,
        hospital: hospitalSession,
      });

      queryClient.clear();
      toast.success(`Sesión real iniciada como: ${userPreset.roleName}`);
      
      // Forzar recarga limpia en el dashboard para aplicar todo el estado real
      navigate("/dashboard");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 100);
      return;

    } catch (apiError: any) {
      console.warn("⚠️ Falló el login demo en tiempo real, aplicando sesión local mock:", apiError);
    }

    // 2. Si falla el login real (ej. backend apagado), aplicar fallback MOCK local
    const userSession = {
      id: 999,
      name: userPreset.name,
      username: userPreset.username,
      email: `${userPreset.username}@sstepi.com`,
      role: userPreset.role,
      permissions: [],
    };
    
    const hospitalSession = {
      id: 1,
      name: "Hospital General SSTEPI",
    };

    useAuthStore.setState({
      user: userSession,
      realUser: userSession,
      token: `mock-jwt-token-sstepi-2026-${userPreset.username}`,
      hospital: hospitalSession,
    });

    queryClient.clear();
    toast.success(`Sesión de demostración (local) activa: ${userPreset.roleName}`);
    
    navigate("/dashboard");
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 100);
  };

  const [time, setTime] = React.useState("");

  // Sincronizar reloj clínico local
  React.useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md transition-all duration-300 md:px-6">
      {/* Sección Izquierda: Toggle Móvil y Hospital */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (window.innerWidth < 768) {
              toggleMobileSidebar();
            } else {
              toggleSidebar();
            }
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-secondary transition-all"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-unitepc-sso text-white shadow-sm shadow-indigo-500/20">
            <Hospital className="h-4.5 w-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold leading-none text-muted-foreground uppercase tracking-wider">
              Centro Activo
            </span>
            <span className="text-sm font-bold text-foreground leading-tight">
              {activeHospital?.name || "Hospital General SSTEPI"}
            </span>
          </div>
        </div>
      </div>

      {/* Sección Derecha: Guardia, Reloj, Notificaciones, Tema, Perfil */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Selector de Estado de Guardia (Turno) */}
        <div className="relative hidden sm:inline-block">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1 text-xs font-medium">
            <span className={`inline-block h-2 w-2 rounded-full ${
              activeGuardShift === "Turno Activo" ? "bg-accent-teal animate-pulse" :
              activeGuardShift === "Guardia Pasiva" ? "bg-accent-amber" : "bg-muted-foreground"
            }`} />
            <select
              value={activeGuardShift}
              onChange={(e) => setActiveGuardShift(e.target.value as any)}
              className="bg-transparent font-medium text-foreground outline-none cursor-pointer pr-1"
            >
              <option value="Turno Activo">Turno Activo</option>
              <option value="Guardia Pasiva">Guardia Pasiva</option>
              <option value="Receso">Receso</option>
            </select>
          </div>
        </div>

        {/* Role View Switcher - solo visible para administradores */}
        <RoleSwitcher />

        {/* Selector de Usuario Demo Rápido en Caliente */}
        <div className="relative inline-block border-l border-border pl-2 md:pl-3">
          <div className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50/60 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
            <span className="hidden lg:inline text-indigo-500">Demo:</span>
            <select
              value={user?.username || ""}
              onChange={(e) => {
                const selected = DEMO_USERS.find(u => u.username === e.target.value);
                if (selected) handleDemoUserSwitch(selected);
              }}
              className="bg-transparent font-bold outline-none cursor-pointer text-indigo-900 border-none text-[10px] pr-1.5 focus:ring-0 focus:outline-none"
            >
              <option value="" disabled>Simular Rol...</option>
              {DEMO_USERS.map(u => (
                <option key={u.username} value={u.username}>{u.roleName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Reloj Clínico Sincronizado */}
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1 text-xs font-mono font-medium text-foreground">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{time || "00:00:00"}</span>
        </div>

        {/* Campana de Notificaciones Operativas */}
        <button className="group relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background hover:bg-secondary text-foreground transition-all">
          <Bell className="h-4.5 w-4.5 transition-transform group-hover:scale-110" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white shadow-sm ring-2 ring-card animate-bounce">
            3
          </span>
        </button>

        {/* Toggle Dark / Light Mode */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background hover:bg-secondary text-foreground transition-all"
          aria-label="Cambiar Tema"
        >
          <Sun className="hidden h-4.5 w-4.5 text-accent-amber transition-transform dark:block dark:rotate-0 dark:scale-100" />
          <Moon className="block h-4.5 w-4.5 text-accent-violet transition-transform rotate-0 scale-100 dark:hidden dark:scale-0" />
        </button>

        {/* Perfil de Usuario */}
        <div className="flex items-center gap-2 border-l border-border pl-2 md:pl-4">
          <div className="flex items-center gap-2 cursor-pointer select-none">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary font-bold text-sm ring-1 ring-border">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
            </div>
            <div className="hidden flex-col text-left md:flex">
              <span className="text-xs font-bold leading-tight text-foreground">
                {user?.name || "Dr. Vegas"}
              </span>
              <span className="text-[10px] font-medium leading-none text-muted-foreground">
                {user?.role?.name || "Médico de Guardia"}
              </span>
            </div>
            <button
              onClick={() => logout()}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
              title="Cerrar Sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
