"use client";

import * as React from "react";
import { usePatientInternationQuery } from "../hooks/usePortalQuery";
import { InpatientOverview } from "../components/InpatientOverview";
import { VitalsChart } from "@/features/nursing/components/VitalsChart";
import { 
  LoadingState, 
  ErrorState, 
  EmptyState 
} from "@/components/ui/clinical-feedback";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { HeartHandshake, ShieldCheck, Activity, Calendar, Stethoscope } from "lucide-react";

export function PortalPage() {
  const { data: inpatient, isLoading, isError, refetch } = usePatientInternationQuery();

  return (
    <div className="space-y-6">
      
      {/* Cabecera del Módulo */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-unitepc-sso text-white shadow-md">
            <HeartHandshake className="h-5.5 w-5.5" />
          </div>
          <div className="flex flex-col text-left">
            <h2 className="text-lg font-bold text-foreground">
              Mi Internación - Transparencia Clínica SSTEPI
            </h2>
            <p className="text-xs text-muted-foreground">
              Visualiza en tiempo real tu diagnóstico, cama del censo, equipo médico y tu curva de constantes vitales.
            </p>
          </div>
        </div>
      </div>

      {/* Renders Condicionales de Carga */}
      {isLoading ? (
        <LoadingState message="Buscando tu expediente clínico de internación..." />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !inpatient ? (
        <EmptyState
          title="Sin Internación Activa"
          description="Actualmente no registras censo físico de internación activo en este hospital."
          icon={HeartHandshake}
        />
      ) : (
        <div className="space-y-6">
          {/* Ficha demográfica de internación */}
          <InpatientOverview inpatient={inpatient} />

          <div className="grid gap-6 lg:grid-cols-3 min-w-0">
            {/* Curva Fisiológica Reutilizada */}
            <div className="lg:col-span-2 space-y-4 min-w-0">
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle className="text-xs flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                    <Activity className="h-4 w-4 text-destructive" /> Evolución de mis Constantes Vitales
                  </CardTitle>
                </CardHeader>
                <CardContent className="min-w-0">
                  <VitalsChart controles={inpatient.controles || []} />
                </CardContent>
              </Card>
            </div>

            {/* Diagnóstico e Historial Ingesta */}
            <div className="space-y-4">
              {/* Diagnóstico */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xs flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                    <Stethoscope className="h-4 w-4 text-primary" /> Diagnóstico Activo
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs leading-relaxed text-foreground font-medium">
                  {inpatient.diagnostico_ingreso}
                </CardContent>
              </Card>

              {/* Bitácora / Notas de enfermería de su cuidado */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xs flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                    <ShieldCheck className="h-4 w-4 text-accent-teal" /> Historial de Evolución
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-3 max-h-40 overflow-y-auto pr-1">
                  {!inpatient.evolucion_enfermeria || inpatient.evolucion_enfermeria.length === 0 ? (
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      Ningún acontecimiento clínico reportado aún.
                    </span>
                  ) : (
                    inpatient.evolucion_enfermeria.map((note) => (
                      <div key={note.id} className="rounded-lg border border-border/60 bg-secondary/15 p-2.5 space-y-1">
                        <div className="flex items-center justify-between border-b border-border/20 pb-1 text-[9px] font-semibold text-muted-foreground">
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="h-3 w-3" />
                            {note.created_at ? new Date(note.created_at).toLocaleDateString() : "Hoy"}
                          </span>
                        </div>
                        <p className="text-[10px] text-foreground leading-relaxed pl-1 pt-0.5">
                          {note.descripcion || "Cuidado registrado"}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
export default PortalPage;
