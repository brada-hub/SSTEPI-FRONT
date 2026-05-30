"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSignosCatalogQuery } from "@/features/nursing/hooks/useCatalogQueries";
import { type SignoCatalog, type ValorControlPayload } from "@/features/nursing/services/vitalSignsService";
import { Activity, Loader2, ArrowUp, ArrowDown } from "lucide-react";

const EMPTY_ARRAY: SignoCatalog[] = [];

interface VitalSignsFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  internacionId: number;
  onSubmit: (valores: ValorControlPayload[], observaciones: string) => Promise<void>;
  isPending?: boolean;
}

// Local state for each signo in the form
interface SignoFormState {
  signo: SignoCatalog;
  medida: string;
  medida_baja: string;
  error?: string;
  error_baja?: string;
}

function getRangoHint(signo: SignoCatalog): string {
  if (signo.rango_minimo != null && signo.rango_maximo != null) {
    return `Normal: ${signo.rango_minimo} – ${signo.rango_maximo} ${signo.unidad}`;
  }
  return signo.unidad;
}

const ANTROPOMETRIA_KEYS = ["Peso", "Talla", "Altura", "IMC"];

export function VitalSignsForm({
  open,
  onOpenChange,
  internacionId,
  onSubmit,
  isPending,
}: VitalSignsFormProps) {
  const { data: signos = EMPTY_ARRAY, isLoading } = useSignosCatalogQuery("rutinario");
  const [formState, setFormState] = React.useState<SignoFormState[]>([]);
  const [observaciones, setObservaciones] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Build form state from catalog when dialog opens
  React.useEffect(() => {
    if (open && signos.length > 0) {
      setFormState(
        signos.map((s) => ({
          signo: s,
          medida: "",
          medida_baja: "",
          error: undefined,
          error_baja: undefined,
        }))
      );
      setObservaciones("");
    }
  }, [open, signos]);

  const signosAntropometria = formState.filter((f) =>
    ANTROPOMETRIA_KEYS.some((k) => f.signo.nombre.includes(k))
  );
  const signosVitales = formState.filter(
    (f) => !ANTROPOMETRIA_KEYS.some((k) => f.signo.nombre.includes(k))
  );

  const updateMedida = (id: number, campo: "medida" | "medida_baja", value: string) => {
    setFormState((prev) =>
      prev.map((f) => {
        if (f.signo.id !== id) return f;
        const updated = { ...f, [campo]: value };
        // Inline validation
        const num = parseFloat(value);
        if (value !== "" && (isNaN(num) || num <= 0)) {
          updated[campo === "medida" ? "error" : "error_baja"] = "Debe ser > 0";
        } else {
          updated[campo === "medida" ? "error" : "error_baja"] = undefined;
        }
        return updated;
      })
    );
  };

  const handleSubmit = async () => {
    // Build payload — only include signos with a medida filled
    const valores: ValorControlPayload[] = [];
    let hasError = false;

    const newState = formState.map((f) => {
      const updated = { ...f };
      if (f.medida === "" || f.medida === null) return updated; // optional signos are skipped
      const num = parseFloat(f.medida);
      if (isNaN(num) || num <= 0) {
        updated.error = "Debe ser > 0";
        hasError = true;
        return updated;
      }
      const payload: ValorControlPayload = { signo_id: f.signo.id, medida: num };
      if (f.signo.requiere_valores_duales && f.medida_baja !== "") {
        const numBaja = parseFloat(f.medida_baja);
        if (isNaN(numBaja) || numBaja <= 0) {
          updated.error_baja = "Debe ser > 0";
          hasError = true;
          return updated;
        }
        payload.medida_baja = numBaja;
      }
      valores.push(payload);
      return updated;
    });

    if (hasError) {
      setFormState(newState);
      return;
    }
    if (valores.length === 0) {
      return; // nothing entered
    }

    try {
      setSubmitting(true);
      await onSubmit(valores, observaciones);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const renderSignoInput = (f: SignoFormState) => (
    <div
      key={f.signo.id}
      className="rounded-xl border border-border bg-secondary/15 p-3 space-y-1.5 hover:border-primary/30 transition-all"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-foreground">{f.signo.nombre}</span>
        <span className="text-[9px] font-mono text-muted-foreground">{f.signo.unidad}</span>
      </div>

      {f.signo.requiere_valores_duales ? (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="flex items-center gap-1 mb-0.5">
              <ArrowUp className="h-2.5 w-2.5 text-destructive" />
              <span className="text-[8px] text-muted-foreground font-semibold">Sistólica</span>
            </div>
            <input
              type="number"
              step="0.1"
              value={f.medida}
              onChange={(e) => updateMedida(f.signo.id, "medida", e.target.value)}
              placeholder="120"
              className="w-full h-8 rounded-lg border border-border bg-background px-2 text-xs font-mono outline-none focus:border-primary"
            />
            {f.error && <p className="text-[8px] text-destructive">{f.error}</p>}
          </div>
          <div>
            <div className="flex items-center gap-1 mb-0.5">
              <ArrowDown className="h-2.5 w-2.5 text-primary" />
              <span className="text-[8px] text-muted-foreground font-semibold">Diastólica</span>
            </div>
            <input
              type="number"
              step="0.1"
              value={f.medida_baja}
              onChange={(e) => updateMedida(f.signo.id, "medida_baja", e.target.value)}
              placeholder="80"
              className="w-full h-8 rounded-lg border border-border bg-background px-2 text-xs font-mono outline-none focus:border-primary"
            />
            {f.error_baja && <p className="text-[8px] text-destructive">{f.error_baja}</p>}
          </div>
        </div>
      ) : (
        <div>
          <input
            type="number"
            step="0.1"
            value={f.medida}
            onChange={(e) => updateMedida(f.signo.id, "medida", e.target.value)}
            placeholder="Ingresar valor..."
            className="w-full h-8 rounded-lg border border-border bg-background px-2 text-xs font-mono outline-none focus:border-primary"
          />
          {f.error && <p className="text-[8px] text-destructive">{f.error}</p>}
        </div>
      )}

      <p className="text-[8px] text-muted-foreground">{getRangoHint(f.signo)}</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidthClass="max-w-2xl" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Activity className="h-4.5 w-4.5" />
            </div>
            <div>
              <DialogTitle>Registrar Constantes Vitales</DialogTitle>
              <DialogDescription>
                Complete los signos disponibles. Los campos no rellenados serán omitidos.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="my-3 max-h-[60vh] overflow-y-auto pr-1 space-y-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground text-xs">
              <Loader2 className="h-5 w-5 animate-spin" />
              Cargando catálogo de constantes clínicas...
            </div>
          ) : (
            <>
              {/* Sección Antropometría */}
              {signosAntropometria.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/30 pb-1">
                    Antropometría
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {signosAntropometria.map(renderSignoInput)}
                  </div>
                </div>
              )}

              {/* Sección Signos Vitales */}
              {signosVitales.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/30 pb-1">
                    Signos Vitales y Triaje
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {signosVitales.map(renderSignoInput)}
                  </div>
                </div>
              )}

              {/* Observaciones */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase">
                  Observaciones clínicas (opcional)
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={2}
                  placeholder="Ej: Paciente colaborador, refiere leve cefalea..."
                  className="w-full rounded-lg border border-border bg-secondary/40 p-2.5 text-xs outline-none resize-none focus:border-primary"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-xs font-bold text-foreground hover:bg-secondary cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || isPending || isLoading}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-white shadow-sm hover:bg-primary/95 disabled:opacity-50 cursor-pointer"
          >
            {submitting || isPending ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" />Registrando...</>
            ) : (
              <><Activity className="h-3.5 w-3.5" />Registrar Constantes</>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
