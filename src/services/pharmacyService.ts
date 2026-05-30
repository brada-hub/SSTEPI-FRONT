import api from "./api";

export interface Medicine {
  id: number;
  nombre: string;
  descripcion?: string;
  stock: number;
  stock_critico: number;
  estante?: string;
  categoria_id: number;
  categoria?: {
    id: number;
    nombre: string;
  };
}

export interface Category {
  id: number;
  nombre: string;
  descripcion?: string;
}

export const pharmacyService = {
  /**
   * Obtiene la lista completa de medicamentos del inventario
   */
  async getMedicines(search?: string): Promise<Medicine[]> {
    const response = await api.get<Medicine[]>("/medicamentos", {
      params: search ? { search } : {},
    });
    return response.data;
  },

  /**
   * Crea un nuevo medicamento en el inventario logístico
   */
  async createMedicine(data: Partial<Medicine>): Promise<Medicine> {
    const response = await api.post<Medicine>("/medicamentos", data);
    return response.data;
  },

  /**
   * Modifica un medicamento
   */
  async updateMedicine(id: number, data: Partial<Medicine>): Promise<Medicine> {
    const response = await api.put<Medicine>(`/medicamentos/${id}`, data);
    return response.data;
  },

  /**
   * Elimina un medicamento del censo de farmacia
   */
  async deleteMedicine(id: number): Promise<void> {
    await api.delete(`/medicamentos/${id}`);
  },

  /**
   * Obtiene la lista de categorías de fármacos
   */
  async getCategories(): Promise<Category[]> {
    const response = await api.get<Category[]>("/medicamento-categorias");
    return response.data;
  },

  /**
   * Registra una dispensación rápida de medicamento en caliente
   */
  async dispenseMedicine(
    id: number,
    payload: { cantidad: number; internacion_id?: number; motivo?: string }
  ): Promise<Medicine> {
    const response = await api.post<Medicine>(`/medicamentos/${id}/dispensar`, payload);
    return response.data;
  },
};

export default pharmacyService;
