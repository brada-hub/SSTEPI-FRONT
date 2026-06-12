import * as React from "react";
import { Routes, Route, Navigate, Outlet, useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import DashboardLayout from "@/app/(dashboard)/layout";

// Import core pages from the app directory
import LoginPage from "@/app/login/page";
import DashboardPage from "@/app/(dashboard)/dashboard/page";
import NursingRoute from "@/app/(dashboard)/estacion-enfermeria/page";
import HospitalRoute from "@/app/(dashboard)/gestion-hospital/page";
import PharmacyRoute from "@/app/(dashboard)/medicamentos/page";
import MisPacientesRoute from "@/app/(dashboard)/mis-pacientes/page";
import NutritionRoute from "@/app/(dashboard)/nutricion/page";
import PatientsRoute from "@/app/(dashboard)/pacientes/page";
import AdminRoute from "@/app/(dashboard)/usuarios-y-roles/page";
import AdmissionRoute from "@/app/(dashboard)/admision/page";

// Import Patient panel component wrapper
import { PatientClinicalPanelWrapper } from "@/features/nursing/components/PatientClinicalPanelWrapper";

// ── Authentication Protection Guard ──
function ProtectedRoute() {
  const token = useAuthStore((state) => state.token);
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// ── Client-side Patient Panel Parameter Resolver Wrapper ──
function PatientPanelPage() {
  const { id } = useParams<{ id: string }>();
  const internacionId = Number(id);

  if (isNaN(internacionId) || internacionId <= 0) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <PatientClinicalPanelWrapper internacionId={internacionId} />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated Dashboard Subsystem */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Main Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* Clinical & Nursing Modules */}
          <Route path="/estacion-enfermeria" element={<NursingRoute />} />
          <Route path="/pacientes" element={<PatientsRoute />} />
          <Route path="/pacientes/:id/panel" element={<PatientPanelPage />} />
          <Route path="/mis-pacientes" element={<MisPacientesRoute />} />
          <Route path="/nutricion" element={<NutritionRoute />} />
          
          {/* Administrative Modules */}
          <Route path="/admision" element={<AdmissionRoute />} />
          <Route path="/medicamentos" element={<PharmacyRoute />} />
          <Route path="/gestion-hospital" element={<HospitalRoute />} />
          <Route path="/usuarios-y-roles" element={<AdminRoute />} />
          
          {/* Default Root Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>

      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
