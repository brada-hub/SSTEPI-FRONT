"use client";

import * as React from "react";
import { type Inpatient } from "@/services/nursingService";
import { 
  type Tratamiento, 
  type TratamientoPayload,
  type Receta, 
  getSeguimientoTratamiento, 
  registrarAdministracion,
  type Toma,
  type RecetaConSeguimiento
} from "@/features/nursing/services/treatmentService";
import { PrescriptionDialog } from "@/features/nursing/components/PrescriptionDialog";
import { SuspendDialog } from "@/features/nursing/components/SuspendDialog";
import { useAuthStore } from "@/stores/authStore";
import { 
  Pill, 
  Plus, 
  Calendar, 
  AlertTriangle, 
  User, 
  History, 
  ChevronDown, 
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, subMinutes, isPast, differenceInMilliseconds, addDays } from "date-fns";

// Helper to parse dates securely
function parseLaravelDate(dateTimeString?: string): Date | null {
  if (!dateTimeString) return null;
  const date = new Date(dateTimeString.toString().replace(" ", "T"));
  return isNaN(date.getTime()) ? null : date;
}

interface TreatmentsTabProps {
  inpatient: Inpatient;
  onPrescribir: (data: TratamientoPayload) => Promise<void>;
  onSuspenderTratamiento: (id: number, motivo: string) => Promise<void>;
  onSuspenderReceta: (id: number, motivo: string) => Promise<void>;
  isPending?: boolean;
}

// ── SUBCOMPONENT: COUNTDOWN TIMER BADGE ───────────────────────────────────────
function RecetaTimerBadge({ 
  receta, 
  tratamiento 
}: { 
  receta: RecetaConSeguimiento; 
  tratamiento: Tratamiento;
}) {
  const [timerText, setTimerText] = React.useState("Calculando...");
  const [timerClass, setTimerClass] = React.useState("bg-secondary/40 text-foreground");

  React.useEffect(() => {
    const inicioTratamiento = parseLaravelDate(tratamiento.fecha_inicio);
    if (!inicioTratamiento) return;

    const finTratamiento = addDays(inicioTratamiento, receta.duracion_dias);
    if (isPast(finTratamiento)) {
      setTimerText("Finalizado");
      setTimerClass("bg-secondary text-muted-foreground");
      return;
    }

    const administraciones = receta.administras || [];
    const proximaPendiente = administraciones.find((admin) => admin.estado === 0);

    if (!proximaPendiente) {
      if (!administraciones.length) {
        setTimerText("Sin iniciar");
        setTimerClass("bg-blue-500/10 text-blue-600 dark:text-blue-400");
        return;
      }
      setTimerText("Todas administradas");
      setTimerClass("bg-emerald-500/10 text-emerald-600 dark:text-emerald-400");
      return;
    }

    const proximaAdmin = parseLaravelDate(proximaPendiente.hora_programada);
    if (!proximaAdmin) return;

    const updateTimer = () => {
      const remainingMs = differenceInMilliseconds(proximaAdmin, new Date());
      
      if (remainingMs <= -1800000) { // 30 minutes overdue
        setTimerText("Atrasada");
        setTimerClass("bg-destructive/10 text-destructive animate-pulse");
        return;
      }

      if (remainingMs <= 0) {
        setTimerText("¡Ahora!");
        setTimerClass("bg-red-500 text-white animate-bounce");
        return;
      }

      const totalSeconds = Math.floor(remainingMs / 1000);
      const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
      const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
      const seconds = String(totalSeconds % 60).padStart(2, "0");

      setTimerText(`${hours}:${minutes}:${seconds}`);
      
      if (totalSeconds < 600) { // less than 10 mins
        setTimerClass("bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold");
      } else {
        setTimerClass("bg-secondary/60 text-muted-foreground");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [receta, tratamiento]);

  return (
    <div className={`rounded-lg px-3 py-1.5 text-center min-w-[120px] shrink-0 border border-border/20 ${timerClass}`}>
      <span className="text-[8px] font-bold uppercase block tracking-wider leading-none mb-0.5">Siguiente dosis</span>
      <span className="text-xs font-black font-mono leading-none">{timerText}</span>
    </div>
  );
}

// ── SUBCOMPONENT: INDIVIDUAL TREATMENT TRACKER ─────────────────────────────────
function TreatmentSeguimientoItem({
  tratamiento,
  fechaSeleccionada,
  isMedico,
  isAlta,
  onOpenSuspendTratamiento,
  onOpenSuspendReceta
}: {
  tratamiento: Tratamiento;
  fechaSeleccionada: Date;
  isMedico: boolean;
  isAlta: boolean;
  onOpenSuspendTratamiento: (id: number) => void;
  onOpenSuspendReceta: (id: number) => void;
}) {
  const queryClient = useQueryClient();
  const [adminDialog, setAdminDialog] = React.useState<{ receta: RecetaConSeguimiento; toma: Toma } | null>(null);
  const [observaciones, setObservaciones] = React.useState("");

  const formattedDate = format(fechaSeleccionada, "yyyy-MM-dd");
  const esHoy = format(new Date(), "yyyy-MM-dd") === formattedDate;

  // Fetch treatment daily administration plan
  const { data: segTrat, isLoading, refetch } = useQuery({
    queryKey: ["seguimiento-tratamiento", tratamiento.id, formattedDate],
    queryFn: () => getSeguimientoTratamiento(tratamiento.id, formattedDate),
    staleTime: 15 * 1000,
  });

  // Dose administration mutation
  const administerMutation = useMutation({
    mutationFn: registrarAdministracion,
    onSuccess: () => {
      toast.success(
        adminDialog?.toma.esPrimeraDosis 
          ? "Tratamiento iniciado correctamente." 
          : "Medicamento administrado registrado."
      );
      setAdminDialog(null);
      setObservaciones("");
      refetch();
      // Invalidate clinical panel details to sync state
      queryClient.invalidateQueries({ queryKey: ["inpatient-detail"] });
    },
    onError: (err: unknown) => {
      const msg =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      toast.error(msg || "Error al registrar la administración.");
    },
  });

  const handleConfirmAdministrar = () => {
    if (!adminDialog) return;
    const isFirst = adminDialog.toma.esPrimeraDosis;
    administerMutation.mutate({
      receta_id: isFirst ? adminDialog.receta.id : undefined,
      administracion_id: !isFirst ? adminDialog.toma.id! : undefined,
      observaciones: observaciones.trim() || undefined,
    });
  };

  const esAdministrable = (horaStr: string) => {
    if (!horaStr) return false;
    const ahora = new Date();
    const hora = parseLaravelDate(horaStr);
    if (!hora) return false;
    const ventanaInicio = subMinutes(hora, 10);
    return ahora >= ventanaInicio;
  };

  const esBotonVisible = (toma: Toma) => {
    if (!toma) return false;
    if (toma.esPrimeraDosis && esHoy) return true;
    const hora = parseLaravelDate(toma.horaReal);
    if (!hora) return false;
    if (!esHoy) return false;
    if (toma.datosAdministracion) return false;
    if (toma.status === "Pendiente" && esAdministrable(toma.horaReal)) return true;
    if (toma.status === "¡ATRASADA!") return true;
    return false;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Cumplida":
      case "Cumplida (Retrasada)":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      case "¡ATRASADA!":
        return "bg-destructive/10 text-destructive border border-destructive/20 animate-pulse";
      case "Sin iniciar":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";
      default:
        return "bg-secondary text-muted-foreground border border-border";
    }
  };

  const getHeaderGradient = (status: string) => {
    switch (status) {
      case "Cumplida":
        return "from-emerald-600 to-emerald-700 text-white";
      case "Cumplida (Retrasada)":
        return "from-amber-600 to-amber-700 text-white";
      case "Sin iniciar":
        return "from-blue-600 to-blue-700 text-white";
      case "¡ATRASADA!":
        return "from-destructive to-red-800 text-white";
      default:
        return "from-slate-600 to-slate-700 text-white";
    }
  };

  const getIconForStatus = (status: string) => {
    switch (status) {
      case "Cumplida":
      case "Cumplida (Retrasada)":
        return CheckCircle;
      case "¡ATRASADA!":
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const formatHora = (dateStr: string) => {
    const d = parseLaravelDate(dateStr);
    return d ? format(d, "HH:mm") : "--:--";
  };

  const formatHoraCompleta = (dateStr: string) => {
    const d = parseLaravelDate(dateStr);
    return d ? format(d, "HH:mm:ss") : "--:--:--";
  };

  const medicoName = tratamiento.medico
    ? `${tratamiento.medico.nombre ?? ""} ${tratamiento.medico.apellidos ?? ""}`.trim()
    : "Médico de Turno";

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-border bg-card text-xs text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span>Sincronizando cronograma de administración...</span>
      </div>
    );
  }

  const recetas = segTrat?.recetas || tratamiento.recetas || [];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-5">
      {/* Header card info */}
      <div className="flex items-start justify-between border-b border-border/30 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black text-foreground uppercase">{tratamiento.tipo}</h3>
            <Badge variant="teal">Activo</Badge>
          </div>
          <p className="text-xs text-foreground font-semibold">{tratamiento.descripcion}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Prescrito por: <strong className="text-foreground">{medicoName}</strong>
            </span>
            {tratamiento.fecha_inicio && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Inicio: {new Date(tratamiento.fecha_inicio).toLocaleDateString("es-ES")}
              </span>
            )}
          </div>
        </div>

        {!isAlta && isMedico && (
          <button
            type="button"
            onClick={() => onOpenSuspendTratamiento(tratamiento.id)}
            className="inline-flex h-7 items-center gap-1 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive text-[10px] font-bold px-2.5 cursor-pointer"
          >
            <AlertTriangle className="h-3 w-3" />
            Suspender
          </button>
        )}
      </div>

      {/* Recetas (Medicamentos) */}
      <div className="space-y-6">
        {recetas.length > 0 ? (
          recetas.map((r: RecetaConSeguimiento) => {
            const isRecetaActiva = r.estado === 0;
            const tomas = r.tomas_hoy || [];

            return (
              <div
                key={r.id}
                className="rounded-xl border border-border bg-secondary/5 p-4 space-y-4"
              >
                {/* Medicament card header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/20 pb-3">
                  <div className="flex items-start gap-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${isRecetaActiva ? 'bg-primary/10 text-primary' : 'bg-muted/10 text-muted-foreground'}`}>
                      <Pill className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground">
                        {r.medicamento?.nombre || "Medicamento"}
                      </p>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground font-semibold">
                        <span>Dosis: <strong className="text-foreground">{r.dosis}</strong></span>
                        <span>•</span>
                        <span>Vía: <strong className="text-foreground">{r.via_administracion}</strong></span>
                        <span>•</span>
                        <span>Cada: <strong className="text-foreground">{r.frecuencia_horas} hrs</strong></span>
                        <span>•</span>
                        <span>Durante: <strong className="text-foreground">{r.duracion_dias} días</strong></span>
                      </div>
                      {r.indicaciones && (
                        <p className="text-[9px] text-muted-foreground/80 italic mt-0.5">
                          Indicación: {r.indicaciones}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isRecetaActiva && esHoy && !isAlta && (
                      <RecetaTimerBadge receta={r} tratamiento={tratamiento} />
                    )}
                    {isRecetaActiva && !isAlta && isMedico && (
                      <button
                        type="button"
                        onClick={() => onOpenSuspendReceta(r.id)}
                        className="inline-flex h-7 items-center gap-1 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive text-[10px] font-bold px-2.5 cursor-pointer shrink-0"
                        title="Suspender Medicamento"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        Suspender
                      </button>
                    )}
                  </div>
                </div>

                {/* Doses Cronograma */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    Cronograma del día:
                  </h4>

                  {tomas.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-5 text-center flex flex-col items-center justify-center gap-1 bg-background/50">
                      <Clock className="h-5 w-5 text-muted-foreground/40" />
                      <p className="text-[10px] text-muted-foreground italic">
                        Sin tomas programadas para esta fecha.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {tomas.map((toma: Toma, idx: number) => {
                        const StatusIcon = getIconForStatus(toma.status);
                        const isBtnVisible = esBotonVisible(toma);

                        return (
                          <div 
                            key={toma.id || idx} 
                            className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all"
                          >
                            {/* Gradient Header */}
                            <div className={`bg-gradient-to-r p-3 flex items-center justify-between ${getHeaderGradient(toma.status)}`}>
                              <div className="flex items-center gap-2">
                                <StatusIcon className="h-4 w-4 shrink-0" />
                                <div className="leading-none">
                                  <span className="text-[8px] font-bold uppercase opacity-80 block">
                                    {toma.esPrimeraDosis ? "AHORA" : formatHora(toma.horaReal)}
                                  </span>
                                  <span className="text-[10px] font-black tracking-tight">{toma.status}</span>
                                </div>
                              </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-3 bg-secondary/10 flex-1 space-y-2 text-[10px] font-semibold">
                              {toma.datosAdministracion ? (
                                <div className="space-y-1 text-foreground/90">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground font-medium">Registrado por:</span>
                                    <span>{toma.datosAdministracion.user?.nombre || "Enfermería"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground font-medium">Hora efectiva:</span>
                                    <span className="font-mono">{formatHoraCompleta(toma.datosAdministracion.fecha ?? "")}</span>
                                  </div>
                                  {toma.datosAdministracion.observaciones && (
                                    <div className="border-t border-border/40 pt-1.5 mt-1">
                                      <span className="text-muted-foreground font-medium block text-[9px] uppercase">Observaciones:</span>
                                      <p className="text-[9px] font-medium text-foreground italic">"{toma.datosAdministracion.observaciones}"</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="h-full flex items-center justify-center py-2 text-center text-muted-foreground/60 italic text-[9px]">
                                  {toma.status === "Pendiente" && !toma.esPrimeraDosis
                                    ? "Disponible 10 min antes de la hora"
                                    : "Espera de administración..."}
                                </div>
                              )}
                            </div>

                            {/* Card Footer Admin Actions */}
                            {isBtnVisible && !isAlta && (
                              <div className="p-2 border-t border-border/20 bg-background">
                                <button
                                  type="button"
                                  onClick={() => setAdminDialog({ receta: r, toma })}
                                  className={`w-full h-8 rounded-lg text-[10px] font-bold text-white shadow-sm transition-all cursor-pointer ${
                                    toma.status === "¡ATRASADA!"
                                      ? "bg-destructive hover:bg-destructive/95 hover:shadow-destructive/20"
                                      : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-25"
                                  }`}
                                >
                                  {toma.esPrimeraDosis ? "Iniciar Tratamiento" : "Registrar Administración"}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-[10px] text-muted-foreground italic">
            No hay medicamentos prescritos en este tratamiento.
          </p>
        )}
      </div>

      {/* Admin Dialog Modal */}
      {adminDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-foreground">
                {adminDialog.toma.esPrimeraDosis 
                  ? `Iniciar Tratamiento: ${adminDialog.receta.medicamento?.nombre}`
                  : `Administración: ${adminDialog.receta.medicamento?.nombre}`}
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {adminDialog.toma.esPrimeraDosis 
                  ? "Se registrará el inicio del tratamiento con la hora actual, lo que recalculará las dosis futuras."
                  : `Confirma la administración de la dosis correspondiente programada a las ${formatHora(adminDialog.toma.horaReal)}.`}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-extrabold text-muted-foreground uppercase">Observaciones clínicas</label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej: Tolera vía oral sin dificultad, signos estables..."
                className="w-full h-20 rounded-lg border border-border bg-secondary/30 p-2.5 text-xs outline-none resize-none focus:border-primary font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/20">
              <button
                type="button"
                onClick={() => {
                  setAdminDialog(null);
                  setObservaciones("");
                }}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-xs font-bold text-foreground hover:bg-secondary cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAdministrar}
                disabled={administerMutation.isPending}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 text-xs font-bold text-white shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {administerMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirmar Administración
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN EXPORT COMPONENT ──────────────────────────────────────────────────────
export function TreatmentsTab({
  inpatient,
  onPrescribir,
  onSuspenderTratamiento,
  onSuspenderReceta,
  isPending,
}: TreatmentsTabProps) {
  const [prescriptionOpen, setPrescriptionOpen] = React.useState(false);
  const [suspendTratId, setSuspendTratId] = React.useState<number | null>(null);
  const [suspendRecetaId, setSuspendRecetaId] = React.useState<number | null>(null);
  const [showHistory, setShowHistory] = React.useState(false);

  // Daily tracking date state
  const [fechaSeleccionada, setFechaSeleccionada] = React.useState<Date>(new Date());

  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const isAdmin = React.useMemo(() => {
    return (
      user?.role?.name?.toLowerCase().includes("admin") ||
      user?.role?.name?.toLowerCase().includes("soporte")
    );
  }, [user]);

  const isMedico = React.useMemo(() => {
    // Solo el Médico y el Administrador pueden prescribir o suspender tratamientos clínicos
    return (
      hasPermission("acceso.mis-pacientes") ||
      user?.role?.name?.toLowerCase().includes("medico") ||
      user?.role?.name?.toLowerCase().includes("médico") ||
      isAdmin
    );
  }, [user, hasPermission, isAdmin]);

  const tratamientos: Tratamiento[] = inpatient.tratamientos ?? [];
  const activeTreatments = tratamientos.filter((t) => t.estado === 0);
  const inactiveTreatments = tratamientos.filter((t) => t.estado !== 0);

  const hasActiveTreatment = activeTreatments.length > 0;
  const isAlta = !!inpatient.fecha_alta;

  // Date handlers
  const cambiarFecha = (dias: number) => {
    const d = new Date(fechaSeleccionada);
    d.setDate(d.getDate() + dias);
    setFechaSeleccionada(d);
  };

  const irAHoy = () => {
    setFechaSeleccionada(new Date());
  };

  const esHoy = format(new Date(), "yyyy-MM-dd") === format(fechaSeleccionada, "yyyy-MM-dd");

  const formatearFechaNav = (fecha: Date) => {
    const opciones: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };
    return fecha.toLocaleDateString("es-ES", opciones);
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex items-center justify-between border-b border-border/30 pb-3">
        <div>
          <h2 className="text-sm font-extrabold text-foreground">Tratamientos Farmacológicos</h2>
          <p className="text-[10px] text-muted-foreground">
            Prescripciones y control de administración de medicamentos en caliente.
          </p>
        </div>
        {!isAlta && isMedico && (
          <button
            type="button"
            onClick={() => setPrescriptionOpen(true)}
            disabled={hasActiveTreatment}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
            title={hasActiveTreatment ? "Ya existe un tratamiento activo" : "Nueva Prescripción"}
          >
            <Plus className="h-4 w-4" />
            Nueva Prescripción
          </button>
        )}
      </div>

      {/* Chronograma Date Selector */}
      {hasActiveTreatment && (
        <div className="rounded-xl border border-border bg-secondary/5 p-3 flex items-center justify-between flex-wrap gap-2 shadow-inner">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <span className="text-[10px] font-black text-foreground uppercase tracking-wider">Cronograma de Dosis</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
              <button
                type="button"
                onClick={() => cambiarFecha(-1)}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="px-3 text-xs font-bold text-primary capitalize select-none min-w-[90px] text-center">
                {formatearFechaNav(fechaSeleccionada)}
              </div>
              <button
                type="button"
                onClick={() => cambiarFecha(1)}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {!esHoy && (
              <button
                type="button"
                onClick={irAHoy}
                className="h-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-black px-3 cursor-pointer transition-all uppercase tracking-wider border border-primary/20 animate-pulse"
              >
                Hoy
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active Treatments List */}
      <div className="space-y-4">
        {activeTreatments.length > 0 ? (
          activeTreatments.map((t) => (
            <TreatmentSeguimientoItem
              key={t.id}
              tratamiento={t}
              fechaSeleccionada={fechaSeleccionada}
              isMedico={!!isMedico}
              isAlta={isAlta}
              onOpenSuspendTratamiento={(id) => setSuspendTratId(id)}
              onOpenSuspendReceta={(id) => setSuspendRecetaId(id)}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-secondary/5 p-8 text-center flex flex-col items-center justify-center gap-2">
            <Pill className="h-6 w-6 text-muted-foreground/60" />
            <h4 className="text-xs font-bold text-foreground">Sin tratamientos activos</h4>
            <p className="text-[10px] text-muted-foreground max-w-[280px]">
              El paciente no tiene ningún esquema farmacológico activo en este momento.
            </p>
          </div>
        )}
      </div>

      {/* Historical Treatments (Collapsible) */}
      {inactiveTreatments.length > 0 && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <History className="h-4 w-4" />
            <span>Historial de Prescripciones ({inactiveTreatments.length})</span>
            {showHistory ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showHistory && (
            <div className="mt-3 space-y-3 pl-1 border-l-2 border-border/30 animate-in slide-in-from-top-2 duration-250">
              {inactiveTreatments.map((t) => (
                <div key={t.id} className="rounded-xl border border-border/60 bg-secondary/5 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase">{t.tipo}</span>
                      <Badge variant="secondary">
                        {t.estado === 1 ? "Suspendido" : "Finalizado"}
                      </Badge>
                    </div>
                    {t.fecha_inicio && (
                      <span className="text-[9px] text-muted-foreground font-mono">
                        {new Date(t.fecha_inicio).toLocaleDateString("es-ES")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{t.descripcion}</p>
                  
                  {/* Medications history list */}
                  <div className="space-y-1 pl-2">
                    {t.recetas?.map((r) => (
                      <div key={r.id} className="text-[10px] text-muted-foreground">
                        💊 {r.medicamento?.nombre} ({r.dosis} - {r.via_administracion})
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Prescription Dialog */}
      <PrescriptionDialog
        open={prescriptionOpen}
        onOpenChange={setPrescriptionOpen}
        internacionId={inpatient.id}
        onSubmit={onPrescribir}
        isPending={!!isPending}
      />

      {/* Suspend Treatment Dialog */}
      <SuspendDialog
        open={suspendTratId !== null}
        onOpenChange={(open) => !open && setSuspendTratId(null)}
        title="Suspender Tratamiento"
        description="Se suspenderán de forma inmediata todos los medicamentos asociados."
        onConfirm={async (motivo) => {
          if (suspendTratId !== null) {
            await onSuspenderTratamiento(suspendTratId, motivo);
            setSuspendTratId(null);
          }
        }}
        isPending={!!isPending}
      />

      {/* Suspend Receta Dialog */}
      <SuspendDialog
        open={suspendRecetaId !== null}
        onOpenChange={(open) => !open && setSuspendRecetaId(null)}
        title="Suspender Medicamento"
        description="El medicamento seleccionado dejará de ser administrado en las próximas rondas."
        onConfirm={async (motivo) => {
          if (suspendRecetaId !== null) {
            await onSuspenderReceta(suspendRecetaId, motivo);
            setSuspendRecetaId(null);
          }
        }}
        isPending={!!isPending}
      />
    </div>
  );
}
export default TreatmentsTab;
