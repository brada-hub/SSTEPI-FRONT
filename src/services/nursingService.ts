import api from "./api";
import { type Tratamiento } from "@/features/nursing/services/treatmentService";
import { type Alimentacion } from "@/features/nursing/services/feedingService";

// ─────────────────────────────────────────────────────────────────────────────
// RAW BACKEND TYPES (exact Laravel API structure)
// ─────────────────────────────────────────────────────────────────────────────

export interface SignoVital {
  id: number;
  nombre: string;
  unidad: string;
  es_rutinario: boolean;
  requiere_valores_duales: boolean;
}

export interface ValorControl {
  id?: number;
  control_id?: number;
  signo_id?: number;
  medida: number | string;
  medida_baja?: number | string | null;
  signo?: SignoVital;
}

/** Raw "Control" from backend — values are stored in valores[] referencing SignoVital by ID */
export interface ControlRaw {
  id: number;
  internacion_id: number;
  user_id?: number;
  tipo?: string;
  fecha_control: string;
  observaciones?: string;
  valores?: ValorControl[];
  user?: {
    id: number;
    nombre?: string;
    apellidos?: string;
    name?: string;
    rol?: { nombre?: string };
  };
  created_at?: string;
}

export interface CuidadoAplicado {
  id?: number;
  user?: { id?: number; nombre?: string; apellidos?: string };
  fecha_aplicacion?: string;
  observaciones?: string;
}

export interface Cuidado {
  id?: number;
  tipo?: string;
  descripcion?: string;
  frecuencia?: string;
  estado?: number;
  cuidadosAplicados?: CuidadoAplicado[];
  nota?: string;
  created_at?: string;
}

/** Ocupacion links Internacion → Cama → Sala */
export interface OcupacionActiva {
  id?: number;
  cama?: {
    id: number;
    codigo: string;
    sala?: {
      id: number;
      nombre: string;
    };
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FRONTEND HELPERS (extract values from ControlRaw[] on demand)
// ─────────────────────────────────────────────────────────────────────────────

/** Extract a numeric value from a Control's valores[] by matching signo nombre (case-insensitive partial) */
export function extractValor(
  valores: ValorControl[] | undefined,
  signoNombrePartial: string
): number | undefined {
  if (!valores || !Array.isArray(valores)) return undefined;
  const v = valores.find((val) =>
    val.signo?.nombre?.toLowerCase().includes(signoNombrePartial.toLowerCase())
  );
  if (!v) return undefined;
  const n = typeof v.medida === "string" ? parseFloat(v.medida) : v.medida;
  return isNaN(n as number) ? undefined : (n as number);
}

/** Extract a numeric medida_baja from a Control's valores[] by signo nombre */
export function extractValorBaja(
  valores: ValorControl[] | undefined,
  signoNombrePartial: string
): number | undefined {
  if (!valores || !Array.isArray(valores)) return undefined;
  const v = valores.find((val) =>
    val.signo?.nombre?.toLowerCase().includes(signoNombrePartial.toLowerCase())
  );
  if (!v || v.medida_baja == null) return undefined;
  const n = typeof v.medida_baja === "string" ? parseFloat(v.medida_baja) : v.medida_baja;
  return isNaN(n as number) ? undefined : (n as number);
}

/** Get the latest control from an array (assumes newest first, or sorts by fecha_control desc) */
export function getLatestControl(controles: ControlRaw[] | undefined): ControlRaw | undefined {
  if (!controles || controles.length === 0) return undefined;
  return [...controles].sort((a, b) => {
    const da = new Date(b.fecha_control).getTime();
    const db = new Date(a.fecha_control).getTime();
    return da - db;
  })[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZED FRONTEND TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface EvolutionNote {
  id?: number;
  internacion_id?: number;
  nota?: string;
  descripcion?: string;
  enfermero_nombre?: string;
  created_at?: string;
}

/** Normalized Inpatient — frontend-safe, uses raw ControlRaw[] for clinical data */
export interface Inpatient {
  id: number;
  paciente_id?: number;
  sala_id?: number;
  cama_id?: number;
  medico_id?: number;
  fecha_ingreso: string;
  fecha_alta?: string | null;
  tipo_alta?: string;
  observaciones_alta?: string;
  /** Normalized: backend sends "diagnostico" not "diagnostico_ingreso" */
  diagnostico_ingreso: string;
  estado?: string;

  // Patient demographics
  paciente: {
    id: number;
    nombre: string;
    apellidos: string;
    ci?: string;
    sexo?: "M" | "F" | string;
    fecha_nacimiento?: string;
  };

  // Cama & sala — extracted from ocupacion_activa or top-level
  cama: {
    id?: number;
    codigo: string;
    nombre?: string;
  };
  sala: {
    id?: number;
    nombre: string;
    codigo?: string;
  };

  // Medico — Laravel User (nombre + apellidos OR name)
  medico?: {
    id?: number;
    name?: string;       // legacy mock field
    nombre?: string;     // real backend field
    apellidos?: string;
  };

  // Treatments and Feeding
  tratamientos?: Tratamiento[];
  alimentaciones?: Alimentacion[];

  // Raw backend relations (canonical source of truth for clinical data)
  controles?: ControlRaw[];
  evolucion_enfermeria?: Cuidado[];
  plan_de_cuidados?: Cuidado[];
  // Normalized evolution notes for timeline display (derived from evolucion_enfermeria)
  evolution_notes?: EvolutionNote[];
  ocupacion_activa?: OcupacionActiva;

  // Anthropometric data
  datos_antropometricos?: {
    peso?: string | number;
    altura?: string | number;
    imc?: number | null;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZATION UTILITY
// Converts raw Laravel internacion response → frontend Inpatient
// ─────────────────────────────────────────────────────────────────────────────

/** Normalize a Cuidado (care plan / evolution) → EvolutionNote for timeline display.
 * Handles both Cuidado shapes and EvolucionNota shapes from backend. */
function normalizeCuidado(cuidado: Cuidado | Record<string, unknown>): EvolutionNote {
  const c = cuidado as Cuidado & Record<string, unknown>;
  const applied = c.cuidadosAplicados?.[0];
  // Try multiple possible note fields from backend
  const nota =
    c.nota ??
    c.descripcion ??
    (c.nota_evolucion as string) ??
    (c.observaciones as string) ??
    "Registro clínico";
  return {
    id: c.id,
    nota,
    descripcion: c.descripcion,
    enfermero_nombre: applied?.user
      ? `${applied.user.nombre ?? ""} ${applied.user.apellidos ?? ""}`.trim()
      : (c.medico_nombre as string) ??
        (c.enfermero_nombre as string) ??
        ((c as Record<string, unknown>).user as { name?: string; nombre?: string } | undefined)?.name ??
        ((c as Record<string, unknown>).user as { name?: string; nombre?: string } | undefined)?.nombre ??
        "Personal de Turno",
    created_at: applied?.fecha_aplicacion ?? c.created_at ?? (c.fecha as string) ?? undefined,
  };
}

/**
 * Master normalizer: converts raw Laravel API response into clean Inpatient.
 * Handles all structural mismatches between backend and frontend.
 * Uses ControlRaw[] as the canonical clinical data source (no flat pre-normalization).
 */
export function normalizeInpatient(raw: Record<string, unknown>): Inpatient {
  // ── Cama & Sala extraction ──────────────────────────────────────────────
  const ocupacion = (raw.ocupacion_activa as OcupacionActiva) ?? (raw.ocupacionActiva as OcupacionActiva) ?? undefined;
  // Backend returns cama with `nombre` (not `codigo`); support both shapes
  const rawCama = (raw.cama as { id?: number; codigo?: string; nombre?: string; sala?: any }) ?? ocupacion?.cama;
  const rawSala = (raw.sala as { id?: number; nombre?: string; codigo?: string }) ?? rawCama?.sala ?? ocupacion?.cama?.sala;

  const cama = {
    id: rawCama?.id,
    // Prefer `nombre` from backend, fallback to `codigo`, then default
    nombre: rawCama?.nombre ?? rawCama?.codigo ?? undefined,
    codigo: rawCama?.codigo ?? rawCama?.nombre ?? "SIN-CAMA",
  };
  const sala = {
    id: rawSala?.id,
    nombre: rawSala?.nombre ?? rawSala?.codigo ?? "Sin Sala",
    codigo: rawSala?.codigo ?? undefined,
  };

  // ── Médico name extraction ───────────────────────────────────────────────
  const medicoRaw = raw.medico as Record<string, unknown> | undefined;

  // ── Raw controls (canonical — no flat pre-normalization) ───────────────────
  const rawControles = (raw.controles as ControlRaw[]) ?? [];

  // Extract custom note controls of type "Evolución Médica" to merge into the clinical timeline
  const controlNotes: EvolutionNote[] = rawControles
    .filter((c) => c.tipo === "Evolución Médica" || c.tipo === "Evolución")
    .map((c) => ({
      id: c.id,
      internacion_id: c.internacion_id,
      nota: c.observaciones || "Registro clínico de evolución médica.",
      enfermero_nombre: c.user
        ? `${c.user.nombre ?? ""} ${c.user.apellidos ?? ""}`.trim() || c.user.name || "Médico de Turno"
        : "Médico de Turno",
      created_at: c.fecha_control || c.created_at,
    }));

  // ── Evolution notes from evolucion_enfermeria or plan_de_cuidados ─────────
  const rawEvolucion = (raw.evolucion_enfermeria as Cuidado[]) ?? [];
  const rawPlanCuidados = (raw.plan_de_cuidados as Cuidado[]) ?? [];

  // ── Diagnostico field (backend: "diagnostico", frontend expects "diagnostico_ingreso") ─
  const diagnostico_ingreso =
    (raw.diagnostico_ingreso as string) ??
    (raw.diagnostico as string) ??
    (raw.motivo as string) ??
    "Sin diagnóstico registrado";

  // ── Paciente ─────────────────────────────────────────────────────────────
  const pacienteRaw = (raw.paciente as Record<string, unknown>) ?? {};

  return {
    id: raw.id as number,
    paciente_id: raw.paciente_id as number | undefined,
    fecha_ingreso: (raw.fecha_ingreso as string) ?? "",
    fecha_alta: raw.fecha_alta as string | null | undefined,
    tipo_alta: raw.tipo_alta as string | undefined,
    observaciones_alta: raw.observaciones_alta as string | undefined,
    diagnostico_ingreso,
    estado: (raw.estado as string) ?? "Internado",
    cama,
    sala,
    paciente: {
      id: (pacienteRaw.id as number) ?? 0,
      nombre: (pacienteRaw.nombre as string) ?? "",
      apellidos: (pacienteRaw.apellidos as string) ?? "",
      ci: pacienteRaw.ci as string | undefined,
      sexo: pacienteRaw.sexo as string | undefined,
      fecha_nacimiento: pacienteRaw.fecha_nacimiento as string | undefined,
    },
    medico: medicoRaw
      ? {
          id: medicoRaw.id as number | undefined,
          name: medicoRaw.name as string | undefined,
          nombre: medicoRaw.nombre as string | undefined,
          apellidos: medicoRaw.apellidos as string | undefined,
        }
      : undefined,
    // Raw clinical data (canonical)
    controles: Array.isArray(rawControles) ? rawControles : [],
    evolucion_enfermeria: Array.isArray(rawEvolucion) ? rawEvolucion : [],
    plan_de_cuidados: Array.isArray(rawPlanCuidados) ? rawPlanCuidados : [],
    evolution_notes: [
      ...Array.isArray(rawEvolucion) ? rawEvolucion.map(normalizeCuidado) : [],
      ...controlNotes
    ],
    ocupacion_activa: ocupacion,
    tratamientos: Array.isArray(raw.tratamientos) ? (raw.tratamientos as Tratamiento[]) : [],
    alimentaciones: Array.isArray(raw.alimentaciones) ? (raw.alimentaciones as Alimentacion[]) : [],
    datos_antropometricos: raw.datos_antropometricos as Inpatient["datos_antropometricos"],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE LAYER
// ─────────────────────────────────────────────────────────────────────────────

export const nursingService = {
  /**
   * Obtiene la lista de todos los pacientes internados activos en la estación.
   * Backend returns raw internaciones[] — we normalize each one.
   */
  async getActiveInpatients(): Promise<Inpatient[]> {
    const response = await api.get<Record<string, unknown>[]>('/estacion-enfermeria/pacientes');
    const raw = Array.isArray(response.data)
      ? response.data
      : Array.isArray((response.data as Record<string, unknown>)?.data)
      ? ((response.data as Record<string, unknown>).data as Record<string, unknown>[])
      : [];
    return raw.map(normalizeInpatient);
  },

  /**
   * Obtiene el detalle clínico completo de una internación.
   */
  async getInpatientDetails(internacionId: number | string): Promise<Inpatient> {
    const response = await api.get<Record<string, unknown>>(`/internaciones/${internacionId}/vista-completa`);
    return normalizeInpatient(response.data);
  },

  /**
   * @deprecated Use postVitalControl from vitalSignsService.ts instead.
   * This method sends an incomplete payload that does not include valores[].
   */
  async addVitalControl(controlData: { internacion_id: number; observaciones?: string }): Promise<ControlRaw> {
    const response = await api.post<ControlRaw>("/controls", {
      internacion_id: controlData.internacion_id,
      tipo: "Control de Rutina",
      fecha_control: new Date().toISOString(),
      observaciones: controlData.observaciones,
    });
    return response.data;
  },

  /**
   * Registra una nota de evolución clínica.
   * @deprecated Use postEvolucionNota from vitalSignsService.ts instead.
   */
  async addEvolutionNote(noteData: { internacion_id: number; nota: string }): Promise<unknown> {
    const response = await api.post("/cuidados-directo", noteData);
    return response.data;
  },
};

export default nursingService;
