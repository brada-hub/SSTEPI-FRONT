"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useHospitalConfigQuery,
  useUpdateHospitalConfigMutation,
} from "@/features/hospital/hooks/useHospitalInfrastructure";
import { Building2, Loader2, Save, MapPin, Phone, Globe } from "lucide-react";

const DEPARTAMENTOS = ["LA PAZ", "COCHABAMBA", "SANTA CRUZ"] as const;
const NIVELES = ["NIVEL 1", "NIVEL 2", "NIVEL 3"] as const;
const TIPOS = ["PÚBLICO", "PRIVADO"] as const;

const schema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(100),
  departamento: z.string().min(1, "Seleccione un departamento"),
  direccion: z.string().min(2, "Dirección requerida").max(255),
  nivel: z.string().min(1, "Seleccione un nivel"),
  tipo: z.string().min(1, "Seleccione un tipo"),
  telefono: z.string().min(8, "Debe tener 8 dígitos").max(8, "Debe tener 8 dígitos"),
});

type FormValues = z.infer<typeof schema>;

export function HospitalConfigTab() {
  const { data: config, isLoading } = useHospitalConfigQuery();
  const updateMut = useUpdateHospitalConfigMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: "",
      departamento: "LA PAZ",
      direccion: "",
      nivel: "NIVEL 1",
      tipo: "PÚBLICO",
      telefono: "",
    },
  });

  React.useEffect(() => {
    if (config) {
      reset({
        nombre: config.nombre ?? "",
        departamento: config.departamento ?? "LA PAZ",
        direccion: config.direccion ?? "",
        nivel: config.nivel ?? "NIVEL 1",
        tipo: config.tipo ?? "PÚBLICO",
        telefono: config.telefono ?? "",
      });
    }
  }, [config, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!config) return;
    await updateMut.mutateAsync({ id: config.id, payload: values });
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center text-xs text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        Cargando configuración...
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-border/30 pb-3">
          <Building2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Datos Institucionales del Hospital</h3>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-muted-foreground uppercase">Nombre Institucional *</label>
            <input {...register("nombre")} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary" />
            {errors.nombre && <p className="text-[9px] text-destructive">{errors.nombre.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Globe className="h-3 w-3" /> Departamento *
              </label>
              <select {...register("departamento")} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary">
                {DEPARTAMENTOS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {errors.departamento && <p className="text-[9px] text-destructive">{errors.departamento.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase">Nivel *</label>
              <select {...register("nivel")} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary">
                {NIVELES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              {errors.nivel && <p className="text-[9px] text-destructive">{errors.nivel.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase">Tipo *</label>
              <select {...register("tipo")} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary">
                {TIPOS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.tipo && <p className="text-[9px] text-destructive">{errors.tipo.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Phone className="h-3 w-3" /> Teléfono (8 dígitos) *
              </label>
              <input {...register("telefono")} placeholder="Ej: 24412345" className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs font-mono outline-none focus:border-primary" />
              {errors.telefono && <p className="text-[9px] text-destructive">{errors.telefono.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Dirección *
            </label>
            <input {...register("direccion")} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary" />
            {errors.direccion && <p className="text-[9px] text-destructive">{errors.direccion.message}</p>}
          </div>

          <div className="flex justify-end pt-2 border-t border-border/20">
            <button
              type="submit"
              disabled={!isDirty || updateMut.isPending}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
            >
              {updateMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
