"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { type Sala, type Especialidad, SALA_TIPOS, type SalaTipo } from "@/features/hospital/services/hospitalInfrastructureService";
import {
  useCreateSalaMutation,
  useUpdateSalaMutation,
  useDeleteSalaMutation,
} from "@/features/hospital/hooks/useHospitalInfrastructure";
import { Badge } from "@/components/ui/badge";
import { DoorOpen, Plus, Pencil, Trash2, Loader2, Search, X } from "lucide-react";

const schema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(100),
  tipo: z.string().min(1, "Seleccione un tipo"),
  especialidad_id: z.number().min(1, "Seleccione una especialidad"),
});

type FormValues = z.infer<typeof schema>;

interface SalasTabProps {
  salas: Sala[];
  especialidades: Especialidad[];
  isLoading: boolean;
}

export function SalasTab({ salas, especialidades, isLoading }: SalasTabProps) {
  const [search, setSearch] = React.useState("");
  const [editing, setEditing] = React.useState<Sala | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const createMut = useCreateSalaMutation();
  const updateMut = useUpdateSalaMutation();
  const deleteMut = useDeleteSalaMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", tipo: "", especialidad_id: 0 },
  });

  const activeEspecialidades = especialidades.filter((e) => e.estado);

  const openCreate = () => {
    setEditing(null);
    reset({ nombre: "", tipo: SALA_TIPOS[0], especialidad_id: activeEspecialidades[0]?.id ?? 0 });
    setDialogOpen(true);
  };

  const openEdit = (sala: Sala) => {
    setEditing(sala);
    reset({ nombre: sala.nombre, tipo: sala.tipo, especialidad_id: sala.especialidad_id });
    setDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    const payload = {
      nombre: values.nombre,
      tipo: values.tipo as SalaTipo,
      especialidad_id: values.especialidad_id,
    };
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, payload });
    } else {
      await createMut.mutateAsync(payload);
    }
    setDialogOpen(false);
  };

  const handleDelete = async (sala: Sala) => {
    await deleteMut.mutateAsync(sala.id);
  };

  const filtered = salas.filter((s) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      s.nombre.toLowerCase().includes(term) ||
      s.tipo.toLowerCase().includes(term) ||
      (s.especialidad?.nombre ?? "").toLowerCase().includes(term)
    );
  });

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center text-xs text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        Cargando salas...
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
            placeholder="Buscar sala..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-lg border border-border bg-card pl-10 pr-4 text-xs font-semibold outline-none focus:border-primary"
          />
        </div>
        <button
          type="button"
          onClick={openCreate}
          disabled={activeEspecialidades.length === 0}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-white shadow-sm hover:bg-primary/90 cursor-pointer disabled:opacity-50"
          title={activeEspecialidades.length === 0 ? "Cree una especialidad primero" : "Nueva Sala"}
        >
          <Plus className="h-4 w-4" />
          Nueva Sala
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold text-muted-foreground uppercase">
              <th className="p-3 pl-4">Nombre</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Especialidad</th>
              <th className="p-3">Estado</th>
              <th className="p-3 text-right pr-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground text-xs">
                  No se encontraron salas.
                </td>
              </tr>
            ) : (
              filtered.map((sala) => (
                <tr key={sala.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                  <td className="p-3 pl-4">
                    <div className="flex items-center gap-2">
                      <DoorOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-bold text-foreground">{sala.nombre}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-[9px]">{sala.tipo}</Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">{sala.especialidad?.nombre || "—"}</td>
                  <td className="p-3">
                    <Badge variant={sala.estado ? "teal" : "secondary"} className="text-[9px]">
                      {sala.estado ? "Activa" : "Inactiva"}
                    </Badge>
                  </td>
                  <td className="p-3 text-right pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(sala)}
                        className="h-7 w-7 rounded-md border border-border bg-background hover:bg-secondary flex items-center justify-center text-foreground cursor-pointer"
                        title="Editar"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(sala)}
                        disabled={deleteMut.isPending}
                        className="h-7 w-7 rounded-md border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 flex items-center justify-center cursor-pointer disabled:opacity-50"
                        title="Eliminar"
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
              <h3 className="text-sm font-black text-foreground">{editing ? "Editar Sala" : "Nueva Sala"}</h3>
              <button type="button" onClick={() => setDialogOpen(false)} className="h-7 w-7 rounded-md hover:bg-secondary flex items-center justify-center cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase">Nombre *</label>
                <input {...register("nombre")} placeholder="Ej: Sala A" className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary" />
                {errors.nombre && <p className="text-[9px] text-destructive">{errors.nombre.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase">Tipo *</label>
                <select {...register("tipo")} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary">
                  <option value="">Seleccione tipo...</option>
                  {SALA_TIPOS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {errors.tipo && <p className="text-[9px] text-destructive">{errors.tipo.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase">Especialidad *</label>
                <select {...register("especialidad_id", { valueAsNumber: true })} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary">
                  <option value={0}>Seleccione...</option>
                  {activeEspecialidades.map((e) => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
                {errors.especialidad_id && <p className="text-[9px] text-destructive">{errors.especialidad_id.message}</p>}
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
                  {editing ? "Guardar Cambios" : "Crear Sala"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
