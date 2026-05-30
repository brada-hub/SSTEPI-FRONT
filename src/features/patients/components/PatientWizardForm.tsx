"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { patientSchema, PatientFormValues, mapPatientFormToBackend } from "../schemas/patientSchema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Patient } from "@/services/patientService";
import { User, Phone, ArrowLeft, ArrowRight, Save, AlertCircle } from "lucide-react";

interface PatientWizardFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientToEdit?: Patient | null;
  onSubmitSuccess: (data: ReturnType<typeof mapPatientFormToBackend>) => Promise<void>;
}

export function PatientWizardForm({
  open,
  onOpenChange,
  patientToEdit,
  onSubmitSuccess,
}: PatientWizardFormProps) {
  const [step, setStep] = React.useState(1);

  const {
    register,
    handleSubmit,
    trigger,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    mode: "onChange",
  });

  React.useEffect(() => {
    if (open) {
      setStep(1);
      if (patientToEdit) {
        reset({
          nombre: patientToEdit.nombre,
          apellidos: patientToEdit.apellidos,
          ci: patientToEdit.ci,
          genero: patientToEdit.genero ?? "masculino",
          fecha_nacimiento: patientToEdit.fecha_nacimiento?.substring(0, 10) ?? "",
          telefono: patientToEdit.telefono ?? "",
          direccion: patientToEdit.direccion ?? "",
          nombre_referencia: patientToEdit.nombre_referencia ?? "",
          apellidos_referencia: patientToEdit.apellidos_referencia ?? "",
          celular_referencia: patientToEdit.celular_referencia ?? "",
        });
      } else {
        reset({
          nombre: "",
          apellidos: "",
          ci: "",
          genero: "masculino",
          fecha_nacimiento: "",
          telefono: "",
          direccion: "",
          nombre_referencia: "",
          apellidos_referencia: "",
          celular_referencia: "",
        });
      }
    }
  }, [open, patientToEdit, reset]);

  const handleNext = async () => {
    let fieldsToValidate: (keyof PatientFormValues)[] = [];
    if (step === 1) {
      fieldsToValidate = ["nombre", "apellidos", "ci", "genero", "fecha_nacimiento"];
    } else if (step === 2) {
      fieldsToValidate = ["telefono", "direccion"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleFormSubmit = async (values: PatientFormValues) => {
    const payload = mapPatientFormToBackend(values);
    await onSubmitSuccess(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidthClass="max-w-md" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>
            {patientToEdit ? "Modificar Expediente Paciente" : "Crear Expediente Paciente"}
          </DialogTitle>
          <DialogDescription>
            Wizard clínico estructurado paso a paso para el registro demográfico.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-3 my-4">
          {[
            { num: 1, label: "Ficha Identidad" },
            { num: 2, label: "Contactos" },
            { num: 3, label: "Referencia" },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-1.5 select-none">
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                step === s.num ? "bg-primary text-white" :
                step > s.num ? "bg-accent-teal text-white" : "bg-secondary text-muted-foreground"
              }`}>
                {s.num}
              </span>
              <span className={`text-[10px] font-bold ${step === s.num ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Formulario principal */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 min-h-60 max-h-96 overflow-y-auto px-1 py-1">

          {/* PASO 1: Identificación y datos personales */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nombres *</label>
                  <input
                    type="text"
                    {...register("nombre", {
                      onChange: (e) => {
                        e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s-]/g, "");
                      }
                    })}
                    placeholder="Ej: Juan Carlos"
                    className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary"
                  />
                  {errors.nombre && <span className="text-[10px] text-destructive block">{errors.nombre.message}</span>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Apellidos *</label>
                  <input
                    type="text"
                    {...register("apellidos", {
                      onChange: (e) => {
                        e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s-]/g, "");
                      }
                    })}
                    placeholder="Ej: Pérez García"
                    className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary"
                  />
                  {errors.apellidos && <span className="text-[10px] text-destructive block">{errors.apellidos.message}</span>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cédula de Identidad *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  {...register("ci", {
                    onChange: (e) => {
                      e.target.value = e.target.value.replace(/[^0-9]/g, "");
                    }
                  })}
                  placeholder="Solo números, 5-20 dígitos"
                  className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs font-mono outline-none focus:border-primary"
                />
                {errors.ci && <span className="text-[10px] text-destructive block">{errors.ci.message}</span>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Género *</label>
                  <select {...register("genero")} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none cursor-pointer">
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                  </select>
                  {errors.genero && <span className="text-[10px] text-destructive block">{errors.genero.message}</span>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nacimiento *</label>
                  <input type="date" {...register("fecha_nacimiento")} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary cursor-pointer" />
                  {errors.fecha_nacimiento && <span className="text-[10px] text-destructive block">{errors.fecha_nacimiento.message}</span>}
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: Contacto */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Teléfono de Contacto *</label>
                <input
                  type="tel"
                  inputMode="tel"
                  {...register("telefono", {
                    onChange: (e) => {
                      e.target.value = e.target.value.replace(/[^0-9]/g, "");
                    }
                  })}
                  placeholder="Solo números, 7-15 dígitos"
                  className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary"
                />
                {errors.telefono && <span className="text-[10px] text-destructive block">{errors.telefono.message}</span>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Dirección Física *</label>
                <input type="text" {...register("direccion")} placeholder="Ej: Av. América #1234, Zona Centro" className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary" />
                {errors.direccion && <span className="text-[10px] text-destructive block">{errors.direccion.message}</span>}
              </div>
            </div>
          )}

          {/* PASO 3: Referencia de emergencia */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-secondary/20 p-3 space-y-2">
                <span className="text-[10px] font-bold text-foreground flex items-center gap-1"><Phone className="h-3 w-3 text-primary" /> Familiar de Referencia (Emergencias)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold text-muted-foreground uppercase">Nombre</label>
                    <input
                      type="text"
                      {...register("nombre_referencia", {
                        onChange: (e) => {
                          e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s-]/g, "");
                        }
                      })}
                      placeholder="Ej: María"
                      className="w-full h-8 rounded-md border border-border bg-background px-2.5 text-xs outline-none"
                    />
                    {errors.nombre_referencia && <span className="text-[9px] text-destructive block">{errors.nombre_referencia.message}</span>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold text-muted-foreground uppercase">Apellidos</label>
                    <input
                      type="text"
                      {...register("apellidos_referencia", {
                        onChange: (e) => {
                          e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s-]/g, "");
                        }
                      })}
                      placeholder="Ej: López"
                      className="w-full h-8 rounded-md border border-border bg-background px-2.5 text-xs outline-none"
                    />
                    {errors.apellidos_referencia && <span className="text-[9px] text-destructive block">{errors.apellidos_referencia.message}</span>}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-muted-foreground uppercase">Celular de Referencia</label>
                  <input
                    type="tel"
                    inputMode="tel"
                    {...register("celular_referencia", {
                      onChange: (e) => {
                        e.target.value = e.target.value.replace(/[^0-9]/g, "");
                      }
                    })}
                    placeholder="Solo números, 7-15 dígitos"
                    className="w-full h-8 rounded-md border border-border bg-background px-2.5 text-xs outline-none"
                  />
                  {errors.celular_referencia && <span className="text-[9px] text-destructive block">{errors.celular_referencia.message}</span>}
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-accent-amber/5 border border-accent-amber/20 p-3 text-[10px] text-accent-amber">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>La información de referencia es opcional pero altamente recomendada para casos de emergencia.</p>
              </div>
            </div>
          )}
        </form>

        {/* Footer del Diálogo */}
        <DialogFooter>
          <div className="flex w-full items-center justify-between">
            {step > 1 ? (
              <button type="button" onClick={handleBack} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3.5 text-xs font-bold text-foreground hover:bg-secondary cursor-pointer">
                <ArrowLeft className="h-3.5 w-3.5" /> Atrás
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button type="button" onClick={handleNext} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-bold text-white shadow-sm hover:bg-primary/95 cursor-pointer">
                Siguiente <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit(handleFormSubmit)}
                disabled={isSubmitting}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-accent-teal px-4 text-xs font-bold text-white shadow-sm hover:bg-accent-teal/95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Grabando..." : <><Save className="h-3.5 w-3.5" /> Guardar Expediente</>}
              </button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
