"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { useInactivityTimer } from "@/hooks/useInactivityTimer";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { ShieldAlert, RefreshCw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((state) => state.token);
  const loading = useAuthStore((state) => state.loading);
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const mobileSidebarOpen = useUIStore((state) => state.mobileSidebarOpen);
  const toggleMobileSidebar = useUIStore((state) => state.toggleMobileSidebar);
  const setMobileSidebar = useUIStore((state) => state.setMobileSidebar);

  const [isHydrated, setIsHydrated] = React.useState(false);

  // Monitor inactividad global
  const { showWarning, countdown, keepSessionAlive, forceLogout } = useInactivityTimer();

  // Asegura la hidratación del Zustand Persist Middleware y despliega la barra lateral por defecto en PC
  React.useEffect(() => {
    setIsHydrated(true);
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      useUIStore.getState().setSidebarCollapsed(false);
    }
  }, []);

  // Cerrar la barra lateral móvil al cambiar de ruta/pathname (al entrar a un modulito)
  React.useEffect(() => {
    setMobileSidebar(false);
  }, [pathname, setMobileSidebar]);

  // Redirección si no está autenticado
  React.useEffect(() => {
    if (isHydrated && !token) {
      router.push("/login");
    }
  }, [isHydrated, token, router]);

  // Loader Clínico si está hidratándose o cargando
  if (!isHydrated || loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#07101f] text-foreground">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-unitepc-sso text-white animate-pulse">
          <Activity className="h-6 w-6" />
        </div>
        <span className="mt-4 font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Sincronizando portal clínico...
        </span>
      </div>
    );
  }

  // Si no hay token, no renderiza para evitar destellos visuales (layout flashes)
  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <OfflineBanner />
      
      {/* Sidebar para Escritorio */}
      <Sidebar />

      {/* Sidebar para Móvil (Drawer overlay) */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={toggleMobileSidebar}
              className="fixed inset-0 z-50 bg-black/60 md:hidden"
            />
            {/* Sidebar Container */}
            <motion.div
              initial={{ x: "-110%" }}
              animate={{ x: 0 }}
              exit={{ x: "-110%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-3 bottom-3 left-3 z-50 w-56 md:hidden"
            >
              <Sidebar isMobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Área Principal de Contenido */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? "md:pl-18" : "md:pl-56"
        }`}
      >
        <Topbar />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 sso-grid overflow-hidden">
          {children}
        </main>
      </div>

      {/* Modal interactivo de alerta de inactividad (15 Minutos) */}
      <AnimatePresence>
        {showWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Glassmorphic Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#07101f]/75 backdrop-blur-md"
            />

            {/* Alerta Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm rounded-2xl border border-destructive/20 bg-card p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive animate-bounce">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">
                    Inactividad Detectada
                  </span>
                  <span className="text-xs text-muted-foreground leading-tight">
                    Tu sesión expirará pronto por seguridad.
                  </span>
                </div>
              </div>

              {/* Temporizador gigante en DM Mono */}
              <div className="my-6 flex flex-col items-center justify-center py-4 rounded-xl bg-secondary/50 border border-border">
                <span className="font-mono text-4xl font-extrabold text-destructive">
                  00:0{countdown}
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-1">
                  Expiración en segundos
                </span>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2">
                <button
                  onClick={keepSessionAlive}
                  className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Mantener Activa
                </button>
                <button
                  onClick={() => forceLogout()}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
                  title="Cerrar Sesión"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Inline helper for Activity icon which is used in loader
function Activity(props: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
