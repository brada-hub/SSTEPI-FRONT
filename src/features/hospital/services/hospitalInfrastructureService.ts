import api from "@/services/api";

// ── Hospital Institucional ────────────────────────────────────────────────────

export interface HospitalConfig {
  id: number;
  nombre: string;
  departamento: "LA PAZ" | "COCHABAMBA" | "SANTA CRUZ";
  direccion: string;
  nivel: "NIVEL 1" | "NIVEL 2" | "NIVEL 3";
  tipo: "PÚBLICO" | "PRIVADO";
  telefono: string;
  created_at?: string;
  updated_at?: string;
}

export interface HospitalConfigPayload {
  nombre: string;
  departamento: string;
  direccion: string;
  nivel: string;
  tipo: string;
  telefono: string;
}

// ── Especialidades ────────────────────────────────────────────────────────────

export interface Especialidad {
  id: number;
  nombre: string;
  descripcion?: string;
  estado: boolean;
  hospital_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface EspecialidadPayload {
  nombre: string;
  descripcion?: string;
  estado: boolean;
  hospital_id: number;
}

// ── Salas ─────────────────────────────────────────────────────────────────────

export type SalaTipo =
  | "SALA COMÚN"
  | "QUIRÓFANO"
  | "CONSULTORIO"
  | "TERAPIA INTENSIVA (UTI)"
  | "LABORATORIO"
  | "SALA DE ESPERA";

export const SALA_TIPOS: SalaTipo[] = [
  "SALA COMÚN",
  "QUIRÓFANO",
  "CONSULTORIO",
  "TERAPIA INTENSIVA (UTI)",
  "LABORATORIO",
  "SALA DE ESPERA",
];

export interface Sala {
  id: number;
  nombre: string;
  tipo: SalaTipo;
  estado: boolean;
  especialidad_id: number;
  especialidad?: Especialidad;
  camas?: Cama[];
  created_at?: string;
  updated_at?: string;
}

export interface SalaPayload {
  nombre: string;
  tipo: SalaTipo;
  especialidad_id: number;
}

// ── Camas ─────────────────────────────────────────────────────────────────────

export type CamaTipo =
  | "ESTÁNDAR"
  | "PEDIÁTRICA"
  | "CUNA"
  | "INCUBADORA"
  | "CAMA UCI"
  | "CAMA QUIRÚRGICA";

export const CAMA_TIPOS: CamaTipo[] = [
  "ESTÁNDAR",
  "PEDIÁTRICA",
  "CUNA",
  "INCUBADORA",
  "CAMA UCI",
  "CAMA QUIRÚRGICA",
];

// 0 = ocupada, 1 = disponible, 2 = mantenimiento
export type CamaDisponibilidad = 0 | 1 | 2;

export const DISPONIBILIDAD_LABELS: Record<CamaDisponibilidad, string> = {
  0: "Ocupada",
  1: "Disponible",
  2: "Mantenimiento",
};

export interface Cama {
  id: number;
  nombre: string;
  tipo: CamaTipo;
  disponibilidad: CamaDisponibilidad;
  estado: boolean;
  sala_id: number;
  sala?: Sala;
  created_at?: string;
  updated_at?: string;
}

export interface CamaPayload {
  nombre: string;
  tipo: CamaTipo;
  disponibilidad: CamaDisponibilidad;
  sala_id: number;
  estado?: boolean;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardKpis {
  total_internados?: number;
  total_camas?: number;
  camas_disponibles?: number;
  camas_ocupadas?: number;
  ocupacion_porcentaje?: number;
  ingresos_hoy?: number;
  altas_hoy?: number;
}

export interface OcupacionEspecialidad {
  especialidad_id: number;
  especialidad_nombre: string;
  total_camas: number;
  camas_ocupadas: number;
  porcentaje: number;
}

export interface EstadoCama {
  id: number;
  nombre: string;
  especialidad?: string;
  total_camas: number;
  camas_disponibles: number;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const hospitalInfrastructureService = {
  // Hospital Config
  async getHospitalConfig(): Promise<HospitalConfig | null> {
    try {
      const res = await api.get<HospitalConfig>("/hospitals/1");
      return res.data ?? null;
    } catch {
      return null;
    }
  },

  async updateHospitalConfig(id: number, payload: HospitalConfigPayload): Promise<HospitalConfig> {
    const res = await api.put<HospitalConfig>(`/hospitals/${id}`, payload);
    return res.data;
  },

  // Especialidades
  async getEspecialidades(): Promise<Especialidad[]> {
    const res = await api.get<Especialidad[]>("/especialidades");
    return Array.isArray(res.data) ? res.data : [];
  },

  async createEspecialidad(payload: EspecialidadPayload): Promise<Especialidad> {
    const res = await api.post<Especialidad>("/especialidades", payload);
    return res.data;
  },

  async updateEspecialidad(id: number, payload: EspecialidadPayload): Promise<Especialidad> {
    const res = await api.put<Especialidad>(`/especialidades/${id}`, payload);
    return res.data;
  },

  async deleteEspecialidad(id: number): Promise<void> {
    await api.delete(`/especialidades/${id}`);
  },

  // Salas
  async getSalas(): Promise<Sala[]> {
    const res = await api.get<Sala[]>("/salas");
    return Array.isArray(res.data) ? res.data : [];
  },

  async getSalaConCamas(id: number): Promise<Sala> {
    const res = await api.get<Sala>(`/salas/${id}`);
    return res.data;
  },

  async createSala(payload: SalaPayload): Promise<Sala> {
    const res = await api.post<Sala>("/salas", payload);
    return res.data;
  },

  async updateSala(id: number, payload: SalaPayload): Promise<Sala> {
    const res = await api.put<Sala>(`/salas/${id}`, payload);
    return res.data;
  },

  async deleteSala(id: number): Promise<void> {
    await api.delete(`/salas/${id}`);
  },

  // Camas
  async getCamas(incluirInactivas?: boolean): Promise<Cama[]> {
    const params = incluirInactivas ? { incluir_inactivas: true } : {};
    const res = await api.get<Cama[]>("/camas", { params });
    return Array.isArray(res.data) ? res.data : [];
  },

  async getCamasDisponibles(salaId?: number): Promise<Cama[]> {
    const params = salaId ? { sala_id: salaId } : {};
    const res = await api.get<Cama[]>("/camas-disponibles", { params });
    return Array.isArray(res.data) ? res.data : [];
  },

  async createCama(payload: CamaPayload): Promise<Cama> {
    const res = await api.post<Cama>("/camas", payload);
    return res.data;
  },

  async updateCama(id: number, payload: CamaPayload): Promise<Cama> {
    const res = await api.put<Cama>(`/camas/${id}`, payload);
    return res.data;
  },

  async deleteCama(id: number): Promise<void> {
    await api.delete(`/camas/${id}`);
  },

  // Dashboard
  async getKpis(): Promise<DashboardKpis | null> {
    try {
      const res = await api.get<DashboardKpis>("/dashboard/kpis");
      return res.data ?? null;
    } catch {
      return null;
    }
  },

  async getOcupacionPorEspecialidad(): Promise<OcupacionEspecialidad[]> {
    try {
      const res = await api.get<OcupacionEspecialidad[]>("/dashboard/ocupacion-especialidad");
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  async getEstadoCamas(): Promise<EstadoCama[]> {
    try {
      const res = await api.get<EstadoCama[]>("/dashboard/estado-camas");
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },
};

export default hospitalInfrastructureService;
