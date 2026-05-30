"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { nursingService } from "@/services/nursingService";
import { postVitalControl, PostControlPayload, postEvolucionNota } from "@/features/nursing/services/vitalSignsService";

export function useInpatientsQuery() {
  return useQuery({
    queryKey: ["inpatients"],
    queryFn: () => nursingService.getActiveInpatients(),
    staleTime: 1 * 60 * 1000, // 1 minute caching
  });
}

export function useInpatientDetailsQuery(internationId: number | string) {
  return useQuery({
    queryKey: ["inpatient-details", internationId],
    queryFn: () => nursingService.getInpatientDetails(internationId),
    enabled: !!internationId,
    staleTime: 30 * 1000,
  });
}

export function useNursingMutations() {
  const queryClient = useQueryClient();

  const vitalMutation = useMutation({
    mutationFn: (payload: PostControlPayload) => postVitalControl(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inpatients"] });
      queryClient.invalidateQueries({ queryKey: ["inpatient-details", variables.internacion_id] });
    },
  });

  const noteMutation = useMutation({
    mutationFn: (data: { internacion_id: number; nota: string }) =>
      postEvolucionNota(data.internacion_id, data.nota),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inpatient-details", variables.internacion_id] });
    },
  });

  return {
    addVitalControl: vitalMutation.mutateAsync,
    isAddingVitals: vitalMutation.isPending,
    addEvolutionNote: noteMutation.mutateAsync,
    isAddingNote: noteMutation.isPending,
  };
}
