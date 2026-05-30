"use client";

import * as React from "react";
import { Patient } from "@/services/patientService";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { calculateAge, formatBoliviaCI, formatBoliviaPhone, generateWhatsAppLink } from "@/lib/clinical";
import { 
  User, 
  Phone, 
  FileText, 
  MapPin, 
  Activity, 
  Bed, 
  Send 
} from "lucide-react";

interface DossierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
}

export function DossierDialog({ open, onOpenChange, patient }: DossierDialogProps) {
  if (!patient) return null;

  const age = calculateAge(patient.fecha_nacimiento);
  const isInterned = !!patient.active_internacion;
  const internacion = patient.active_internacion;

  // Texto predefinido para compartir ficha con el WhatsApp del familiar
  const whatsAppText = `SSTEPI INFORME CLÍNICO:\n\n` +
    `Estimado familiar de ${patient.nombre} ${patient.apellidos},\n` +
    `Le informamos que el paciente se encuentra registrado bajo el expediente:\n` +
    `• C.I.: ${patient.ci}\n` +
    `• Edad: ${age} años\n` +
    `• Estado: ${isInterned ? `INTERNADO (Sala: ${internacion?.sala || "General"}, Cama: ${internacion?.cama || "N/A"})` : "Ambulatorio"}\n\n` +
    `Para cualquier consulta médica de guardia, comuníquese con el hospital.`;

  const refPhone = patient.celular_referencia || patient.telefono;
  const waLink = generateWhatsAppLink(refPhone, whatsAppText);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidthClass="max-w-md" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-unitepc-sso text-white shadow-md">
              <User className="h-5 w-5" />
            </div>
            <div className="flex flex-col text-left">
              <DialogTitle>Dossier Clínico</DialogTitle>
              <DialogDescription>
                Resumen demográfico e internación de SSTEPI
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Ficha Principal de Datos */}
        <div className="my-4 space-y-4 max-h-[350px] overflow-y-auto pr-1">
          {/* Card Nombre e Identidad */}
          <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-foreground leading-tight">
                  {patient.nombre} {patient.apellidos}
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                  CI: {patient.ci}
                </span>
              </div>
              <Badge variant={patient.genero === "masculino" ? "teal" : patient.genero === "femenino" ? "violet" : "secondary"}>
                {patient.genero === "masculino" ? "Masculino" : patient.genero === "femenino" ? "Femenino" : "Otro"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs border-t border-border/40 pt-3">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Edad</span>
                <span className="font-semibold text-foreground">{age} años</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Nacimiento</span>
                <span className="font-semibold text-foreground">{patient.fecha_nacimiento.substring(0, 10)}</span>
              </div>
            </div>
          </div>

          {/* Información de Internación Física si aplica */}
          {isInterned ? (
            <div className="rounded-xl border border-accent-teal/20 bg-accent-teal/5 p-4 space-y-2">
              <span className="text-[10px] font-bold text-accent-teal uppercase tracking-wider flex items-center gap-1">
                <Bed className="h-3.5 w-3.5" /> Ubicación en Planta
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">Sala</span>
                  <span className="font-semibold text-foreground">{internacion?.sala || "Sala A - Especialidades"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">Cama Activa</span>
                  <span className="font-mono font-bold text-primary">{internacion?.cama || "Cama 104"}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <span className="text-[10px] text-muted-foreground font-semibold">
                Paciente Ambulatorio (Sin censo de cama activo)
              </span>
            </div>
          )}

          {/* Contacto y Emergencia */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Contactos Autorizados
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-border bg-card p-3 flex flex-col gap-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Paciente
                </span>
                <span className="font-semibold text-foreground">
                  {formatBoliviaPhone(patient.telefono)}
                </span>
              </div>

              <div className="rounded-lg border border-border bg-card p-3 flex flex-col gap-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <User className="h-3 w-3" /> Familiar
                </span>
                <span className="font-semibold text-foreground truncate">
                  {[patient.nombre_referencia, patient.apellidos_referencia].filter(Boolean).join(" ") || "S/D"}
                </span>
                <span className="text-[9px] text-muted-foreground font-semibold">
                  {formatBoliviaPhone(patient.celular_referencia)}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-3 flex flex-col gap-1 text-xs">
              <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Dirección
              </span>
              <span className="font-medium text-foreground leading-snug">
                {patient.direccion || "No registrada"}
              </span>
            </div>
          </div>

          {/* Antecedentes Clínicos */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Antecedentes y Alergias
            </span>
            <div className="rounded-lg border border-border bg-card p-3 text-xs flex gap-2">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-foreground leading-relaxed">
                Sin antecedentes patológicos registrados en el expediente.
              </p>
            </div>
          </div>
        </div>

        {/* Footer del Diálogo */}
        <DialogFooter>
          <div className="flex w-full items-center justify-between">
            {refPhone ? (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#25d366] px-4 text-xs font-bold text-white shadow-sm hover:bg-[#20ba5a] transition-all"
              >
                <Send className="h-3.5 w-3.5 fill-white" />
                Compartir WhatsApp
              </a>
            ) : (
              <div />
            )}
            <button
              onClick={() => onOpenChange(false)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-xs font-bold text-foreground hover:bg-secondary cursor-pointer"
            >
              Cerrar Dossier
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default DossierDialog;
