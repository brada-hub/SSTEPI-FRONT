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
import { Pill, Save, ShieldAlert } from "lucide-react";
import { Medicine, Category, pharmacyService } from "@/services/pharmacyService";

const medicineFormSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(100, "Máximo 100 caracteres"),
  descripcion: z.string().min(5, "Mínimo 5 caracteres").max(255, "Máximo 255 caracteres"),
  categoria_id: z.coerce.number().min(1, "Debe seleccionar una categoría"),
  stock: z.coerce.number().min(0, "El stock no puede ser negativo"),
  stock_critico: z.coerce.number().min(0, "El stock crítico no puede ser negativo"),
  estante: z.string().min(2, "Debe indicar la ubicación (ej: Pasillo A)").max(100),
});

type MedicineFormValues = z.infer<typeof medicineFormSchema>;

interface MedicineFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicineToEdit?: Medicine | null;
  onSubmitSuccess: (data: Partial<Medicine>) => Promise<void>;
}

export function MedicineFormDialog({
  open,
  onOpenChange,
  medicineToEdit,
  onSubmitSuccess,
}: MedicineFormDialogProps) {
  const [categories, setCategories] = React.useState<Category[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(medicineFormSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      categoria_id: 1,
      stock: 0,
      stock_critico: 10,
      estante: "",
    },
  });

  // Load categories
  React.useEffect(() => {
    if (open) {
      pharmacyService.getCategories()
        .then(setCategories)
        .catch(() => {});

      if (medicineToEdit) {
        reset({
          nombre: medicineToEdit.nombre,
          descripcion: medicineToEdit.descripcion ?? "",
          categoria_id: medicineToEdit.categoria_id ?? 1,
          stock: medicineToEdit.stock ?? 0,
          stock_critico: medicineToEdit.stock_critico ?? 10,
          estante: medicineToEdit.estante ?? "",
        });
      } else {
        reset({
          nombre: "",
          descripcion: "",
          categoria_id: 1,
          stock: 0,
          stock_critico: 10,
          estante: "",
        });
      }
    }
  }, [open, medicineToEdit, reset]);

  const handleFormSubmit = async (values: any) => {
    await onSubmitSuccess(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidthClass="max-w-md" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Pill className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col text-left">
              <DialogTitle>
                {medicineToEdit ? "Modificar Fármaco" : "Nuevo Fármaco Clínico"}
              </DialogTitle>
              <DialogDescription>
                Configure los datos esenciales del medicamento e inventario.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="my-4 space-y-3.5 max-h-[60vh] overflow-y-auto px-1 py-1">
          {/* Nombre */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Nombre Comercial / SKU *</label>
            <input
              type="text"
              placeholder="ej: Ibuprofeno 400mg"
              {...register("nombre")}
              className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary"
            />
            {errors.nombre?.message && <span className="text-[9px] text-destructive block">{String(errors.nombre.message)}</span>}
          </div>

          {/* Categoria */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Categoría Farmacológica *</label>
            <select
              {...register("categoria_id")}
              className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
            {errors.categoria_id?.message && <span className="text-[9px] text-destructive block">{String(errors.categoria_id.message)}</span>}
          </div>

          {/* Ubicación Estante */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Estante / Logística de Ubicación *</label>
            <input
              type="text"
              placeholder="ej: Pasillo B / Estante 3 / Nivel 1"
              {...register("estante")}
              className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary"
            />
            {errors.estante?.message && <span className="text-[9px] text-destructive block">{String(errors.estante.message)}</span>}
          </div>

          {/* Grid: Stock y Stock Crítico */}
          <div className="grid gap-3 grid-cols-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Stock Inicial *</label>
              <input
                type="number"
                placeholder="100"
                {...register("stock")}
                className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs font-mono outline-none focus:border-primary"
              />
              {errors.stock?.message && <span className="text-[9px] text-destructive block">{String(errors.stock.message)}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Stock Alerta Crítica *</label>
              <input
                type="number"
                placeholder="10"
                {...register("stock_critico")}
                className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs font-mono outline-none focus:border-primary"
              />
              {errors.stock_critico?.message && <span className="text-[9px] text-destructive block">{String(errors.stock_critico.message)}</span>}
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Indicaciones y Descripción *</label>
            <textarea
              rows={2}
              placeholder="Acción farmacológica, contraindicaciones básicas o posología de almacén..."
              {...register("descripcion")}
              className="w-full rounded-lg border border-border bg-secondary/50 p-2.5 text-xs outline-none focus:border-primary resize-none placeholder:text-muted-foreground/60"
            />
            {errors.descripcion?.message && <span className="text-[9px] text-destructive block">{String(errors.descripcion.message)}</span>}
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
            type="button"
            onClick={handleSubmit(handleFormSubmit)}
            disabled={isSubmitting}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-white shadow-sm hover:bg-primary/95 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Sincronizando..." : <><Save className="h-4 w-4" /> Guardar Fármaco</>}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
