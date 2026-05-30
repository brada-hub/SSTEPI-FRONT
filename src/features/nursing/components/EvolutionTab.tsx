"use client";

import * as React from "react";
import { type Inpatient, type Cuidado, type EvolutionNote } from "@/services/nursingService";
import { CareplanDialog } from "@/features/nursing/components/CareplanDialog";
import { EvolutionDialog } from "@/features/nursing/components/EvolutionDialog";
import { ApplyCareDialog } from "@/features/nursing/components/ApplyCareDialog";
import { useAuthStore } from "@/stores/authStore";
import { ClipboardList, FileText, Plus, User, Clock, ChevronDown, ChevronUp, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EvolutionTabProps {
  inpatient: Inpatient;
  viewMode?: "cuidados" | "evolucion" | "todos";
  onAddCuidado: (data: {
    internacion_id: number;
    tipo: string;
    descripcion: string;
    frecuencia: string;
  }) => Promise<void>;
  onAddEvolutionNote: (data: { observaciones: string }) => Promise<void>;
  onApplyCuidado?: (data: { cuidado_id: number; observaciones?: string }) => Promise<void>;
  isPending?: boolean;
}

export function EvolutionTab({
  inpatient,
  viewMode = "todos",
  onAddCuidado,
  onAddEvolutionNote,
  onApplyCuidado,
  isPending,
}: EvolutionTabProps) {
  const [careplanOpen, setCareplanOpen] = React.useState(false);
  const [evolutionOpen, setEvolutionOpen] = React.useState(false);
  const [applyCareOpen, setApplyCareOpen] = React.useState(false);
  const [selectedCuidado, setSelectedCuidado] = React.useState<Cuidado | null>(null);
  const [showFinishedCare, setShowFinishedCare] = React.useState(false);

  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const canEdit = React.useMemo(() => {
    return (
      hasPermission("acceso.mis-pacientes") ||
      hasPermission("acceso.estacion-enfermeria") ||
      user?.role?.name?.toLowerCase().includes("medico") ||
      user?.role?.name?.toLowerCase().includes("médico") ||
      user?.role?.name?.toLowerCase().includes("enfermer")
    );
  }, [user, hasPermission]);

  const isEnfermeria = React.useMemo(() => {
    return user?.role?.name?.toLowerCase().includes("enfermer");
  }, [user]);

  const isMedicoOrAdmin = React.useMemo(() => {
    return (
      user?.role?.name?.toLowerCase().includes("medico") ||
      user?.role?.name?.toLowerCase().includes("médico") ||
      user?.role?.name?.toLowerCase().includes("admin") ||
      user?.role?.name?.toLowerCase().includes("soporte")
    );
  }, [user]);

  const planDeCuidados: Cuidado[] = inpatient.plan_de_cuidados ?? [];
  const activeCuidados = planDeCuidados.filter((c) => c.estado === 0 || c.estado == null);
  const inactiveCuidados = planDeCuidados.filter((c) => c.estado === 1);

  const notes: EvolutionNote[] = inpatient.evolution_notes ?? [];
  // Sort notes newest first
  const sortedNotes = [...notes].sort((a, b) => {
    const da = new Date(a.created_at ?? 0).getTime();
    const db = new Date(b.created_at ?? 0).getTime();
    return db - da;
  });

  const isAlta = !!inpatient.fecha_alta;

  const showCuidados = viewMode === "todos" || viewMode === "cuidados";
  const showEvolucion = viewMode === "todos" || viewMode === "evolucion";
  const colSpanClass = viewMode === "todos" ? "lg:col-span-6" : "lg:col-span-12";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Columna Izquierda: Plan de Cuidados */}
      {showCuidados && (
        <div className={`${colSpanClass} space-y-4`}>
        <div className="flex items-center justify-between border-b border-border/30 pb-3">
          <div>
            <h2 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4 text-primary" />
              Plan de Cuidados e Indicaciones
            </h2>
            <p className="text-[10px] text-muted-foreground">
              Directrices de cuidado, controles horarios e indicaciones clínicas.
            </p>
          </div>
          {!isAlta && isMedicoOrAdmin && (
            <button
              type="button"
              onClick={() => setCareplanOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-white shadow-sm hover:bg-primary/90 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Nueva Indicación
            </button>
          )}
        </div>

        <div className="space-y-3">
          {activeCuidados.length > 0 ? (
            activeCuidados.map((c, idx) => (
              <div
                key={c.id ?? idx}
                className="rounded-xl border border-border bg-card p-3 shadow-sm space-y-2 hover:border-primary/20 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">
                    {c.tipo || "Indicación de Enfermería"}
                  </span>
                  <Badge variant="teal">{c.frecuencia || "Según indicación"}</Badge>
                </div>
                <p className="text-xs text-foreground font-semibold">{c.descripcion || "Sin descripción."}</p>
                {c.created_at && (
                  <span className="text-[9px] text-muted-foreground block font-mono">
                    Registrado: {new Date(c.created_at).toLocaleString("es-ES")}
                  </span>
                )}

                {/* Historial de Aplicaciones */}
                {c.cuidadosAplicados && c.cuidadosAplicados.length > 0 && (
                  <div className="mt-2.5 pt-2.5 border-t border-border/30 space-y-1.5">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Historial de Aplicaciones ({c.cuidadosAplicados.length})
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {c.cuidadosAplicados.map((ap, apIdx) => {
                        const nurseName = ap.user
                          ? `${ap.user.nombre ?? ""} ${ap.user.apellidos ?? ""}`.trim()
                          : "Personal de Enfermería";
                        const timeStr = ap.fecha_aplicacion
                          ? new Date(ap.fecha_aplicacion).toLocaleString("es-ES")
                          : "Fecha no disponible";
                        return (
                          <div
                            key={ap.id ?? apIdx}
                            className="text-[10px] text-foreground bg-secondary/20 p-2 rounded-lg border border-border/30 flex flex-col gap-0.5 animate-fadeIn"
                          >
                            <div className="flex items-center justify-between font-semibold">
                              <span className="text-teal-600 dark:text-teal-400 flex items-center gap-1">
                                <Check className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                                Realizado por {nurseName}
                              </span>
                              <span className="text-muted-foreground font-mono text-[9px]">{timeStr}</span>
                            </div>
                            {ap.observaciones && (
                              <p className="text-[9px] text-muted-foreground italic font-medium pl-4 mt-0.5">
                                "{ap.observaciones}"
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Botón de registrar aplicación para Enfermería */}
                {!isAlta && isEnfermeria && (
                  <div className="pt-1.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCuidado(c);
                        setApplyCareOpen(true);
                      }}
                      className="inline-flex h-7 items-center gap-1 rounded-lg border border-teal-500/30 bg-teal-50/50 hover:bg-teal-50 dark:bg-teal-950/10 dark:hover:bg-teal-950/20 px-2.5 text-[10px] font-bold text-teal-600 dark:text-teal-400 cursor-pointer transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      Registrar Aplicación
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-secondary/5 p-8 text-center flex flex-col items-center justify-center gap-2">
              <ClipboardList className="h-6 w-6 text-muted-foreground/60" />
              <h4 className="text-xs font-bold text-foreground">Sin indicaciones activas</h4>
              <p className="text-[10px] text-muted-foreground max-w-[280px]">
                No hay planes de cuidados específicos indicados para este paciente.
              </p>
            </div>
          )}
        </div>

        {/* Collapsible Completed Cares */}
        {inactiveCuidados.length > 0 && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowFinishedCare(!showFinishedCare)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <span>Historial de Indicaciones finalizadas ({inactiveCuidados.length})</span>
              {showFinishedCare ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showFinishedCare && (
              <div className="mt-3 space-y-2.5 pl-1 border-l-2 border-border/30">
                {inactiveCuidados.map((c, idx) => (
                  <div key={c.id ?? idx} className="rounded-xl border border-border/60 bg-secondary/5 p-3 opacity-70">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">{c.tipo}</span>
                      <Badge variant="secondary">Finalizado</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{c.descripcion}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Columna Derecha: Notas de Evolución (Bitácora) */}
      {showEvolucion && (
        <div className={`${colSpanClass} space-y-4`}>
        <div className="flex items-center justify-between border-b border-border/30 pb-3">
          <div>
            <h2 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" />
              Bitácora de Evolución Médica
            </h2>
            <p className="text-[10px] text-muted-foreground">
              Historial cronológico de notas de evolución, incidentes y novedades médicas.
            </p>
          </div>
          {!isAlta && canEdit && (
            <button
              type="button"
              onClick={() => setEvolutionOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-white shadow-sm hover:bg-primary/90 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Nueva Nota
            </button>
          )}
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {sortedNotes.length > 0 ? (
            <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
              {sortedNotes.map((note, idx) => {
                const author = note.enfermero_nombre || "Personal de Turno";
                const dateFormatted = note.created_at
                  ? new Date(note.created_at).toLocaleString("es-ES")
                  : "Fecha no disponible";

                return (
                  <div key={note.id ?? idx} className="relative space-y-1">
                    {/* Circle marker */}
                    <div className="absolute -left-[18.5px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>

                    <div className="rounded-xl border border-border bg-card p-3 shadow-sm space-y-2">
                      <p className="text-xs text-foreground font-semibold leading-relaxed whitespace-pre-line">
                        {note.nota || note.descripcion || "Sin contenido registrado."}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] text-muted-foreground border-t border-border/30 pt-2 font-semibold">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 text-primary" />
                          <span>{author}</span>
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="h-3 w-3" />
                          <span>{dateFormatted}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-secondary/5 p-8 text-center flex flex-col items-center justify-center gap-2">
              <FileText className="h-6 w-6 text-muted-foreground/60" />
              <h4 className="text-xs font-bold text-foreground">Sin notas registradas</h4>
              <p className="text-[10px] text-muted-foreground max-w-[280px]">
                No se han registrado notas de evolución para esta internación.
              </p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Careplan Dialog */}
      <CareplanDialog
        open={careplanOpen}
        onOpenChange={setCareplanOpen}
        internacionId={inpatient.id}
        onSubmit={onAddCuidado}
        isPending={isPending}
      />

      {/* Evolution Dialog */}
      <EvolutionDialog
        open={evolutionOpen}
        onOpenChange={setEvolutionOpen}
        inpatient={inpatient}
        onSubmitSuccess={async (data) => {
          await onAddEvolutionNote({ observaciones: data.nota });
        }}
      />

      {/* Apply Care Dialog */}
      <ApplyCareDialog
        open={applyCareOpen}
        onOpenChange={setApplyCareOpen}
        cuidado={selectedCuidado}
        onSubmit={async (obs) => {
          if (selectedCuidado?.id && onApplyCuidado) {
            await onApplyCuidado({
              cuidado_id: selectedCuidado.id,
              observaciones: obs,
            });
          }
        }}
        isPending={isPending}
      />
    </div>
  );
}
export default EvolutionTab;
