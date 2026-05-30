"use client";

import * as React from "react";
import { useNutritionInpatients, useNutritionMutations } from "../hooks/useNutritionQuery";
import { DietTable } from "../components/DietTable";
import { DietAssignmentDialog } from "../components/DietAssignmentDialog";
import { DietSuspensionDialog } from "../components/DietSuspensionDialog";
import { 
  LoadingState, 
  ErrorState, 
  EmptyState 
} from "@/components/ui/clinical-feedback";
import { Apple, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function NutritionPage() {
  // Modales State
  const [isAssignOpen, setIsAssignOpen] = React.useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = React.useState(false);
  
  const [selectedInpatient, setSelectedInpatient] = React.useState<any | null>(null);
  const [selectedDiet, setSelectedDiet] = React.useState<any | null>(null);

  // TanStack Queries & Mutations
  const { data: patients, isLoading, isError, refetch } = useNutritionInpatients();
  const { assignDiet, suspendDiet } = useNutritionMutations();

  const handleOpenAssign = (inpatient: any) => {
    setSelectedInpatient(inpatient);
    setIsAssignOpen(true);
  };

  const handleOpenSuspend = (diet: any) => {
    setSelectedDiet(diet);
    setIsSuspendOpen(true);
  };

  const handleAssignSubmit = async (internationId: number, data: any) => {
    try {
      await assignDiet({ internationId, dietData: data });
      toast.success("Régimen alimenticio asignado al paciente con éxito.");
      refetch();
    } catch (error) {
      toast.error("Fallo al registrar la asignación alimenticia.");
    }
  };

  const handleSuspendSubmit = async (dietId: number | string, motivo: string) => {
    try {
      await suspendDiet({ dietId, motivo });
      toast.success("Régimen alimenticio suspendido correctamente.");
      refetch();
    } catch (error) {
      toast.error("Fallo al suspender el régimen alimenticio.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cabecera del Módulo */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-unitepc-sso text-white shadow-md">
            <Apple className="h-5.5 w-5.5" />
          </div>
          <div className="flex flex-col text-left">
            <h2 className="text-lg font-bold text-foreground">
              Consola de Asignación Alimenticia & Dietas
            </h2>
            <p className="text-xs text-muted-foreground">
              Supervisión de dietas asignadas, notas de ingesta y flujos de suspensión por nutricionistas del hospital.
            </p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-4 text-xs font-bold text-foreground hover:bg-secondary transition-all self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar Dietas
        </button>
      </div>

      {/* Renders Condicionales de Carga */}
      {isLoading ? (
        <LoadingState message="Buscando censo clínico de ingestas y dietas..." />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !patients || patients.length === 0 ? (
        <EmptyState
          title="Sin Internaciones Activas"
          description="No se registran pacientes internados con requerimiento dietético activo en este censo."
          icon={Apple}
        />
      ) : (
        <DietTable
          patients={patients}
          onOpenAssign={handleOpenAssign}
          onOpenSuspend={handleOpenSuspend}
        />
      )}

      {/* Modales de Control */}
      <DietAssignmentDialog
        open={isAssignOpen}
        onOpenChange={setIsAssignOpen}
        inpatient={selectedInpatient}
        onSubmitSuccess={handleAssignSubmit}
      />

      <DietSuspensionDialog
        open={isSuspendOpen}
        onOpenChange={setIsSuspendOpen}
        diet={selectedDiet}
        onSubmitSuccess={handleSuspendSubmit}
      />

    </div>
  );
}
export default NutritionPage;
