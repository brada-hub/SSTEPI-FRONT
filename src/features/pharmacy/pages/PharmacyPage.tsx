"use client";
 
import * as React from "react";
import { useMedicinesQuery, usePharmacyMutations } from "../hooks/usePharmacyQuery";
import { InventoryKPIs } from "../components/InventoryKPIs";
import { MedicineTable } from "../components/MedicineTable";
import { DispenseDialog } from "../components/DispenseDialog";
import { MedicineFormDialog } from "../components/MedicineFormDialog";
import { Medicine } from "@/services/pharmacyService";
import { 
  LoadingState, 
  ErrorState, 
  EmptyState 
} from "@/components/ui/clinical-feedback";
import { Pill, RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

export function PharmacyPage() {
  const [isDispenseOpen, setIsDispenseOpen] = React.useState(false);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedMedicine, setSelectedMedicine] = React.useState<Medicine | null>(null);
  const [medicineToEdit, setMedicineToEdit] = React.useState<Medicine | null>(null);

  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const isAdmin = React.useMemo(() => {
    return (
      user?.role?.name?.toLowerCase().includes("admin") ||
      hasPermission("acceso.usuarios-roles")
    );
  }, [user, hasPermission]);

  // TanStack Queries & Mutations
  const { data: medicines, isLoading, isError, refetch } = useMedicinesQuery();
  const { 
    createMedicine, 
    updateMedicine, 
    deleteMedicine, 
    dispenseMedicine 
  } = usePharmacyMutations();

  const handleOpenDispense = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setIsDispenseOpen(true);
  };

  const handleOpenCreate = () => {
    setMedicineToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (medicine: Medicine) => {
    setMedicineToEdit(medicine);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: Partial<Medicine>) => {
    try {
      if (medicineToEdit) {
        await updateMedicine({ id: medicineToEdit.id, data });
      } else {
        await createMedicine(data);
      }
      refetch();
    } catch {
      toast.error("Fallo al registrar los cambios en almacén.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMedicine(id);
      refetch();
    } catch {
      toast.error("Fallo al remover el medicamento de inventario.");
    }
  };

  const handleDispenseSubmit = async (id: number, data: any) => {
    try {
      await dispenseMedicine({ id, ...data });
      refetch();
    } catch {
      // Error handled by mutation toast
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cabecera del Módulo */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-unitepc-sso text-white shadow-md">
            <Pill className="h-5.5 w-5.5" />
          </div>
          <div className="flex flex-col text-left">
            <h2 className="text-lg font-bold text-foreground">
              Control de Inventario Farmacéutico & Dispensación
            </h2>
            <p className="text-xs text-muted-foreground">
              Supervisión de stock crítico, ubicaciones logísticas de estantes y entrega reactiva de fármacos por receta.
            </p>
          </div>
        </div>

        <div className="flex gap-2 self-start sm:self-auto">
          <button
            onClick={() => refetch()}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-bold text-foreground hover:bg-secondary transition-all cursor-pointer"
            title="Sincronizar inventario"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-white shadow-md hover:bg-primary/95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Nuevo Medicamento
            </button>
          )}
        </div>
      </div>

      {/* Renders Condicionales de Carga */}
      {isLoading ? (
        <LoadingState message="Sincronizando inventario farmacéutico..." />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !medicines || medicines.length === 0 ? (
        <EmptyState
          title="Sin Medicamentos Registrados"
          description="Aún no se reportan insumos o fármacos en el almacén de farmacia de este centro."
          icon={Pill}
          actionLabel={isAdmin ? "Registrar Primer Medicamento" : undefined}
          onAction={isAdmin ? handleOpenCreate : undefined}
        />
      ) : (
        <div className="space-y-6">
          {/* Ficha de KPIs */}
          <InventoryKPIs medicines={medicines} />

          {/* Tabla de Inventario */}
          <MedicineTable
            medicines={medicines}
            onOpenDispense={handleOpenDispense}
            onOpenEdit={handleOpenEdit}
            onDelete={handleDelete}
          />
        </div>
      )}

      {/* Modal de Dispensación */}
      <DispenseDialog
        open={isDispenseOpen}
        onOpenChange={setIsDispenseOpen}
        medicine={selectedMedicine}
        onSubmitSuccess={handleDispenseSubmit}
      />

      {/* Modal de Creación / Edición */}
      <MedicineFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        medicineToEdit={medicineToEdit}
        onSubmitSuccess={handleFormSubmit}
      />

    </div>
  );
}
export default PharmacyPage;
