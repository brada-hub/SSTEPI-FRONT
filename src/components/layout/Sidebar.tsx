"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { useRoleViewsStore } from "@/stores/roleViewsStore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  FolderHeart, 
  UserPlus, 
  Activity, 
  Apple, 
  Pill, 
  Building2, 
  Users2, 
  ShieldCheck,
  Stethoscope,
  LogOut
} from "lucide-react";

interface SidebarLink {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string;
  badge?: string | number;
  badgeColor?: string;
}

interface LinkGroup {
  groupName: string;
  items: SidebarLink[];
}

export function Sidebar({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const logout = useAuthStore((state) => state.logout);
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, toggleMobileSidebar } = useUIStore();
  const activeRoleView = useRoleViewsStore((state) => state.activeRoleView);

  const navigation: LinkGroup[] = [
    {
      groupName: "Clínico",
      items: [
        {
          name: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          permission: "acceso.dashboard",
        },
        {
          name: "Pacientes",
          href: "/pacientes",
          icon: FolderHeart,
          permission: "acceso.pacientes",
          badge: 42,
          badgeColor: "bg-primary/10 text-primary",
        },
        {
          name: "Admisión",
          href: "/admision",
          icon: UserPlus,
          permission: "acceso.admision",
        },
        {
          name: "Mis Pacientes",
          href: "/mis-pacientes",
          icon: Stethoscope,
          permission: "acceso.mis-pacientes",
        },
        {
          name: "Enfermería",
          href: "/estacion-enfermeria",
          icon: Activity,
          permission: "acceso.estacion-enfermeria",
          badge: "Alarma",
          badgeColor: "bg-destructive/10 text-destructive animate-pulse",
        },
        {
          name: "Nutrición",
          href: "/nutricion",
          icon: Apple,
          permission: "acceso.nutricion",
        },
      ],
    },
    {
      groupName: "Logística",
      items: [
        {
          name: "Farmacia",
          href: "/medicamentos",
          icon: Pill,
          permission: "acceso.medicamentos",
          badge: "Bajo",
          badgeColor: "bg-accent-amber/10 text-accent-amber",
        },
      ],
    },
    {
      groupName: "Administración",
      items: [
        {
          name: "Hospital",
          href: "/gestion-hospital",
          icon: Building2,
          permission: "acceso.hospital",
        },
        {
          name: "Personal & Roles",
          href: "/usuarios-y-roles",
          icon: Users2,
          permission: "acceso.usuarios-roles",
        },
      ],
    },

  ];

  // Filtra los grupos que tienen items permitidos
  const allowedNavigation = navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(item.permission)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside
      className={`z-50 flex flex-col bg-sidebar transition-all duration-300 overflow-hidden ${
        isMobile
          ? "h-full w-full rounded-2xl border border-border shadow-2xl flex"
          : `fixed top-0 bottom-0 left-0 border-r border-border ${sidebarCollapsed ? "w-18" : "w-56"} hidden md:flex`
      }`}
    >
      {/* Cabecera / Logo */}
      <div 
        className={`flex border-b border-border transition-all duration-300 ${
          (isMobile || !sidebarCollapsed) 
            ? "flex-col py-6 px-4 items-center justify-center gap-3 text-center" 
            : "h-14 items-center justify-center px-2"
        }`}
      >
        <Link 
          href="/dashboard" 
          className={`flex overflow-hidden select-none transition-all duration-300 ${
            (isMobile || !sidebarCollapsed) 
              ? "flex-col items-center gap-2" 
              : "items-center justify-center"
          }`}
        >
          <div className="flex items-center justify-center shrink-0">
            <img 
              src="/SSTEPI.png" 
              alt="SSTEPI Logo" 
              className={`object-contain transition-all duration-300 ${
                (isMobile || !sidebarCollapsed) 
                  ? "h-24 w-auto max-w-[160px] hover:scale-105" 
                  : "h-6 w-6"
              }`}
            />
          </div>
          <AnimatePresence>
            {(isMobile || !sidebarCollapsed) && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center"
              >
                <span className="font-sans text-[11px] font-black tracking-widest text-slate-500 uppercase">
                  SSTEPI CLÍNICO
                </span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1.5 text-center">
                  SISTEMA DE SEGUIMIENTO Y EVOLUCIÓN
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navegación Principal */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-6">
        {allowedNavigation.map((group) => (
          <div key={group.groupName} className="space-y-1.5">
            {/* Header del grupo */}
            <AnimatePresence>
              {(isMobile || !sidebarCollapsed) && (
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest"
                >
                  {group.groupName}
                </motion.h3>
              )}
            </AnimatePresence>

            {/* Enlaces de navegación */}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const showLabels = isMobile || !sidebarCollapsed;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      title={!showLabels ? item.name : undefined}
                      className={`group relative flex h-9 items-center justify-between rounded-lg px-3 text-xs font-semibold transition-all duration-300 ${
                        isActive
                          ? "bg-secondary text-primary font-bold shadow-sm"
                          : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-105 ${
                            isActive ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                        <AnimatePresence>
                          {showLabels && (
                            <motion.span
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={{ duration: 0.15 }}
                            >
                              {item.name}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Insignia / Badge */}
                      {showLabels && item.badge && (
                        <span
                          className={`flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1.5 text-[9px] font-bold leading-none ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {/* Tooltip flotante para sidebar colapsado (desktop) */}
                      {!showLabels && (
                        <span className="pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1 text-[10px] font-bold text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                          {item.name}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Pie / Botón de Cerrar Sesión */}
      <div className="border-t border-border p-2">
        <button
          onClick={() => logout()}
          className={`flex h-9 w-full items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300 ${
            sidebarCollapsed ? "justify-center" : "px-3 gap-2.5 text-xs font-semibold"
          }`}
          title={sidebarCollapsed ? "Cerrar sesión" : undefined}
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap"
              >
                Cerrar sesión
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </aside>
  );
}
