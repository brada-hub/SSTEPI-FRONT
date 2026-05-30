import api from "@/services/api";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Cuidado {
  id: number;
  internacion_id: number;
  tipo: string;
  descripcion: string;
  frecuencia: string;
  estado?: number;
  created_at?: string;
  user?: { nombre?: string; apellidos?: string; name?: string };
}

export interface CuidadoPayload {
  internacion_id: number;
  tipo: string;
  descripcion: string;
  frecuencia: string;
}

export interface CuidadoAplicadoPayload {
  cuidado_id: number;
  observaciones?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────
export async function createCuidado(payload: CuidadoPayload): Promise<Cuidado> {
  const res = await api.post<Cuidado>("/cuidados", payload);
  return res.data;
}

export async function deleteCuidado(id: number): Promise<void> {
  await api.delete(`/cuidados/${id}`);
}

export async function aplicarCuidado(payload: CuidadoAplicadoPayload): Promise<any> {
  const res = await api.post("/cuidados-aplicados", payload);
  return res.data;
}
