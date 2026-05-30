"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useMedicamentosQuery } from "@/features/nursing/hooks/useCatalogQueries";
import { createMedicamento, type Medicamento } from "@/features/nursing/services/treatmentService";
import { Stethoscope, Plus, Trash2, Loader2, Search, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";

const EMPTY_ARRAY: Medicamento[] = [];

// ── Types ─────────────────────────────────────────────────────────────────────
interface RecetaForm {
  medicamento_id: number;
  medicamento_nombre: string;
  dosis_valor: number | string;
  dosis_unidad: string;
  via_administracion: string;
  frecuencia_horas: number | string;
  duracion_dias: number | string;
}

const schema = z.object({
  tipo: z.string().min(2, "Mínimo 2 caracteres"),
  descripcion: z.string().min(3, "Mínimo 3 caracteres"),
});
type FormValues = z.infer<typeof schema>;

const VIAS = ["Oral", "Intravenosa", "Intramuscular", "Subcutánea", "Tópica", "Inhalatoria", "Rectal", "Ótica", "Oftálmica"];
const UNIDADES_DOSIS = ["mg", "g", "ml", "mcg", "UI", "gotas", "comprimido(s)", "cápsula(s)"];

interface PrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  internacionId: number;
  onSubmit: (data: {
    internacion_id: number;
    tipo: string;
    descripcion: string;
    fecha_inicio: string;
    fecha_fin: string;
    recetas: {
      medicamento_id: number;
      dosis: string;
      via_administracion: string;
      frecuencia_horas: number;
      duracion_dias: number;
    }[];
  }) => Promise<void>;
  isPending?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function PrescriptionDialog({
  open,
  onOpenChange,
  internacionId,
  onSubmit,
  isPending,
}: PrescriptionDialogProps) {
  const { data: medicamentos = EMPTY_ARRAY, isLoading: isLoadingMeds, error: medsError, refetch: refetchMeds } = useMedicamentosQuery();
  const [localMeds, setLocalMeds] = React.useState<Medicamento[]>([]);
  const [recetas, setRecetas] = React.useState<RecetaForm[]>([]);
  const [searchMed, setSearchMed] = React.useState("");
  const [filteredMeds, setFilteredMeds] = React.useState<Medicamento[]>([]);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // New medication sub-dialog
  const [newMedDialog, setNewMedDialog] = React.useState(false);
  const [newMedForm, setNewMedForm] = React.useState({ nombre: "", descripcion: "" });
  const [savingMed, setSavingMed] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // All available meds (catalog + locally created)
  const allMeds = React.useMemo(
    () => [...medicamentos, ...localMeds.filter((lm) => !medicamentos.find((m) => m.id === lm.id))],
    [medicamentos, localMeds]
  );

  React.useEffect(() => {
    if (open) {
      reset({ tipo: "", descripcion: "" });
      setRecetas([]);
      setSearchMed("");
    }
  }, [open, reset]);

  React.useEffect(() => {
    if (!searchMed.trim()) {
      setFilteredMeds(allMeds.slice(0, 8));
    } else {
      const q = searchMed.toLowerCase();
      setFilteredMeds(allMeds.filter((m) => m.nombre.toLowerCase().includes(q)).slice(0, 10));
    }
  }, [searchMed, allMeds]);

  const addReceta = (med: Medicamento) => {
    if (recetas.some((r) => r.medicamento_id === med.id)) {
      toast.warning("Este medicamento ya fue añadido.");
      return;
    }
    setRecetas((prev) => [
      ...prev,
      {
        medicamento_id: med.id,
        medicamento_nombre: med.nombre,
        dosis_valor: "",
        dosis_unidad: "mg",
        via_administracion: "Oral",
        frecuencia_horas: 8,
        duracion_dias: 1,
      },
    ]);
    setSearchMed("");
    setShowDropdown(false);
  };

  const updateReceta = (idx: number, key: keyof RecetaForm, value: string | number) => {
    setRecetas((prev) => prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  };

  const removeReceta = (idx: number) => {
    setRecetas((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveNewMed = async () => {
    if (!newMedForm.nombre.trim()) return;
    setSavingMed(true);
    try {
      const payload = {
        nombre: newMedForm.nombre.trim(),
        descripcion: newMedForm.descripcion.trim() || undefined,
        categoria_id: 1, // default category (Analgésicos)
      };
      const created = await createMedicamento(payload);
      
      // Update local state list to display immediately
      setLocalMeds((prev) => [...prev, created]);
      
      // Refetch from server to sync cache
      await refetchMeds();
      
      toast.success(`Medicamento "${created.nombre}" creado y añadido.`);
      addReceta(created);
      setNewMedDialog(false);
      setNewMedForm({ nombre: "", descripcion: "" });
    } catch (err: any) {
      console.error("Error creating medication:", err);
      const responseErrors = err.response?.data?.errors;
      const responseMessage = err.response?.data?.message;
      
      if (responseErrors) {
        const firstErrorKey = Object.keys(responseErrors)[0];
        const firstErrorMsg = responseErrors[firstErrorKey]?.[0] || "Datos inválidos.";
        toast.error(`Validación: ${firstErrorMsg}`);
      } else if (responseMessage) {
        toast.error(responseMessage);
      } else {
        toast.error("Error al crear el medicamento.");
      }
    } finally {
      setSavingMed(false);
    }
  };

  const onFormSubmit = async (values: FormValues) => {
    if (recetas.length === 0) {
      toast.error("Debe prescribir al menos un medicamento.");
      return;
    }
    const maxDuracion = Math.max(...recetas.map((r) => Number(r.duracion_dias) || 0));
    const fechaInicio = format(new Date(), "yyyy-MM-dd HH:mm:ss");
    const fechaFin = format(addDays(new Date(), maxDuracion), "yyyy-MM-dd HH:mm:ss");

    setSubmitting(true);
    try {
      await onSubmit({
        internacion_id: internacionId,
        tipo: values.tipo,
        descripcion: values.descripcion,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        recetas: recetas.map((r) => ({
          medicamento_id: r.medicamento_id,
          dosis: `${r.dosis_valor} ${r.dosis_unidad}`,
          via_administracion: r.via_administracion,
          frecuencia_horas: Number(r.frecuencia_horas),
          duracion_dias: Number(r.duracion_dias),
        })),
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent maxWidthClass="max-w-2xl" onClose={() => onOpenChange(false)}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-teal/10 text-accent-teal">
                <Stethoscope className="h-4.5 w-4.5" />
              </div>
              <div>
                <DialogTitle>Prescribir Tratamiento</DialogTitle>
                <DialogDescription>Configure el tratamiento y los medicamentos recetados.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form id="prescription-form" onSubmit={handleSubmit(onFormSubmit)}>
            <div className={`my-3 max-h-[65vh] overflow-y-auto pr-1 space-y-4 transition-all duration-300 ${showDropdown ? "pb-48" : "pb-4"}`}>
              {/* Tipo y descripción */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Tipo de Tratamiento *</label>
                  <input
                    {...register("tipo")}
                    placeholder="Ej: Antibioticoterapia, Hidratación IV..."
                    className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary"
                  />
                  {errors.tipo && <p className="text-[9px] text-destructive">{errors.tipo.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Descripción / Diagnóstico *</label>
                  <input
                    {...register("descripcion")}
                    placeholder="Ej: Infección urinaria, fiebre..."
                    className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary"
                  />
                  {errors.descripcion && <p className="text-[9px] text-destructive">{errors.descripcion.message}</p>}
                </div>
              </div>

              {/* Buscador medicamentos */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase">Agregar Medicamento</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      value={searchMed}
                      onChange={(e) => { setSearchMed(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                      placeholder="Buscar medicamento en catálogo..."
                      className="w-full h-9 rounded-lg border border-border bg-secondary/50 pl-8 pr-3 text-xs outline-none focus:border-primary"
                    />
                    {showDropdown && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg py-1 scrollbar-thin">
                        {isLoadingMeds ? (
                          <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-teal" />
                            <span>Cargando catálogo...</span>
                          </div>
                        ) : medsError ? (
                          <div className="px-3 py-2 text-xs text-destructive flex flex-col gap-1">
                            <span>Error al cargar medicamentos.</span>
                            <button
                              type="button"
                              onMouseDown={(e) => { e.preventDefault(); refetchMeds(); }}
                              className="text-[10px] text-accent-teal hover:underline text-left cursor-pointer font-semibold"
                            >
                              Reintentar
                            </button>
                          </div>
                        ) : filteredMeds.length === 0 ? (
                          <div className="px-3 py-2.5 text-xs text-muted-foreground text-center">
                            <p className="font-medium mb-1">No se encontraron medicamentos</p>
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setNewMedForm({ nombre: searchMed.trim(), descripcion: "" });
                                setNewMedDialog(true);
                              }}
                              className="text-[10px] text-accent-teal hover:underline font-bold cursor-pointer"
                            >
                              + Registrar "{searchMed.trim()}"
                            </button>
                          </div>
                        ) : (
                          filteredMeds.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onMouseDown={() => addReceta(m)}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-secondary/60 hover:text-primary transition-colors text-foreground font-semibold flex items-center gap-2 cursor-pointer"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-accent-teal shrink-0" />
                              <span>{m.nombre}</span>
                              {m.descripcion && (
                                <span className="text-[10px] text-muted-foreground font-normal ml-auto truncate max-w-[220px]">
                                  {m.descripcion}
                                </span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewMedDialog(true)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer"
                  >
                    <PlusCircle className="h-3.5 w-3.5 text-accent-teal" />
                    Nuevo
                  </button>
                </div>
              </div>

              {/* Recetas añadidas */}
              {recetas.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">
                    Medicamentos Prescritos ({recetas.length})
                  </p>
                  {recetas.map((r, idx) => (
                    <div key={idx} className="rounded-xl border border-border bg-secondary/10 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{r.medicamento_nombre}</span>
                        <button
                          type="button"
                          onClick={() => removeReceta(idx)}
                          className="text-muted-foreground hover:text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div className="space-y-0.5">
                          <label className="text-[8px] font-bold text-muted-foreground uppercase">Dosis</label>
                          <div className="flex">
                            <input
                              type="number"
                              value={r.dosis_valor}
                              onChange={(e) => updateReceta(idx, "dosis_valor", e.target.value)}
                              placeholder="12"
                              className="w-full h-7 rounded-l-lg border border-border bg-background px-2 text-[10px] font-mono outline-none focus:border-primary"
                            />
                            <select
                              value={r.dosis_unidad}
                              onChange={(e) => updateReceta(idx, "dosis_unidad", e.target.value)}
                              className="h-7 rounded-r-lg border-l-0 border border-border bg-secondary/50 px-1 text-[10px] outline-none"
                            >
                              {UNIDADES_DOSIS.map((u) => <option key={u}>{u}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[8px] font-bold text-muted-foreground uppercase">Vía</label>
                          <select
                            value={r.via_administracion}
                            onChange={(e) => updateReceta(idx, "via_administracion", e.target.value)}
                            className="w-full h-7 rounded-lg border border-border bg-secondary/50 px-1 text-[10px] outline-none"
                          >
                            {VIAS.map((v) => <option key={v}>{v}</option>)}
                          </select>
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[8px] font-bold text-muted-foreground uppercase">Frecuencia (h)</label>
                          <input
                            type="number"
                            value={r.frecuencia_horas}
                            onChange={(e) => updateReceta(idx, "frecuencia_horas", e.target.value)}
                            className="w-full h-7 rounded-lg border border-border bg-background px-2 text-[10px] font-mono outline-none focus:border-primary"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[8px] font-bold text-muted-foreground uppercase">Duración (días)</label>
                          <input
                            type="number"
                            value={r.duracion_dias}
                            onChange={(e) => updateReceta(idx, "duracion_dias", e.target.value)}
                            className="w-full h-7 rounded-lg border border-border bg-background px-2 text-[10px] font-mono outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-xs font-bold text-foreground hover:bg-secondary cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="prescription-form"
              disabled={submitting || isPending}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-accent-teal px-4 text-xs font-bold text-white shadow-sm hover:bg-accent-teal/90 disabled:opacity-50 cursor-pointer"
            >
              {submitting || isPending ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" />Prescribiendo...</>
              ) : (
                <><Stethoscope className="h-3.5 w-3.5" />Prescribir Tratamiento</>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sub-dialog: nuevo medicamento */}
      <Dialog open={newMedDialog} onOpenChange={setNewMedDialog}>
        <DialogContent maxWidthClass="max-w-sm" onClose={() => setNewMedDialog(false)}>
          <DialogHeader>
            <DialogTitle>Añadir Nuevo Medicamento</DialogTitle>
            <DialogDescription>Creará el medicamento en el catálogo del sistema.</DialogDescription>
          </DialogHeader>
          <div className="my-3 space-y-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase">Nombre *</label>
              <input
                value={newMedForm.nombre}
                onChange={(e) => setNewMedForm((p) => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej: Amoxicilina 500mg"
                className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase">Descripción</label>
              <textarea
                value={newMedForm.descripcion}
                onChange={(e) => setNewMedForm((p) => ({ ...p, descripcion: e.target.value }))}
                rows={2}
                placeholder="Antibiótico betalactámico..."
                className="w-full rounded-lg border border-border bg-secondary/40 p-2.5 text-xs outline-none resize-none focus:border-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setNewMedDialog(false)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-xs font-bold text-foreground hover:bg-secondary cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveNewMed}
              disabled={savingMed || !newMedForm.nombre.trim()}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-white disabled:opacity-50 cursor-pointer"
            >
              {savingMed ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Guardar y Añadir
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
