"use client";

import * as React from "react";
import { ControlRaw, extractValor } from "@/services/nursingService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

interface VitalsChartProps {
  controles: ControlRaw[];
  compact?: boolean;
}

interface ChartDataPoint {
  name: string;
  fecha: string;
  temp?: number;
  fc?: number;
  sat?: number;
  pa?: number;
  fr?: number;
  glucosa?: number;
}

const VITALS_META = [
  { key: "temp",    label: "Temp (°C)",    color: "#ef4444", unit: "°C" },
  { key: "fc",      label: "FC (lpm)",     color: "#0ecfb0", unit: "lpm" },
  { key: "sat",     label: "SatO₂ (%)",    color: "#3b82f6", unit: "%" },
  { key: "pa",      label: "PA (mmHg)",    color: "#f59e0b", unit: "mmHg" },
  { key: "fr",      label: "FR (rpm)",     color: "#a855f7", unit: "rpm" },
];

// Custom tooltip for clinical clarity
function ClinicalTooltip({ active, payload, label }: Record<string, unknown>) {
  if (!active || !payload || !(payload as unknown[]).length) return null;
  const data = (payload as Array<{ payload: ChartDataPoint }>)[0]?.payload;
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm p-3 shadow-xl text-[10px] min-w-[140px]">
      <p className="font-mono font-bold text-[9px] text-muted-foreground mb-1.5 border-b border-border/40 pb-1">
        {data?.fecha ?? label as string}
      </p>
      {(payload as Array<{ name: string; value: number; color: string }>).map((entry) => {
        const meta = VITALS_META.find((m) => m.label === entry.name);
        return (
          <div key={entry.name} className="flex items-center justify-between gap-3 py-0.5">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
            </span>
            <span className="font-bold font-mono" style={{ color: entry.color }}>
              {entry.value != null ? `${entry.value}${meta?.unit ?? ""}` : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function VitalsChart({ controles, compact = false }: VitalsChartProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = React.useMemo<ChartDataPoint[]>(() => {
    if (!controles || controles.length === 0) return [];

    return [...controles]
      .sort((a, b) => {
        const da = new Date(a.fecha_control ?? 0).getTime();
        const db = new Date(b.fecha_control ?? 0).getTime();
        return da - db;
      })
      .map((c, idx) => {
        const rawDate = c.fecha_control ?? "";
        const date = rawDate ? new Date(rawDate) : new Date();
        const formattedDate =
          date.toLocaleDateString("es-ES", { day: "numeric", month: "short" }) +
          " " +
          date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

        return {
          name: `C${idx + 1}`,
          fecha: formattedDate,
          temp: extractValor(c.valores, "temperatura"),
          fc: extractValor(c.valores, "frecuencia card"),
          sat: extractValor(c.valores, "saturaci"),
          pa: extractValor(c.valores, "presión arterial") ?? extractValor(c.valores, "presion arterial"),
          fr: extractValor(c.valores, "frecuencia respiratoria"),
          glucosa: extractValor(c.valores, "glucosa"),
        };
      });
  }, [controles]);

  if (!mounted) {
    return (
      <div
        className={`w-full flex items-center justify-center text-xs text-muted-foreground bg-secondary/20 rounded-xl animate-pulse ${
          compact ? "h-32" : "h-52"
        }`}
      >
        <span>Sincronizando curvas clínicas...</span>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div
        className={`w-full flex flex-col items-center justify-center text-[10px] text-muted-foreground font-semibold bg-secondary/25 border border-dashed border-border rounded-xl gap-2 ${
          compact ? "h-32" : "h-52"
        }`}
      >
        <span className="text-2xl opacity-30">📊</span>
        <span>Sin constantes fisiológicas registradas.</span>
      </div>
    );
  }

  return (
    <div
      className="min-w-0 w-full"
      style={{ fontSize: "10px" }}
    >
      <ResponsiveContainer width="100%" height={compact ? 144 : 224} minWidth={0}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.3} />
          <XAxis
            dataKey="name"
            stroke="var(--muted-foreground)"
            fontSize={8}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)" }}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={8}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)" }}
            domain={["auto", "auto"]}
          />
          <Tooltip content={<ClinicalTooltip active={undefined} payload={undefined} label={undefined} />} />
          {!compact && (
            <Legend
              iconType="circle"
              iconSize={6}
              wrapperStyle={{ fontSize: "9px", paddingTop: "4px" }}
            />
          )}
          <Line
            type="monotone"
            dataKey="temp"
            name="Temp (°C)"
            stroke="#ef4444"
            strokeWidth={1.5}
            dot={{ r: 2.5, fill: "#ef4444", strokeWidth: 0 }}
            activeDot={{ r: 4 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="fc"
            name="FC (lpm)"
            stroke="#0ecfb0"
            strokeWidth={1.5}
            dot={{ r: 2.5, fill: "#0ecfb0", strokeWidth: 0 }}
            activeDot={{ r: 4 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="sat"
            name="SatO₂ (%)"
            stroke="#3b82f6"
            strokeWidth={1.5}
            dot={{ r: 2.5, fill: "#3b82f6", strokeWidth: 0 }}
            activeDot={{ r: 4 }}
            connectNulls
          />
          {!compact && (
            <Line
              type="monotone"
              dataKey="pa"
              name="PA (mmHg)"
              stroke="#f59e0b"
              strokeWidth={1.5}
              dot={{ r: 2.5, fill: "#f59e0b", strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              connectNulls
            />
          )}
          {!compact && (
            <Line
              type="monotone"
              dataKey="fr"
              name="FR (rpm)"
              stroke="#a855f7"
              strokeWidth={1.5}
              dot={{ r: 2.5, fill: "#a855f7", strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default VitalsChart;
