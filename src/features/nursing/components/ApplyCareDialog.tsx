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
import { type Cuidado } from "@/services/nursingService";
import { ClipboardCheck, Loader2 } from "lucide-react";

interface ApplyCareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cuidado: Cuidado | null;
  onSubmit: (observaciones: string) => Promise<void>;
  isPending?: boolean;
}

export function ApplyCareDialog({
  open,
  onOpenChange,
  cuidado,
  onSubmit,
  isPending,
}: ApplyCareDialogProps) {
  const [observaciones, setObservaciones] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setObservaciones("");
    }
  }, [open]);

  if (!cuidado) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(observaciones);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidthClass="max-w-md" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div className="text-left">
              <DialogTitle>Registrar Aplicación de Cuidado</DialogTitle>
              <DialogDescription>
                Registre la realización y el estado del cuidado indicado.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="my-3 space-y-3">
          <div className="rounded-lg bg-secondary/30 p-3 border border-border/50 space-y-1">
            <span className="text-[9px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">
              {cuidado.tipo || "Indicación de Enfermería"} — {cuidado.frecuencia || "Según indicación"}
            </span>
            <p className="text-xs font-semibold text-foreground">
              {cuidado.descripcion}
            </p>
          </div>

          <form id="apply-care-form" onSubmit={handleSubmit} className="space-y-1.5">
            <label className="text-[9px] font-bold text-muted-foreground uppercase">
              Observaciones / Novedades (Opcional)
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              placeholder="Ej: Suministrado sin novedades. Tolerancia adecuada..."
              className="w-full rounded-lg border border-border bg-secondary/40 p-2.5 text-xs outline-none resize-none focus:border-primary placeholder:text-muted-foreground/55"
            />
          </form>
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
            type="submit"
            form="apply-care-form"
            disabled={isPending}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 px-4 text-xs font-bold text-white shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Registrando...
              </>
            ) : (
              "Confirmar Realizado"
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ApplyCareDialog;
