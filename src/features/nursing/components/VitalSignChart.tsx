"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceArea,
} from "recharts";
import { format } from "date-fns";

export interface ChartPoint {
  x: number; // timestamp
  y: number; // measure (systolic for PA)
  yBajo?: number | null; // measure low (diastolic for PA)
  user: string;
  rol: string;
  observacion?: string;
}

interface VitalSignChartProps {
  signoNombre: string;
  unidad: string;
  data: ChartPoint[];
}

const RANGOS_META: Record<string, { min: number; max: number; minBaja?: number; maxBaja?: number }> = {
  "Frecuencia Cardíaca": { min: 60, max: 100 },
  "Frecuencia Respiratoria": { min: 12, max: 20 },
  "Presión Arterial": { min: 90, max: 120, minBaja: 60, maxBaja: 80 },
  "Saturación de Oxígeno": { min: 95, max: 100 },
  "Temperatura": { min: 36.5, max: 37.5 },
  "Glucosa Capilar": { min: 70, max: 140 },
};

const EJES_Y: Record<string, { min: number; max: number }> = {
  "Frecuencia Cardíaca": { min: 40, max: 180 },
  "Frecuencia Respiratoria": { min: 0, max: 40 },
  "Presión Arterial": { min: 40, max: 200 },
  "Saturación de Oxígeno": { min: 80, max: 101 },
  "Temperatura": { min: 30, max: 42 },
  "Glucosa Capilar": { min: 40, max: 250 },
};

interface TooltipPayloadItem {
  payload: ChartPoint;
}

function ClinicalTooltip({ active, payload, unidad }: { active?: boolean; payload?: TooltipPayloadItem[]; unidad: string }) {
  if (!active || !payload || !payload.length) return null;
  
  const pt: ChartPoint = payload[0].payload;
  const formattedDate = format(new Date(pt.x), "dd/MM/yyyy HH:mm");

  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm p-3 shadow-xl text-[11px] min-w-[160px]">
      <p className="font-mono font-bold text-[10px] text-muted-foreground mb-1.5 border-b border-border/40 pb-1">
        {formattedDate}
      </p>
      <div className="space-y-1">
        {pt.yBajo != null ? (
          <div>
            <span className="text-muted-foreground block text-[9px] uppercase font-bold">Valor Sistólica / Diastólica</span>
            <span className="text-xs font-black text-foreground">
              {pt.y} / {pt.yBajo} <span className="text-[10px] font-normal text-muted-foreground">{unidad}</span>
            </span>
          </div>
        ) : (
          <div>
            <span className="text-muted-foreground block text-[9px] uppercase font-bold">Valor Medido</span>
            <span className="text-xs font-black text-foreground">
              {pt.y} <span className="text-[10px] font-normal text-muted-foreground">{unidad}</span>
            </span>
          </div>
        )}
        <div className="text-[9px] text-muted-foreground pt-1 border-t border-border/20">
          Registrado por: <strong className="text-foreground">{pt.user}</strong> ({pt.rol})
        </div>
        {pt.observacion && (
          <div className="mt-1 p-1 bg-secondary/40 rounded text-[9px] text-muted-foreground italic max-w-[180px] break-words">
            Obs: {pt.observacion}
          </div>
        )}
      </div>
    </div>
  );
}

export function VitalSignChart({ signoNombre, unidad, data }: VitalSignChartProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-48 bg-secondary/10 rounded-xl animate-pulse flex items-center justify-center text-xs text-muted-foreground">
        Cargando gráfica...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-48 border border-dashed border-border bg-secondary/5 rounded-xl flex flex-col items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <span className="text-lg opacity-40">📊</span>
        <span>Sin registros para graficar.</span>
      </div>
    );
  }

  const rango = RANGOS_META[signoNombre];
  const eje = EJES_Y[signoNombre] || { min: "auto", max: "auto" };

  // Sort data chronologically just in case
  const sortedData = [...data].sort((a, b) => a.x - b.x);

  return (
    <div className="w-full text-[10px]">
      <ResponsiveContainer width="100%" height={208} minWidth={0}>
        <LineChart data={sortedData} margin={{ top: 12, right: 10, bottom: 4, left: -22 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.3} />
          <XAxis
            dataKey="x"
            stroke="var(--muted-foreground)"
            fontSize={8}
            tickLine={false}
            axisLine={false}
            tickFormatter={(tick) => format(new Date(tick), "dd/MM HH:mm")}
            tick={{ fill: "var(--muted-foreground)" }}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={8}
            tickLine={false}
            axisLine={false}
            domain={[eje.min, eje.max]}
            tick={{ fill: "var(--muted-foreground)" }}
          />
          
          {/* Reference normal range band if applicable */}
          {rango && (
            <ReferenceArea
              y1={rango.min}
              y2={rango.max}
              fill="var(--color-accent-teal)"
              fillOpacity={0.06}
              stroke="var(--color-accent-teal)"
              strokeOpacity={0.1}
              strokeDasharray="3 3"
            />
          )}

          <Tooltip content={<ClinicalTooltip unidad={unidad} />} />
          
          {/* Systolic or primary value line */}
          <Line
            type="monotone"
            dataKey="y"
            name={signoNombre === "Presión Arterial" ? "Presión Sistólica" : signoNombre}
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-primary)", strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 1 }}
            connectNulls
          />

          {/* Diastolic value line (only for Presión Arterial) */}
          {signoNombre === "Presión Arterial" && (
            <Line
              type="monotone"
              dataKey="yBajo"
              name="Presión Diastólica"
              stroke="var(--color-accent-teal)"
              strokeWidth={1.8}
              dot={{ r: 3, fill: "var(--color-accent-teal)", strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 1 }}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
export default VitalSignChart;
