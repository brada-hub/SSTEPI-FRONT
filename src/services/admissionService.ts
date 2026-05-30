import api from "./api";

export interface AdmissionPayload {
  paciente_id: number;
  sala_id: number;
  cama_id: number;
  medico_id: number;
  diagnostico_ingreso: string;
  // Signos vitales iniciales del triage de admisión
  presion_sistolica?: number;
  presion_diastolica?: number;
  frecuencia_cardiaca?: number;
  frecuencia_respiratoria?: number;
  temperatura?: number;
  saturacion_oxigeno?: number;
  peso_kg?: number;
  talla_cm?: number;
  // Tratamientos pre-prescritos
  pre_prescripciones?: {
    medicamento: string;
    dosis: string;
    frecuencia_horas: number;
    via: string;
    duracion_dias: number;
  }[];
}

export interface AdmissionResult {
  id: number;
  paciente_id: number;
  sala_id: number;
  cama_id: number;
  fecha_ingreso: string;
  estado: number;
}

export interface RoomAvailability {
  id: number;
  nombre: string;
  especialidad?: string;
  total_camas: number;
  camas_disponibles: number;
}

export const admissionService = {
  /**
   * Registra una nueva admisión e internación de planta con triage clínico y camas
   */
  async createAdmission(payload: AdmissionPayload): Promise<AdmissionResult> {
    const response = await api.post<AdmissionResult>("/admisiones", payload);
    return response.data;
  },

  /**
   * Obtiene la disponibilidad de salas y camas en caliente
   */
  async getAvailableInfrastructure(): Promise<RoomAvailability[]> {
    const response = await api.get<RoomAvailability[]>("/dashboard/estado-camas");
    return Array.isArray(response.data) ? response.data : [];
  },
};

export default admissionService;
