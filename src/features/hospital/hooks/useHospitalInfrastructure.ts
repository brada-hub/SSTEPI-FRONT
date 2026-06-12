"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  hospitalInfrastructureService,
  type HospitalConfigPayload,
  type EspecialidadPayload,
  type SalaPayload,
  type CamaPayload,
} from "@/features/hospital/services/hospitalInfrastructureService";

// ── Query Keys ────────────────────────────────────────────────────────────────
const QK = {
  hospitalConfig: ["hospital-config"],
  especialidades: ["especialidades"],
  salas: ["salas"],
  camas: ["camas"],
  camasDisponibles: ["camas-disponibles"],
  kpis: ["dashboard-kpis"],
  ocupacionEspecialidad: ["dashboard-ocupacion-especialidad"],
  estadoCamas: ["dashboard-estado-camas"],
  admissionInfrastructure: ["admission-infrastructure"],
} as const;

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: QK.especialidades });
  qc.invalidateQueries({ queryKey: QK.salas });
  qc.invalidateQueries({ queryKey: QK.camas });
  qc.invalidateQueries({ queryKey: QK.camasDisponibles });
  qc.invalidateQueries({ queryKey: QK.kpis });
  qc.invalidateQueries({ queryKey: QK.ocupacionEspecialidad });
  qc.invalidateQueries({ queryKey: QK.estadoCamas });
  qc.invalidateQueries({ queryKey: QK.admissionInfrastructure });
}

function getMutationErrorMsg(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const res = (err as any).response;
    if (res && res.data) {
      if (res.data.message) return res.data.message;
      if (res.data.error) return res.data.error;
      if (res.data.errors) {
        const first = Object.values(res.data.errors)[0];
        if (Array.isArray(first)) return first[0];
      }
    }
  }
  return fallback;
}

// ── Hospital Config ───────────────────────────────────────────────────────────
export function useHospitalConfigQuery() {
  return useQuery({
    queryKey: QK.hospitalConfig,
    queryFn: () => hospitalInfrastructureService.getHospitalConfig(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateHospitalConfigMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: HospitalConfigPayload }) =>
      hospitalInfrastructureService.updateHospitalConfig(id, payload),
    onSuccess: () => {
      toast.success("Configuración del hospital actualizada.");
      qc.invalidateQueries({ queryKey: QK.hospitalConfig });
    },
    onError: (err) => toast.error(getMutationErrorMsg(err, "Error al actualizar la configuración.")),
  });
}

// ── Especialidades ────────────────────────────────────────────────────────────
export function useEspecialidadesQuery() {
  return useQuery({
    queryKey: QK.especialidades,
    queryFn: () => hospitalInfrastructureService.getEspecialidades(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateEspecialidadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: EspecialidadPayload) =>
      hospitalInfrastructureService.createEspecialidad(payload),
    onSuccess: () => {
      toast.success("Especialidad creada correctamente.");
      invalidateAll(qc);
    },
    onError: (err) => toast.error(getMutationErrorMsg(err, "Error al crear la especialidad.")),
  });
}

export function useUpdateEspecialidadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: EspecialidadPayload }) =>
      hospitalInfrastructureService.updateEspecialidad(id, payload),
    onSuccess: () => {
      toast.success("Especialidad actualizada.");
      invalidateAll(qc);
    },
    onError: (err) => toast.error(getMutationErrorMsg(err, "Error al actualizar la especialidad.")),
  });
}

export function useDeleteEspecialidadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => hospitalInfrastructureService.deleteEspecialidad(id),
    onSuccess: () => {
      toast.success("Especialidad eliminada.");
      invalidateAll(qc);
    },
    onError: (err: unknown) => {
      const msg =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      toast.error(msg || "Error al eliminar la especialidad.");
    },
  });
}

// ── Salas ─────────────────────────────────────────────────────────────────────
export function useSalasQuery() {
  return useQuery({
    queryKey: QK.salas,
    queryFn: () => hospitalInfrastructureService.getSalas(),
    staleTime: 1 * 60 * 1000,
  });
}

export function useCreateSalaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SalaPayload) => hospitalInfrastructureService.createSala(payload),
    onSuccess: () => {
      toast.success("Sala creada correctamente.");
      invalidateAll(qc);
    },
    onError: (err) => toast.error(getMutationErrorMsg(err, "Error al crear la sala.")),
  });
}

export function useUpdateSalaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SalaPayload }) =>
      hospitalInfrastructureService.updateSala(id, payload),
    onSuccess: () => {
      toast.success("Sala actualizada.");
      invalidateAll(qc);
    },
    onError: (err) => toast.error(getMutationErrorMsg(err, "Error al actualizar la sala.")),
  });
}

export function useDeleteSalaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => hospitalInfrastructureService.deleteSala(id),
    onSuccess: () => {
      toast.success("Sala eliminada.");
      invalidateAll(qc);
    },
    onError: (err: unknown) => {
      const msg =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      toast.error(msg || "Error al eliminar la sala.");
    },
  });
}

// ── Camas ─────────────────────────────────────────────────────────────────────
export function useCamasQuery(incluirInactivas?: boolean) {
  return useQuery({
    queryKey: incluirInactivas ? [...QK.camas, "incluir-inactivas"] : QK.camas,
    queryFn: () => hospitalInfrastructureService.getCamas(incluirInactivas),
    staleTime: 30 * 1000,
  });
}

export function useCamasDisponiblesQuery(salaId?: number) {
  return useQuery({
    queryKey: [...QK.camasDisponibles, salaId],
    queryFn: () => hospitalInfrastructureService.getCamasDisponibles(salaId),
    staleTime: 15 * 1000,
  });
}

export function useCreateCamaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CamaPayload) => hospitalInfrastructureService.createCama(payload),
    onSuccess: () => {
      toast.success("Cama creada correctamente.");
      invalidateAll(qc);
    },
    onError: (err) => toast.error(getMutationErrorMsg(err, "Error al crear la cama.")),
  });
}

export function useUpdateCamaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CamaPayload }) =>
      hospitalInfrastructureService.updateCama(id, payload),
    onSuccess: () => {
      toast.success("Cama actualizada.");
      invalidateAll(qc);
    },
    onError: (err) => toast.error(getMutationErrorMsg(err, "Error al actualizar la cama.")),
  });
}

export function useDeleteCamaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => hospitalInfrastructureService.deleteCama(id),
    onSuccess: () => {
      toast.success("Cama eliminada.");
      invalidateAll(qc);
    },
    onError: (err: unknown) => {
      const msg =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      toast.error(msg || "Error al eliminar la cama.");
    },
  });
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function useDashboardKpisQuery() {
  return useQuery({
    queryKey: QK.kpis,
    queryFn: () => hospitalInfrastructureService.getKpis(),
    staleTime: 30 * 1000,
  });
}

export function useOcupacionEspecialidadQuery() {
  return useQuery({
    queryKey: QK.ocupacionEspecialidad,
    queryFn: () => hospitalInfrastructureService.getOcupacionPorEspecialidad(),
    staleTime: 30 * 1000,
  });
}

export function useEstadoCamasQuery() {
  return useQuery({
    queryKey: QK.estadoCamas,
    queryFn: () => hospitalInfrastructureService.getEstadoCamas(),
    staleTime: 30 * 1000,
  });
}

// ── Admission infrastructure (camas disponibles para admisión) ────────────────
export function useAdmissionInfrastructureQuery() {
  return useQuery({
    queryKey: QK.admissionInfrastructure,
    queryFn: () => hospitalInfrastructureService.getCamas(),
    staleTime: 15 * 1000,
  });
}
