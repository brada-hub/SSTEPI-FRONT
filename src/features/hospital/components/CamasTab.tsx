"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  type Sala,
  type Cama,
  type CamaTipo,
  type CamaDisponibilidad,
  CAMA_TIPOS,
  DISPONIBILIDAD_LABELS,
} from "@/features/hospital/services/hospitalInfrastructureService";
import {
  useCreateCamaMutation,
  useUpdateCamaMutation,
  useDeleteCamaMutation,
  useCamasQuery,
} from "@/features/hospital/hooks/useHospitalInfrastructure";
import { Badge } from "@/components/ui/badge";
import { Bed, Plus, Pencil, Trash2, Loader2, Search, X, CheckCircle2, Wrench, AlertTriangle, Eye, EyeOff } from "lucide-react";

const schema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(100),
  tipo: z.string().min(1, "Seleccione un tipo"),
  disponibilidad: z.number().min(0).max(2),
  sala_id: z.number().min(1, "Seleccione una sala"),
});

type FormValues = z.infer<typeof schema>;

const DISP_CONFIG: Record<CamaDisponibilidad, { label: string; color: string; icon: React.ElementType }> = {
  0: { label: "Ocupada", color: "bg-destructive text-white", icon: Bed },
  1: { label: "Disponible", color: "bg-emerald-500 text-white", icon: CheckCircle2 },
  2: { label: "Mantenimiento", color: "bg-accent-amber text-foreground", icon: Wrench },
};

interface CamasTabProps {
  salas: Sala[];
  camas?: Cama[];
  isLoading?: boolean;
}

export function CamasTab({ salas }: CamasTabProps) {
  const [search, setSearch] = React.useState("");
  const [salaFilter, setSalaFilter] = React.useState<number | "all">("all");
  const [editing, setEditing] = React.useState<Cama | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [showInactive, setShowInactive] = React.useState(false);

  const { data: camas = [], isLoading } = useCamasQuery(showInactive);

  const createMut = useCreateCamaMutation();
  const updateMut = useUpdateCamaMutation();
  const deleteMut = useDeleteCamaMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", tipo: CAMA_TIPOS[0], disponibilidad: 1, sala_id: 0 },
  });

  const activeSalas = salas.filter((s) => s.estado);

  const openCreate = () => {
    setEditing(null);
    reset({ nombre: "", tipo: CAMA_TIPOS[0], disponibilidad: 1, sala_id: activeSalas[0]?.id ?? 0 });
    setDialogOpen(true);
  };

  const openEdit = (cama: Cama) => {
    setEditing(cama);
    reset({
      nombre: cama.nombre,
      tipo: cama.tipo,
      disponibilidad: cama.disponibilidad,
      sala_id: cama.sala_id,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    const payload = {
      nombre: values.nombre,
      tipo: values.tipo as CamaTipo,
      disponibilidad: values.disponibilidad as CamaDisponibilidad,
      sala_id: values.sala_id,
    };
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, payload });
    } else {
      await createMut.mutateAsync(payload);
    }
    setDialogOpen(false);
  };

  const handleDelete = async (cama: Cama) => {
    await deleteMut.mutateAsync(cama.id);
  };

  const filtered = camas.filter((c) => {
    const matchSearch = !search.trim() || c.nombre.toLowerCase().includes(search.toLowerCase());
    const matchSala = salaFilter === "all" || c.sala_id === salaFilter;
    return matchSearch && matchSala;
  });

  const camasBySala = React.useMemo(() => {
    const map = new Map<number, Cama[]>();
    filtered.forEach((c) => {
      const list = map.get(c.sala_id) ?? [];
      list.push(c);
      map.set(c.sala_id, list);
    });
    return map;
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center text-xs text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        Cargando camas...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative flex max-w-[200px] items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar cama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-card pl-10 pr-4 text-xs font-semibold outline-none focus:border-primary"
            />
          </div>
          <select
            value={salaFilter}
            onChange={(e) => setSalaFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="h-9 rounded-lg border border-border bg-card px-3 text-xs outline-none focus:border-primary"
          >
            <option value="all">Todas las salas</option>
            {salas.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>

          {/* Toggle de Camas Inactivas */}
          <label className="flex items-center gap-2 h-9 border border-border bg-card rounded-lg px-3 text-xs font-bold text-foreground cursor-pointer hover:bg-secondary/50 transition-all select-none">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-border bg-card text-primary focus:ring-primary h-3.5 w-3.5"
            />
            <span>Ver dadas de baja</span>
          </label>
        </div>
        <button
          type="button"
          onClick={openCreate}
          disabled={activeSalas.length === 0}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-white shadow-sm hover:bg-primary/90 cursor-pointer disabled:opacity-50"
          title={activeSalas.length === 0 ? "Cree una sala primero" : "Nueva Cama"}
        >
          <Plus className="h-4 w-4" />
          Nueva Cama
        </button>
      </div>

      {/* Mapa Operacional */}
      <div className="space-y-4">
        {activeSalas
          .filter((s) => salaFilter === "all" || s.id === salaFilter)
          .map((sala) => {
            const salaCamas = camasBySala.get(sala.id) ?? [];
            if (salaCamas.length === 0) return null;
            return (
              <div key={sala.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-foreground">{sala.nombre}</h4>
                  <span className="text-[10px] text-muted-foreground font-semibold">{salaCamas.length} camas</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {salaCamas.map((cama) => {
                    const config = DISP_CONFIG[cama.disponibilidad];
                    const Icon = config.icon;
                    return (
                      <button
                        key={cama.id}
                        type="button"
                        onClick={() => openEdit(cama)}
                        className={`rounded-lg p-2 flex flex-col items-center justify-center gap-1 min-h-[72px] transition-all hover:scale-105 cursor-pointer ${
                          !cama.estado ? "bg-secondary/40 text-muted-foreground border border-dashed border-border" : config.color
                        }`}
                        title={`${cama.nombre} — ${!cama.estado ? "Inactiva (Baja)" : config.label} (${cama.tipo})`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-[9px] font-black leading-tight text-center">{cama.nombre}</span>
                        <span className="text-[8px] font-semibold opacity-80">{cama.tipo}</span>
                        {!cama.estado && <span className="text-[7px] bg-destructive/10 text-destructive rounded px-1 mt-0.5 font-bold uppercase">Baja</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold text-muted-foreground uppercase">
              <th className="p-3 pl-4">Nombre</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Sala</th>
              <th className="p-3">Disponibilidad</th>
              <th className="p-3">Estado</th>
              <th className="p-3 text-right pr-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground text-xs">
                  No se encontraron camas.
                </td>
              </tr>
            ) : (
              filtered.map((cama) => {
                const config = DISP_CONFIG[cama.disponibilidad];
                return (
                  <tr key={cama.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                    <td className="p-3 pl-4 font-bold text-foreground font-mono">{cama.nombre}</td>
                    <td className="p-3 text-muted-foreground">{cama.tipo}</td>
                    <td className="p-3 text-muted-foreground">{cama.sala?.nombre || "—"}</td>
                    <td className="p-3">
                      <Badge className={`text-[9px] ${config.color}`}>{config.label}</Badge>
                    </td>
                    <td className="p-3">
                      {cama.estado ? (
                        <Badge className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Activa</Badge>
                      ) : (
                        <Badge className="text-[9px] bg-destructive/10 text-destructive border border-destructive/20">Inactiva</Badge>
                      )}
                    </td>
                    <td className="p-3 text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        {!cama.estado ? (
                          <button
                            type="button"
                            onClick={async () => {
                              await updateMut.mutateAsync({
                                id: cama.id,
                                payload: {
                                  nombre: cama.nombre,
                                  tipo: cama.tipo,
                                  disponibilidad: cama.disponibilidad,
                                  sala_id: cama.sala_id,
                                  estado: true,
                                },
                              });
                            }}
                            disabled={updateMut.isPending}
                            className="h-7 px-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/10 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 font-bold"
                            title="Reactivar"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span className="text-[10px]">Reactivar</span>
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(cama)}
                              className="h-7 w-7 rounded-md border border-border bg-background hover:bg-secondary flex items-center justify-center text-foreground cursor-pointer"
                              title="Editar"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(cama)}
                              disabled={deleteMut.isPending}
                              className="h-7 w-7 rounded-md border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 flex items-center justify-center cursor-pointer disabled:opacity-50"
                              title="Eliminar"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-foreground">{editing ? "Editar Cama" : "Nueva Cama"}</h3>
              <button type="button" onClick={() => setDialogOpen(false)} className="h-7 w-7 rounded-md hover:bg-secondary flex items-center justify-center cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase">Nombre *</label>
                <input {...register("nombre")} placeholder="Ej: Cama 101" className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary" />
                {errors.nombre && <p className="text-[9px] text-destructive">{errors.nombre.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Tipo *</label>
                  <select {...register("tipo")} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary">
                    {CAMA_TIPOS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Disponibilidad *</label>
                  <select {...register("disponibilidad", { valueAsNumber: true })} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary">
                    <option value={1}>Disponible</option>
                    <option value={2}>Mantenimiento</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase">Sala *</label>
                <select {...register("sala_id", { valueAsNumber: true })} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary">
                  <option value={0}>Seleccione...</option>
                  {activeSalas.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
                {errors.sala_id && <p className="text-[9px] text-destructive">{errors.sala_id.message}</p>}
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
                  {editing ? "Guardar Cambios" : "Crear Cama"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
