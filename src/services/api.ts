import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

const api = axios.create({
  baseURL: (typeof import.meta !== "undefined" && import.meta.env ? (import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL) : null) || process.env.NEXT_PUBLIC_API_URL || "https://web-production-59875.up.railway.app/api",
  timeout: 15000, // 15 segundos de timeout
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// ✅ Interceptor de Peticiones: Inyectar token desde Zustand (o activar Adaptador Mock en modo demo)
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    // ⚡ Si estamos en sesión de demostración local, NO enviar peticiones al backend real.
    // En su lugar, inyectamos un adaptador mock que resuelve inmediatamente con éxito (200 OK)
    // retornando colecciones vacías o stubs limpios, lo cual previene 100% las pantallas de error de conexión.
    // NOTA: Se excluyen /login y /register para poder iniciar sesión real y salir de la sesión mock.
    if (token.startsWith("mock-") && !config.url?.endsWith("/login") && !config.url?.endsWith("/register")) {
      config.adapter = (cfg: any) => {
        return new Promise((resolve) => {
          let responseData: any = [];
          const url = cfg.url || "";

          if (url.includes("/me")) {
            responseData = {
              user: {
                id: 999,
                nombre: "Personal",
                apellidos: "Clínico Demo",
                email: "demo@sstepi.com",
                rol: { 
                  id: 4, 
                  nombre: "Demostración", 
                  permissions: ["acceso.dashboard", "acceso.pacientes", "acceso.estacion-enfermeria", "acceso.nutricion"] 
                }
              }
            };
          } else if (url.includes("/pacientes")) {
            responseData = [];
          } else if (url.includes("/signos")) {
            responseData = [];
          } else if (url.includes("/estacion-enfermeria")) {
            responseData = [];
          } else if (url.includes("/medicamentos")) {
            responseData = [
              { id: 1, nombre: "Paracetamol", descripcion: "Analgésico y antipirético para fiebre y dolor leve." },
              { id: 2, nombre: "Ketorolaco", descripcion: "AINE potente para dolor agudo de moderado a severo." },
              { id: 3, nombre: "Amoxicilina con Ácido Clavulánico", descripcion: "Antibiótico de amplio espectro bacteriano." },
              { id: 4, nombre: "Solución Salina 0.9%", descripcion: "Suero fisiológico para hidratación y soporte IV." },
              { id: 5, nombre: "Omeprazol", descripcion: "Protector gástrico para úlceras y reflujo." }
            ];
          } else if (url.includes("/dietas") || url.includes("/nutricion") || url.includes("/alimentacion")) {
            responseData = [];
          } else {
            responseData = {};
          }

          resolve({
            data: responseData,
            status: 200,
            statusText: "OK",
            headers: {},
            config: cfg,
          });
        });
      };
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 📌 Interceptor de Respuestas: Diagnóstico Granular de Red e Integración
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // 1. Diagnóstico de CORS o Bloqueo Preflight
    if (error.message === "Network Error" && !error.response) {
      console.error("❌ Fallo de Preflight CORS: El servidor Laravel en Railway no está autorizando este origen o los encabezados.");
      error.message = "Fallo de comunicación CORS: Origen o cabecera no permitidos por el servidor.";
    }

    // 2. Diagnóstico de Timeout
    else if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      console.error("⏱️ Timeout de Petición HTTP: La solicitud clínica excedió el límite de 15 segundos.");
      error.message = "La solicitud clínica ha tardado demasiado. Verifique la carga del servidor.";
    }

    // 3. Diagnóstico de Desconexión Física / Offline
    else if (error.code === "ERR_NETWORK" || (typeof window !== "undefined" && !window.navigator.onLine)) {
      console.error("❌ Conectividad Perdida: El cliente está offline o el backend de Laravel está completamente apagado.");
      error.message = "Estación sin conexión. El servidor central de salud no responde.";
    }

    // 4. Manejar 401 Expirado (evitando loops en login/logout y sesiones mock)
    else if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest.url?.endsWith("/logout") &&
      !originalRequest.url?.endsWith("/login")
    ) {
      const currentToken = useAuthStore.getState().token;

      // ⚡ Si estamos en sesión de demostración mock, ignorar 401 de peticiones residuales
      if (currentToken && currentToken.startsWith("mock-")) {
        return Promise.reject(error);
      }

      console.warn("⚠️ Sesión expirada o inválida (401). Cerrando sesión...");
      
      // Limpiar Zustand Auth Store
      useAuthStore.getState().logout();
      
      // Redirigir de forma segura al login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
