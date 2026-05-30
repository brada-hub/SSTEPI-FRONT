"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { type Especialidad } from "@/features/hospital/services/hospitalInfrastructureService";
import {
  useCreateEspecialidadMutation,
  useUpdateEspecialidadMutation,
  useDeleteEspecialidadMutation,
} from "@/features/hospital/hooks/useHospitalInfrastructure";
import { useAuthStore } from "@/stores/authStore";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Plus, Pencil, Trash2, Loader2, Search, X } from "lucide-react";

const schema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(100),
  descripcion: z.string().max(255).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface EspecialidadesTabProps {
  especialidades: Especialidad[];
  isLoading: boolean;
}

export function EspecialidadesTab({ especialidades, isLoading }: EspecialidadesTabProps) {
  const [search, setSearch] = React.useState("");
  const [editing, setEditing] = React.useState<Especialidad | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const hospital = useAuthStore((s) => s.hospital);
  const hospitalId = hospital?.id ?? 0;

  const createMut = useCreateEspecialidadMutation();
  const updateMut = useUpdateEspecialidadMutation();
  const deleteMut = useDeleteEspecialidadMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", descripcion: "" },
  });

  const openCreate = () => {
    setEditing(null);
    reset({ nombre: "", descripcion: "" });
    setDialogOpen(true);
  };

  const openEdit = (esp: Especialidad) => {
    setEditing(esp);
    reset({ nombre: esp.nombre, descripcion: esp.descripcion ?? "" });
    setDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    const payload = {
      nombre: values.nombre,
      descripcion: values.descripcion || undefined,
      estado: true,
      hospital_id: hospitalId,
    };
    if (editing) {
      await updateMut.mutateAsync({
        id: editing.id,
        payload: { ...payload, estado: editing.estado },
      });
    } else {
      await createMut.mutateAsync(payload);
    }
    setDialogOpen(false);
  };

  const handleToggle = async (esp: Especialidad) => {
    if (esp.estado) {
      await deleteMut.mutateAsync(esp.id);
    } else {
      await updateMut.mutateAsync({
        id: esp.id,
        payload: {
          nombre: esp.nombre,
          descripcion: esp.descripcion,
          estado: true,
          hospital_id: hospitalId,
        },
      });
    }
  };

  const filtered = especialidades.filter((e) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return e.nombre.toLowerCase().includes(term) || (e.descripcion ?? "").toLowerCase().includes(term);
  });

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center text-xs text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        Cargando especialidades...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex max-w-xs items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar especialidad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-lg border border-border bg-card pl-10 pr-4 text-xs font-semibold outline-none focus:border-primary"
          />
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-white shadow-sm hover:bg-primary/90 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Nueva Especialidad
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold text-muted-foreground uppercase">
              <th className="p-3 pl-4">Nombre</th>
              <th className="p-3">Descripción</th>
              <th className="p-3">Estado</th>
              <th className="p-3 text-right pr-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground text-xs">
                  No se encontraron especialidades.
                </td>
              </tr>
            ) : (
              filtered.map((esp) => (
                <tr key={esp.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                  <td className="p-3 pl-4">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-bold text-foreground">{esp.nombre}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground max-w-[200px] truncate">{esp.descripcion || "—"}</td>
                  <td className="p-3">
                    <Badge variant={esp.estado ? "teal" : "secondary"} className="text-[9px]">
                      {esp.estado ? "Activa" : "Inactiva"}
                    </Badge>
                  </td>
                  <td className="p-3 text-right pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(esp)}
                        className="h-7 w-7 rounded-md border border-border bg-background hover:bg-secondary flex items-center justify-center text-foreground cursor-pointer"
                        title="Editar"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggle(esp)}
                        disabled={deleteMut.isPending || updateMut.isPending}
                        className={`h-7 w-7 rounded-md border flex items-center justify-center cursor-pointer disabled:opacity-50 ${
                          esp.estado
                            ? "border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10"
                            : "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10"
                        }`}
                        title={esp.estado ? "Desactivar" : "Activar"}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-foreground">
                {editing ? "Editar Especialidad" : "Nueva Especialidad"}
              </h3>
              <button type="button" onClick={() => setDialogOpen(false)} className="h-7 w-7 rounded-md hover:bg-secondary flex items-center justify-center cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase">Nombre *</label>
                <input {...register("nombre")} placeholder="Ej: Medicina Interna" className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary" />
                {errors.nombre && <p className="text-[9px] text-destructive">{errors.nombre.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase">Descripción</label>
                <textarea {...register("descripcion")} rows={2} placeholder="Descripción opcional..." className="w-full rounded-lg border border-border bg-secondary/50 p-2.5 text-xs outline-none resize-none focus:border-primary" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border/20">
                <button type="button" onClick={() => setDialogOpen(false)} className="h-9 px-4 rounded-lg border border-border bg-background text-xs font-bold text-foreground hover:bg-secondary cursor-pointer">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMut.isPending || updateMut.isPending}
                  className="h-9 px-4 rounded-lg bg-primary text-xs font-bold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                >
                  {createMut.isPending || updateMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1" /> : null}
                  {editing ? "Guardar Cambios" : "Crear Especialidad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
