"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/services/api";
import { getFirstValidationError } from "@/lib/errors";
import { normalizeInpatient, type Inpatient } from "@/services/nursingService";
import { postVitalControl, postEvolucionNota, type PostControlPayload } from "@/features/nursing/services/vitalSignsService";
import { createTratamiento, suspenderTratamiento, suspenderReceta, type TratamientoPayload } from "@/features/nursing/services/treatmentService";
import { createCuidado, aplicarCuidado, type CuidadoPayload, type CuidadoAplicadoPayload } from "@/features/nursing/services/careplanService";
import { createAlimentacion, updateAlimentacion, suspenderAlimentacion, type AlimentacionPayload } from "@/features/nursing/services/feedingService";
import { darDeAlta } from "@/features/nursing/services/dischargeService";

// ── Query key factory ─────────────────────────────────────────────────────────
export const inpatientDetailKey = (internacionId: number) => [
  "inpatient-detail",
  internacionId,
] as const;

// ── Vista completa fetcher ────────────────────────────────────────────────────
async function fetchInpatientDetail(internacionId: number): Promise<Inpatient> {
  const res = await api.get<Record<string, unknown>>(
    `/internaciones/${internacionId}/vista-completa`
  );
  return normalizeInpatient(res.data);
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useInpatientDetail(internacionId: number) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: inpatientDetailKey(internacionId),
    queryFn: () => fetchInpatientDetail(internacionId),
    staleTime: 30 * 1000, // 30s — datos clínicos deben ser frescos
    retry: 1,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: inpatientDetailKey(internacionId) });

  // ── Mutation: Registrar signos vitales ─────────────────────────────────────
  const registerVitals = useMutation({
    mutationFn: (payload: PostControlPayload) => postVitalControl(payload),
    onSuccess: () => {
      toast.success("Signos vitales registrados correctamente.");
      invalidate();
    },
    onError: (err: unknown) => {
      const msg = getFirstValidationError(err);
      toast.error(msg);
    },
  });

  // ── Mutation: Nota de evolución ────────────────────────────────────────────
  const addEvolutionNote = useMutation({
    mutationFn: ({ observaciones }: { observaciones: string }) =>
      postEvolucionNota(internacionId, observaciones),
    onSuccess: () => {
      toast.success("Nota de evolución registrada.");
      invalidate();
    },
    onError: (err: unknown) => {
      const msg = getFirstValidationError(err);
      toast.error(msg);
    },
  });

  // ── Mutation: Prescribir tratamiento ───────────────────────────────────────
  const prescribir = useMutation({
    mutationFn: (data: TratamientoPayload) => createTratamiento(data),
    onSuccess: () => {
      toast.success("Tratamiento prescrito correctamente.");
      invalidate();
    },
    onError: (err: unknown) => {
      const msg = getFirstValidationError(err);
      toast.error(msg);
    },
  });

  // ── Mutation: Suspender tratamiento ───────────────────────────────────────
  const suspenderTrat = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) =>
      suspenderTratamiento(id, motivo),
    onSuccess: () => {
      toast.success("Tratamiento suspendido.");
      invalidate();
    },
    onError: (err: unknown) => {
      const msg = getFirstValidationError(err);
      toast.error(msg);
    },
  });

  // ── Mutation: Suspender receta (medicamento) ───────────────────────────────
  const suspenderRec = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) =>
      suspenderReceta(id, motivo),
    onSuccess: () => {
      toast.success("Medicamento suspendido.");
      invalidate();
    },
    onError: (err: unknown) => {
      const msg = getFirstValidationError(err);
      toast.error(msg);
    },
  });

  // ── Mutation: Nueva indicación / cuidado ──────────────────────────────────
  const addCuidado = useMutation({
    mutationFn: (payload: CuidadoPayload) => createCuidado(payload),
    onSuccess: () => {
      toast.success("Indicación registrada correctamente.");
      invalidate();
    },
    onError: (err: unknown) => {
      const msg = getFirstValidationError(err);
      toast.error(msg);
    },
  });

  // ── Mutation: Registrar aplicación de cuidado ────────────────────────────────
  const applyCuidado = useMutation({
    mutationFn: (payload: CuidadoAplicadoPayload) => aplicarCuidado(payload),
    onSuccess: () => {
      toast.success("Aplicación de cuidado registrada correctamente.");
      invalidate();
    },
    onError: (err: unknown) => {
      const msg = getFirstValidationError(err);
      toast.error(msg);
    },
  });

  // ── Mutation: Asignar dieta ────────────────────────────────────────────────
  const asignarDieta = useMutation({
    mutationFn: (payload: AlimentacionPayload) => createAlimentacion(payload),
    onSuccess: () => {
      toast.success("Plan alimenticio asignado.");
      invalidate();
    },
    onError: (err: unknown) => {
      const msg = getFirstValidationError(err);
      toast.error(msg);
    },
  });

  // ── Mutation: Modificar dieta ──────────────────────────────────────────────
  const modificarDieta = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AlimentacionPayload> }) =>
      updateAlimentacion(id, data),
    onSuccess: () => {
      toast.success("Plan alimenticio actualizado.");
      invalidate();
    },
    onError: (err: unknown) => {
      const msg = getFirstValidationError(err);
      toast.error(msg);
    },
  });

  // ── Mutation: Suspender dieta ──────────────────────────────────────────────
  const suspenderDieta = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) => suspenderAlimentacion(id, motivo),
    onSuccess: () => {
      toast.success("Dieta suspendida.");
      invalidate();
    },
    onError: (err: unknown) => {
      const msg = getFirstValidationError(err);
      toast.error(msg);
    },
  });

  // ── Mutation: Dar de alta ──────────────────────────────────────────────────
  const alta = useMutation({
    mutationFn: (payload: { tipo_alta: string; observaciones_alta?: string }) =>
      darDeAlta(internacionId, payload),
    onSuccess: () => {
      toast.success("Paciente dado de alta correctamente.");
      invalidate();
      // Invalidate the inpatients list so the discharged patient disappears from nursing station
      queryClient.invalidateQueries({ queryKey: ["inpatients"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-patients"] });
      queryClient.invalidateQueries({ queryKey: ["nutrition-inpatients"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["inpatient-details"] });
      queryClient.invalidateQueries({ queryKey: ["admission-infrastructure"] });
    },
    onError: (err: unknown) => {
      const msg = getFirstValidationError(err);
      toast.error(msg);
    },
  });

  return {
    query,
    inpatient: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    // Mutations
    registerVitals,
    addEvolutionNote,
    prescribir,
    suspenderTrat,
    suspenderRec,
    addCuidado,
    applyCuidado,
    asignarDieta,
    modificarDieta,
    suspenderDieta,
    alta,
  };
}
