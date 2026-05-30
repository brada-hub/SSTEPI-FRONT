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
import { ClipboardList, Loader2 } from "lucide-react";

interface CareplanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  internacionId: number;
  onSubmit: (data: {
    internacion_id: number;
    tipo: string;
    descripcion: string;
    frecuencia: string;
  }) => Promise<void>;
  isPending?: boolean;
}

const schema = z.object({
  tipo: z.string().min(2, "Mínimo 2 caracteres"),
  descripcion: z.string().min(5, "Mínimo 5 caracteres"),
  frecuencia: z.string().min(2, "Mínimo 2 caracteres"),
});

type FormValues = z.infer<typeof schema>;

const TIPOS_CUIDADO = [
  "Enfermería",
  "Medicación",
  "Kinesiología",
  "Curaciones",
  "Monitoreo Continuo",
  "Nutrición y Dieta",
];

const FRECUENCIAS = [
  "Cada 2 horas",
  "Cada 4 horas",
  "Cada 6 horas",
  "Cada 8 horas",
  "Cada 12 horas",
  "Cada 24 horas (diario)",
  "Según necesidad (PRN)",
  "Una sola vez",
];

export function CareplanDialog({
  open,
  onOpenChange,
  internacionId,
  onSubmit,
  isPending,
}: CareplanDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { tipo: "Enfermería", descripcion: "", frecuencia: "Cada 8 horas" },
  });

  React.useEffect(() => {
    if (open) {
      reset({ tipo: "Enfermería", descripcion: "", frecuencia: "Cada 8 horas" });
    }
  }, [open, reset]);

  const onFormSubmit = async (values: FormValues) => {
    await onSubmit({
      internacion_id: internacionId,
      tipo: values.tipo,
      descripcion: values.descripcion,
      frecuencia: values.frecuencia,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidthClass="max-w-md" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardList className="h-4.5 w-4.5" />
            </div>
            <div>
              <DialogTitle>Nueva Indicación de Cuidado</DialogTitle>
              <DialogDescription>
                Agregue una nueva indicación médica o plan de enfermería para el paciente.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form id="careplan-form" onSubmit={handleSubmit(onFormSubmit)} className="my-3 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase">Tipo de Cuidado *</label>
              <select
                {...register("tipo")}
                className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-2.5 text-xs outline-none focus:border-primary"
              >
                {TIPOS_CUIDADO.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.tipo && <p className="text-[9px] text-destructive">{errors.tipo.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase">Frecuencia *</label>
              <select
                {...register("frecuencia")}
                className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-2.5 text-xs outline-none focus:border-primary"
              >
                {FRECUENCIAS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              {errors.frecuencia && <p className="text-[9px] text-destructive">{errors.frecuencia.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-muted-foreground uppercase">Instrucción / Descripción *</label>
            <textarea
              {...register("descripcion")}
              rows={3}
              placeholder="Ej: Controlar temperatura horaria por curva febril. Mantener vía permeable..."
              className="w-full rounded-lg border border-border bg-secondary/40 p-2.5 text-xs outline-none resize-none focus:border-primary"
            />
            {errors.descripcion && <p className="text-[9px] text-destructive">{errors.descripcion.message}</p>}
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
            form="careplan-form"
            disabled={isPending}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" />Guardando...</>
            ) : (
              "Guardar Indicación"
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default CareplanDialog;
