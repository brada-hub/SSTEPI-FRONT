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
  DialogFooter 
} from "@/components/ui/dialog";
import { Apple, ShieldCheck, Plus, Trash, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getTiposDieta, type TipoDieta } from "@/features/nursing/services/feedingService";

const dietAssignmentSchema = z.object({
  tipo_dieta_id: z.coerce.number().min(1, "Debe seleccionar un tipo de dieta"),
  via_administracion: z.enum(["Oral", "Enteral", "Parenteral"], {
    message: "Debe seleccionar la vía de administración",
  }),
  restricciones: z.string().optional(),
  descripcion: z.string().optional(),
  fecha_inicio: z.string().min(1, "Debe indicar la fecha de inicio"),
  fecha_fin: z.string().min(1, "Debe indicar la fecha de finalización"),
});

type DietAssignmentFormValues = z.infer<typeof dietAssignmentSchema>;

interface DietAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inpatient: any | null;
  onSubmitSuccess: (internationId: number, data: any) => Promise<void>;
}

const STANDARD_MEALS = [
  "Desayuno",
  "Merienda AM",
  "Almuerzo",
  "Merienda PM",
  "Cena"
];

export function DietAssignmentDialog({
  open,
  onOpenChange,
  inpatient,
  onSubmitSuccess,
}: DietAssignmentDialogProps) {
  const [dietTypes, setDietTypes] = React.useState<TipoDieta[]>([]);
  
  // Tiempos / comidas activas
  const [activeMeals, setActiveMeals] = React.useState<{ [key: string]: boolean }>({
    "Desayuno": true,
    "Almuerzo": true,
    "Cena": true,
  });
  const [mealDescriptions, setMealDescriptions] = React.useState<{ [key: string]: string }>({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(dietAssignmentSchema),
    defaultValues: {
      tipo_dieta_id: 1,
      via_administracion: "Oral",
      restricciones: "",
      descripcion: "",
      fecha_inicio: "",
      fecha_fin: "",
    },
  });

  // Cargar Tipos de Dieta de la base de datos
  React.useEffect(() => {
    if (open) {
      getTiposDieta()
        .then(setDietTypes)
        .catch(() => toast.error("Error al cargar tipos de dieta clínicos."));

      // Configurar fechas por defecto (hoy a las 08:00 hasta dentro de 7 días)
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);

      const formatDate = (date: Date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}T08:00`;
      };

      reset({
        tipo_dieta_id: 1,
        via_administracion: "Oral",
        restricciones: "",
        descripcion: "",
        fecha_inicio: formatDate(now),
        fecha_fin: formatDate(nextWeek),
      });

      setActiveMeals({
        "Desayuno": true,
        "Almuerzo": true,
        "Cena": true,
      });
      setMealDescriptions({
        "Desayuno": "Infusión tibia o té, acompañado de pan tostado o galletas de agua.",
        "Almuerzo": "Sopa crema licuada sin grasa, puré de patata o calabaza, compota de manzana.",
        "Cena": "Caldo colado ligero, gelatina dietética o mazamorra suave.",
      });
    }
  }, [open, reset]);

  if (!inpatient) return null;

  const toggleMeal = (meal: string) => {
    setActiveMeals((prev) => ({ ...prev, [meal]: !prev[meal] }));
  };

  const handleMealDescriptionChange = (meal: string, desc: string) => {
    setMealDescriptions((prev) => ({ ...prev, [meal]: desc }));
  };

  const handleFormSubmit = async (values: any) => {
    // Filtrar y preparar tiempos estructurados
    const tiempos = Object.keys(activeMeals)
      .filter((meal) => activeMeals[meal])
      .map((meal) => ({
        tiempo_comida: meal,
        descripcion: mealDescriptions[meal] || "Según indicación nutricional general."
      }));

    if (tiempos.length === 0) {
      toast.error("Debe seleccionar al menos un tiempo de comida (ej: Almuerzo).");
      return;
    }

    const payload = {
      tipo_dieta_id: Number(values.tipo_dieta_id),
      via_administracion: values.via_administracion,
      frecuencia_tiempos: tiempos.length,
      tiempos,
      restricciones: values.restricciones || "Ninguna restricción reportada.",
      descripcion: values.descripcion || "Plan alimenticio formulado por nutricionista.",
      fecha_inicio: new Date(values.fecha_inicio).toISOString(),
      fecha_fin: new Date(values.fecha_fin).toISOString(),
    };

    try {
      await onSubmitSuccess(inpatient.id, payload);
      onOpenChange(false);
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Fallo al asignar el régimen alimenticio.";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidthClass="max-w-xl" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-amber/15 text-accent-amber">
              <Apple className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col text-left">
              <DialogTitle>Formular Régimen Clínico Nutricional</DialogTitle>
              <DialogDescription>
                Paciente: {inpatient.paciente.nombre} {inpatient.paciente.apellidos} {inpatient.paciente.edad || inpatient.paciente.fecha_nacimiento ? `(${inpatient.paciente.edad ?? ""} años)` : ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="my-4 space-y-4 max-h-[65vh] overflow-y-auto px-1 py-1">
          {/* Grid: Tipo Dieta y Vía */}
          <div className="grid gap-3 grid-cols-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Tipo de Dieta</label>
              <select
                {...register("tipo_dieta_id")}
                className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none cursor-pointer"
              >
                {dietTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
              {errors.tipo_dieta_id?.message && <span className="text-[9px] text-destructive">{String(errors.tipo_dieta_id.message)}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Vía de Administración</label>
              <select
                {...register("via_administracion")}
                className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none cursor-pointer"
              >
                {["Oral", "Enteral", "Parenteral"].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              {errors.via_administracion?.message && <span className="text-[9px] text-destructive">{String(errors.via_administracion.message)}</span>}
            </div>
          </div>

          {/* Fechas */}
          <div className="grid gap-3 grid-cols-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Fecha Inicio</label>
              <input
                type="datetime-local"
                {...register("fecha_inicio")}
                className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none cursor-pointer"
              />
              {errors.fecha_inicio?.message && <span className="text-[9px] text-destructive">{String(errors.fecha_inicio.message)}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Fecha Término</label>
              <input
                type="datetime-local"
                {...register("fecha_fin")}
                className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none cursor-pointer"
              />
              {errors.fecha_fin?.message && <span className="text-[9px] text-destructive">{String(errors.fecha_fin.message)}</span>}
            </div>
          </div>

          {/* Tiempos de Comida y Menú por Platos */}
          <div className="rounded-xl border border-border bg-secondary/20 p-3.5 space-y-3">
            <span className="text-[10px] font-bold text-foreground uppercase tracking-wider block border-b border-border/40 pb-1.5">
              Planificación de Platos por Horas/Tiempos
            </span>
            
            <div className="flex flex-wrap gap-2">
              {STANDARD_MEALS.map((meal) => {
                const isChecked = !!activeMeals[meal];
                return (
                  <button
                    key={meal}
                    type="button"
                    onClick={() => toggleMeal(meal)}
                    className={`h-7 px-3 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                      isChecked
                        ? "bg-accent-amber/20 border-accent-amber/40 text-accent-amber"
                        : "bg-background border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {meal}
                  </button>
                );
              })}
            </div>

            {/* Campos de entrada para platos activos */}
            <div className="space-y-2.5 pt-1.5">
              {STANDARD_MEALS.map((meal) => {
                if (!activeMeals[meal]) return null;
                return (
                  <div key={meal} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">{meal}</span>
                      <button type="button" onClick={() => toggleMeal(meal)} className="text-[9px] text-destructive hover:underline">Quitar</button>
                    </div>
                    <input
                      type="text"
                      value={mealDescriptions[meal] || ""}
                      onChange={(e) => handleMealDescriptionChange(meal, e.target.value)}
                      placeholder={`ej: Dieta para ${meal.toLowerCase()}...`}
                      className="w-full h-8 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Restricciones */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase block">Restricciones Alimentarias Clínicas</label>
            <input
              type="text"
              placeholder="ej: Hiposódica estricta, restricción de líquidos, sin gluten..."
              {...register("restricciones")}
              className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary"
            />
            {errors.restricciones?.message && <span className="text-[9px] text-destructive">{String(errors.restricciones.message)}</span>}
          </div>

          {/* Notas / Observaciones */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase block">Indicaciones / Observaciones Generales</label>
            <textarea
              rows={2}
              placeholder="Comentarios adicionales del especialista nutricional..."
              {...register("descripcion")}
              className="w-full rounded-lg border border-border bg-secondary/50 p-2.5 text-xs outline-none focus:border-primary resize-none placeholder:text-muted-foreground/60"
            />
            {errors.descripcion?.message && <span className="text-[9px] text-destructive">{String(errors.descripcion.message)}</span>}
          </div>
        </form>

        {/* Footer */}
        <DialogFooter>
          <button type="button" onClick={() => onOpenChange(false)} className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-xs font-bold text-foreground hover:bg-secondary cursor-pointer">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit(handleFormSubmit)}
            disabled={isSubmitting}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-accent-amber px-4 text-xs font-bold text-white shadow-sm hover:bg-accent-amber/95 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Asignando..." : <><ShieldCheck className="h-4 w-4" /> Asignar Régimen</>}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DietAssignmentDialog;
