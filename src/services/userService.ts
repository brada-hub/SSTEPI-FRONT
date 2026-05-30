import api from "./api";
import { User, Role, Permission } from "@/stores/authStore";

export interface UserPayload {
  name: string;
  username: string;
  email: string;
  password?: string;
  role_id: number;
  telefono?: string;
}

export const userService = {
  /**
   * Obtiene la lista completa de personal y usuarios del hospital (normalizada)
   */
  async getUsers(): Promise<User[]> {
    const response = await api.get<any>("/users");
    // ✅ Normalizar paginados de Laravel (soporta arrays directos y objetos paginados con .data)
    const rawUsers = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.data)
      ? response.data.data
      : [];

    return rawUsers.map((rawUser: any) => {
      // Normalizar permisos del usuario
      const mappedPermissions = Array.isArray(rawUser.permissions)
        ? rawUser.permissions.map((p: any) => ({
            id: p.id,
            name: p.nombre || p.name || "",
            pivot: p.pivot ? {
              permitido: p.pivot.estado === "permitido" || p.pivot.permitido === true
            } : undefined
          }))
        : [];

      return {
        id: rawUser.id,
        name: rawUser.nombre && rawUser.apellidos 
          ? `${rawUser.nombre} ${rawUser.apellidos}` 
          : (rawUser.name || "Personal Clínico"),
        username: rawUser.email ? rawUser.email.split("@")[0] : `usuario_${rawUser.id}`,
        email: rawUser.email || "",
        telefono: rawUser.telefono || "",
        role: rawUser.rol ? {
          id: rawUser.rol.id,
          name: rawUser.rol.nombre || rawUser.rol.name || "Personal Clínico",
          permissions: Array.isArray(rawUser.rol.permissions)
            ? rawUser.rol.permissions.map((p: any) => p.nombre || p.name || "")
            : [],
        } : undefined,
        permissions: mappedPermissions,
      };
    });
  },

  async createUser(payload: UserPayload): Promise<User> {
    const response = await api.post<User>("/users", payload);
    return response.data;
  },

  /**
   * Modifica un profesional existente del hospital
   */
  async updateUser(userId: number, payload: Partial<UserPayload>): Promise<User> {
    const response = await api.put<User>(`/users/${userId}`, payload);
    return response.data;
  },

  /**
   * Modifica los permisos directos y específicos de un usuario (Overrides)
   */
  async updateUserPermissions(
    userId: number,
    payload: { permissions: { id: number; permitido: boolean }[] }
  ): Promise<any> {
    const response = await api.put(`/users/${userId}/permissions`, payload);
    return response.data;
  },

  /**
   * Modifica el estado de disponibilidad laboral de un usuario
   */
  async toggleUserStatus(userId: number): Promise<any> {
    const response = await api.patch(`/users/${userId}/estado`);
    return response.data;
  },

  /**
   * Obtiene todos los roles disponibles en el hospital (normalizados)
   */
  async getRoles(): Promise<Role[]> {
    const response = await api.get<any[]>("/rols");
    const rawRoles = Array.isArray(response.data) ? response.data : [];
    return rawRoles.map((r: any) => ({
      id: r.id,
      name: r.nombre || r.name || "",
      permissions: Array.isArray(r.permissions)
        ? r.permissions.map((p: any) => p.nombre || p.name || "")
        : [],
    }));
  },

  /**
   * Modifica los permisos asignados a un rol específico (sincronización masiva de permisos de un rol)
   */
  async updateRolePermissions(
    roleId: number,
    permissions: number[]
  ): Promise<any> {
    const response = await api.put(`/rols/${roleId}/permissions`, { permissions });
    return response.data;
  },

  /**
   * Obtiene la lista global de permisos catalogados en el sistema (normalizados)
   */
  async getPermissions(): Promise<Permission[]> {
    const response = await api.get<any[]>("/permissions");
    const rawPermissions = Array.isArray(response.data) ? response.data : [];
    return rawPermissions.map((p: any) => ({
      id: p.id,
      name: p.nombre || p.name || "",
    }));
  },
};

export default userService;
