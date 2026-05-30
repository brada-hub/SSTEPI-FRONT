"use client";

import * as React from "react";
import { useRoleViewsStore } from "@/stores/roleViewsStore";
import {
  AdminDashboard,
  MedicoDashboard,
  EnfermeriaDashboard,
  NutricionDashboard,
  FarmaciaDashboard,
  AdmisionDashboard,
} from "@/components/dashboard/RoleDashboards";

const DASHBOARD_MAP: Record<string, React.ComponentType> = {
  administrador: AdminDashboard,
  medico: MedicoDashboard,
  enfermeria: EnfermeriaDashboard,
  nutricion: NutricionDashboard,
  farmacia: FarmaciaDashboard,
  admision: AdmisionDashboard,
};

export default function DashboardPage() {
  const activeRoleView = useRoleViewsStore((state) => state.activeRoleView);

  const viewId = activeRoleView || "administrador";
  const DashboardComponent = DASHBOARD_MAP[viewId] || AdminDashboard;

  return <DashboardComponent />;
}
