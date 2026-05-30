"use client";

import * as React from "react";
import { useInpatientsQuery, useNursingMutations } from "../hooks/useNursingQuery";
import { InpatientCard } from "../components/InpatientCard";
import { PatientClinicalPanel } from "../components/PatientClinicalPanel";
import { VitalSignsForm } from "../components/VitalSignsForm";
import { EvolutionDialog } from "../components/EvolutionDialog";
import { Inpatient } from "@/services/nursingService";
import { type PostControlPayload } from "@/features/nursing/services/vitalSignsService";
import { 
  LoadingState, 
  ErrorState, 
  EmptyState 
} from "@/components/ui/clinical-feedback";
import { Activity, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function NursingPage() {
  const [search, setSearch] = React.useState("");
  const [selectedInpatient, setSelectedInpatient] = React.useState<Inpatient | null>(null);

  // Modales State
  const [isVitalsOpen, setIsVitalsOpen] = React.useState(false);
  const [isNoteOpen, setIsNoteOpen] = React.useState(false);
  const [activeInpatientForModal, setActiveInpatientForModal] = React.useState<Inpatient | null>(null);

  // TanStack Queries & Mutations
  const { data: inpatients, isLoading, isError, refetch } = useInpatientsQuery();
  const { addVitalControl, addEvolutionNote } = useNursingMutations();

  const handleOpenVitals = (inpatient: Inpatient) => {
    setActiveInpatientForModal(inpatient);
    setIsVitalsOpen(true);
  };

  const handleOpenNote = (inpatient: Inpatient) => {
    setActiveInpatientForModal(inpatient);
    setIsNoteOpen(true);
  };

  const handleSelectInpatient = (inpatient: Inpatient) => {
    setSelectedInpatient(inpatient);
  };

  const handleVitalSubmit = async (values: PostControlPayload) => {
    try {
      await addVitalControl(values);
      toast.success("Constantes vitales registradas correctamente.");
      refetch();
      // Actualizar el inpatient seleccionado para reflejar los cambios
      if (selectedInpatient && selectedInpatient.id === values.internacion_id) {
        refetch();
      }
    } catch {
      toast.error("Fallo al registrar los signos vitales.");
    }
  };

  const handleNoteSubmit = async (values: { internacion_id: number; nota: string }) => {
    try {
      await addEvolutionNote(values);
      toast.success("Nota de evolución clínica registrada.");
      refetch();
    } catch {
      toast.error("Fallo al registrar la nota.");
    }
  };

  // Filtrado reactivo en caliente de internados
  const filteredInpatients = React.useMemo(() => {
    if (!inpatients) return [];
    if (!search.trim()) return inpatients;
    const term = search.toLowerCase();
    return inpatients.filter((i) => {
      const nombre = (i.paciente?.nombre ?? "").toLowerCase();
      const apellidos = (i.paciente?.apellidos ?? "").toLowerCase();
      const cama = (i.cama?.codigo ?? "").toLowerCase();
      const sala = (i.sala?.nombre ?? "").toLowerCase();
      const diagnostico = (i.diagnostico_ingreso ?? "").toLowerCase();
      return (
        nombre.includes(term) ||
        apellidos.includes(term) ||
        cama.includes(term) ||
        sala.includes(term) ||
        diagnostico.includes(term)
      );
    });
  }, [inpatients, search]);

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-unitepc-sso text-white shadow-md">
            <Activity className="h-5.5 w-5.5" />
          </div>
          <div className="flex flex-col text-left">
            <h2 className="text-lg font-bold text-foreground">
              Estación Enfermería & Censo
            </h2>
            <p className="text-xs text-muted-foreground">
              Supervisión en caliente de pacientes internados, curvas vitales, evoluciones y dietas asignadas.
            </p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-4 text-xs font-bold text-foreground hover:bg-secondary transition-all self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar Censo
        </button>
      </div>

      {/* Renders Condicionales de Carga */}
      {isLoading ? (
        <LoadingState message="Buscando censo clínico de internados..." />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !inpatients || inpatients.length === 0 ? (
        <EmptyState
          title="Sin Pacientes Internados"
          description="No se encuentran registros activos de internaciones en este turno clínico."
          icon={Activity}
        />
      ) : selectedInpatient ? (
        <PatientClinicalPanel
          inpatient={selectedInpatient}
          internacionId={selectedInpatient.id}
          onClose={() => {
            setSelectedInpatient(null);
            refetch();
          }}
        />
      ) : (
        <div className="space-y-4">
          {/* Buscador */}
          <div className="relative flex max-w-sm items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por paciente, cama o sala..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-card pl-10 pr-4 text-xs font-semibold text-foreground outline-none focus:border-primary transition-all placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Grid de Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredInpatients.map((inpatient) => (
              <InpatientCard
                key={inpatient.id}
                inpatient={inpatient}
                onOpenVitals={handleOpenVitals}
                onOpenNote={handleOpenNote}
                onSelect={handleSelectInpatient}
              />
            ))}
          </div>
        </div>
      )}

      {/* Diálogos modales */}
      <VitalSignsForm
        open={isVitalsOpen}
        onOpenChange={setIsVitalsOpen}
        internacionId={activeInpatientForModal?.id ?? 0}
        onSubmit={async (valores, observaciones) => {
          if (!activeInpatientForModal) return;
          await handleVitalSubmit({
            internacion_id: activeInpatientForModal.id,
            valores,
            observaciones,
          });
        }}
        isPending={false}
      />

      <EvolutionDialog
        open={isNoteOpen}
        onOpenChange={setIsNoteOpen}
        inpatient={activeInpatientForModal}
        onSubmitSuccess={handleNoteSubmit}
      />
    </div>
  );
}
export default NursingPage;
