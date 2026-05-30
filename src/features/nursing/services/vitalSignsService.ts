import api from "@/services/api";

// ── Raw backend types ──────────────────────────────────────────────────────────
export interface SignoCatalog {
  id: number;
  nombre: string;
  unidad: string;
  requiere_valores_duales: boolean;
  rango_minimo?: number | null;
  rango_maximo?: number | null;
  tipo?: string; // 'rutinario' | 'todos'
}

export interface ValorControlPayload {
  signo_id: number;
  medida: number;
  medida_baja?: number | null;
}

export interface PostControlPayload {
  internacion_id: number;
  tipo?: string;
  fecha_control?: string;
  observaciones?: string;
  valores?: ValorControlPayload[];
}

// ── Service ───────────────────────────────────────────────────────────────────
export async function getSignosCatalog(tipo?: "rutinario" | "todos"): Promise<SignoCatalog[]> {
  const params = tipo && tipo !== "todos" ? { tipo } : {};
  const res = await api.get<SignoCatalog[]>("/signos", { params });
  return Array.isArray(res.data) ? res.data : [];
}

export async function postVitalControl(payload: PostControlPayload): Promise<void> {
  await api.post("/controls", payload);
}

export async function postEvolucionNota(
  internacionId: number,
  observaciones: string
): Promise<void> {
  await api.post("/controls", {
    internacion_id: internacionId,
    tipo: "Evolución Médica",
    fecha_control: new Date().toISOString(),
    observaciones,
  });
}
