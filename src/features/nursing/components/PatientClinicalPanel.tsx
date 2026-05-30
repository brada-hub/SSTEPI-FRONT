"use client";

import * as React from "react";
import { useInpatientDetail } from "@/features/nursing/hooks/useInpatientDetail";
import { useAuthStore } from "@/stores/authStore";
import { type Inpatient } from "@/services/nursingService";
import { type TratamientoPayload } from "@/features/nursing/services/treatmentService";
import { type AlimentacionPayload } from "@/features/nursing/services/feedingService";
import { type ValorControlPayload } from "@/features/nursing/services/vitalSignsService";
import { calculateAge } from "@/lib/clinical";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Tabs
import { ResumenTab } from "./ResumenTab";
import { VitalSignsTab } from "./VitalSignsTab";
import { TreatmentsTab } from "./TreatmentsTab";
import { FeedingTab } from "./FeedingTab";
import { EvolutionTab } from "./EvolutionTab";
import { DocumentosTab } from "./DocumentosTab";
import { DischargePanel } from "./DischargePanel";

import {
  ArrowLeft,
  Activity,
  Heart,
  Pill,
  Apple,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Stethoscope,
  LogOut,
  Plus,
  AlertTriangle,
  User,
  Bed,
  Clock,
  Loader2,
} from "lucide-react";

interface PatientClinicalPanelProps {
  inpatient: Inpatient;
  internacionId: number;
  onClose: () => void;
}

type TabId = "resumen" | "vitals" | "tratamientos" | "alimentacion" | "cuidados" | "evolucion" | "documentos";

const TABS: { id: TabId; label: string; icon: React.ElementType; permission?: string }[] = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "vitals", label: "Signos Vitales", icon: Heart },
  { id: "tratamientos", label: "Tratamientos", icon: Pill },
  { id: "alimentacion", label: "Alimentación", icon: Apple },
  { id: "cuidados", label: "Cuidados", icon: ClipboardList },
  { id: "evolucion", label: "Evolución", icon: Activity },
  { id: "documentos", label: "Documentos", icon: FileText, permission: "acceso.mis-pacientes" },
];

export function PatientClinicalPanel({
  inpatient: initialInpatient,
  internacionId,
  onClose,
}: PatientClinicalPanelProps) {
  const [activeTab, setActiveTab] = React.useState<TabId>("resumen");

  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const {
    inpatient: freshInpatient,
    isLoading,
    registerVitals,
    addEvolutionNote,
    prescribir,
    suspenderTrat,
    suspenderRec,
    addCuidado,
    applyCuidado,
    asignarDieta,
    modificarDieta,
    suspenderDieta,
    alta,
  } = useInpatientDetail(internacionId);

  const patientData = freshInpatient ?? initialInpatient;
  const isAlta = !!patientData.fecha_alta;

  const isAdmin = React.useMemo(() => {
    return (
      user?.role?.name?.toLowerCase().includes("admin") ||
      user?.role?.name?.toLowerCase().includes("soporte")
    );
  }, [user]);

  // Role checks - Grant full access to Admin for easy testing
  const isMedico = React.useMemo(() => {
    return (
      hasPermission("acceso.mis-pacientes") ||
      user?.role?.name?.toLowerCase().includes("medico") ||
      user?.role?.name?.toLowerCase().includes("médico") ||
      isAdmin
    );
  }, [user, hasPermission, isAdmin]);

  const isNutricionista = React.useMemo(() => {
    return (
      hasPermission("acceso.nutricion") ||
      user?.role?.name?.toLowerCase().includes("nutri") ||
      isAdmin
    );
  }, [user, hasPermission, isAdmin]);

  const isEnfermeria = React.useMemo(() => {
    return (
      hasPermission("acceso.estacion-enfermeria") ||
      user?.role?.name?.toLowerCase().includes("enfermer") ||
      isAdmin
    );
  }, [user, hasPermission, isAdmin]);

  const canEditClinical = isMedico || isEnfermeria;

  const patient = patientData.paciente;
  const age = patient?.fecha_nacimiento ? calculateAge(patient.fecha_nacimiento) : "S/D";

  const medicoName = React.useMemo(() => {
    const m = patientData.medico;
    if (!m) return "Médico de Turno";
    const full = `${m.nombre ?? ""} ${m.apellidos ?? ""}`.trim();
    return full || m.name || "Médico de Turno";
  }, [patientData.medico]);

  const daysHospitalized = React.useMemo(() => {
    if (!patientData.fecha_ingreso) return 0;
    const start = new Date(patientData.fecha_ingreso).getTime();
    const end = isAlta ? new Date(patientData.fecha_alta!).getTime() : Date.now();
    return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  }, [patientData.fecha_ingreso, patientData.fecha_alta, isAlta]);

  const [realTimeStay, setRealTimeStay] = React.useState("");

  React.useEffect(() => {
    if (!patientData.fecha_ingreso) return;
    const start = new Date(patientData.fecha_ingreso).getTime();
    
    const updateTime = () => {
      const end = isAlta ? new Date(patientData.fecha_alta!).getTime() : Date.now();
      const diffMs = Math.max(0, end - start);
      
      const seconds = Math.floor((diffMs / 1000) % 60);
      const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
      const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);
      
      setRealTimeStay(parts.join(" "));
    };
    
    updateTime();
    if (isAlta) return;
    
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [patientData.fecha_ingreso, patientData.fecha_alta, isAlta]);

  // Actions
  const handleAlta = async (payload: { tipo_alta: string; observaciones_alta?: string }) => {
    try {
      await alta.mutateAsync(payload);
    } catch {
      // toast shown by hook
    }
  };

  const filteredTabs = TABS.filter((t) => {
    if (!t.permission) return true;
    return hasPermission(t.permission);
  });

  return (
    <div className="space-y-4">
      {/* Back navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background hover:bg-secondary text-foreground transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            Panel Clínico de Internación
          </span>
          <h1 className="text-base font-extrabold text-foreground tracking-tight leading-none mt-0.5">
            Expediente #{internacionId}
          </h1>
        </div>
      </div>

      {isLoading && !freshInpatient ? (
        <div className="h-96 rounded-2xl border border-border bg-card flex flex-col items-center justify-center text-xs text-muted-foreground gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Sincronizando expediente clínico en tiempo real...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* MAIN WORKSPACE */}
          <div className="lg:col-span-9 space-y-4">
            {/* Clinical Header Card */}
            <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/10 p-5 shadow-sm space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-full blur-2xl" />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative z-10">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-black text-foreground uppercase tracking-wide">
                      {patient?.nombre} {patient?.apellidos}
                    </h2>
                    <Badge variant={isAlta ? "secondary" : "teal"}>
                      {isAlta ? "Alta Médica" : "Hospitalizado"}
                    </Badge>
                    {patientData.controles && patientData.controles.length > 0 && (
                      <Badge variant="outline" className="text-[9px] font-mono">
                        <Clock className="h-2.5 w-2.5 mr-0.5 text-primary" />
                        {realTimeStay || `${daysHospitalized}d`}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    {age} años • {patient?.sexo === "M" ? "Masculino" : patient?.sexo === "F" ? "Femenino" : "S/D"} • CI: {patient?.ci || "S/D"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-secondary/40 p-2 text-right min-w-[100px]">
                    <span className="text-[8px] text-muted-foreground font-bold uppercase block">Estadía</span>
                    <span className="text-xs font-black text-foreground font-mono leading-none block mt-0.5">{realTimeStay || `${daysHospitalized} días`}</span>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-2 text-right">
                    <span className="text-[8px] text-primary font-bold uppercase block">Ubicación</span>
                    <span className="text-xs font-black text-primary font-mono">{patientData.cama?.codigo || "S/C"}</span>
                  </div>
                </div>
              </div>

              {/* Diagnosis & meta */}
              <div className="rounded-xl border border-border bg-secondary/15 p-3 text-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Diagnóstico de Ingreso
                    </span>
                    <p className="text-foreground font-medium italic">
                      "{patientData.diagnostico_ingreso || "Sin diagnóstico registrado"}"
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <User className="h-3.5 w-3.5 text-primary" />
                    <span className="font-semibold text-primary">{medicoName}</span>
                    <span className="text-border">|</span>
                    <Bed className="h-3.5 w-3.5" />
                    <span>{patientData.sala?.nombre || "Sin sala"}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Role Based */}
              {!isAlta && (
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/20">
                  {isMedico && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("tratamientos")}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-white shadow-sm hover:bg-primary/90 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Nuevo Tratamiento
                    </button>
                  )}
                  {(isMedico || isEnfermeria) && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("vitals")}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-bold text-foreground hover:bg-secondary cursor-pointer"
                    >
                      <Activity className="h-3.5 w-3.5 text-accent-teal" />
                      Registrar Signos
                    </button>
                  )}
                  {(isMedico || isEnfermeria) && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("evolucion")}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-bold text-foreground hover:bg-secondary cursor-pointer"
                    >
                      <Stethoscope className="h-3.5 w-3.5 text-primary" />
                      Nueva Evolución
                    </button>
                  )}
                  {isMedico && (
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById("discharge-panel-container");
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth" });
                          el.classList.add("ring-2", "ring-accent-amber", "transition-all", "duration-500");
                          setTimeout(() => {
                            el.classList.remove("ring-2", "ring-accent-amber");
                          }, 2000);
                        }
                      }}
                      disabled={alta.isPending}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-destructive/10 border border-destructive/20 px-3 text-xs font-bold text-destructive hover:bg-destructive/20 disabled:opacity-50 cursor-pointer ml-auto"
                    >
                      {alta.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                      Dar de Alta
                    </button>
                  )}
                </div>
              )}

              {/* Alertas críticas */}
              {patientData.controles && patientData.controles.length > 0 && (
                <AlertasCriticas controles={patientData.controles} />
              )}
            </div>

            {/* Tabs Navigation */}
            <div className="rounded-xl border border-border bg-card p-1.5 flex gap-1 shadow-sm overflow-x-auto">
              {filteredTabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-1.5 h-8 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      active
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Workspace */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm min-h-[350px]">
              {activeTab === "resumen" && (
                <ResumenTab inpatient={patientData} />
              )}
              {activeTab === "vitals" && (
                <VitalSignsTab
                  inpatient={patientData}
                  onRegisterVitals={async (valores: ValorControlPayload[], observaciones: string) => {
                    await registerVitals.mutateAsync({
                      internacion_id: patientData.id,
                      valores,
                      observaciones,
                    });
                  }}
                  isRegisterPending={registerVitals.isPending}
                />
              )}
              {activeTab === "tratamientos" && (
                <TreatmentsTab
                  inpatient={patientData}
                  onPrescribir={async (data: TratamientoPayload) => {
                    await prescribir.mutateAsync(data);
                  }}
                  onSuspenderTratamiento={async (id, mot) => {
                    await suspenderTrat.mutateAsync({ id, motivo: mot });
                  }}
                  onSuspenderReceta={async (id, mot) => {
                    await suspenderRec.mutateAsync({ id, motivo: mot });
                  }}
                  isPending={
                    prescribir.isPending || suspenderTrat.isPending || suspenderRec.isPending
                  }
                />
              )}
              {activeTab === "alimentacion" && (
                <FeedingTab
                  inpatient={patientData}
                  onAsignar={async (data: AlimentacionPayload) => {
                    await asignarDieta.mutateAsync(data);
                  }}
                  onModificar={async (id: number, d: Partial<AlimentacionPayload>) => {
                    await modificarDieta.mutateAsync({ id, data: d });
                  }}
                  onSuspender={async (id: number) => {
                    await suspenderDieta.mutateAsync(id);
                  }}
                  isPending={
                    asignarDieta.isPending || modificarDieta.isPending || suspenderDieta.isPending
                  }
                />
              )}
              {activeTab === "cuidados" && (
                <EvolutionTab
                  inpatient={patientData}
                  viewMode="cuidados"
                  onAddCuidado={async (data) => {
                    await addCuidado.mutateAsync(data);
                  }}
                  onAddEvolutionNote={async (data) => {
                    await addEvolutionNote.mutateAsync(data);
                  }}
                  onApplyCuidado={async (data) => {
                    await applyCuidado.mutateAsync(data);
                  }}
                  isPending={addCuidado.isPending || addEvolutionNote.isPending || applyCuidado.isPending}
                />
              )}
              {activeTab === "evolucion" && (
                <EvolutionTab
                  inpatient={patientData}
                  viewMode="evolucion"
                  onAddCuidado={async (data) => {
                    await addCuidado.mutateAsync(data);
                  }}
                  onAddEvolutionNote={async (data) => {
                    await addEvolutionNote.mutateAsync(data);
                  }}
                  onApplyCuidado={async (data) => {
                    await applyCuidado.mutateAsync(data);
                  }}
                  isPending={addCuidado.isPending || addEvolutionNote.isPending || applyCuidado.isPending}
                />
              )}
              {activeTab === "documentos" && (
                <DocumentosTab inpatient={patientData} />
              )}
            </div>
          </div>

          {/* Right Sidebar: Administrative panel */}
          <div className="lg:col-span-3 space-y-4">
            {/* Status Card */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-foreground border-b border-border/30 pb-2">
                Ficha Administrativa
              </h3>

              <div className="space-y-3 text-[11px] font-semibold">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Ingreso:</span>
                  <span className="font-mono text-foreground">
                    {patientData.fecha_ingreso
                      ? format(new Date(patientData.fecha_ingreso), "dd/MM/yyyy HH:mm", { locale: es })
                      : "S/D"}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-muted-foreground font-medium">Médico:</span>
                  <span className="text-right text-primary text-[10px] truncate max-w-[120px]" title={medicoName}>
                    {medicoName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Sala:</span>
                  <span className="text-foreground">{patientData.sala?.nombre || "Sin Sala"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Cama:</span>
                  <span className="font-mono text-foreground">{patientData.cama?.codigo || "S/C"}</span>
                </div>
                {isAlta && patientData.fecha_alta && (
                  <div className="flex justify-between items-center border-t border-border/30 pt-2">
                    <span className="text-muted-foreground font-medium">Alta:</span>
                    <span className="font-mono text-accent-teal">
                      {format(new Date(patientData.fecha_alta), "dd/MM/yyyy HH:mm", { locale: es })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Panel de Alta Médica & Reportes Finales (Epicrisis/Evolución PDF) */}
            <div id="discharge-panel-container" className="transition-all duration-300 rounded-xl">
              <DischargePanel
                inpatient={patientData}
                onAlta={handleAlta}
                isPending={alta.isPending}
              />
            </div>

            {/* Anthropometrics */}
            {patientData.datos_antropometricos && (
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-sm">
                <h3 className="text-xs font-bold text-foreground border-b border-border/30 pb-2">
                  Antropometría
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold">
                  <div className="bg-secondary/20 p-2 rounded-lg text-center">
                    <span className="text-[8px] text-muted-foreground font-bold uppercase block">Peso</span>
                    <span className="text-xs font-extrabold text-foreground">
                      {patientData.datos_antropometricos.peso || "—"} kg
                    </span>
                  </div>
                  <div className="bg-secondary/20 p-2 rounded-lg text-center">
                    <span className="text-[8px] text-muted-foreground font-bold uppercase block">Altura</span>
                    <span className="text-xs font-extrabold text-foreground">
                      {patientData.datos_antropometricos.altura || "—"} cm
                    </span>
                  </div>
                </div>
                {patientData.datos_antropometricos.imc != null && (
                  <div className="bg-secondary/15 border border-border/30 p-2 rounded-lg flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground font-semibold">IMC:</span>
                    <span className="font-black text-foreground">{patientData.datos_antropometricos.imc}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Subcomponent: Alertas Críticas ───────────────────────────────────────────
function AlertasCriticas({ controles }: { controles: NonNullable<Inpatient["controles"]> }) {
  const latest = React.useMemo(() => {
    if (!controles || controles.length === 0) return null;
    return [...controles].sort((a, b) =>
      new Date(b.fecha_control).getTime() - new Date(a.fecha_control).getTime()
    )[0];
  }, [controles]);

  if (!latest || !latest.valores) return null;

  const alerts: string[] = [];
  latest.valores.forEach((v) => {
    if (!v.signo) return;
    const n = typeof v.medida === "string" ? parseFloat(v.medida) : v.medida;
    if (isNaN(n)) return;
    const nombre = v.signo.nombre;

    const rangos: Record<string, [number, number]> = {
      "Frecuencia Cardíaca": [60, 100],
      "Frecuencia Respiratoria": [12, 20],
      "Temperatura": [36, 37.5],
      "Saturación de Oxígeno": [95, 100],
      "Glucosa Capilar": [70, 140],
      "Presión Arterial": [90, 120],
    };

    const r = rangos[nombre];
    if (r && (n < r[0] || n > r[1])) {
      alerts.push(`${nombre}: ${n} ${v.signo.unidad}`);
    }
  });

  if (alerts.length === 0) return null;

  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 flex items-start gap-2">
      <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">Alertas Clínicas</span>
        <div className="flex flex-wrap gap-1.5">
          {alerts.map((a) => (
            <Badge key={a} variant="destructive" className="text-[9px]">
              {a}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
