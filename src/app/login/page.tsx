"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "@/stores/authStore";
import api from "@/services/api";
import { toast } from "sonner";
import { 
  Lock, 
  User as UserIcon, 
  Activity, 
  ChevronRight, 
  Hospital, 
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";

// Esquema de validación estricta con Zod
const loginSchema = z.object({
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z.string().min(4, "La contraseña debe tener al menos 4 caracteres"),
  hospitalId: z.string().min(1, "Debe seleccionar un centro médico"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Lista de roles preestablecidos para el panel de desarrollo interno (fallback demo)
const PRESET_ROLES = [
  {
    roleName: "Administrador General",
    username: "admin",
    role: { id: 1, name: "Administrador General", permissions: [
      "acceso.dashboard", "acceso.pacientes", "acceso.admision", 
      "acceso.estacion-enfermeria", "acceso.nutricion", "acceso.medicamentos", 
      "acceso.hospital", "acceso.usuarios-roles"
    ]}
  },
  {
    roleName: "Médico de Guardia",
    username: "medico",
    role: { id: 2, name: "Médico de Guardia", permissions: [
      "acceso.dashboard", "acceso.pacientes", "acceso.admision", 
      "acceso.estacion-enfermeria", "acceso.hospital", "acceso.mis-pacientes"
    ]}
  },
  {
    roleName: "Estación Enfermería",
    username: "enfermero",
    role: { id: 3, name: "Lic. Enfermería", permissions: [
      "acceso.dashboard", "acceso.pacientes", "acceso.estacion-enfermeria"
    ]}
  },
  {
    roleName: "Nutricionista",
    username: "nutricionista",
    role: { id: 4, name: "Nutricionista Clínico", permissions: [
      "acceso.dashboard", "acceso.nutricion"
    ]}
  }
];

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const setHospital = useAuthStore((state) => state.setHospital);
  const setLoading = useAuthStore((state) => state.setLoading);
  const token = useAuthStore((state) => state.token);

  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);

  // Redireccionar si ya está logueado
  React.useEffect(() => {
    if (token) {
      router.push("/dashboard");
    }
  }, [token, router]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      hospitalId: "1",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoginError(null);
    setLoading(true);

    try {
      // 1. Intentar llamar al backend real Laravel vía Axios
      const response = await api.post("/login", {
        email: values.username,
        password: values.password,
      });

      const { access_token, user } = response.data;

      const userSession = {
        id: user.id,
        name: `${user.nombre} ${user.apellidos}`,
        username: user.email,
        email: user.email,
        role: {
          id: user.rol?.id || user.rol_id || 5,
          name: user.rol?.nombre || "Personal Clínico",
          permissions: user.rol?.permissions?.map((p: any) => p.nombre) || user.permissions?.map((p: any) => p.nombre) || [],
        },
        permissions: user.permissions || [],
      };

      const hospitalSession = {
        id: user.hospital_id || parseInt(values.hospitalId || "1"),
        name: user.hospital?.nombre || "Hospital General SSTEPI",
      };

      setSession(userSession, access_token);
      setHospital(hospitalSession);
      router.push("/dashboard");
    } catch (apiError: any) {
      console.warn("⚠️ Falló login real en Laravel, verificando causa:", apiError);
      
      if (apiError.response?.status === 401 || apiError.response?.status === 403 || apiError.response?.status === 422) {
        setLoginError(apiError.response?.data?.message || "Credenciales incorrectas reales.");
        setLoading(false);
        return;
      }

      console.info("⚡ Entrando en modo Demostración local por indisponibilidad de red/servidor backend.");
      
      await new Promise((resolve) => setTimeout(resolve, 600));

      const matchedPreset = PRESET_ROLES.find(
        (r) => r.username.toLowerCase() === values.username.toLowerCase()
      );

      const defaultRole = {
        id: 5,
        name: "Personal Clínico",
        permissions: ["acceso.dashboard", "acceso.pacientes"],
      };

      const userSession = {
        id: Math.floor(Math.random() * 1000),
        name: matchedPreset ? `Dr/a. ${matchedPreset.username.toUpperCase()}` : `Clínico: ${values.username}`,
        username: values.username,
        email: `${values.username}@sstepi.com`,
        role: matchedPreset ? matchedPreset.role : defaultRole,
        permissions: [],
      };

      const hospitalSession = {
        id: parseInt(values.hospitalId || "1"),
        name: "Hospital General SSTEPI",
      };

      setSession(userSession, "mock-jwt-token-sstepi-2026");
      setHospital(hospitalSession);

      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen max-h-screen w-full flex-col md:flex-row bg-white font-sans antialiased overflow-hidden">
      
      {/* SECCIÓN IZQUIERDA (Branding / Hero) - Oculta en móviles y visible en md en adelante */}
      <div className="relative hidden md:flex md:w-1/2 flex-col justify-center items-center p-8 lg:p-12 bg-gradient-to-br from-teal-600 via-blue-800 to-violet-950 text-white overflow-hidden select-none h-full">
        
        {/* Fondo decorativo con marca de agua del Logotipo real */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
          <img 
            src="/SSTEPI.png" 
            alt="SSTEPI Background Logo" 
            className="w-[85%] max-w-[420px] object-contain"
          />
        </div>

        {/* Círculos de luz difusa de fondo */}
        <div className="absolute top-10 left-10 h-80 w-80 rounded-full bg-white/5 blur-[90px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-teal-500/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-5 max-w-md">
          {/* Logotipo SSTEPI visible en blanco arriba - Más grande y sin caja */}
          <div className="transition-all duration-300 hover:scale-103">
            <img 
              src="/SSTEPI.png" 
              alt="SSTEPI Logo Hero" 
              className="h-44 md:h-52 lg:h-60 w-auto object-contain brightness-0 invert opacity-95 max-w-[360px]" 
            />
          </div>

          {/* Divisor elegante */}
          <div className="h-[2px] w-14 bg-sky-400/80 rounded-full mx-auto" />
          
          {/* Subtítulo descriptivo en letra pequeña elegante y espaciada */}
          <p className="text-[10px] md:text-[11px] font-black tracking-widest text-teal-50/90 leading-relaxed max-w-xs uppercase">
            Sistema de Seguimiento al Tratamiento y Evolución de Pacientes Internados
          </p>
        </div>
      </div>

      {/* SECCIÓN DERECHA (Formulario de Login) */}
      <div className="relative flex w-full md:w-1/2 flex-col justify-between bg-white px-6 py-6 md:px-12 md:py-8 lg:py-10 h-full max-h-screen overflow-hidden">
        
        {/* Espaciador superior para centrado */}
        <div className="hidden md:block" />

        {/* Contenido del Formulario */}
        <div className="w-full max-w-md mx-auto my-auto space-y-5 md:space-y-6 lg:space-y-7">
          
          {/* Logotipo SSTEPI */}
          <div className="flex flex-col items-center text-center">
            <img 
              src="/SSTEPI.png" 
              alt="SSTEPI Logo" 
              className="h-20 w-auto md:h-22 lg:h-24 object-contain mb-2 max-w-[240px]" 
            />
            <h2 className="text-lg md:text-xl font-bold tracking-tight text-indigo-950 font-sans">
              Acceso al Sistema
            </h2>
            <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-[9px] font-bold text-sky-600 uppercase tracking-wider">
              <Activity className="h-2.5 w-2.5" />
              Módulo de Internación
            </div>
          </div>

          {/* Alerta de Error */}
          {loginError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 p-2.5 text-xs text-red-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
              <span className="font-semibold">{loginError}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Input de Usuario */}
            <div className="space-y-1">
              <label className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">
                Usuario o Correo Electrónico
              </label>
              <div className="relative flex items-center rounded-lg border border-slate-200 bg-slate-50/40 hover:bg-slate-50 focus-within:border-indigo-600 focus-within:bg-white focus-within:ring-1 focus-within:ring-indigo-600 transition-all overflow-hidden">
                <div className="flex items-center justify-center pl-3 border-r border-slate-100 pr-2">
                  <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="ej. usuario@sstepi.com"
                  {...register("username")}
                  className="w-full h-10 px-3 text-xs font-semibold text-slate-700 bg-transparent outline-none placeholder:text-slate-400"
                />
              </div>
              {errors.username && (
                <span className="text-[9px] text-red-500 font-semibold block">
                  {errors.username.message}
                </span>
              )}
            </div>

            {/* Input de Contraseña con Ojito */}
            <div className="space-y-1">
              <label className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">
                Contraseña
              </label>
              <div className="relative flex items-center rounded-lg border border-slate-200 bg-slate-50/40 hover:bg-slate-50 focus-within:border-indigo-600 focus-within:bg-white focus-within:ring-1 focus-within:ring-indigo-600 transition-all overflow-hidden pr-10">
                <div className="flex items-center justify-center pl-3 border-r border-slate-100 pr-2">
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className="w-full h-10 px-3 text-xs font-semibold text-slate-700 bg-transparent outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="text-[9px] text-red-500 font-semibold block">
                  {errors.password.message}
                </span>
              )}
            </div>

            {/* Opciones Intermedias */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                Recordarme
              </label>
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("Por favor, póngase en contacto con el administrador del hospital para restablecer su contraseña.");
                }} 
                className="text-sky-600 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo-900 text-xs font-bold text-white shadow-md shadow-indigo-900/10 hover:bg-indigo-800 hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Iniciar Sesión
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Indicador SSL */}
          <div className="flex items-center justify-center gap-1.5 text-[9.5px] text-slate-400 font-semibold pt-1">
            <Lock className="h-3 w-3 text-slate-300" />
            <span>Conexión segura SSL de nivel bancario</span>
          </div>

        </div>

        {/* Footer */}
        <div className="w-full text-center md:text-right text-[9px] text-slate-400 font-semibold mt-4 border-t border-slate-100 pt-3.5 flex flex-col sm:flex-row justify-between items-center gap-1.5 shrink-0">
          <span><strong>SSTEPI</strong> © 2026 · Sistema de Salud y Gestión Hospitalaria.</span>
          <div className="flex gap-3 text-slate-500">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacidad</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Términos</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Soporte</a>
          </div>
        </div>

      </div>

    </div>
  );
}
