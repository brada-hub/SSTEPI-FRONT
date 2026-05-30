"use client";

import * as React from "react";
import { usePatientsQuery, usePatientMutations } from "../hooks/usePatientsQuery";
import { PatientTable } from "../components/PatientTable";
import { PatientWizardForm } from "../components/PatientWizardForm";
import { DossierDialog } from "../components/DossierDialog";
import { HistoryDialog } from "../components/HistoryDialog";
import { Patient, patientService } from "@/services/patientService";
import { type PatientFormValues } from "@/features/patients/schemas/patientSchema";
import { mapPatientFormToBackend } from "../schemas/patientSchema";
import { 
  LoadingState, 
  ErrorState, 
  EmptyState 
} from "@/components/ui/clinical-feedback";
import { Plus, FolderHeart } from "lucide-react";
import { toast } from "sonner";

export function PatientsPage() {
  const [search, setSearch] = React.useState("");
  
  // Modales State
  const [isWizardOpen, setIsWizardOpen] = React.useState(false);
  const [isDossierOpen, setIsDossierOpen] = React.useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null);
  const [patientToEdit, setPatientToEdit] = React.useState<Patient | null>(null);

  // TanStack Queries & Mutations
  const { data: patients, isLoading, isError, refetch } = usePatientsQuery(search);
  const { createPatient, updatePatient } = usePatientMutations();

  const handleOpenDossier = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDossierOpen(true);
  };

  const handleOpenHistory = async (patient: Patient) => {
    const loadingToast = toast.loading("Consultando historial clínico del paciente...");
    try {
      const fullPatient = await patientService.getPatientById(patient.id);
      setSelectedPatient(fullPatient);
      setIsHistoryOpen(true);
      toast.dismiss(loadingToast);
    } catch {
      toast.error("Error al consultar el historial de internación.");
      toast.dismiss(loadingToast);
    }
  };

  const handleOpenCreate = () => {
    setPatientToEdit(null);
    setIsWizardOpen(true);
  };

  const handleOpenEdit = (patient: Patient) => {
    setPatientToEdit(patient);
    setIsWizardOpen(true);
  };

  const handleFormSubmit = async (values: PatientFormValues) => {
    try {
      const payload = mapPatientFormToBackend(values);
      if (patientToEdit) {
        await updatePatient({ id: patientToEdit.id, data: payload });
        toast.success("Expediente demográfico actualizado correctamente.");
      } else {
        await createPatient(payload);
        toast.success("Expediente demográfico creado correctamente.");
      }
      refetch();
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message || error?.response?.data?.error;
      const validationErrors = error?.response?.data?.errors;
      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0];
        if (Array.isArray(firstError)) {
          toast.error(`Error del servidor: ${firstError[0]}`);
          return;
        }
      }
      toast.error(serverMessage || "Error al registrar los cambios clínicos.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cabecera del Módulo */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-unitepc-sso text-white shadow-md">
            <FolderHeart className="h-5.5 w-5.5" />
          </div>
          <div className="flex flex-col text-left">
            <h2 className="text-lg font-bold text-foreground">
              Directorio Demográfico de Expedientes
            </h2>
            <p className="text-xs text-muted-foreground">
              Visualiza y gestiona las fichas demográficas y antecedentes del censo.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-white shadow-md hover:bg-primary/95 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Nuevo Expediente
        </button>
      </div>

      {/* Renders Condicionales de Estado */}
      {isLoading ? (
        <LoadingState message="Buscando expedientes clínicos demográficos..." />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !patients || patients.length === 0 ? (
        <EmptyState
          title="Directorio de Expedientes Vacío"
          description="Aún no se han registrado fichas demográficas de pacientes en este centro médico."
          icon={FolderHeart}
          actionLabel="Registrar Primer Paciente"
          onAction={handleOpenCreate}
        />
      ) : (
        <PatientTable
          patients={patients}
          onOpenDossier={handleOpenDossier}
          onOpenEdit={handleOpenEdit}
          onOpenHistory={handleOpenHistory}
        />
      )}

      {/* Diálogo Formulario Wizard */}
      <PatientWizardForm
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        patientToEdit={patientToEdit}
        onSubmitSuccess={handleFormSubmit}
      />

      {/* Diálogo Dossier Clínico */}
      <DossierDialog
        open={isDossierOpen}
        onOpenChange={setIsDossierOpen}
        patient={selectedPatient}
      />

      {/* Diálogo Historial Clínico */}
      <HistoryDialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        patient={selectedPatient}
      />
    </div>
  );
}
export default PatientsPage;
