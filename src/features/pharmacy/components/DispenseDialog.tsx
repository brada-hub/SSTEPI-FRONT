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
import { Medicine } from "@/services/pharmacyService";
import { Pill, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const dispenseSchema = z.object({
  cantidad: z.number().min(1, "La cantidad mínima a dispensar es 1"),
  motivo: z.string().min(3, "Debe especificar el motivo de la entrega"),
  internacion_id: z.number().optional().or(z.literal(0)),
});

type DispenseFormValues = z.infer<typeof dispenseSchema>;

interface DispenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicine: Medicine | null;
  onSubmitSuccess: (id: number, data: { cantidad: number; internacionId?: number; motivo?: string }) => Promise<void>;
}

export function DispenseDialog({
  open,
  onOpenChange,
  medicine,
  onSubmitSuccess,
}: DispenseDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DispenseFormValues>({
    resolver: zodResolver(dispenseSchema),
    defaultValues: {
      cantidad: 1,
      motivo: "Dispensación de rutina por indicación médica",
      internacion_id: 0,
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        cantidad: 1,
        motivo: "Dispensación de rutina por indicación médica",
        internacion_id: 0,
      });
    }
  }, [open, reset]);

  if (!medicine) return null;

  const handleFormSubmit = async (values: DispenseFormValues) => {
    if (values.cantidad > medicine.stock) {
      toast.error(`Stock insuficiente. Solo quedan ${medicine.stock} unidades de ${medicine.nombre}.`);
      return;
    }

    try {
      await onSubmitSuccess(medicine.id, {
        cantidad: values.cantidad,
        internacionId: values.internacion_id ? Number(values.internacion_id) : undefined,
        motivo: values.motivo,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error("Fallo al registrar la dispensación.");
    }
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
              <DialogTitle>Dispensar Medicamento</DialogTitle>
              <DialogDescription>
                Fármaco: {medicine.nombre} • Stock: {medicine.stock} unidades
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Formulario */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="my-4 space-y-4">
          <div className="grid gap-3 grid-cols-3">
            {/* Cantidad */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Cantidad</label>
              <input type="number" {...register("cantidad", { valueAsNumber: true })} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs font-mono outline-none" />
              {errors.cantidad && <span className="text-[9px] text-destructive block">{errors.cantidad.message}</span>}
            </div>

            {/* Internacion ID */}
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Internación ID (Opcional)</label>
              <input type="number" placeholder="ej: 14" {...register("internacion_id", { valueAsNumber: true })} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs font-mono outline-none" />
            </div>
          </div>

          {/* Motivo */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase block">Motivo / Justificación</label>
            <input type="text" {...register("motivo")} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary" />
            {errors.motivo && <span className="text-[9px] text-destructive block">{errors.motivo.message}</span>}
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
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-white shadow-sm hover:bg-primary/95 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Entregando..." : <><ShieldCheck className="h-4 w-4" /> Registrar Entrega</>}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default DispenseDialog;
