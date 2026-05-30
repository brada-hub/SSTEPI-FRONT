"use client";

import * as React from "react";
import {
  type DashboardKpis,
  type OcupacionEspecialidad,
  type EstadoCama,
  type Cama,
} from "@/features/hospital/services/hospitalInfrastructureService";
import { Badge } from "@/components/ui/badge";
import {
  Bed,
  Users,
  Activity,
  Stethoscope,
  DoorOpen,
  TrendingUp,
  CheckCircle2,
  Wrench,
  Loader2,
  Building2,
} from "lucide-react";

interface HospitalDashboardTabProps {
  kpis: DashboardKpis | null | undefined;
  ocupacionEsp: OcupacionEspecialidad[];
  estadoCamas: EstadoCama[];
  camas: Cama[];
  isLoading: boolean;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-2">
      <div className="flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div>
        <span className="text-2xl font-black text-foreground font-mono">{value}</span>
        {sub && <span className="text-[10px] text-muted-foreground font-semibold ml-2">{sub}</span>}
      </div>
    </div>
  );
}

export function HospitalDashboardTab({ kpis, ocupacionEsp, estadoCamas, camas, isLoading }: HospitalDashboardTabProps) {
  if (isLoading) {
    return (
      <div className="h-96 rounded-2xl border border-border bg-card flex flex-col items-center justify-center text-xs text-muted-foreground gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span>Cargando dashboard operativo...</span>
      </div>
    );
  }

  const totalCamas = kpis?.total_camas ?? camas.length;
  const camasOcupadas = kpis?.camas_ocupadas ?? camas.filter((c) => c.disponibilidad === 0).length;
  const camasDisponibles = kpis?.camas_disponibles ?? camas.filter((c) => c.disponibilidad === 1).length;
  const camasMantenimiento = camas.filter((c) => c.disponibilidad === 2).length;
  const ocupacionPct = kpis?.ocupacion_porcentaje ?? (totalCamas > 0 ? Math.round((camasOcupadas / totalCamas) * 100) : 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Bed} label="Total Camas" value={totalCamas} color="bg-primary" />
        <StatCard icon={CheckCircle2} label="Disponibles" value={camasDisponibles} color="bg-emerald-600" sub="Libres" />
        <StatCard icon={Users} label="Ocupadas" value={camasOcupadas} color="bg-destructive" sub={`${ocupacionPct}%`} />
        <StatCard icon={Wrench} label="Mantenimiento" value={camasMantenimiento} color="bg-accent-amber" />
      </div>

      {/* Ocupación General */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Ocupación General del Hospital</h3>
          <span className="ml-auto text-lg font-black font-mono text-foreground">{ocupacionPct}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              ocupacionPct >= 90 ? "bg-destructive" : ocupacionPct >= 70 ? "bg-accent-amber" : "bg-emerald-500"
            }`}
            style={{ width: `${ocupacionPct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
          <span>0% Vacío</span>
          <span>50% Media</span>
          <span>100% Lleno</span>
        </div>
      </div>

      {/* Ocupación por Especialidad */}
      {ocupacionEsp.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            Ocupación por Especialidad
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ocupacionEsp.map((esp, idx) => (
              <div key={`esp-${esp.especialidad_id ?? idx}-${idx}`} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{esp.especialidad_nombre}</span>
                  <Badge variant={esp.porcentaje >= 80 ? "destructive" : esp.porcentaje >= 50 ? "amber" : "teal"} className="text-[9px]">
                    {esp.porcentaje}% Ocup.
                  </Badge>
                </div>
                <div className="text-[10px] text-muted-foreground font-semibold">
                  {esp.total_camas} camas • {esp.camas_ocupadas} ocup.
                </div>
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full ${esp.porcentaje >= 80 ? "bg-destructive" : esp.porcentaje >= 50 ? "bg-accent-amber" : "bg-emerald-500"}`}
                    style={{ width: `${esp.porcentaje}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado por Sala */}
      {estadoCamas.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <DoorOpen className="h-4 w-4 text-primary" />
            Estado por Sala
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {estadoCamas.map((sala, idx) => {
              const total = sala.total_camas;
              const libres = sala.camas_disponibles;
              const ocup = total - libres;
              const pct = total > 0 ? Math.round((ocup / total) * 100) : 0;
              return (
                <div key={`sala-${sala.id ?? idx}-${idx}`} className="rounded-xl border border-border bg-card p-4 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{sala.nombre}</span>
                    <Badge variant={pct >= 80 ? "destructive" : pct >= 50 ? "amber" : "teal"} className="text-[9px]">
                      {pct}%
                    </Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-semibold">
                    {sala.especialidad || "General"}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[9px] font-bold text-center">
                    <div className="bg-emerald-500/10 text-emerald-700 rounded py-1">{libres} Libres</div>
                    <div className="bg-destructive/10 text-destructive rounded py-1">{ocup} Ocup.</div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct >= 80 ? "bg-destructive" : pct >= 50 ? "bg-accent-amber" : "bg-emerald-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
