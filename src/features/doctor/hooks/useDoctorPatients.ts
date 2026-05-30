"use client";

import { useQuery } from "@tanstack/react-query";
import { doctorService } from "@/features/doctor/services/doctorService";

export function useDoctorPatients() {
  return useQuery({
    queryKey: ["doctor-patients"],
    queryFn: () => doctorService.getMyPatients(),
    staleTime: 1 * 60 * 1000,
  });
}
