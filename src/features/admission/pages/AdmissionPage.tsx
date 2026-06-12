"use client";

import * as React from "react";
import { AdmissionStepper } from "../components/AdmissionStepper";
import { UserPlus, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export function AdmissionPage() {
  return (
    <div className="space-y-6">
      
      {/* Header del Módulo */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-unitepc-sso text-white shadow-md">
            <UserPlus className="h-5.5 w-5.5" />
          </div>
          <div className="flex flex-col text-left">
            <h2 className="text-lg font-bold text-foreground">
              Asistente de Internación & Triaje
            </h2>
            <p className="text-xs text-muted-foreground">
              Ingresa los datos demográficos, constantes vitales y pre-prescripciones para admitir al paciente.
            </p>
          </div>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3.5 text-xs font-bold text-foreground hover:bg-secondary transition-all self-start sm:self-auto"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a Guardia
        </Link>
      </div>

      {/* Stepper Wizard principal */}
      <AdmissionStepper />

    </div>
  );
}
export default AdmissionPage;
