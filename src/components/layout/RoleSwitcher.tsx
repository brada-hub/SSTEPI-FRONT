"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useRoleViewsStore } from "@/stores/roleViewsStore";
import {
  ShieldCheck,
  Stethoscope,
  Heart,
  Apple,
  Pill,
  UserPlus,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ShieldCheck,
  Stethoscope,
  Heart,
  Apple,
  Pill,
  UserPlus,
};

export function RoleSwitcher() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const {
    activeRoleView,
    roleViews,
    setActiveRoleView,
    resetToOriginalRole,
    getActiveViewLabel,
    isRoleViewActive,
  } = useRoleViewsStore();

  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const isAdmin =
    user?.role?.name?.toLowerCase().includes("administrador") ||
    hasPermission("acceso.usuarios-roles");

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    useAuthStore.getState().syncSimulation();
  }, []);

  if (!isAdmin) return null;

  const activeView = roleViews.find((v) => v.id === activeRoleView);

  const handleSelect = (roleId: string | null) => {
    if (roleId === null || roleId === activeRoleView) {
      resetToOriginalRole();
      useAuthStore.getState().syncSimulation();
    } else {
      setActiveRoleView(roleId);
      // Wait for activeRoleView to be set before syncing, but we can also just run it
      // since syncSimulation reads useRoleViewsStore directly.
      setTimeout(() => {
        useAuthStore.getState().syncSimulation();
        window.location.reload();
      }, 0);
      return;
    }
    setOpen(false);
    window.location.reload();
  };

  return (
    <div ref={dropdownRef} className={"relative" + (isRoleViewActive() ? " ml-2" : "")}>
      {isRoleViewActive() ? (
        <div className="flex items-center gap-1.5 rounded-lg border border-accent-teal/30 bg-accent-teal/5 px-2.5 py-1 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-accent-teal">
            {activeView && (() => {
              const Icon = ICON_MAP[activeView.icon];
              return Icon ? <Icon className="h-3.5 w-3.5" /> : null;
            })()}
            <span className="text-accent-teal font-bold">Visualizando como:</span>
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-foreground font-semibold hover:bg-accent-teal/10 transition-colors"
          >
            {activeView?.label}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
          <button
            onClick={() => handleSelect(null)}
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            title="Volver a mi sesión real"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(!open)}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-accent-violet" />
          <span>Supervisor</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl border border-border bg-card shadow-xl overflow-hidden"
          >
            <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
              Cambio rápido de rol
            </div>
            <div className="p-1.5 space-y-0.5">
              {roleViews.map((view) => {
                const Icon = ICON_MAP[view.icon];
                const isActive = activeRoleView === view.id;
                return (
                  <button
                    key={view.id}
                    onClick={() => handleSelect(view.id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                  >
                    <div className={`flex h-7 w-7 items-center justify-center rounded-md border ${view.color}`}>
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                    </div>
                    <span className="flex-1 text-left">{view.label}</span>
                    {isActive && (
                      <span className="flex h-2 w-2 rounded-full bg-accent-teal" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="border-t border-border p-1.5">
              <button
                onClick={() => handleSelect(null)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Volver a mi sesión real
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
