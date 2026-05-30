"use client";

import * as React from "react";
import { 
  QueryClient, 
  QueryClientProvider, 
  QueryCache, 
  MutationCache 
} from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster, toast } from "sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            // Evitar tostar ante consultas en segundo plano transparentes
            if (query.state.data !== undefined) return;

            // ⚡ Silenciar errores de demo (sesiones mock sin backend)
            if ((error as any)?.__isDemo) return;
            
            console.error("🔥 Error de Consulta en Servidor Laravel:", error);
            toast.error(`Error Clínico: No se pudo consultar la información. (${error.message})`);
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            // ⚡ Silenciar errores de demo (sesiones mock sin backend)
            if ((error as any)?.__isDemo) return;

            console.error("🔥 Error de Mutación/Cambio en Servidor Laravel:", error);
            toast.error(`Error de Operación: No se pudo guardar el registro médico. (${error.message})`);
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            // Retry strategies robusta: reintentar 2 veces en fallos de GET con backoff exponencial
            retry: (failureCount, error: any) => {
              if (error?.response?.status === 401 || error?.response?.status === 403) {
                return false; // No reintentar fallos de credenciales
              }
              if (error?.__isDemo) return false; // No reintentar en modo demo
              return failureCount < 2;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Mutation safety: no reintentar nunca fallos de escrituras para prevenir duplicaciones clínicas
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        {children}
        {/* Dispensador global de toasts clínicos premium */}
        <Toaster 
          position="bottom-right" 
          theme="dark" 
          toastOptions={{
            style: {
              background: "var(--card)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-sans)",
            }
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
