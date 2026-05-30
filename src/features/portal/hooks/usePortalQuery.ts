"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { Inpatient, normalizeInpatient } from "@/services/nursingService";

export function usePatientInternationQuery() {
  return useQuery({
    queryKey: ["patient-internation"],
    queryFn: async (): Promise<Inpatient | null> => {
      const response = await api.get<Record<string, unknown>>("/mi-internacion");

      // Backend returns { has_internacion: false } when patient has no active internation
      const data = response.data;
      if (data && typeof data === "object") {
        if ((data as { has_internacion?: boolean }).has_internacion === false) {
          return null;
        }
        // Normalize full backend response
        return normalizeInpatient(data);
      }
      return null;
    },
    staleTime: 1 * 60 * 1000,
    retry: 1,
  });
}

export default usePatientInternationQuery;
