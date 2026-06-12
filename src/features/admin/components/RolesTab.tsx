"use client";

import * as React from "react";
import { Role, Permission } from "@/stores/authStore";
import { 
  Shield, 
  ShieldCheck, 
  Search, 
  Lock, 
  Unlock, 
  Save, 
  Award, 
  Info,
  Check,
  CheckSquare,
  MinusSquare,
  AlertCircle,
  Plus,
  Loader2,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

interface RolesTabProps {
  roles: Role[];
  permissions: Permission[];
  onSaveRolePermissions: (roleId: number, permissionIds: number[]) => Promise<void>;
  isSaving: boolean;
  onCreateRole: (payload: { nombre: string; descripcion?: string }) => Promise<any>;
  isCreatingRole: boolean;
}

export function RolesTab({
  roles,
  permissions,
  onSaveRolePermissions,
  isSaving,
  onCreateRole,
  isCreatingRole,
}: RolesTabProps) {
  const [selectedRoleId, setSelectedRoleId] = React.useState<number | null>(null);
  const [checkedPermissionIds, setCheckedPermissionIds] = React.useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = React.useState("");
  
  // Estados para creación de nuevo rol
  const [roleDialogOpen, setRoleDialogOpen] = React.useState(false);
  const [newRoleName, setNewRoleName] = React.useState("");
  const [newRoleDesc, setNewRoleDesc] = React.useState("");

  // Inicializar el primer rol seleccionado por defecto
  React.useEffect(() => {
    if (roles.length > 0 && selectedRoleId === null) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  // Obtener el rol actualmente seleccionado
  const selectedRole = React.useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || null;
  }, [roles, selectedRoleId]);

  // Sincronizar el conjunto de permisos activados cuando cambia el rol seleccionado
  React.useEffect(() => {
    if (selectedRole) {
      const activeIds = new Set<number>();
      permissions.forEach((p) => {
        if (selectedRole.permissions.includes(p.name)) {
          activeIds.add(p.id);
        }
      });
      setCheckedPermissionIds(activeIds);
    } else {
      setCheckedPermissionIds(new Set());
    }
  }, [selectedRole, permissions]);

  // Filtrar permisos globales basados en el término de búsqueda
  const filteredPermissions = React.useMemo(() => {
    if (!searchTerm.trim()) return permissions;
    const term = searchTerm.toLowerCase();
    return permissions.filter((p) => p.name.toLowerCase().includes(term));
  }, [permissions, searchTerm]);

  const handleTogglePermission = (permissionId: number) => {
    setCheckedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setCheckedPermissionIds((prev) => {
      const next = new Set(prev);
      filteredPermissions.forEach((p) => next.add(p.id));
      return next;
    });
  };

  const handleDeselectAll = () => {
    setCheckedPermissionIds((prev) => {
      const next = new Set(prev);
      filteredPermissions.forEach((p) => next.delete(p.id));
      return next;
    });
  };

  const handleSave = async () => {
    if (selectedRoleId === null) return;
    await onSaveRolePermissions(selectedRoleId, Array.from(checkedPermissionIds));
  };

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-12 text-left">
      {/* Panel Izquierdo: Lista de Roles */}
      <div className="md:col-span-4 space-y-4">
        <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-primary" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Roles del Hospital
              </h3>
            </div>
            <button
              onClick={() => {
                setNewRoleName("");
                setNewRoleDesc("");
                setRoleDialogOpen(true);
              }}
              className="inline-flex h-6 items-center gap-1 rounded bg-primary px-2 text-[10px] font-bold text-white shadow hover:bg-primary/90 cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              Nuevo
            </button>
          </div>
          
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Selecciona un rol clínico para auditar y configurar sus accesos e inhabilidades del sistema.
          </p>

          <div className="space-y-1.5 pt-1">
            {roles.map((role) => {
              const isActive = role.id === selectedRoleId;
              const permCount = role.permissions.length;

              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-primary/5 border-primary/45 shadow-sm text-foreground"
                      : "bg-background/45 border-border hover:bg-secondary/45 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                      isActive ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                    }`}>
                      <Shield className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-bold truncate">
                      {role.name}
                    </span>
                  </div>
                  <Badge variant={isActive ? "violet" : "secondary"} className="text-[9px] font-bold py-0 px-2">
                    {permCount} Permisos
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Panel Derecho: Configuración de Permisos */}
      <div className="md:col-span-8 space-y-4">
        {selectedRole ? (
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm relative overflow-hidden">
            {/* Header del panel derecho */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4 gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col text-left">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Configuración de Rol: {selectedRole.name}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Define qué accesos del sistema heredan automáticamente los usuarios con este rol.
                  </p>
                </div>
              </div>

              {/* Botón Guardar superior */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[11px] font-bold text-white shadow-sm hover:bg-primary/95 disabled:opacity-50 transition-all cursor-pointer self-start sm:self-auto"
              >
                <Save className="h-3.5 w-3.5" />
                {isSaving ? "Guardando..." : "Guardar Permisos"}
              </button>
            </div>

            {/* Aviso Informativo */}
            <div className="flex items-start gap-2.5 rounded-lg bg-primary/5 border border-primary/15 p-3 text-[10px] text-muted-foreground leading-normal">
              <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-foreground block">
                  Sincronización Inherente de Seguridad
                </span>
                <p>
                  Las modificaciones en los permisos heredados del rol entrarán en vigor de forma inmediata para todos los profesionales de guardia que ostenten el rol de <strong>{selectedRole.name}</strong>, a menos que tengan una anulación (override) manual específica asignada en su perfil.
                </p>
              </div>
            </div>

            {/* Buscador y Controles Rápidos */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between bg-secondary/35 p-3 rounded-lg border border-border/45">
              <div className="relative flex-1 max-w-xs flex items-center">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground/80" />
                <input
                  type="text"
                  placeholder="Filtrar permisos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-7 rounded-md border border-border bg-background pl-8 pr-3 text-[11px] font-semibold text-foreground outline-none focus:border-primary transition-all placeholder:text-muted-foreground/60"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="inline-flex h-7 items-center justify-center gap-1 rounded-md border border-border bg-background px-2.5 text-[10px] font-bold text-foreground hover:bg-secondary transition-all cursor-pointer"
                >
                  <CheckSquare className="h-3 w-3" />
                  Marcar Todos
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="inline-flex h-7 items-center justify-center gap-1 rounded-md border border-border bg-background px-2.5 text-[10px] font-bold text-foreground hover:bg-secondary transition-all cursor-pointer"
                >
                  <MinusSquare className="h-3 w-3" />
                  Desmarcar Todos
                </button>
              </div>
            </div>

            {/* Lista cuadriculada de permisos */}
            <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 max-h-[350px] overflow-y-auto pr-1 py-1">
              {filteredPermissions.length === 0 ? (
                <div className="col-span-full py-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-xl">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[11px] font-bold">No se encontraron permisos coincidentes</span>
                </div>
              ) : (
                filteredPermissions.map((permission) => {
                  const isChecked = checkedPermissionIds.has(permission.id);

                  return (
                    <button
                      key={permission.id}
                      type="button"
                      onClick={() => handleTogglePermission(permission.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all duration-200 cursor-pointer ${
                        isChecked
                          ? "bg-card border-accent-teal/35 shadow-sm text-foreground"
                          : "bg-background/25 border-border hover:bg-secondary/45 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="flex flex-col text-left pr-2">
                        <span className="font-bold text-[10px] uppercase tracking-wide truncate max-w-[180px]">
                          {permission.name}
                        </span>
                        <span className="text-[8px] text-muted-foreground font-semibold mt-0.5">
                          {isChecked ? "Con acceso activo" : "Acceso inactivo"}
                        </span>
                      </div>
                      
                      <div className={`flex h-5.5 w-5.5 items-center justify-center rounded-md border transition-all ${
                        isChecked 
                          ? "bg-accent-teal border-accent-teal text-white shadow-sm shadow-accent-teal/20" 
                          : "border-border text-transparent"
                      }`}>
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer con guardar secundario */}
            <div className="flex justify-end pt-3 border-t border-border/40">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-white shadow-sm hover:bg-primary/95 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Guardando Cambios..." : "Guardar Permisos"}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
            <Shield className="h-8 w-8 text-muted-foreground/60 animate-pulse" />
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-foreground block">
                Cargando Configuración de Roles
              </span>
              <span className="text-[10px] text-muted-foreground block">
                Obteniendo información del servidor Laravel de forma segura.
              </span>
            </div>
          </div>
        )}
      </div>
      
      {roleDialogOpen && (
        <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
          <DialogContent maxWidthClass="max-w-sm" onClose={() => setRoleDialogOpen(false)}>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Shield className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col text-left">
                  <DialogTitle>Registrar Nuevo Rol</DialogTitle>
                  <DialogDescription>
                    Crea un nuevo rol clínico para configurar sus accesos en el sistema.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const trimmedName = newRoleName.trim();
                if (!trimmedName) return;
                try {
                  await onCreateRole({ nombre: trimmedName, descripcion: newRoleDesc.trim() || undefined });
                  setRoleDialogOpen(false);
                } catch {
                  // El error ya lo gestiona la mutación
                }
              }}
              className="my-4 space-y-3.5 text-left"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Nombre del Rol *</label>
                <input
                  type="text"
                  required
                  placeholder="ej: RADIÓLOGO"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary font-semibold uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Descripción</label>
                <textarea
                  rows={2}
                  placeholder="ej: Personal encargado de estudios de imagenología..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full rounded-lg border border-border bg-secondary/50 p-2.5 text-xs outline-none resize-none focus:border-primary font-medium"
                />
              </div>

              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setRoleDialogOpen(false)}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-xs font-bold text-foreground hover:bg-secondary cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingRole || !newRoleName.trim()}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-white shadow-sm hover:bg-primary/95 disabled:opacity-50 cursor-pointer"
                >
                  {isCreatingRole ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Crear Rol
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default RolesTab;
