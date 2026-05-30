"use client";

import * as React from "react";
import { type Inpatient } from "@/services/nursingService";
import { descargarEpicrisis, descargarEvolucionClinica } from "@/features/nursing/services/dischargeService";
import { useAuthStore } from "@/stores/authStore";
import { FileDown, FileText, Loader2, AlertCircle, FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface DocumentosTabProps {
  inpatient: Inpatient;
}

export function DocumentosTab({ inpatient }: DocumentosTabProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const user = useAuthStore((state) => state.user);

  const [downloadingEpicrisis, setDownloadingEpicrisis] = React.useState(false);
  const [downloadingEvolucion, setDownloadingEvolucion] = React.useState(false);

  const isAlta = !!inpatient.fecha_alta;
  const isMedico = React.useMemo(() => {
    return (
      hasPermission("acceso.mis-pacientes") ||
      user?.role?.name?.toLowerCase().includes("medico") ||
      user?.role?.name?.toLowerCase().includes("médico")
    );
  }, [user, hasPermission]);

  const canDownload = isAlta || isMedico || hasPermission("acceso.usuarios-roles");

  const handleEpicrisis = async () => {
    setDownloadingEpicrisis(true);
    try {
      await descargarEpicrisis(
        inpatient.id,
        inpatient.paciente.apellidos || "",
        inpatient.paciente.ci || ""
      );
      toast.success("Epicrisis descargada correctamente.");
    } catch {
      toast.error("Error al descargar la epicrisis. Verifique si el reporte está disponible.");
    } finally {
      setDownloadingEpicrisis(false);
    }
  };

  const handleEvolucion = async () => {
    setDownloadingEvolucion(true);
    try {
      await descargarEvolucionClinica(
        inpatient.id,
        inpatient.paciente.apellidos || "",
        inpatient.paciente.ci || ""
      );
      toast.success("Evolución clínica descargada correctamente.");
    } catch {
      toast.error("Error al descargar la evolución clínica.");
    } finally {
      setDownloadingEvolucion(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 pb-3">
        <div>
          <h2 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-primary" />
            Documentos Clínicos
          </h2>
          <p className="text-[10px] text-muted-foreground">
            Reportes, epicrisis y evoluciones clínicas generados automáticamente por el sistema.
          </p>
        </div>
        {isAlta && (
          <Badge variant="teal" className="text-[9px]">
            <FileCheck className="h-3 w-3 mr-0.5" />
            Alta registrada
          </Badge>
        )}
      </div>

      {/* Info banner */}
      {!canDownload && (
        <div className="rounded-xl border border-accent-amber/20 bg-accent-amber/5 p-4 flex items-start gap-2 text-xs text-accent-amber">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Los documentos clínicos solo están disponibles una vez que el paciente ha recibido el alta médica, o para personal médico autorizado.
          </p>
        </div>
      )}

      {/* Document cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Epicrisis */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileDown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground">Epicrisis Médica</h3>
              <p className="text-[10px] text-muted-foreground">Resumen final de la internación, diagnósticos y tratamientos aplicados.</p>
            </div>
          </div>

          <div className="text-[10px] text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Paciente:</span>
              <span className="font-semibold text-foreground">{inpatient.paciente.nombre} {inpatient.paciente.apellidos}</span>
            </div>
            <div className="flex justify-between">
              <span>CI:</span>
              <span className="font-mono text-foreground">{inpatient.paciente.ci || "S/D"}</span>
            </div>
            {isAlta && inpatient.fecha_alta && (
              <div className="flex justify-between">
                <span>Fecha de alta:</span>
                <span className="font-mono text-accent-teal">{new Date(inpatient.fecha_alta).toLocaleDateString("es-ES")}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleEpicrisis}
            disabled={!canDownload || downloadingEpicrisis}
            className="w-full inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-secondary/30 text-xs font-bold text-foreground hover:bg-secondary/60 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            {downloadingEpicrisis ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 text-accent-teal" />
            )}
            Descargar Epicrisis PDF
          </button>
        </div>

        {/* Evolución Clínica */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-violet/10 text-accent-violet">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground">Evolución Clínica</h3>
              <p className="text-[10px] text-muted-foreground">Historial cronológico completo de evoluciones, signos vitales y notas de enfermería.</p>
            </div>
          </div>

          <div className="text-[10px] text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Controles registrados:</span>
              <span className="font-mono text-foreground">{inpatient.controles?.length ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Evoluciones:</span>
              <span className="font-mono text-foreground">{inpatient.evolucion_enfermeria?.length ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Días internado:</span>
              <span className="font-mono text-foreground">
                {inpatient.fecha_ingreso
                  ? Math.max(1, Math.ceil((Date.now() - new Date(inpatient.fecha_ingreso).getTime()) / 86400000))
                  : "S/D"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleEvolucion}
            disabled={!canDownload || downloadingEvolucion}
            className="w-full inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-secondary/30 text-xs font-bold text-foreground hover:bg-secondary/60 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            {downloadingEvolucion ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 text-accent-violet" />
            )}
            Descargar Evolución PDF
          </button>
        </div>
      </div>
    </div>
  );
}
