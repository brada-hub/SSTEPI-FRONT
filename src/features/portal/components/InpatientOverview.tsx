"use client";

import * as React from "react";
import { Inpatient } from "@/services/nursingService";
import { calculateAge, formatBoliviaCI } from "@/lib/clinical";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { User, Bed, Calendar } from "lucide-react";

interface InpatientOverviewProps {
  inpatient: Inpatient;
}

export function InpatientOverview({ inpatient }: InpatientOverviewProps) {
  const patient = inpatient?.paciente;
  const cama = inpatient?.cama;
  const sala = inpatient?.sala;
  const medico = inpatient?.medico;

  const age = patient?.fecha_nacimiento
    ? calculateAge(patient.fecha_nacimiento)
    : "S/D";

  const medicoName = medico
    ? medico.nombre && medico.apellidos
      ? `Dr. ${medico.nombre} ${medico.apellidos}`
      : medico.nombre
      ? `Dr. ${medico.nombre}`
      : medico.name ?? "Médico Responsable"
    : "Médico Responsable";

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Tarjeta Identificación */}
      <Card className="hover:scale-[1.01] transition-all">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
            <User className="h-4 w-4 text-primary" /> Identificación del Paciente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-xs">
          <span className="font-extrabold text-foreground text-sm leading-snug">
            {patient?.nombre ?? "Paciente"} {patient?.apellidos ?? ""}
          </span>
          {patient?.ci && (
            <p className="text-muted-foreground mt-0.5">
              CI: {formatBoliviaCI(patient.ci)}
            </p>
          )}
          <span className="text-[10px] text-muted-foreground font-semibold block mt-1">
            {age !== "S/D" ? `${age} años` : "Edad N/D"} •{" "}
            {patient?.sexo === "M"
              ? "Masculino"
              : patient?.sexo === "F"
              ? "Femenino"
              : "S/D"}
          </span>
        </CardContent>
      </Card>

      {/* Tarjeta Ubicación */}
      <Card className="hover:scale-[1.01] transition-all">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
            <Bed className="h-4 w-4 text-accent-teal" /> Ubicación en Planta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-xs">
          <span className="font-mono text-sm font-extrabold text-primary">
            {cama?.codigo ?? "SIN-CAMA"}
          </span>
          <p className="text-muted-foreground">Sala: {sala?.nombre ?? "Sin sala"}</p>
          <span className="text-[10px] text-muted-foreground font-semibold block mt-1">
            Cama activa en censo hospitalario
          </span>
        </CardContent>
      </Card>

      {/* Tarjeta Médico */}
      <Card className="hover:scale-[1.01] transition-all">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
            <Calendar className="h-4 w-4 text-accent-violet" /> Equipo de Guardia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-xs">
          <span className="font-bold text-foreground text-sm">{medicoName}</span>
          <p className="text-muted-foreground">
            Ingreso:{" "}
            {inpatient.fecha_ingreso
              ? new Date(inpatient.fecha_ingreso).toLocaleDateString("es-ES")
              : "S/D"}
          </p>
          <span className="text-[10px] text-muted-foreground font-semibold block mt-1">
            Médico Responsable de Internación
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
export default InpatientOverview;
