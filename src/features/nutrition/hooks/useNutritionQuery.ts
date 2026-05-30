"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { nutritionService, DietRecord } from "@/services/nutritionService";
import { getFirstValidationError } from "@/lib/errors";
import { toast } from "sonner";

export function useNutritionInpatients() {
  return useQuery({
    queryKey: ["nutrition-inpatients"],
    queryFn: () => nutritionService.getInpatientsForDiet(),
    staleTime: 1 * 60 * 1000,
  });
}

export function useNutritionMutations() {
  const queryClient = useQueryClient();

  const assignMutation = useMutation({
    mutationFn: ({ internationId, dietData }: { internationId: number; dietData: Partial<DietRecord> }) =>
      nutritionService.assignDiet(internationId, dietData),
    onSuccess: () => {
      toast.success("Régimen alimenticio asignado al paciente con éxito.");
      queryClient.invalidateQueries({ queryKey: ["nutrition-inpatients"] });
    },
    onError: (err: unknown) => {
      const msg = getFirstValidationError(err);
      toast.error(msg);
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ dietId, motivo }: { dietId: number | string; motivo: string }) =>
      nutritionService.suspendDiet(dietId, { motivo }),
    onSuccess: () => {
      toast.success("Régimen alimenticio suspendido correctamente.");
      queryClient.invalidateQueries({ queryKey: ["nutrition-inpatients"] });
    },
    onError: (err: unknown) => {
      const msg = getFirstValidationError(err);
      toast.error(msg);
    },
  });

  return {
    assignDiet: assignMutation.mutateAsync,
    isAssigning: assignMutation.isPending,
    suspendDiet: suspendMutation.mutateAsync,
    isSuspending: suspendMutation.isPending,
  };
}
export default useNutritionInpatients;
