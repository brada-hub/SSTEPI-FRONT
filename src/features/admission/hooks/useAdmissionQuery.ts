"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { admissionService, AdmissionPayload } from "@/services/admissionService";
import { patientService, type Patient } from "@/services/patientService";
import { userService } from "@/services/userService";
import { getFirstValidationError } from "@/lib/errors";
import { toast } from "sonner";

import { nursingService } from "@/services/nursingService";

interface ClinicianUser {
  id: number;
  name?: string;
  nombre?: string;
  apellidos?: string;
  role?: { name?: string; nombre?: string };
  rol?: { name?: string; nombre?: string };
}

export function useAdmissionResources() {
  const patientsQuery = useQuery<Patient[]>({
    queryKey: ["admission-patients"],
    queryFn: () => patientService.getPatients(),
    staleTime: 1 * 60 * 1000,
  });

  const activeInpatientsQuery = useQuery({
    queryKey: ["admission-active-inpatients"],
    queryFn: () => nursingService.getActiveInpatients(),
    staleTime: 1 * 60 * 1000,
  });

  const cliniciansQuery = useQuery<ClinicianUser[]>({
    queryKey: ["admission-clinicians"],
    queryFn: async () => {
      const response = await userService.getUsers();
      const users: ClinicianUser[] = Array.isArray(response)
        ? response
        : Array.isArray((response as { data?: unknown })?.data)
        ? ((response as { data: ClinicianUser[] }).data)
        : Array.isArray((response as { users?: unknown })?.users)
        ? ((response as { users: ClinicianUser[] }).users)
        : [];

      return users.filter((u) => {
        const role = u.role || u.rol;
        const roleName = role?.name || role?.nombre || "";
        const roleNameLower = roleName.toLowerCase();
        return (
          roleNameLower.includes("médico") ||
          roleNameLower.includes("doctor") ||
          roleNameLower.includes("administrador") ||
          roleNameLower.includes("admin")
        );
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  const allPatients = patientsQuery.data ?? [];
  const activeInpatients = activeInpatientsQuery.data ?? [];
  const activePatientIds = new Set(activeInpatients.map((inp) => inp.paciente?.id).filter(Boolean));
  const freePatients = allPatients.filter((p) => !activePatientIds.has(p.id));

  return {
    patients: freePatients,
    allPatients,
    isLoadingPatients: patientsQuery.isLoading || activeInpatientsQuery.isLoading,
    clinicians: cliniciansQuery.data ?? [],
    isLoadingClinicians: cliniciansQuery.isLoading,
    isError: patientsQuery.isError || activeInpatientsQuery.isError || cliniciansQuery.isError,
  };
}

export function useAdmissionMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: AdmissionPayload) => admissionService.createAdmission(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admission-infrastructure"] });
      queryClient.invalidateQueries({ queryKey: ["inpatients"] });
      toast.success("Paciente admitido e internado correctamente.");
    },
    onError: (err: unknown) => {
      const msg = getFirstValidationError(err);
      toast.error(msg);
    },
  });

  return {
    createAdmission: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    isSuccess: mutation.isSuccess,
  };
}
