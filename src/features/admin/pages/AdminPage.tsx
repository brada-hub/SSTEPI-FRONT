"use client";

import * as React from "react";
import { useAdminUsers, useAdminMutations } from "../hooks/useAdminQuery";
import { UserTable } from "../components/UserTable";
import { PermissionsGrid } from "../components/PermissionsGrid";
import { UserCreateDialog } from "../components/UserCreateDialog";
import { RolesTab } from "../components/RolesTab";
import { User } from "@/stores/authStore";
import { 
  LoadingState, 
  ErrorState, 
  EmptyState 
} from "@/components/ui/clinical-feedback";
import { Users, Plus, RefreshCw, Award } from "lucide-react";
import { toast } from "sonner";

export function AdminPage() {
  // Pestaña Activa
  const [activeTab, setActiveTab] = React.useState<"users" | "roles">("users");

  // Modales State
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = React.useState(false);
  
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [userToEdit, setUserToEdit] = React.useState<User | null>(null);

  // TanStack Queries & Mutations
  const { 
    users, 
    roles, 
    permissions, 
    isLoadingUsers, 
    isError, 
    refetchUsers 
  } = useAdminUsers();

  const { 
    createUser, 
    updateUser,
    updatePermissions, 
    toggleStatus,
    updateRolePermissions,
    isUpdatingRolePermissions,
    createRole,
    isCreatingRole
  } = useAdminMutations();

  const handleOpenPermissions = (user: User) => {
    setSelectedUser(user);
    setIsPermissionsOpen(true);
  };

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setIsCreateOpen(true);
  };

  const handleNewUserClick = () => {
    setUserToEdit(null);
    setIsCreateOpen(true);
  };

  const handleToggleStatus = async (userId: number) => {
    try {
      await toggleStatus(userId);
    } catch (error) {
      toast.error("Fallo al suspender/activar profesional.");
    }
  };

  const handleCreateSubmit = async (values: any) => {
    if (userToEdit) {
      // Modo edición
      return await updateUser({ userId: userToEdit.id, payload: values });
    } else {
      // Modo creación estándar
      return await createUser(values);
    }
  };

  const handlePermissionsSubmit = async (userId: number, directPermissions: any[]) => {
    try {
      await updatePermissions({ userId, permissions: directPermissions });
    } catch (error) {
      toast.error("Fallo al actualizar las claves de seguridad.");
    }
  };

  const handleSaveRolePermissions = async (roleId: number, permissionIds: number[]) => {
    try {
      await updateRolePermissions({ roleId, permissions: permissionIds });
    } catch (error) {
      // El error ya se gestiona mediante toast en la mutación
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cabecera del Módulo */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-unitepc-sso text-white shadow-md">
            <Users className="h-5.5 w-5.5" />
          </div>
          <div className="flex flex-col text-left">
            <h2 className="text-lg font-bold text-foreground">
              Portal Administrativo & Personal del Hospital
            </h2>
            <p className="text-xs text-muted-foreground">
              Registra profesionales de guardia, configura roles, y asigne claves de seguridad u overrides granulares.
            </p>
          </div>
        </div>

        <div className="flex gap-2 self-start sm:self-auto">
          <button
            onClick={() => refetchUsers()}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3.5 text-xs font-bold text-foreground hover:bg-secondary transition-all cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          
          {activeTab === "users" && (
            <button
              onClick={handleNewUserClick}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-white shadow-md hover:bg-primary/95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Nuevo Profesional
            </button>
          )}
        </div>
      </div>

      {/* Sistema de Pestañas Premium */}
      <div className="flex border-b border-border/40 gap-6 text-left">
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer flex items-center gap-1.5 ${
            activeTab === "users"
              ? "text-primary font-extrabold"
              : "text-muted-foreground hover:text-foreground font-semibold"
          }`}
        >
          <Users className="h-4 w-4" />
          Personal Clínico
          {activeTab === "users" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full animate-in fade-in slide-in-from-bottom-1 duration-200" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("roles")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer flex items-center gap-1.5 ${
            activeTab === "roles"
              ? "text-primary font-extrabold"
              : "text-muted-foreground hover:text-foreground font-semibold"
          }`}
        >
          <Award className="h-4 w-4" />
          Configuración de Roles
          {activeTab === "roles" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full animate-in fade-in slide-in-from-bottom-1 duration-200" />
          )}
        </button>
      </div>

      {/* Contenido Condicional por Pestaña */}
      {activeTab === "users" ? (
        <>
          {/* Renders Condicionales de Carga para Personal */}
          {isLoadingUsers ? (
            <LoadingState message="Buscando personal y roles hospitalarios..." />
          ) : isError ? (
            <ErrorState onRetry={() => refetchUsers()} />
          ) : !users || users.length === 0 ? (
            <EmptyState
              title="Sin Personal Registrado"
              description="Aún no se modela el personal del hospital en este centro clínico."
              icon={Users}
              actionLabel="Registrar Primer Profesional"
              onAction={handleNewUserClick}
            />
          ) : (
            <UserTable
              users={users}
              onToggleStatus={handleToggleStatus}
              onConfigurePermissions={handleOpenPermissions}
              onEditUser={handleEditUser}
            />
          )}
        </>
      ) : (
        <RolesTab
          roles={roles}
          permissions={permissions}
          onSaveRolePermissions={handleSaveRolePermissions}
          isSaving={isUpdatingRolePermissions}
          onCreateRole={createRole}
          isCreatingRole={isCreatingRole}
        />
      )}

      {/* Modales de Control */}
      <UserCreateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        roles={roles}
        onSubmitSuccess={handleCreateSubmit}
        userToEdit={userToEdit}
      />

      <PermissionsGrid
        open={isPermissionsOpen}
        onOpenChange={setIsPermissionsOpen}
        user={selectedUser}
        globalPermissions={permissions}
        onSubmitSuccess={handlePermissionsSubmit}
      />

    </div>
  );
}

export default AdminPage;
