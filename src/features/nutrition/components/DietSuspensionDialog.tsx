"use client";

import * as React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Apple, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface DietSuspensionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diet: any | null;
  onSubmitSuccess: (dietId: number | string, motivo: string) => Promise<void>;
}

export function DietSuspensionDialog({
  open,
  onOpenChange,
  diet,
  onSubmitSuccess,
}: DietSuspensionDialogProps) {
  const [reason, setReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) setReason("");
  }, [open]);

  if (!diet) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Debe especificar el motivo clínico de la suspensión.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitSuccess(diet.id, reason);
      onOpenChange(false);
    } catch (error) {
      toast.error("Fallo al suspender el régimen alimenticio.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidthClass="max-w-md" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              <Apple className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col text-left">
              <DialogTitle>Suspender Dieta Activa</DialogTitle>
              <DialogDescription>
                Régimen: {diet.tipo_dieta}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="my-4 space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Motivo Clínico de Suspensión</label>
            <textarea
              rows={3}
              placeholder="ej: Paciente cursa con vómitos, indicación de ayuno por preparación de cirugía..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary/50 p-3 text-xs outline-none focus:border-primary placeholder:text-muted-foreground/60 resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <DialogFooter>
          <button type="button" onClick={() => onOpenChange(false)} className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-xs font-bold text-foreground hover:bg-secondary cursor-pointer">
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-destructive px-4 text-xs font-bold text-white shadow-sm hover:bg-destructive/95 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Suspendiendo..." : <><ShieldCheck className="h-4 w-4" /> Confirmar Suspensión</>}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default DietSuspensionDialog;
