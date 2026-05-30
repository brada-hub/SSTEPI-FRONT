"use client";

import * as React from "react";
import { User, Permission } from "@/stores/authStore";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface PermissionsGridProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  globalPermissions: Permission[];
  onSubmitSuccess: (userId: number, permissions: { id: number; permitido: boolean }[]) => Promise<void>;
}

export function PermissionsGrid({
  open,
  onOpenChange,
  user,
  globalPermissions,
  onSubmitSuccess,
}: PermissionsGridProps) {
  // Mapa de anulaciones directas de permisos
  const [overrides, setOverrides] = React.useState<Record<number, "permitido" | "denegado" | "heredado">>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Inicializar mapa de anulaciones al abrir
  React.useEffect(() => {
    if (open && user) {
      const initialMap: Record<number, "permitido" | "denegado" | "heredado"> = {};
      
      // Inicializar todo como heredado por defecto
      globalPermissions.forEach((p) => {
        initialMap[p.id] = "heredado";
      });

      // Rellenar las anulaciones directas del usuario
      if (user.permissions) {
        user.permissions.forEach((up) => {
          if (up.pivot) {
            initialMap[up.id] = up.pivot.permitido ? "permitido" : "denegado";
          }
        });
      }

      setOverrides(initialMap);
    }
  }, [open, user, globalPermissions]);

  if (!user) return null;

  const handleToggle = (permissionId: number, state: "permitido" | "denegado" | "heredado") => {
    setOverrides((prev) => ({
      ...prev,
      [permissionId]: state,
    }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // Filtrar anulaciones que no sean "heredado"
      const payload = Object.entries(overrides)
        .filter(([_, value]) => value !== "heredado")
        .map(([id, value]) => ({
          id: parseInt(id),
          permitido: value === "permitido",
        }));

      await onSubmitSuccess(user.id, payload);
      onOpenChange(false);
    } catch (error) {
      toast.error("Fallo al actualizar las anulaciones de seguridad.");
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
              <Shield className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col text-left">
              <DialogTitle>Anulaciones de Permisos</DialogTitle>
              <DialogDescription>
                Profesional: {user.name} • Rol: {user.role?.name || "Clínico"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Grid de Permisos */}
        <div className="my-4 space-y-4 max-h-[350px] overflow-y-auto px-1 py-1 text-xs">
          
          <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 p-2.5 text-[10px] text-muted-foreground leading-snug">
            <ShieldAlert className="h-4 w-4 shrink-0 text-primary" />
            <span>Configura anulaciones específicas de seguridad para el profesional. Sobrescriben el comportamiento de su rol heredado.</span>
          </div>

          <div className="space-y-2.5">
            {globalPermissions.map((permission) => {
              const currentOverride = overrides[permission.id] || "heredado";
              // Determina si el rol de usuario ya posee este permiso de manera heredada
              const isHeredadoPermitido = user.role?.permissions.includes(permission.name) || false;

              return (
                <div key={permission.id} className="rounded-xl border border-border bg-card p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-col text-left max-w-xs">
                    <span className="font-bold text-foreground truncate uppercase tracking-wide text-[10px]">
                      {permission.name}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-semibold mt-0.5">
                      Estado Rol: {isHeredadoPermitido ? "Habilitado de Rol" : "Bloqueado de Rol"}
                    </span>
                  </div>

                  {/* Toggles de Anulación */}
                  <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5 border border-border/20 self-start sm:self-auto font-bold text-[9px]">
                    {[
                      { state: "heredado" as const, label: "Heredado" },
                      { state: "permitido" as const, label: "Permitido" },
                      { state: "denegado" as const, label: "Denegado" },
                    ].map((opt) => (
                      <button
                        key={opt.state}
                        type="button"
                        onClick={() => handleToggle(permission.id, opt.state)}
                        className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                          currentOverride === opt.state
                            ? "bg-card text-foreground border border-border shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer */}
        <DialogFooter>
          <button type="button" onClick={() => onOpenChange(false)} className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-xs font-bold text-foreground hover:bg-secondary cursor-pointer">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-white shadow-sm hover:bg-primary/95 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Sincronizando..." : <><ShieldCheck className="h-4 w-4" /> Sincronizar Permisos</>}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default PermissionsGrid;
