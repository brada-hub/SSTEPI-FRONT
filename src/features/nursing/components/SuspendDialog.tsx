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
import { AlertTriangle } from "lucide-react";

interface SuspendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onConfirm: (motivo: string) => Promise<void>;
  isPending?: boolean;
}

const schema = z.object({
  motivo: z
    .string()
    .min(10, "Debe ingresar al menos 10 caracteres explicando el motivo."),
});

type FormValues = z.infer<typeof schema>;

export function SuspendDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isPending,
}: SuspendDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { motivo: "" },
  });

  React.useEffect(() => {
    if (open) reset({ motivo: "" });
  }, [open, reset]);

  const onSubmit = async (values: FormValues) => {
    await onConfirm(values.motivo);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidthClass="max-w-sm" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="my-2 space-y-3"
          id="suspend-form"
        >
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">
              Motivo de suspensión
            </label>
            <textarea
              {...register("motivo")}
              rows={3}
              placeholder="Ej: Paciente presentó reacción adversa al medicamento..."
              className="w-full rounded-lg border border-border bg-secondary/40 p-2.5 text-xs outline-none resize-none focus:border-primary"
            />
            {errors.motivo && (
              <p className="text-[9px] text-destructive font-semibold">
                {errors.motivo.message}
              </p>
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
            form="suspend-form"
            disabled={isSubmitting || isPending}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-destructive px-4 text-xs font-bold text-white shadow-sm hover:bg-destructive/90 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting || isPending ? "Suspendiendo..." : "Confirmar Suspensión"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
