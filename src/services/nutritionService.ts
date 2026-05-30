import api from "./api";

export interface DietRecord {
  id?: number;
  internacion_id: number;
  tipo_dieta: string;
  indicaciones?: string;
  fecha_asignacion: string;
  estado: "activo" | "suspendido";
  motivo_suspension?: string;
  fecha_suspension?: string;
  nutricionista_nombre?: string;
}

export const nutritionService = {
  /**
   * Obtiene la lista de internaciones activas para control de alimentación
   */
  async getInpatientsForDiet(): Promise<any[]> {
    const response = await api.get<any[]>("/internaciones/activas");
    return response.data;
  },

  /**
   * Asigna un régimen de alimentación a una internación activa
   */
  async assignDiet(internationId: number, dietData: any): Promise<any> {
    const response = await api.post<any>("/alimentaciones", {
      internacion_id: internationId,
      ...dietData
    });
    return response.data;
  },

  /**
   * Suspende una dieta activa con el debido motivo clínico
   */
  async suspendDiet(dietId: number | string, payload: { motivo: string }): Promise<any> {
    const response = await api.post(`/alimentaciones/${dietId}/suspender`, payload);
    return response.data;
  },
};

export default nutritionService;
