"use client";

import * as React from "react";
import { ShieldAlert, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundaryPage({ error, reset }: ErrorProps) {
  React.useEffect(() => {
    // Reportar excepcion a consolas o servicios de telemetria
    console.error("🔥 Error capturado por Boundary de App Router:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#07101f] px-4 text-center font-sans antialiased text-xs">
      <div className="absolute top-1/3 left-1/3 h-[300px] w-[300px] rounded-full bg-destructive/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-destructive/20 bg-card p-6 shadow-2xl space-y-4">
        
        {/* Logo/Icono */}
        <div className="flex flex-col items-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20 animate-pulse">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-sm font-extrabold text-foreground uppercase tracking-wider">
            Anomalía Clínica de Sistema
          </h2>
          <p className="mt-1 text-[10px] text-muted-foreground max-w-xs font-medium">
            El enrutador ha capturado una excepción técnica no controlada en el portal de SSTEPI.
          </p>
        </div>

        {/* Mensaje de Error */}
        <div className="rounded-lg bg-secondary/50 border border-border p-3 text-[10px] text-muted-foreground font-mono text-left max-h-32 overflow-y-auto">
          <span className="font-bold text-foreground">Detalle Técnico:</span>
          <p className="mt-1 leading-relaxed break-all">
            {error.message || "Excepción de referencia nula o falta de conexión."}
          </p>
        </div>

        {/* Controles de Acción */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-white shadow-sm hover:bg-primary/95 transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Restablecer Canal
          </button>
          
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-4 text-xs font-bold text-foreground hover:bg-secondary transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver
          </Link>
        </div>

      </div>
    </div>
  );
}
