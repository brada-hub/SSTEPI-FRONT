import api from "@/services/api";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface TipoDieta {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface Alimentacion {
  id: number;
  internacion_id: number;
  tipo_dieta_id?: number;
  tipo_dieta?: TipoDieta;
  via_administracion: string;
  estado: number; // 0=activa, 1=suspendida, 2=finalizada
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AlimentacionPayload {
  internacion_id: number;
  tipo_dieta_id: number;
  via_administracion: string;
  observaciones?: string;
  estado?: number;
}

// ── Service ───────────────────────────────────────────────────────────────────
export async function getTiposDieta(): Promise<TipoDieta[]> {
  const res = await api.get<TipoDieta[]>("/tipos-dieta");
  return Array.isArray(res.data) ? res.data : [];
}

export async function createAlimentacion(payload: AlimentacionPayload): Promise<Alimentacion> {
  const res = await api.post<Alimentacion>("/alimentaciones", payload);
  return res.data;
}

export async function updateAlimentacion(
  id: number,
  data: Partial<AlimentacionPayload>
): Promise<Alimentacion> {
  const res = await api.put<Alimentacion>(`/alimentaciones/${id}`, data);
  return res.data;
}

export async function suspenderAlimentacion(id: number): Promise<void> {
  await api.put(`/alimentaciones/${id}`, { estado: 1 });
}

export interface Consumo {
  id: number;
  tratamiento_id: number;
  alimentacion_id: number;
  fecha: string;
  tiempo_comida: string;
  porcentaje_consumido: number;
  observaciones?: string;
  created_at?: string;
  registrado_por?: { id: number; nombre?: string; apellidos?: string; name?: string };
}

export async function getConsumos(
  alimentacionId: number,
  fecha: string
): Promise<Consumo[]> {
  const res = await api.get<Consumo[]>(`/consumos/alimentacion/${alimentacionId}/${fecha}`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function registrarConsumo(payload: {
  tratamiento_id: number;
  alimentacion_id: number;
  fecha: string;
  tiempo_comida: string;
  porcentaje_consumido: number;
  observaciones?: string;
}): Promise<Consumo> {
  const res = await api.post<Consumo>("/consumos/registrar-tiempo", payload);
  return res.data;
}

