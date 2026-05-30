"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PatientClinicalPanel } from "./PatientClinicalPanel";
import { useInpatientDetail } from "@/features/nursing/hooks/useInpatientDetail";
import { Loader2, AlertCircle } from "lucide-react";

interface PatientClinicalPanelWrapperProps {
  internacionId: number;
}

export function PatientClinicalPanelWrapper({ internacionId }: PatientClinicalPanelWrapperProps) {
  const router = useRouter();
  const { inpatient, isLoading, isError } = useInpatientDetail(internacionId);

  if (isLoading) {
    return (
      <div className="h-[70vh] rounded-2xl border border-border bg-card flex flex-col items-center justify-center text-xs text-muted-foreground gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span>Cargando expediente clínico...</span>
      </div>
    );
  }

  if (isError || !inpatient) {
    return (
      <div className="h-[70vh] rounded-2xl border border-border bg-card flex flex-col items-center justify-center text-xs text-muted-foreground gap-3">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <span className="text-destructive font-semibold">No se pudo cargar el expediente.</span>
        <button
          type="button"
          onClick={() => router.push("/estacion-enfermeria")}
          className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-white shadow-sm hover:bg-primary/90 cursor-pointer"
        >
          Volver al Censo
        </button>
      </div>
    );
  }

  return (
    <PatientClinicalPanel
      inpatient={inpatient}
      internacionId={internacionId}
      onClose={() => router.push("/estacion-enfermeria")}
    />
  );
}
