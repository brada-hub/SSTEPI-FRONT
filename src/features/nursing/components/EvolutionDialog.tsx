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
import { Inpatient } from "@/services/nursingService";
import { FileText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface EvolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inpatient: Inpatient | null;
  onSubmitSuccess: (data: { internacion_id: number; nota: string }) => Promise<void>;
}

export function EvolutionDialog({
  open,
  onOpenChange,
  inpatient,
  onSubmitSuccess,
}: EvolutionDialogProps) {
  const [note, setNote] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) setNote("");
  }, [open]);

  if (!inpatient) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      toast.error("La nota de evolución no puede estar vacía.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitSuccess({
        internacion_id: inpatient.id,
        nota: note,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error("Fallo al grabar la nota de evolución.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidthClass="max-w-md" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col text-left">
              <DialogTitle>Registrar Nota de Evolución</DialogTitle>
              <DialogDescription>
                Paciente: {inpatient.paciente.nombre} {inpatient.paciente.apellidos}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="my-4 space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Evolución Clínica / Bitácora</label>
            <textarea
              rows={4}
              placeholder="Escriba los acontecimientos clínicos notables del turno..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
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
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-white shadow-sm hover:bg-primary/95 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Registrando..." : <><ShieldCheck className="h-4 w-4" /> Registrar Nota</>}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default EvolutionDialog;
