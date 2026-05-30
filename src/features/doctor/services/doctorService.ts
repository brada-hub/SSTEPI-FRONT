import api from "@/services/api";
import { normalizeInpatient, type Inpatient } from "@/services/nursingService";

export const doctorService = {
  /**
   * Obtiene las internaciones activas donde el médico logueado es el responsable.
   * Fallback: si el backend no soporta filtro por médico, trae todas y filtra en frontend.
   */
  async getMyPatients(): Promise<Inpatient[]> {
    const response = await api.get<Record<string, unknown>[]>("/internaciones/mis-pacientes");
    const raw = Array.isArray(response.data)
      ? response.data
      : Array.isArray((response.data as Record<string, unknown>)?.data)
      ? ((response.data as Record<string, unknown>).data as Record<string, unknown>[])
      : [];
    return raw.map(normalizeInpatient);
  },
};

export default doctorService;
