"use client";

import * as React from "react";
import { User } from "@/stores/authStore";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User as UserIcon, Shield, Settings, AlertCircle, Search, Pencil } from "lucide-react";

interface UserTableProps {
  users: User[];
  onToggleStatus: (userId: number) => Promise<void>;
  onConfigurePermissions: (user: User) => void;
  onEditUser?: (user: User) => void;
}

export function UserTable({ users, onToggleStatus, onConfigurePermissions, onEditUser }: UserTableProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredUsers = React.useMemo(() => {
    if (!searchTerm.trim()) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(term) ||
        (u.username || "").toLowerCase().includes(term) ||
        (u.email || "").toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative flex max-w-sm items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar personal por nombre o correo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-9 rounded-lg border border-border bg-card pl-10 pr-4 text-xs font-semibold text-foreground outline-none focus:border-primary transition-all placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Roster Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profesional</TableHead>
              <TableHead>Usuario de Acceso</TableHead>
              <TableHead>Rol Asignado</TableHead>
              <TableHead>Permisos</TableHead>
              <TableHead className="text-right">Acciones Administrativas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Ningún profesional registrado en el sistema.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                // Simulamos estado activo, en fallback de backend
                const isWorking = true;

                return (
                  <TableRow key={user.id}>
                    {/* Celda Profesional */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {(() => {
                          const displayName = user.name || user.username || "Personal Clínico";
                          const displayEmail = user.email || "sin_correo@hospital.com";
                          return (
                            <>
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary font-bold text-xs">
                                {displayName.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-foreground leading-snug">
                                  {displayName}
                                </span>
                                <span className="text-[9px] text-muted-foreground font-semibold">
                                  {displayEmail}
                                </span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </TableCell>

                    {/* Celda de Acceso */}
                    <TableCell className="font-mono text-xs font-semibold text-foreground">
                      {user.username}
                    </TableCell>

                    {/* Celda de Rol */}
                    <TableCell>
                      <Badge variant="violet">
                        {user.role?.name || "Clínico"}
                      </Badge>
                    </TableCell>

                    {/* Celda Permisos Override Status */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-medium text-[10px] text-muted-foreground">
                        <Shield className="h-3.5 w-3.5 text-primary" />
                        <span>
                          {user.permissions && user.permissions.length > 0 
                            ? `${user.permissions.length} Overrides` 
                            : "Estándar de Rol"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Celda Acciones */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEditUser?.(user)}
                          className="flex h-7 px-2 items-center justify-center gap-1 rounded-md border border-border bg-background hover:bg-secondary text-foreground text-[10px] font-bold transition-all cursor-pointer"
                        >
                          <Pencil className="h-3 w-3 text-primary" />
                          Editar
                        </button>
                        <button
                          onClick={() => onConfigurePermissions(user)}
                          className="flex h-7 px-2 items-center justify-center gap-1 rounded-md border border-border bg-background hover:bg-secondary text-foreground text-[10px] font-bold transition-all cursor-pointer"
                        >
                          <Settings className="h-3 w-3" />
                          Permisos
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
export default UserTable;
