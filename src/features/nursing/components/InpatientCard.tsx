"use client";

import * as React from "react";
import { Inpatient, extractValor } from "@/services/nursingService";
import { calculateAge, calculateBMI } from "@/lib/clinical";
import { Badge } from "@/components/ui/badge";
import { Activity, FileText, Bed, ArrowUpRight, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";

interface InpatientCardProps {
  inpatient: Inpatient;
  onOpenVitals: (inpatient: Inpatient) => void;
  onOpenNote: (inpatient: Inpatient) => void;
  onSelect: (inpatient: Inpatient) => void;
}

export function InpatientCard({ inpatient, onOpenVitals, onOpenNote, onSelect }: InpatientCardProps) {
  // Defensive checks on inpatient and relations
  const patient = inpatient?.paciente;
  const cama = inpatient?.cama;
  const sala = inpatient?.sala;
  const diagnostico = inpatient?.diagnostico_ingreso;
  
  const age = patient?.fecha_nacimiento 
    ? calculateAge(patient.fecha_nacimiento) 
    : "S/D";
  
  // Extraer el último control raw registrado para mostrar IMC y constantes
  const rawControles = inpatient?.controles ?? [];
  const lastRawControl = rawControles.length > 0 ? rawControles[rawControles.length - 1] : null;

  const lastPeso = lastRawControl ? extractValor(lastRawControl.valores, "peso") : undefined;
  const lastTalla = lastRawControl ? extractValor(lastRawControl.valores, "altura") : undefined;
  const lastPresion = lastRawControl ? extractValor(lastRawControl.valores, "presión arterial") ?? extractValor(lastRawControl.valores, "presion arterial") : undefined;
  const lastTemperatura = lastRawControl ? extractValor(lastRawControl.valores, "temperatura") : undefined;
  const lastSatO2 = lastRawControl ? extractValor(lastRawControl.valores, "saturaci") : undefined;

  const bmiData = React.useMemo(() => {
    if (lastPeso && lastTalla) {
      return calculateBMI(lastPeso, lastTalla);
    }
    return { bmi: 0, classification: "S/D", color: "text-muted-foreground", bg: "bg-secondary/50 border-border/40" };
  }, [lastPeso, lastTalla]);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:scale-[1.01] hover:border-primary/20 shadow-sm flex flex-col justify-between gap-3 min-h-[160px]">
      
      {/* Header: Cama e Identificación */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bed className="h-4.5 w-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-xs font-extrabold text-foreground">
              {cama?.nombre ?? cama?.codigo ?? "SIN-CAMA"}
            </span>
            <span className="text-[9px] text-muted-foreground font-semibold">
              {sala?.nombre ?? sala?.codigo ?? "Sin Sala"}
            </span>
          </div>
        </div>

        {/* Badge de IMC Clínico */}
        {bmiData.bmi > 0 && (
          <Badge variant={
            bmiData.classification === "Normal" ? "teal" :
            bmiData.classification === "Sobrepeso" ? "amber" : "destructive"
          }>
            IMC {bmiData.bmi} ({bmiData.classification})
          </Badge>
        )}
      </div>

      {/* Datos del Paciente */}
      <div className="cursor-pointer select-none group" onClick={() => onSelect(inpatient)}>
        <h4 className="text-xs font-bold text-foreground truncate uppercase tracking-wide group-hover:text-primary transition-colors">
          {patient?.nombre ?? "Paciente sin nombre"} {patient?.apellidos ?? ""}
        </h4>
        <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
          {age} {age !== "S/D" ? "años" : ""} • {patient?.sexo === "M" ? "Masculino" : patient?.sexo === "F" ? "Femenino" : "S/D"}
        </p>
        <span className="text-[9px] text-muted-foreground/80 block italic truncate mt-1">
          Diag: {diagnostico ?? "Sin diagnóstico registrado"}
        </span>
      </div>

      {/* Acciones rápidas y panel */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSelect(inpatient)}
          className="flex-1 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[10px] font-bold text-white shadow-sm hover:bg-primary/90 cursor-pointer"
        >
          <Stethoscope className="h-3.5 w-3.5" />
          Abrir Panel Clínico
        </button>
        <Link
          to={`/pacientes/${inpatient.id}/panel`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background hover:bg-secondary text-foreground transition-all shrink-0"
          title="Abrir en página dedicada"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Footer: Signos y Botones */}
      <div className="flex items-center justify-between border-t border-border/40 pt-3">
        <div className="flex items-center gap-2">
          {lastRawControl ? (
            <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-foreground bg-secondary/40 px-2 py-0.5 rounded-md">
              <Activity className="h-3.5 w-3.5 text-accent-teal animate-pulse" />
              <span>PA: {lastPresion ?? "—"} mmHg</span>
              <span className="text-muted-foreground mx-0.5">|</span>
              <span>{lastTemperatura ?? "—"}°C</span>
              {lastSatO2 != null && (
                <>
                  <span className="text-muted-foreground mx-0.5">|</span>
                  <span>SpO₂: {lastSatO2}%</span>
                </>
              )}
            </div>
          ) : (
            <span className="text-[9px] text-muted-foreground font-medium">Sin constantes</span>
          )}
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => onOpenVitals(inpatient)}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background hover:bg-secondary text-foreground transition-all"
            title="Registrar Vitales"
          >
            <Activity className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onOpenNote(inpatient)}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background hover:bg-secondary text-foreground transition-all"
            title="Evolución Rápida"
          >
            <FileText className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
}

export default InpatientCard;
