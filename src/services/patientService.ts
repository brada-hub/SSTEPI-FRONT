import api from "./api";
import { type PatientBackendPayload } from "@/features/patients/schemas/patientSchema";

export interface ActiveInternacionSummary {
  id: number;
  fecha_ingreso?: string;
  diagnostico_ingreso?: string;
  sala?: string;
  cama?: string;
}

export interface HistoricalInternacion {
  id: number;
  fecha_ingreso: string;
  fecha_alta?: string | null;
  motivo?: string;
  diagnostico?: string;
  tipo_alta?: string | null;
  observaciones_alta?: string | null;
  medico?: {
    id: number;
    nombre?: string;
    apellidos?: string;
  } | null;
}

export interface Patient {
  id: number;
  nombre: string;
  apellidos: string;
  ci: string;
  genero: "masculino" | "femenino" | "otro";
  fecha_nacimiento: string;
  telefono?: string;
  direccion?: string;
  nombre_referencia?: string;
  apellidos_referencia?: string;
  celular_referencia?: string;
  estado?: boolean;
  active_internacion?: ActiveInternacionSummary | null;
  internaciones?: HistoricalInternacion[];
}

export const patientService = {
  /**
   * Obtiene la lista demográfica de pacientes, permitiendo filtrados opcionales
   */
  async getPatients(search?: string): Promise<Patient[]> {
    const response = await api.get<Patient[] | { data: Patient[] }>("/pacientes", {
      params: search ? { search } : {},
    });
    return Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.data)
      ? response.data.data
      : [];
  },

  /**
   * Obtiene la ficha demográfica detallada de un paciente
   */
  async getPatientById(id: number | string): Promise<Patient> {
    const response = await api.get<Patient>(`/pacientes/${id}`);
    return response.data;
  },

  /**
   * Crea un nuevo expediente demográfico de paciente
   */
  async createPatient(patientData: PatientBackendPayload): Promise<Patient> {
    const response = await api.post<Patient>("/pacientes", patientData);
    return response.data;
  },

  /**
   * Modifica la información demográfica de un expediente
   */
  async updatePatient(id: number | string, patientData: PatientBackendPayload): Promise<Patient> {
    const response = await api.put<Patient>(`/pacientes/${id}`, patientData);
    return response.data;
  },
};
export default patientService;
