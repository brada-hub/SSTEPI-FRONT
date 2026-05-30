"use client";

import * as React from "react";
import { type Inpatient, extractValor, getLatestControl } from "@/services/nursingService";
import { type Tratamiento, type Receta } from "@/features/nursing/services/treatmentService";
import { type Alimentacion } from "@/features/nursing/services/feedingService";
import { type Cuidado } from "@/services/nursingService";
import {
  Heart, Thermometer, Wind, Gauge, Droplets, Activity,
  Pill, Apple, ClipboardList, AlertTriangle, TrendingDown, TrendingUp,
  CheckCircle2, XCircle, Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VitalSignChart } from "./VitalSignChart";

const RANGOS: Record<string, { min: number; max: number; unit: string }> = {
  "Temperatura": { min: 36, max: 37.5, unit: "°C" },
  "Frecuencia Cardíaca": { min: 60, max: 100, unit: "lpm" },
  "Frecuencia Respiratoria": { min: 12, max: 20, unit: "rpm" },
  "Presión Arterial": { min: 90, max: 120, unit: "mmHg" },
  "Saturación de Oxígeno": { min: 95, max: 100, unit: "%" },
  "Glucosa Capilar": { min: 70, max: 140, unit: "mg/dL" },
};

interface ResumenTabProps {
  inpatient: Inpatient;
}

function VitalMiniCard({
  icon: Icon,
  label,
  value,
  unit,
  alert,
}: {
  icon: React.ElementType;
  label: string;
  value: number | undefined;
  unit: string;
  alert: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-3 flex flex-col gap-1 transition-all ${
        alert
          ? "border-destructive/40 bg-destructive/5"
          : "border-border hover:border-border/80"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={`h-3.5 w-3.5 ${alert ? "text-destructive" : "text-muted-foreground"}`} />
      </div>
      <div className="flex items-end gap-1">
        <span className={`text-lg font-extrabold font-mono leading-none ${alert ? "text-destructive" : "text-foreground"}`}>
          {value != null ? value : "—"}
        </span>
        <span className="text-[9px] text-muted-foreground mb-0.5">{unit}</span>
      </div>
      {alert && (
        <div className="flex items-center gap-1 text-[9px] font-semibold text-destructive">
          <AlertTriangle className="h-2.5 w-2.5" />
          Fuera de rango
        </div>
      )}
    </div>
  );
}

export function ResumenTab({ inpatient }: ResumenTabProps) {
  const rawControles = inpatient.controles ?? [];
  const latest = React.useMemo(() => getLatestControl(rawControles), [rawControles]);

  // Extract latest values
  const temp = latest ? extractValor(latest.valores, "temperatura") : undefined;
  const fc = latest ? extractValor(latest.valores, "frecuencia card") : undefined;
  const fr = latest ? extractValor(latest.valores, "frecuencia respiratoria") : undefined;
  const pa = latest ? extractValor(latest.valores, "presión arterial") ?? extractValor(latest.valores, "presion arterial") : undefined;
  const sat = latest ? extractValor(latest.valores, "saturaci") : undefined;
  const gluc = latest ? extractValor(latest.valores, "glucosa") : undefined;

  const isAlert = (nombre: string, val: number | undefined) => {
    if (val == null) return false;
    const r = RANGOS[nombre];
    if (!r) return false;
    return val < r.min || val > r.max;
  };

  // Active treatments
  const activeTratamientos = (inpatient.tratamientos ?? []).filter((t: Tratamiento) => t.estado === 0);
  const activeRecetas = activeTratamientos.flatMap((t: Tratamiento) => (t.recetas ?? []).filter((r: Receta) => r.estado === 0));

  // Active diet
  const activeDieta = (inpatient.alimentaciones ?? []).find((a: Alimentacion) => a.estado === 0);

  // Active care plans
  const activeCuidados = (inpatient.plan_de_cuidados ?? []).filter((c: Cuidado) => c.estado === 0 || c.estado == null);

  // Evolution notes count
  const evoluciones = inpatient.evolucion_enfermeria ?? [];

  // Chart data for latest 5 controls
  const chartData = React.useMemo(() => {
    if (rawControles.length === 0) return [];
    const chronological = [...rawControles].sort((a, b) =>
      new Date(a.fecha_control).getTime() - new Date(b.fecha_control).getTime()
    );
    const latestFive = chronological.slice(-5);

    return latestFive.map((c) => ({
      signoNombre: "Frecuencia Cardíaca",
      unidad: "lpm",
      data: [{
        x: new Date(c.fecha_control).getTime(),
        y: extractValor(c.valores, "frecuencia card") ?? 0,
        yBajo: null,
        user: "",
        rol: "",
        observacion: c.observaciones,
      }],
    }));
  }, [rawControles]);

  return (
    <div className="space-y-6">
      {/* Latest Vitals Monitor */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <Heart className="h-4 w-4 text-destructive" />
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Monitor Clínico — Último Control
          </h3>
          {latest && (
            <span className="ml-auto text-[9px] font-mono text-muted-foreground">
              {new Date(latest.fecha_control).toLocaleString("es-ES", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          <VitalMiniCard icon={Thermometer} label="Temp" value={temp} unit="°C" alert={isAlert("Temperatura", temp)} />
          <VitalMiniCard icon={Heart} label="FC" value={fc} unit="lpm" alert={isAlert("Frecuencia Cardíaca", fc)} />
          <VitalMiniCard icon={Droplets} label="SpO₂" value={sat} unit="%" alert={isAlert("Saturación de Oxígeno", sat)} />
          <VitalMiniCard icon={Gauge} label="PA" value={pa} unit="mmHg" alert={isAlert("Presión Arterial", pa)} />
          <VitalMiniCard icon={Wind} label="FR" value={fr} unit="rpm" alert={isAlert("Frecuencia Respiratoria", fr)} />
          <VitalMiniCard icon={Activity} label="Glucosa" value={gluc} unit="mg/dL" alert={isAlert("Glucosa Capilar", gluc)} />
        </div>
      </div>

      {/* Clinical Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tratamientos */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-border/30 pb-2">
            <Pill className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-bold text-foreground uppercase">Tratamientos Activos</h4>
          </div>
          {activeTratamientos.length > 0 ? (
            <div className="space-y-2">
              {activeTratamientos.map((t: Tratamiento) => (
                <div key={t.id} className="text-[10px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{t.tipo}</span>
                    <Badge variant="teal" className="text-[8px]">Activo</Badge>
                  </div>
                  <p className="text-muted-foreground truncate">{t.descripcion}</p>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-muted-foreground">
                    {(t.recetas ?? []).map((r: Receta) => (
                      <span key={r.id} className="bg-secondary/30 px-1.5 py-0.5 rounded text-[9px]">
                        {r.medicamento?.nombre || "Medicamento"} ({r.dosis})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground text-[10px] py-2">
              <XCircle className="h-3.5 w-3.5" />
              Sin tratamientos activos
            </div>
          )}
        </div>

        {/* Alimentación */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-border/30 pb-2">
            <Apple className="h-4 w-4 text-accent-amber" />
            <h4 className="text-xs font-bold text-foreground uppercase">Nutrición</h4>
          </div>
          {activeDieta ? (
            <div className="space-y-2 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">{activeDieta.tipo_dieta?.nombre || "Dieta"}</span>
                <Badge variant="teal" className="text-[8px]">Activa</Badge>
              </div>
              <div className="text-muted-foreground">
                Vía: <span className="text-foreground font-semibold">{activeDieta.via_administracion}</span>
              </div>
              {activeDieta.observaciones && (
                <p className="text-muted-foreground italic bg-secondary/20 p-1.5 rounded">{activeDieta.observaciones}</p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground text-[10px] py-2">
              <XCircle className="h-3.5 w-3.5" />
              Sin dieta asignada
            </div>
          )}
        </div>

        {/* Cuidados + Evolución */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-border/30 pb-2">
            <ClipboardList className="h-4 w-4 text-accent-violet" />
            <h4 className="text-xs font-bold text-foreground uppercase">Cuidados & Evolución</h4>
          </div>
          <div className="space-y-2 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Indicaciones activas:</span>
              <span className="font-bold text-foreground">{activeCuidados.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Notas de evolución:</span>
              <span className="font-bold text-foreground">{evoluciones.length}</span>
            </div>
            {activeCuidados.length > 0 && (
              <div className="space-y-1 pt-1">
                {activeCuidados.slice(0, 3).map((c: Cuidado, i: number) => (
                  <div key={c.id ?? i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-accent-teal shrink-0 mt-0.5" />
                    <span className="text-muted-foreground truncate">{c.descripcion || c.tipo}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Trends */}
      {rawControles.length > 1 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-bold text-foreground uppercase">Tendencia Reciente</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chartData.length > 0 && (
              <VitalSignChart signoNombre="Frecuencia Cardíaca" unidad="lpm" data={chartData[0]?.data ?? []} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
