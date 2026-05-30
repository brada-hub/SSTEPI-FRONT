"use client";

import * as React from "react";
import { useDoctorPatients } from "@/features/doctor/hooks/useDoctorPatients";
import { Inpatient } from "@/services/nursingService";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/clinical-feedback";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Bed, Search, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function DoctorPatientsPage() {
  const { data: patients, isLoading, isError, refetch } = useDoctorPatients();
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredPatients = React.useMemo(() => {
    if (!Array.isArray(patients)) return [];
    if (!searchTerm.trim()) return patients;
    const term = searchTerm.toLowerCase();
    return patients.filter((p) => {
      const fullName = `${p.paciente?.nombre ?? ""} ${p.paciente?.apellidos ?? ""}`.toLowerCase();
      return fullName.includes(term) || (p.paciente?.ci ?? "").includes(term);
    });
  }, [patients, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-md">
            <Stethoscope className="h-5.5 w-5.5" />
          </div>
          <div className="flex flex-col text-left">
            <h2 className="text-lg font-bold text-foreground">Mis Pacientes a Cargo</h2>
            <p className="text-xs text-muted-foreground">
              Internaciones activas bajo su responsabilidad médica directa.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative flex max-w-sm items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar paciente por nombre o CI..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-9 rounded-lg border border-border bg-card pl-10 pr-4 text-xs font-semibold text-foreground outline-none focus:border-primary transition-all placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState message="Cargando pacientes a cargo..." />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : filteredPatients.length === 0 ? (
        <EmptyState
          title="Sin Pacientes a Cargo"
          description="No tiene internaciones activas bajo su responsabilidad en este momento."
          icon={Stethoscope}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPatients.map((inpatient) => (
            <DoctorPatientCard key={inpatient.id} inpatient={inpatient} />
          ))}
        </div>
      )}
    </div>
  );
}

function DoctorPatientCard({ inpatient }: { inpatient: Inpatient }) {
  const patient = inpatient.paciente;
  const cama = inpatient.cama;
  const sala = inpatient.sala;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col gap-3 hover:border-primary/20 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bed className="h-4 w-4" />
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
        <Badge variant="teal">Activo</Badge>
      </div>

      <div className="space-y-1">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
          {patient?.nombre} {patient?.apellidos}
        </h4>
        <p className="text-[10px] text-muted-foreground font-semibold">
          CI: {patient?.ci ?? "S/D"}
        </p>
        <p className="text-[9px] text-muted-foreground/80 italic truncate">
          Diagnóstico: {inpatient.diagnostico_ingreso}
        </p>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-border/40">
        <Link
          href={`/pacientes/${inpatient.id}/panel`}
          className="flex-1 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[10px] font-bold text-white shadow-sm hover:bg-primary/90 transition-all"
        >
          <Stethoscope className="h-3.5 w-3.5" />
          Abrir Panel Clínico
        </Link>
        <Link
          href={`/pacientes/${inpatient.id}/panel`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background hover:bg-secondary text-foreground transition-all shrink-0"
          title="Abrir en página dedicada"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default DoctorPatientsPage;
