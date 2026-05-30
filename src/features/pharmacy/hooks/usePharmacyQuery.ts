"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pharmacyService, Medicine } from "@/services/pharmacyService";
import { getFirstValidationError } from "@/lib/errors";
import { toast } from "sonner";

export function useMedicinesQuery(search?: string) {
  return useQuery({
    queryKey: ["medicines", search],
    queryFn: () => pharmacyService.getMedicines(search),
    staleTime: 1 * 60 * 1000,
  });
}

export function useCategoriesQuery() {
  return useQuery({
    queryKey: ["medicine-categories"],
    queryFn: () => pharmacyService.getCategories(),
    staleTime: 10 * 60 * 1000,
  });
}

export function usePharmacyMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: Partial<Medicine>) => pharmacyService.createMedicine(data),
    onSuccess: () => {
      toast.success("Medicamento registrado en el inventario.");
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
    },
    onError: (err: unknown) => {
      const msg = getFirstValidationError(err);
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Medicine> }) =>
      pharmacyService.updateMedicine(id, data),
    onSuccess: () => {
      toast.success("Medicamento actualizado correctamente.");
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
    },
    onError: (err: unknown) => {
      const msg = getFirstValidationError(err);
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => pharmacyService.deleteMedicine(id),
    onSuccess: () => {
      toast.success("Medicamento removido del inventario.");
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
    },
    onError: (err: unknown) => {
      const msg = getFirstValidationError(err);
      toast.error(msg);
    },
  });

  const dispenseMutation = useMutation({
    mutationFn: ({ id, cantidad, internacionId, motivo }: { id: number; cantidad: number; internacionId?: number; motivo?: string }) =>
      pharmacyService.dispenseMedicine(id, { cantidad, internacion_id: internacionId, motivo }),
    onSuccess: () => {
      toast.success("Medicamento dispensado correctamente.");
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
    },
    onError: (err: unknown) => {
      const msg = getFirstValidationError(err);
      toast.error(msg);
    },
  });

  return {
    createMedicine: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateMedicine: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteMedicine: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    dispenseMedicine: dispenseMutation.mutateAsync,
    isDispensing: dispenseMutation.isPending,
  };
}
export default useMedicinesQuery;
