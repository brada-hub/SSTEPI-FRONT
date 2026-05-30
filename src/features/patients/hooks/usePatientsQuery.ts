"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { patientService, Patient } from "@/services/patientService";
import { type PatientBackendPayload } from "@/features/patients/schemas/patientSchema";

export function usePatientsQuery(search?: string) {
  return useQuery({
    queryKey: ["patients", search],
    queryFn: () => patientService.getPatients(search),
    staleTime: 2 * 60 * 1000, // 2 minutes caching
  });
}

export function usePatientMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: PatientBackendPayload) => patientService.createPatient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: PatientBackendPayload }) =>
      patientService.updatePatient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });

  return {
    createPatient: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updatePatient: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
