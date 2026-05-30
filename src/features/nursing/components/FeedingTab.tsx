"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { type Inpatient } from "@/services/nursingService";
import { 
  type Alimentacion, 
  type AlimentacionPayload,
  type TipoDieta,
  getConsumos,
  registrarConsumo,
  type Consumo
} from "@/features/nursing/services/feedingService";
import { useTiposDietaQuery } from "@/features/nursing/hooks/useCatalogQueries";
import { useAuthStore } from "@/stores/authStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { SuspendDialog } from "@/features/nursing/components/SuspendDialog";

const getLocalDatetimeString = (date: Date) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
  return localISOTime;
};
import { 
  Apple, 
  Plus, 
  Calendar, 
  AlertTriangle, 
  User, 
  History, 
  ChevronDown, 
  ChevronUp, 
  Loader2,
  Coffee,
  Sun,
  Utensils,
  Cookie,
  Moon,
  CheckCircle,
  Clock,
  HeartCrack
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

const EMPTY_CONSUMOS: Consumo[] = [];

interface FeedingTabProps {
  inpatient: Inpatient;
  onAsignar: (data: AlimentacionPayload) => Promise<void>;
  onModificar: (id: number, data: Partial<AlimentacionPayload>) => Promise<void>;
  onSuspender: (id: number, motivo: string) => Promise<void>;
  isPending?: boolean;
}


const VIAS_ALIMENTACION = [
  "Oral",
  "Enteral (Sonda Nasogástrica)",
  "Enteral (Sonda Nasoyeyunal)",
  "Parenteral Total",
  "Parenteral Parcial",
];

const schema = z.object({
  tipo_dieta_id: z.string().min(1, "Debe seleccionar un tipo de dieta"),
  via_administracion: z.string().min(1, "Debe seleccionar una vía de administración"),
  observaciones: z.string().optional(),
  restricciones: z.string().optional(),
  fecha_inicio: z.string().min(1, "Debe seleccionar la fecha de inicio"),
  fecha_fin: z.string().min(1, "Debe seleccionar la fecha de fin"),
  tiempos_seleccionados: z.array(z.string()).min(1, "Debe seleccionar al menos un tiempo de comida"),
});

type FormValues = z.infer<typeof schema>;

// Backend may return tiempos as part of alimentacion
interface AlimentacionConTiempos extends Alimentacion {
  tiempos?: { tiempo_comida: string; descripcion?: string }[];
}

// ── SUBCOMPONENT: INTERACTIVE MEAL CONSUMPTION PANEL ───────────────────────────
function InteractiveFeedingPanel({
  activeAlim,
  tratamientoId,
  isAlta
}: {
  activeAlim: Alimentacion;
  tratamientoId: number | undefined;
  isAlta: boolean;
}) {
  const fechaHoy = format(new Date(), "yyyy-MM-dd");

  // Fetch consumptions registered today
  const { data: consumos = EMPTY_CONSUMOS, isLoading, refetch } = useQuery({
    queryKey: ["consumos-alimentacion", activeAlim.id, fechaHoy],
    queryFn: () => getConsumos(activeAlim.id, fechaHoy),
    staleTime: 10 * 1000,
  });

  // Save meal consumption mutation
  const registerConsumoMutation = useMutation({
    mutationFn: registrarConsumo,
    onSuccess: (newConsumo) => {
      toast.success(`${newConsumo.tiempo_comida} registrado correctamente.`);
      // Reset input state for that meal
      setInputs(prev => ({
        ...prev,
        [newConsumo.tiempo_comida]: { porcentaje: 0, observaciones: "" }
      }));
      refetch();
    },
    onError: (err: unknown) => {
      const msg =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      toast.error(msg || "Error al registrar el consumo de alimentos.");
    },
  });

  // Local inputs state for each meal time
  const [inputs, setInputs] = React.useState<Record<string, { porcentaje: number; observaciones: string }>>({
    "Desayuno": { porcentaje: 0, observaciones: "" },
    "Merienda AM": { porcentaje: 0, observaciones: "" },
    "Almuerzo": { porcentaje: 0, observaciones: "" },
    "Merienda PM": { porcentaje: 0, observaciones: "" },
    "Cena": { porcentaje: 0, observaciones: "" },
  });

  // Food times mapping config
  const getIconoTiempo = (tiempo: string) => {
    switch (tiempo) {
      case "Desayuno": return Coffee;
      case "Merienda AM": return Sun;
      case "Almuerzo": return Utensils;
      case "Merienda PM": return Cookie;
      case "Cena": return Moon;
      default: return Apple;
    }
  };

  const getHorarioTiempo = (tiempo: string) => {
    switch (tiempo) {
      case "Desayuno": return "07:00 - 09:00";
      case "Merienda AM": return "10:00 - 11:00";
      case "Almuerzo": return "12:00 - 14:00";
      case "Merienda PM": return "16:00 - 17:00";
      case "Cena": return "18:00 - 20:00";
      default: return "";
    }
  };

  const getBadgeColor = (tiempo: string) => {
    switch (tiempo) {
      case "Desayuno": return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
      case "Merienda AM": return "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400";
      case "Almuerzo": return "bg-orange-500/15 text-orange-700 dark:text-orange-400";
      case "Merienda PM": return "bg-pink-500/15 text-pink-700 dark:text-pink-400";
      case "Cena": return "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400";
      default: return "bg-secondary text-muted-foreground";
    }
  };

  const getPorcentajeColor = (porcentaje: number) => {
    if (porcentaje <= 25) return "bg-red-500 text-white";
    if (porcentaje <= 50) return "bg-orange-500 text-white";
    if (porcentaje <= 75) return "bg-amber-500 text-foreground";
    return "bg-emerald-600 text-white";
  };

  const getAvatarClass = (porcentaje: number) => {
    if (porcentaje <= 25) return "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20";
    if (porcentaje <= 50) return "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20";
    if (porcentaje <= 75) return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20";
    return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
  };

  // Get eating times list (either custom from backend or default list)
  const tiemposDefault = [
    { tiempo_comida: "Desayuno", descripcion: "Ración matinal balanceada" },
    { tiempo_comida: "Merienda AM", descripcion: "Suplemento nutricional matutino" },
    { tiempo_comida: "Almuerzo", descripcion: "Comida principal calórica" },
    { tiempo_comida: "Merienda PM", descripcion: "Suplemento nutricional vespertino" },
    { tiempo_comida: "Cena", descripcion: "Ración ligera nocturna" },
  ];

  // We check activeAlim.tiempos
  const alimExt = activeAlim as AlimentacionConTiempos;
  const tiempos = alimExt.tiempos && alimExt.tiempos.length > 0
    ? alimExt.tiempos
    : tiemposDefault;

  const handleGuardarTiempo = (tiempoComida: string) => {
    if (!tratamientoId) {
      toast.warning("Debe existir un tratamiento activo para registrar consumos.");
      return;
    }

    const dataInput = inputs[tiempoComida];
    if (!dataInput) return;

    registerConsumoMutation.mutate({
      tratamiento_id: tratamientoId,
      alimentacion_id: activeAlim.id,
      fecha: fechaHoy,
      tiempo_comida: tiempoComida,
      porcentaje_consumido: dataInput.porcentaje,
      observaciones: dataInput.observaciones.trim() || undefined,
    });
  };

  const getConsumosPorTiempo = (tiempoComida: string) => {
    return consumos.filter((c) => c.tiempo_comida === tiempoComida);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 border-t border-border/20 pt-4 mt-2">
        <Plus className="h-4 w-4 text-emerald-600 shrink-0" />
        <span className="text-[10px] font-black text-foreground uppercase tracking-wider">Registrar Novedad de Consumo (Hoy)</span>
      </div>

      {!tratamientoId && (
        <div className="rounded-xl border border-border bg-destructive/5 p-4 text-xs text-destructive flex items-center gap-3 font-semibold">
          <HeartCrack className="h-5 w-5 shrink-0 animate-pulse" />
          <span>Atención: No se encontró un tratamiento clínico activo. No es posible registrar el suministro alimentario en el sistema.</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Sincronizando bitácora de nutrición...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiempos.map((tiempo: { tiempo_comida: string; descripcion?: string }, index: number) => {
            const tiempoComida = tiempo.tiempo_comida;
            const MealIcon = getIconoTiempo(tiempoComida);
            const inputVal = inputs[tiempoComida] || { porcentaje: 0, observaciones: "" };
            const history = getConsumosPorTiempo(tiempoComida);

            return (
              <div 
                key={`${tiempoComida}-${index}`}
                className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between space-y-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                {/* Header card info */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-primary">
                      <MealIcon className="h-4.5 w-4.5 shrink-0" />
                      <span className="text-xs font-black text-foreground leading-none">{tiempoComida}</span>
                    </div>
                    <Badge variant="outline" className={`text-[8px] font-bold py-0.5 px-2 ${getBadgeColor(tiempoComida)}`}>
                      {getHorarioTiempo(tiempoComida)}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-semibold italic">
                    {tiempo.descripcion || "Sin especificaciones especiales."}
                  </p>
                </div>

                {/* Suministro registry slider */}
                {!isAlta && (
                  <div className="space-y-3 bg-secondary/15 p-3 rounded-lg border border-border/20">
                    <div className="flex items-center justify-between text-[10px] font-bold text-foreground">
                      <span>Ingesta consumida:</span>
                      <Badge className={`text-[10px] font-black font-mono leading-none py-0.5 px-1.5 rounded-md ${getPorcentajeColor(inputVal.porcentaje)}`}>
                        {inputVal.porcentaje}%
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="25"
                        value={inputVal.porcentaje}
                        disabled={!tratamientoId}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setInputs(prev => ({
                            ...prev,
                            [tiempoComida]: { ...prev[tiempoComida], porcentaje: val }
                          }));
                        }}
                        className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50"
                      />
                      <div className="flex justify-between text-[8px] text-muted-foreground font-bold px-0.5 leading-none">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <input
                        type="text"
                        value={inputVal.observaciones}
                        disabled={!tratamientoId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInputs(prev => ({
                            ...prev,
                            [tiempoComida]: { ...prev[tiempoComida], observaciones: val }
                          }));
                        }}
                        placeholder="Observaciones de enfermería..."
                        className="w-full h-8 rounded-lg border border-border bg-background px-2 text-[10px] outline-none focus:border-primary placeholder:text-muted-foreground/60 disabled:opacity-50 font-medium"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleGuardarTiempo(tiempoComida)}
                      disabled={!tratamientoId || registerConsumoMutation.isPending}
                      className="w-full h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-[10px] font-bold text-white shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {registerConsumoMutation.isPending && registerConsumoMutation.variables?.tiempo_comida === tiempoComida ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5" />
                      )}
                      Registrar Consumo
                    </button>
                  </div>
                )}

                {/* History logs today */}
                <div className="space-y-2 pt-2 border-t border-border/20">
                  <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-foreground uppercase tracking-wider">
                    <History className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Registros de hoy ({history.length})</span>
                  </div>

                  {history.length === 0 ? (
                    <div className="flex items-center gap-1.5 justify-center py-2 text-center text-muted-foreground/60 italic text-[9px] bg-secondary/10 rounded-lg">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground/40" />
                      <span>Sin registros hoy.</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {history.map((c) => (
                        <div key={c.id} className="rounded-lg p-2 bg-secondary/15 flex items-center gap-2.5 text-[10px] font-semibold border border-border/10">
                          <div className={`h-7 w-7 rounded-md font-mono text-[9px] font-black shrink-0 flex items-center justify-center ${getAvatarClass(c.porcentaje_consumido)}`}>
                            {c.porcentaje_consumido}%
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground text-[10px] truncate">
                              {c.observaciones ? `"${c.observaciones}"` : "Sin observaciones registrada."}
                            </p>
                            <p className="text-[8px] text-muted-foreground font-mono leading-none mt-0.5">
                              {c.created_at ? format(new Date(c.created_at), "HH:mm") : "--:--"}
                              {c.registrado_por?.nombre && ` · ${c.registrado_por.nombre.split(" ")[0]}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── MAIN EXPORT COMPONENT ──────────────────────────────────────────────────────
export function FeedingTab({
  inpatient,
  onAsignar,
  onModificar,
  onSuspender,
  isPending,
}: FeedingTabProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingAlim, setEditingAlim] = React.useState<Alimentacion | null>(null);
  const [showHistory, setShowHistory] = React.useState(false);
  const [suspendDietId, setSuspendDietId] = React.useState<number | null>(null);

  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const { data: tiposDieta = [], isLoading: isLoadingCatalog } = useTiposDietaQuery();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { 
      tipo_dieta_id: "", 
      via_administracion: "Oral", 
      observaciones: "",
      restricciones: "",
      fecha_inicio: "",
      fecha_fin: "",
      tiempos_seleccionados: [],
    },
  });

  const isAdmin = React.useMemo(() => {
    return (
      user?.role?.name?.toLowerCase().includes("admin") ||
      user?.role?.name?.toLowerCase().includes("soporte")
    );
  }, [user]);

  const canEdit = React.useMemo(() => {
    // Solo el Nutricionista y el Administrador pueden prescribir, modificar o suspender planes dietéticos
    return (
      hasPermission("acceso.nutricion") ||
      user?.role?.name?.toLowerCase().includes("nutri") ||
      isAdmin
    );
  }, [user, hasPermission, isAdmin]);

  const alimentaciones: Alimentacion[] = inpatient.alimentaciones ?? [];
  const activeAlim = alimentaciones.find((a) => a.estado === 0);
  const inactiveAlims = alimentaciones.filter((a) => a.estado !== 0);

  const isAlta = !!inpatient.fecha_alta;

  // Extract active treatment ID to link consumptions
  const activeTreatment = inpatient.tratamientos?.find((t) => t.estado === 0);
  const tratamientoId = activeTreatment?.id || inpatient.tratamientos?.[0]?.id;


  React.useEffect(() => {
    if (dialogOpen) {
      if (editingAlim) {
        const existingTiempos = (editingAlim as AlimentacionConTiempos).tiempos?.map((t) => t.tiempo_comida) || [];
        reset({
          tipo_dieta_id: String(editingAlim.tipo_dieta_id),
          via_administracion: editingAlim.via_administracion,
          observaciones: editingAlim.descripcion ?? "",
          restricciones: editingAlim.restricciones ?? "",
          fecha_inicio: editingAlim.fecha_inicio ? getLocalDatetimeString(new Date(editingAlim.fecha_inicio)) : getLocalDatetimeString(new Date()),
          fecha_fin: editingAlim.fecha_fin ? getLocalDatetimeString(new Date(editingAlim.fecha_fin)) : getLocalDatetimeString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
          tiempos_seleccionados: existingTiempos,
        });
      } else {
        reset({
          tipo_dieta_id: tiposDieta[0]?.id ? String(tiposDieta[0].id) : "",
          via_administracion: "Oral",
          observaciones: "",
          restricciones: "",
          fecha_inicio: getLocalDatetimeString(new Date()),
          fecha_fin: getLocalDatetimeString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
          tiempos_seleccionados: ["Desayuno", "Almuerzo", "Cena"],
        });
      }
    }
  }, [dialogOpen, editingAlim, reset, tiposDieta]);

  const onSubmitForm = async (values: FormValues) => {
    const selectedTiempos = Array.isArray(values.tiempos_seleccionados) 
      ? values.tiempos_seleccionados 
      : [];
    const tiemposArray = selectedTiempos.map((t) => ({
      tiempo_comida: t,
      descripcion: `Suministro de ${t} según régimen.`,
    }));

    const payload: AlimentacionPayload = {
      internacion_id: inpatient.id,
      tipo_dieta_id: Number(values.tipo_dieta_id),
      via_administracion: values.via_administracion,
      frecuencia_tiempos: tiemposArray.length,
      tiempos: tiemposArray,
      fecha_inicio: values.fecha_inicio ? new Date(values.fecha_inicio).toISOString() : new Date().toISOString(),
      fecha_fin: values.fecha_fin ? new Date(values.fecha_fin).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      restricciones: values.restricciones || "",
      descripcion: values.observaciones || "",
      estado: 0,
    };

    if (editingAlim) {
      await onModificar(editingAlim.id, payload);
    } else {
      await onAsignar(payload);
    }
    setDialogOpen(false);
    setEditingAlim(null);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-border/30 pb-3">
        <div>
          <h2 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
            <Apple className="h-4 w-4 text-primary" />
            Plan de Alimentación y Nutrición
          </h2>
          <p className="text-[10px] text-muted-foreground">
            Asignación del plan dietético, vías de soporte y control de suministro diario de comida.
          </p>
        </div>
        {!isAlta && canEdit && !activeAlim && (
          <button
            type="button"
            onClick={() => {
              setEditingAlim(null);
              setDialogOpen(true);
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-white shadow-sm hover:bg-primary/90 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Asignar Dieta
          </button>
        )}
      </div>

      {/* Active Diet Details */}
      <div>
        {activeAlim ? (
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-5">
            <div className="flex items-start justify-between border-b border-border/30 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-foreground uppercase">
                    {activeAlim.tipo_dieta?.nombre || "Dieta Personalizada"}
                  </h3>
                  <Badge variant="teal">Vía: {activeAlim.via_administracion}</Badge>
                </div>
                {activeAlim.tipo_dieta?.descripcion && (
                  <p className="text-[11px] text-muted-foreground">
                    {activeAlim.tipo_dieta.descripcion}
                  </p>
                )}
                {activeAlim.observaciones && (
                  <div className="text-xs text-foreground font-semibold bg-secondary/20 p-2 rounded-lg mt-1 border border-border/30">
                    <strong>Notas de Prescripción:</strong> {activeAlim.observaciones}
                  </div>
                )}
                <div className="flex items-center gap-4 text-[9px] text-muted-foreground font-mono mt-2">
                  {activeAlim.created_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Asignado el: {new Date(activeAlim.created_at).toLocaleString("es-ES")}
                    </span>
                  )}
                </div>
              </div>

              {!isAlta && canEdit && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAlim(activeAlim);
                      setDialogOpen(true);
                    }}
                    className="inline-flex h-7 items-center justify-center rounded-lg border border-border bg-background px-3 text-[10px] font-bold text-foreground hover:bg-secondary cursor-pointer"
                  >
                    Modificar
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuspendDietId(activeAlim.id)}
                    className="inline-flex h-7 items-center gap-1 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive text-[10px] font-bold px-2.5 cursor-pointer"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    Suspender
                  </button>
                </div>
              )}
            </div>

            {/* Interactive Consumption Grid Panel */}
            <InteractiveFeedingPanel
              activeAlim={activeAlim}
              tratamientoId={tratamientoId}
              isAlta={isAlta}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-secondary/5 p-8 text-center flex flex-col items-center justify-center gap-2">
            <Apple className="h-6 w-6 text-muted-foreground/60" />
            <h4 className="text-xs font-bold text-foreground">Sin dieta asignada</h4>
            <p className="text-[10px] text-muted-foreground max-w-[280px]">
              El paciente se encuentra actualmente sin indicaciones de nutrición activas.
            </p>
          </div>
        )}
      </div>

      {/* Collapsible Diet History */}
      {inactiveAlims.length > 0 && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <History className="h-4 w-4" />
            <span>Historial de Planes Alimenticios ({inactiveAlims.length})</span>
            {showHistory ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showHistory && (
            <div className="mt-3 space-y-3 pl-1 border-l-2 border-border/30 animate-in slide-in-from-top-2 duration-250">
              {inactiveAlims.map((a) => (
                <div key={a.id} className="rounded-xl border border-border/60 bg-secondary/5 p-3.5 space-y-2 opacity-75">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase">
                        {a.tipo_dieta?.nombre || "Dieta Anterior"}
                      </span>
                      <Badge variant="secondary">
                        {a.estado === 1 ? "Suspendido" : "Finalizado"}
                      </Badge>
                    </div>
                    {a.created_at && (
                      <span className="text-[9px] text-muted-foreground font-mono">
                        {new Date(a.created_at).toLocaleDateString("es-ES")}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Vía: {a.via_administracion}</div>
                  {a.observaciones && (
                    <p className="text-[10px] text-muted-foreground italic">Obs: {a.observaciones}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assignment / Modification Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent maxWidthClass="max-w-md" onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>
              {editingAlim ? "Modificar Plan Alimenticio" : "Asignar Plan Alimenticio"}
            </DialogTitle>
            <DialogDescription>
              Configure la nutrición y soporte dietético del paciente internado.
            </DialogDescription>
          </DialogHeader>

          {isLoadingCatalog ? (
            <div className="flex justify-center py-6 gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando catálogo de dietas...
            </div>
          ) : (
            <form id="feeding-form" onSubmit={handleSubmit(onSubmitForm)} className="my-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Tipo de Dieta *</label>
                  <select
                    {...register("tipo_dieta_id")}
                    className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-2.5 text-xs outline-none focus:border-primary"
                  >
                    <option value="">Seleccione dieta...</option>
                    {tiposDieta.map((d: TipoDieta) => (
                      <option key={d.id} value={d.id}>
                        {d.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.tipo_dieta_id && (
                    <p className="text-[9px] text-destructive">{errors.tipo_dieta_id.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Vía de Soporte *</label>
                  <select
                    {...register("via_administracion")}
                    className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-2.5 text-xs outline-none focus:border-primary"
                  >
                    {VIAS_ALIMENTACION.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                  {errors.via_administracion && (
                    <p className="text-[9px] text-destructive">{errors.via_administracion.message}</p>
                  )}
                </div>
              </div>

              {/* Tiempos de Comida (Checkboxes) */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase">Tiempos de Comida *</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {["Desayuno", "Merienda AM", "Almuerzo", "Merienda PM", "Cena"].map((t) => (
                    <label key={t} className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-foreground">
                      <input
                        type="checkbox"
                        value={t}
                        {...register("tiempos_seleccionados")}
                        className="h-3.5 w-3.5 rounded border-border bg-card text-primary focus:ring-primary focus:ring-1"
                      />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
                {errors.tiempos_seleccionados && (
                  <p className="text-[9px] text-destructive font-semibold">{errors.tiempos_seleccionados.message}</p>
                )}
              </div>

              {/* Fechas de Suministro */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Fecha Inicio *</label>
                  <input
                    type="datetime-local"
                    {...register("fecha_inicio")}
                    className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-2.5 text-xs outline-none focus:border-primary font-mono"
                  />
                  {errors.fecha_inicio && (
                    <p className="text-[9px] text-destructive">{errors.fecha_inicio.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Fecha Fin *</label>
                  <input
                    type="datetime-local"
                    {...register("fecha_fin")}
                    className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-2.5 text-xs outline-none focus:border-primary font-mono"
                  />
                  {errors.fecha_fin && (
                    <p className="text-[9px] text-destructive">{errors.fecha_fin.message}</p>
                  )}
                </div>
              </div>

              {/* Restricciones */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase">Restricciones Dietéticas</label>
                <input
                  type="text"
                  placeholder="Ej: Hiposódica, sin gluten, sin lácteos..."
                  {...register("restricciones")}
                  className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-2.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase">Descripción / Observaciones</label>
                <textarea
                  {...register("observaciones")}
                  rows={2}
                  placeholder="Ej: Restringir sodio. Aumentar líquidos orales..."
                  className="w-full rounded-lg border border-border bg-secondary/40 p-2.5 text-xs outline-none resize-none focus:border-primary"
                />
              </div>
            </form>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-xs font-bold text-foreground hover:bg-secondary cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="feeding-form"
              disabled={isPending || isLoadingCatalog}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editingAlim ? "Modificar Dieta" : "Asignar Dieta"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diet Suspension Dialog */}
      <SuspendDialog
        open={suspendDietId !== null}
        onOpenChange={(open) => !open && setSuspendDietId(null)}
        title="Suspender Plan Alimenticio"
        description="El régimen alimentario del paciente se suspenderá de forma inmediata en el sistema."
        onConfirm={async (motivo) => {
          if (suspendDietId !== null) {
            await onSuspender(suspendDietId, motivo);
            setSuspendDietId(null);
          }
        }}
        isPending={isPending}
      />
    </div>
  );
}
export default FeedingTab;
