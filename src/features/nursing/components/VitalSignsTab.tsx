"use client";

import * as React from "react";
import { type Inpatient, type ControlRaw } from "@/services/nursingService";
import { VitalSignsForm } from "@/features/nursing/components/VitalSignsForm";
import { VitalSignChart, type ChartPoint } from "@/features/nursing/components/VitalSignChart";
import { type ValorControlPayload } from "@/features/nursing/services/vitalSignsService";
import { useAuthStore } from "@/stores/authStore";
import { Heart, Activity, Thermometer, Droplets, Gauge, AlertCircle, Plus, Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VitalSignsTabProps {
  inpatient: Inpatient;
  onRegisterVitals: (valores: ValorControlPayload[], observaciones: string) => Promise<void>;
  isRegisterPending?: boolean;
}

const RANGOS_NORMALES: Record<string, { min: number; max: number; minBaja?: number; maxBaja?: number }> = {
  "Frecuencia Cardíaca": { min: 60, max: 100 },
  "Frecuencia Respiratoria": { min: 12, max: 20 },
  "Presión Arterial": { min: 90, max: 120, minBaja: 60, maxBaja: 80 },
  "Saturación de Oxígeno": { min: 95, max: 100 },
  "Temperatura": { min: 36.5, max: 37.5 },
  "Glucosa Capilar": { min: 70, max: 140 },
};

function getIconForStat(nombre: string) {
  const cn = "h-5 w-5";
  switch (nombre) {
    case "Frecuencia Cardíaca":
      return <Heart className={`${cn} text-destructive`} />;
    case "Frecuencia Respiratoria":
      return <Activity className={`${cn} text-purple-500`} />;
    case "Presión Arterial":
      return <Gauge className={`${cn} text-accent-amber`} />;
    case "Saturación de Oxígeno":
      return <Droplets className={`${cn} text-blue-500`} />;
    case "Temperatura":
      return <Thermometer className={`${cn} text-red-500`} />;
    default:
      return <Activity className={`${cn} text-accent-teal`} />;
  }
}

function getStatus(nombre: string, valor: number, valorBajo?: number | null) {
  const rango = RANGOS_NORMALES[nombre];
  if (!rango) return { label: "Normal", color: "text-muted-foreground bg-secondary/50", status: "normal" };

  if (nombre === "Presión Arterial" && valorBajo != null) {
    if (valor > rango.max || valorBajo > 80) {
      return { label: "Alto", color: "text-destructive bg-destructive/10 animate-pulse border-destructive/20", status: "high" };
    }
    if (valor < rango.min || valorBajo < 60) {
      return { label: "Bajo", color: "text-blue-500 bg-blue-500/10 border-blue-500/20", status: "low" };
    }
    return { label: "Normal", color: "text-accent-teal bg-accent-teal/10 border-accent-teal/20", status: "normal" };
  }

  if (valor < rango.min) {
    return { label: "Bajo", color: "text-blue-500 bg-blue-500/10 border-blue-500/20", status: "low" };
  }
  if (valor > rango.max) {
    return { label: "Alto", color: "text-destructive bg-destructive/10 animate-pulse border-destructive/20", status: "high" };
  }
  return { label: "Normal", color: "text-accent-teal bg-accent-teal/10 border-accent-teal/20", status: "normal" };
}

export function VitalSignsTab({
  inpatient,
  onRegisterVitals,
  isRegisterPending,
}: VitalSignsTabProps) {
  const [formOpen, setFormOpen] = React.useState(false);
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const canRegister = React.useMemo(() => {
    return (
      hasPermission("acceso.estacion-enfermeria") ||
      hasPermission("acceso.mis-pacientes") ||
      user?.role?.name?.toLowerCase().includes("enfermero") ||
      user?.role?.name?.toLowerCase().includes("enfermera") ||
      user?.role?.name?.toLowerCase().includes("medico") ||
      user?.role?.name?.toLowerCase().includes("médico")
    );
  }, [user, hasPermission]);

  // Extract raw controls history from inpatient
  const rawControls: ControlRaw[] = inpatient.controles ?? [];
  const activeControls = rawControls.filter((c) => c.tipo !== "Evolución Médica");

  // Get latest control for stat cards
  const latestControl = activeControls.length > 0 ? activeControls[0] : null;

  // Build stat cards for clinical vitals — defensively, no non-null assertions
  const statCards = React.useMemo(() => {
    if (!latestControl || !latestControl.valores) return [];
    const exclude = ["Peso", "Talla", "Altura", "IMC"];

    // Previous control for trend comparison
    const prevControl = activeControls.length > 1 ? activeControls[1] : null;

    return latestControl.valores
      .filter((v) => {
        const nombre = v.signo?.nombre;
        return typeof nombre === "string" && nombre.length > 0 && !exclude.includes(nombre);
      })
      .map((v) => {
        const nombre = v.signo!.nombre;
        const unidad = v.signo?.unidad ?? "";

        const valRaw = typeof v.medida === "string" ? parseFloat(v.medida) : v.medida;
        const valNum = typeof valRaw === "number" && !isNaN(valRaw) ? valRaw : 0;

        const valBajoRaw = v.medida_baja != null
          ? (typeof v.medida_baja === "string" ? parseFloat(v.medida_baja) : v.medida_baja)
          : null;
        const valBajoNum = typeof valBajoRaw === "number" && !isNaN(valBajoRaw) ? valBajoRaw : null;

        const status = getStatus(nombre, valNum, valBajoNum);

        // Trend: compare with previous control's same signo
        let trend: "up" | "down" | "same" | null = null;
        if (prevControl && prevControl.valores) {
          const prevVal = prevControl.valores.find((pv) => pv.signo?.nombre === nombre);
          if (prevVal) {
            const prevRaw = typeof prevVal.medida === "string" ? parseFloat(prevVal.medida) : prevVal.medida;
            const prevNum = typeof prevRaw === "number" && !isNaN(prevRaw) ? prevRaw : 0;
            if (valNum > prevNum * 1.02) trend = "up";
            else if (valNum < prevNum * 0.98) trend = "down";
            else trend = "same";
          }
        }

        return {
          nombre,
          valor: valNum,
          valorBajo: valBajoNum,
          valorFormateado: valBajoNum != null ? `${valNum}/${valBajoNum}` : `${valNum}`,
          unidad,
          status,
          trend,
        };
      });
  }, [latestControl, activeControls]);

  // Group historical data for charts — guard against NaN and invalid dates
  const chartData = React.useMemo(() => {
    if (activeControls.length === 0) return [];
    const exclude = ["Peso", "Talla", "Altura", "IMC"];
    const grouped: Record<string, { data: ChartPoint[]; unidad: string }> = {};

    const chronologicalControls = [...activeControls].reverse();

    chronologicalControls.forEach((c) => {
      if (!c.valores || !c.fecha_control) return;

      const ts = new Date(c.fecha_control).getTime();
      if (isNaN(ts)) return;

      const userName = c.user
        ? `${c.user.nombre ?? ""} ${c.user.apellidos ?? ""}`.trim() || c.user.name || "Personal Clínico"
        : "Sistema";
      const userRol = c.user?.rol?.nombre || "Personal";

      c.valores.forEach((v) => {
        const nombre = v.signo?.nombre;
        if (!nombre || exclude.includes(nombre)) return;
        const unidad = v.signo?.unidad ?? "";

        const valRaw = typeof v.medida === "string" ? parseFloat(v.medida) : v.medida;
        const valNum = typeof valRaw === "number" && !isNaN(valRaw) ? valRaw : 0;

        const valBajoRaw = v.medida_baja != null
          ? (typeof v.medida_baja === "string" ? parseFloat(v.medida_baja) : v.medida_baja)
          : null;
        const valBajoNum = typeof valBajoRaw === "number" && !isNaN(valBajoRaw) ? valBajoRaw : null;

        if (!grouped[nombre]) {
          grouped[nombre] = { data: [], unidad };
        }

        grouped[nombre].data.push({
          x: ts,
          y: valNum,
          yBajo: valBajoNum,
          user: userName,
          rol: userRol,
          observacion: c.observaciones,
        });
      });
    });

    return Object.keys(grouped).map((nombre) => ({
      signoNombre: nombre,
      unidad: grouped[nombre].unidad,
      data: grouped[nombre].data,
    }));
  }, [activeControls]);

  const isAlta = !!inpatient.fecha_alta;

  return (
    <div className="space-y-6">
      {/* Botón de Registro */}
      <div className="flex items-center justify-between border-b border-border/30 pb-3">
        <div>
          <h2 className="text-sm font-extrabold text-foreground">Signos Vitales y Triaje</h2>
          <p className="text-[10px] text-muted-foreground">
            Monitoreo en tiempo real de las constantes clínicas del paciente.
          </p>
        </div>
        {!isAlta && canRegister && (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-white shadow-sm hover:bg-primary/90 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Registrar Constantes
          </button>
        )}
      </div>

      {/* Cards Row */}
      {statCards.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {statCards.map((card) => (
            <div
              key={card.nombre}
              className="rounded-xl border border-border bg-card p-3 flex flex-col justify-between h-24 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-muted-foreground uppercase truncate pr-1">
                  {card.nombre}
                </span>
                {getIconForStat(card.nombre)}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-lg font-black text-foreground font-mono tracking-tight">
                  {card.valorFormateado}
                </span>
                <span className="text-[9px] text-muted-foreground font-semibold">
                  {card.unidad}
                </span>
                {card.trend === "up" && <TrendingUp className="h-3 w-3 text-destructive" />}
                {card.trend === "down" && <TrendingDown className="h-3 w-3 text-blue-500" />}
                {card.trend === "same" && <Minus className="h-3 w-3 text-muted-foreground" />}
              </div>
              <div className="mt-1 flex justify-start">
                <span
                  className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${card.status.color}`}
                >
                  {card.status.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-secondary/5 p-8 text-center flex flex-col items-center justify-center gap-2">
          <Info className="h-6 w-6 text-muted-foreground/60" />
          <h4 className="text-xs font-bold text-foreground">Sin registros recientes</h4>
          <p className="text-[10px] text-muted-foreground max-w-[280px]">
            No se han registrado constantes fisiológicas en las últimas horas para este paciente.
          </p>
        </div>
      )}

      {/* Charts Grid */}
      {chartData.length > 0 && (
        <div className="space-y-4 pt-2">
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Curvas de Evolución Clínica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chartData.map((chart) => (
              <div
                key={chart.signoNombre}
                className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between border-b border-border/30 pb-2">
                  <div className="flex items-center gap-2">
                    {getIconForStat(chart.signoNombre)}
                    <span className="text-xs font-bold text-foreground">{chart.signoNombre}</span>
                  </div>
                  <Badge variant="secondary" className="text-[9px] font-semibold">
                    {chart.unidad}
                  </Badge>
                </div>
                <VitalSignChart
                  signoNombre={chart.signoNombre}
                  unidad={chart.unidad}
                  data={chart.data}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Dialog */}
      <VitalSignsForm
        open={formOpen}
        onOpenChange={setFormOpen}
        internacionId={inpatient.id}
        onSubmit={onRegisterVitals}
        isPending={isRegisterPending}
      />
    </div>
  );
}
export default VitalSignsTab;
