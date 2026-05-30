"use client";

import * as React from "react";
import { type Patient } from "@/services/patientService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { descargarEpicrisis } from "@/features/nursing/services/dischargeService";
import { calculateAge } from "@/lib/clinical";
import { 
  FolderHeart, 
  Calendar, 
  User, 
  FileText, 
  FileDown, 
  Loader2, 
  Clock, 
  AlertCircle,
  HelpCircle,
  Inbox
} from "lucide-react";
import { toast } from "sonner";
import { differenceInDays, differenceInHours, parseISO } from "date-fns";

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
}

export function HistoryDialog({ open, onOpenChange, patient }: HistoryDialogProps) {
  const [downloadingId, setDownloadingId] = React.useState<number | null>(null);

  if (!patient) return null;

  const age = calculateAge(patient.fecha_nacimiento);
  const internaciones = patient.internaciones ?? [];

  const handleDownloadPDF = async (internacionId: number) => {
    setDownloadingId(internacionId);
    toast.info("Generando expediente clínico histótico PDF...");
    try {
      await descargarEpicrisis(
        internacionId,
        patient.apellidos,
        patient.ci
      );
      toast.success("Epicrisis de internación descargada con éxito.");
    } catch (err) {
      toast.error("Error al descargar el reporte clínico.");
    } finally {
      setDownloadingId(null);
    }
  };

  const calculateDuration = (ingresoStr: string, altaStr?: string | null) => {
    try {
      const start = parseISO(ingresoStr);
      const end = altaStr ? parseISO(altaStr) : new Date();
      const days = differenceInDays(end, start);
      const hours = differenceInHours(end, start) % 24;
      
      if (days === 0 && hours === 0) return "Menos de 1 hora";
      
      const parts = [];
      if (days > 0) parts.push(`${days} ${days === 1 ? "día" : "días"}`);
      if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hora" : "horas"}`);
      return parts.join(", ");
    } catch {
      return "S/D";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidthClass="max-w-xl" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shadow-sm">
              <FolderHeart className="h-5.5 w-5.5" />
            </div>
            <div className="text-left">
              <DialogTitle>Historial de Internaciones</DialogTitle>
              <DialogDescription>
                Resumen clínico histórico del paciente
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Patient demographics brief */}
        <div className="rounded-xl border border-border/60 bg-secondary/15 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-primary font-bold text-[10px]">
              {patient.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-foreground">{patient.nombre} {patient.apellidos}</span>
              <span className="text-[9px] text-muted-foreground font-mono">CI: {patient.ci}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-[10px] font-semibold">{age} años</Badge>
            <Badge variant={patient.genero === "masculino" ? "teal" : patient.genero === "femenino" ? "violet" : "secondary"}>
              {patient.genero === "masculino" ? "Masculino" : patient.genero === "femenino" ? "Femenino" : "Otro"}
            </Badge>
          </div>
        </div>

        {/* Chronological Timeline list */}
        <div className="my-3 space-y-4 max-h-[400px] overflow-y-auto pr-1 text-left">
          {internaciones.length > 0 ? (
            <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
              {internaciones.map((item, idx) => {
                const isActive = !item.fecha_alta;
                const medicName = item.medico
                  ? `Dr(a). ${item.medico.nombre ?? ""} ${item.medico.apellidos ?? ""}`.trim()
                  : "Médico de Guardia";
                const stayDuration = calculateDuration(item.fecha_ingreso, item.fecha_alta);
                
                return (
                  <div key={item.id ?? idx} className="relative space-y-1">
                    {/* Circle marker */}
                    <div className={`absolute -left-[20.5px] top-1.5 h-3.5 w-3.5 rounded-full border-2 bg-background flex items-center justify-center ${isActive ? 'border-accent-teal' : 'border-muted-foreground/60'}`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-accent-teal animate-pulse' : 'bg-muted-foreground/60'}`} />
                    </div>

                    <div className={`rounded-xl border p-3.5 shadow-sm space-y-3 transition-colors ${isActive ? 'border-accent-teal/30 bg-accent-teal/5' : 'border-border bg-card'}`}>
                      {/* Card Header: Dates & Status */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/30 pb-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-mono">
                            {new Date(item.fecha_ingreso).toLocaleDateString("es-ES")}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-mono text-muted-foreground">
                            {item.fecha_alta ? new Date(item.fecha_alta).toLocaleDateString("es-ES") : "Activo"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground font-mono font-bold flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {stayDuration}
                          </span>
                          <Badge variant={isActive ? "teal" : "secondary"} className="text-[8px] tracking-wider uppercase font-bold py-0.5">
                            {isActive ? "Activo" : "Alta"}
                          </Badge>
                        </div>
                      </div>

                      {/* Content: Diagnoses & Motivos */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-extrabold text-muted-foreground uppercase tracking-wider">Motivo de Ingreso</span>
                          <span className="font-semibold text-foreground mt-0.5">{item.motivo || "S/D"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-extrabold text-muted-foreground uppercase tracking-wider">Diagnóstico Principal</span>
                          <span className="font-bold text-foreground mt-0.5">{item.diagnostico || "S/D"}</span>
                        </div>
                      </div>

                      {/* Treating Doctor */}
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-secondary/20 p-2 rounded-lg">
                        <User className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>Médico Tratante: <strong className="text-foreground">{medicName}</strong></span>
                      </div>

                      {/* Discharge Details if completed */}
                      {!isActive && (
                        <div className="p-2.5 rounded-lg bg-secondary/15 border border-border/30 space-y-1 text-xs">
                          <span className="text-[8px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">
                            Detalles de Egreso: {item.tipo_alta || "Alta Médica"}
                          </span>
                          <p className="text-[10px] text-muted-foreground font-medium italic leading-relaxed">
                            "{item.observaciones_alta || "Alta sin observaciones clínicas particulares registradas."}"
                          </p>
                        </div>
                      )}

                      {/* Action PDF button */}
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleDownloadPDF(item.id)}
                          disabled={downloadingId !== null}
                          className="inline-flex h-7 items-center gap-1 px-3.5 rounded-md border border-border bg-background hover:bg-secondary text-[10px] font-bold text-foreground shadow-sm disabled:opacity-50 cursor-pointer transition-colors"
                        >
                          {downloadingId === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <FileDown className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                          )}
                          Descargar Epicrisis PDF
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/5 p-12 text-center flex flex-col items-center justify-center gap-2">
              <Inbox className="h-8 w-8 text-muted-foreground/60" />
              <h4 className="text-xs font-bold text-foreground">Sin hospitalizaciones registradas</h4>
              <p className="text-[10px] text-muted-foreground max-w-[320px] leading-relaxed">
                Este paciente no registra antecedentes de internación o censo de camas en el historial de la institución.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-xs font-bold text-foreground hover:bg-secondary cursor-pointer"
          >
            Cerrar Historial
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default HistoryDialog;
