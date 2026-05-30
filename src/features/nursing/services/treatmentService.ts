import api from "@/services/api";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Medicamento {
  id: number;
  nombre: string;
  descripcion?: string;
  categoria_id?: number;
}

export interface RecetaPayload {
  medicamento_id: number;
  dosis: string; // "12 mg"
  via_administracion: string;
  frecuencia_horas: number;
  duracion_dias: number;
  indicaciones?: string;
}

export interface TratamientoPayload {
  internacion_id: number;
  tipo: string;
  descripcion: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  observaciones?: string;
  estado?: number;
  recetas: RecetaPayload[];
}

export interface Receta {
  id: number;
  medicamento_id: number;
  medicamento: Medicamento;
  dosis: string;
  via_administracion: string;
  frecuencia_horas: number;
  duracion_dias: number;
  estado: number;
  indicaciones?: string;
}

export interface Tratamiento {
  id: number;
  internacion_id: number;
  tipo: string;
  descripcion: string;
  estado: number; // 0=activo, 1=suspendido, 2=finalizado
  medico?: { id: number; nombre?: string; apellidos?: string; name?: string };
  recetas: Receta[];
  fecha_inicio?: string;
  fecha_fin?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────
export async function getMedicamentos(): Promise<Medicamento[]> {
  const res = await api.get<Medicamento[]>("/medicamentos");
  return Array.isArray(res.data) ? res.data : [];
}

export async function getMedicamentoCategorias(): Promise<{ id: number; nombre: string }[]> {
  const res = await api.get<{ id: number; nombre: string }[]>("/medicamento-categorias");
  return Array.isArray(res.data) ? res.data : [];
}

export async function createMedicamento(
  data: Pick<Medicamento, "nombre" | "descripcion"> & { categoria_id: number }
): Promise<Medicamento> {
  const res = await api.post<Medicamento>("/medicamentos", data);
  return res.data;
}

export async function createTratamiento(data: TratamientoPayload): Promise<Tratamiento> {
  const res = await api.post<Tratamiento>("/tratamientos", data);
  return res.data;
}

export async function updateTratamiento(
  id: number,
  data: Partial<TratamientoPayload>
): Promise<Tratamiento> {
  const res = await api.put<Tratamiento>(`/tratamientos/${id}`, data);
  return res.data;
}

export async function suspenderTratamiento(id: number, motivo: string): Promise<void> {
  await api.post(`/tratamientos/${id}/suspender`, { motivo });
}

export async function suspenderReceta(id: number, motivo: string): Promise<void> {
  await api.post(`/recetas/${id}/suspender`, { motivo });
}

export interface DatosAdministracion {
  user?: { nombre?: string; apellidos?: string; name?: string };
  fecha?: string;
  observaciones?: string;
}

export interface Toma {
  id: number | null;
  horaReal: string; // DateTime string
  status: string; // 'Cumplida' | 'Cumplida (Retrasada)' | 'Sin iniciar' | 'Pendiente' | '¡ATRASADA!'
  datosAdministracion: DatosAdministracion | null;
  esPrimeraDosis: boolean;
}

export interface AdministracionRegistro {
  id?: number;
  hora_programada?: string;
  estado?: number;
  observaciones?: string;
}

export interface RecetaConSeguimiento extends Receta {
  tomas_hoy?: Toma[];
  fecha_visualizada?: string;
  administras?: AdministracionRegistro[];
}

export interface SeguimientoTratamiento {
  id: number;
  tipo: string;
  descripcion: string;
  estado: number;
  medico?: { id: number; nombre?: string; apellidos?: string };
  recetas: RecetaConSeguimiento[];
}

export async function getSeguimientoTratamiento(
  id: number,
  fecha?: string
): Promise<SeguimientoTratamiento> {
  const res = await api.get<SeguimientoTratamiento>(
    `/seguimiento/tratamiento/${id}`,
    {
      params: fecha ? { fecha } : {},
    }
  );
  return res.data;
}

export interface AdministracionResult {
  id?: number;
  receta_id?: number;
  estado?: number;
  fecha?: string;
  observaciones?: string;
}

export async function registrarAdministracion(payload: {
  receta_id?: number;
  administracion_id?: number;
  observaciones?: string;
}): Promise<AdministracionResult> {
  const res = await api.post<AdministracionResult>("/administraciones", payload);
  return res.data;
}

