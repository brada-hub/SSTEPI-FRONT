"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService, UserPayload } from "@/services/userService";
import { getFirstValidationError } from "@/lib/errors";
import { toast } from "sonner";

export function useAdminUsers() {
  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => userService.getUsers(),
    staleTime: 2 * 60 * 1000,
  });

  const rolesQuery = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => userService.getRoles(),
    staleTime: 10 * 60 * 1000,
  });

  const permissionsQuery = useQuery({
    queryKey: ["admin-permissions"],
    queryFn: () => userService.getPermissions(),
    staleTime: 10 * 60 * 1000,
  });

  return {
    users: usersQuery.data || [],
    isLoadingUsers: usersQuery.isLoading,
    roles: rolesQuery.data || [],
    permissions: permissionsQuery.data || [],
    isError: usersQuery.isError || rolesQuery.isError || permissionsQuery.isError,
    refetchUsers: usersQuery.refetch,
  };
}

export function useAdminMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: UserPayload) => userService.createUser(payload),
    onSuccess: () => {
      toast.success("Profesional registrado correctamente.");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: unknown) => {
      const msg = getFirstValidationError(err);
      toast.error(msg);
    },
  });

  const permissionsMutation = useMutation({
    mutationFn: ({ userId, permissions }: { userId: number; permissions: { id: number; permitido: boolean }[] }) =>
      userService.updateUserPermissions(userId, { permissions }),
    onSuccess: () => {
      toast.success("Permisos sincronizados correctamente.");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: unknown) => {
      const msg = getFirstValidationError(err);
      toast.error(msg);
    },
  });

  const statusMutation = useMutation({
    mutationFn: (userId: number) => userService.toggleUserStatus(userId),
    onSuccess: () => {
      toast.success("Estado laboral modificado con éxito.");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: unknown) => {
      const msg = getFirstValidationError(err);
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: Partial<UserPayload> }) =>
      userService.updateUser(userId, payload),
    onSuccess: () => {
      toast.success("Profesional actualizado correctamente.");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: unknown) => {
      const msg = getFirstValidationError(err);
      toast.error(msg);
    },
  });

  const rolePermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: number; permissions: number[] }) =>
      userService.updateRolePermissions(roleId, permissions),
    onSuccess: () => {
      toast.success("Permisos del rol sincronizados correctamente.");
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: unknown) => {
      const msg = getFirstValidationError(err);
      toast.error(msg);
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: (payload: { nombre: string; descripcion?: string }) => userService.createRole({
      nombre: payload.nombre,
      descripcion: payload.descripcion,
      estado: true
    }),
    onSuccess: () => {
      toast.success("Rol creado correctamente.");
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    },
    onError: (err: unknown) => {
      const msg = getFirstValidationError(err);
      toast.error(msg);
    },
  });

  return {
    createUser: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateUser: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updatePermissions: permissionsMutation.mutateAsync,
    isUpdatingPermissions: permissionsMutation.isPending,
    toggleStatus: statusMutation.mutateAsync,
    isTogglingStatus: statusMutation.isPending,
    updateRolePermissions: rolePermissionsMutation.mutateAsync,
    isUpdatingRolePermissions: rolePermissionsMutation.isPending,
    createRole: createRoleMutation.mutateAsync,
    isCreatingRole: createRoleMutation.isPending,
  };
}
export default useAdminUsers;
