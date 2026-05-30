"use client";

import * as React from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";
import "@/app/globals.css";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  React.useEffect(() => {
    console.error("🔥 Error crítico capturado en Global Boundary:", error);
  }, [error]);

  return (
    <html lang="es" className="h-full">
      <body className="flex h-full min-h-screen flex-col items-center justify-center bg-[#07101f] px-4 text-center font-sans antialiased text-xs text-foreground">
        <div className="relative z-10 w-full max-w-md rounded-2xl border border-destructive/20 bg-card p-6 shadow-2xl space-y-4">
          
          {/* Logo */}
          <div className="flex flex-col items-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20 animate-pulse">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-sm font-extrabold text-foreground uppercase tracking-wider">
              Fallo Crítico Global
            </h2>
            <p className="mt-1 text-[10px] text-muted-foreground max-w-xs font-medium">
              SSTEPI ha experimentado un desbordamiento general en el enrutamiento primario.
            </p>
          </div>

          {/* Detalle */}
          <div className="rounded-lg bg-secondary/50 border border-border p-3 text-[10px] text-muted-foreground font-mono text-left max-h-32 overflow-y-auto">
            <span className="font-bold text-foreground">Excepción Primaria:</span>
            <p className="mt-1 leading-relaxed break-all">
              {error.message || "Excepción de referencia nula del navegador."}
            </p>
          </div>

          {/* Botón */}
          <button
            onClick={() => reset()}
            className="w-full flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-white shadow-sm hover:bg-primary/95 transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Restablecer Portal Clínico
          </button>

        </div>
      </body>
    </html>
  );
}
