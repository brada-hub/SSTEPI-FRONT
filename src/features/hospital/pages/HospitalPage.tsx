"use client";

import * as React from "react";
import {
  Building2,
  RefreshCw,
  LayoutDashboard,
  Stethoscope,
  DoorOpen,
  Bed,
  Settings,
  Loader2,
} from "lucide-react";
import {
  useSalasQuery,
  useEspecialidadesQuery,
  useCamasQuery,
  useDashboardKpisQuery,
  useOcupacionEspecialidadQuery,
  useEstadoCamasQuery,
} from "@/features/hospital/hooks/useHospitalInfrastructure";
import { HospitalDashboardTab } from "@/features/hospital/components/HospitalDashboardTab";
import { EspecialidadesTab } from "@/features/hospital/components/EspecialidadesTab";
import { SalasTab } from "@/features/hospital/components/SalasTab";
import { CamasTab } from "@/features/hospital/components/CamasTab";
import { HospitalConfigTab } from "@/features/hospital/components/HospitalConfigTab";

type TabId = "dashboard" | "especialidades" | "salas" | "camas" | "config";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "especialidades", label: "Especialidades", icon: Stethoscope },
  { id: "salas", label: "Salas", icon: DoorOpen },
  { id: "camas", label: "Camas", icon: Bed },
  { id: "config", label: "Configuración", icon: Settings },
];

export function HospitalPage() {
  const [activeTab, setActiveTab] = React.useState<TabId>("dashboard");

  const { data: salas, isLoading: loadingSalas, refetch: refetchSalas } = useSalasQuery();
  const { data: especialidades, isLoading: loadingEspecialidades, refetch: refetchEsp } = useEspecialidadesQuery();
  const { data: camas, isLoading: loadingCamas, refetch: refetchCamas } = useCamasQuery();
  const { data: kpis, isLoading: loadingKpis, refetch: refetchKpis } = useDashboardKpisQuery();
  const { data: ocupacionEsp, refetch: refetchOcup } = useOcupacionEspecialidadQuery();
  const { data: estadoCamas, refetch: refetchEstado } = useEstadoCamasQuery();

  const isLoading = loadingSalas || loadingEspecialidades || loadingCamas || loadingKpis;

  const refetchAll = () => {
    refetchSalas();
    refetchEsp();
    refetchCamas();
    refetchKpis();
    refetchOcup();
    refetchEstado();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-unitepc-sso text-white shadow-md">
            <Building2 className="h-5.5 w-5.5" />
          </div>
          <div className="flex flex-col text-left">
            <h2 className="text-lg font-bold text-foreground">
              Gestión de Infraestructura Hospitalaria
            </h2>
            <p className="text-xs text-muted-foreground">
              Administración de especialidades, salas, camas y configuración institucional.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={refetchAll}
          disabled={isLoading}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-4 text-xs font-bold text-foreground hover:bg-secondary transition-all self-start sm:self-auto cursor-pointer disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-border bg-card p-1.5 flex gap-1 shadow-sm overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-1.5 h-8 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                active
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "dashboard" && (
          <HospitalDashboardTab
            kpis={kpis}
            ocupacionEsp={ocupacionEsp ?? []}
            estadoCamas={estadoCamas ?? []}
            camas={camas ?? []}
            isLoading={isLoading}
          />
        )}
        {activeTab === "especialidades" && (
          <EspecialidadesTab especialidades={especialidades ?? []} isLoading={loadingEspecialidades} />
        )}
        {activeTab === "salas" && (
          <SalasTab
            salas={salas ?? []}
            especialidades={especialidades ?? []}
            isLoading={loadingSalas}
          />
        )}
        {activeTab === "camas" && (
          <CamasTab salas={salas ?? []} camas={camas ?? []} isLoading={loadingCamas} />
        )}
        {activeTab === "config" && <HospitalConfigTab />}
      </div>
    </div>
  );
}

export default HospitalPage;
