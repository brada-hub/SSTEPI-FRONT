"use client";

import { useQuery } from "@tanstack/react-query";
import { getSignosCatalog } from "@/features/nursing/services/vitalSignsService";
import { getMedicamentos } from "@/features/nursing/services/treatmentService";
import { getTiposDieta } from "@/features/nursing/services/feedingService";

/** Catálogo EAV de signos vitales */
export function useSignosCatalogQuery(tipo?: "rutinario" | "todos") {
  return useQuery({
    queryKey: ["signos-catalog", tipo ?? "todos"],
    queryFn: () => getSignosCatalog(tipo),
    staleTime: 60 * 60 * 1000, // 1h — catálogo estático
  });
}

/** Catálogo de medicamentos */
export function useMedicamentosQuery() {
  return useQuery({
    queryKey: ["medicamentos-catalog"],
    queryFn: getMedicamentos,
    staleTime: 5 * 1000, // 5 segundos para actualización instantánea
  });
}

/** Catálogo de tipos de dieta */
export function useTiposDietaQuery() {
  return useQuery({
    queryKey: ["tipos-dieta-catalog"],
    queryFn: getTiposDieta,
    staleTime: 60 * 60 * 1000,
  });
}
