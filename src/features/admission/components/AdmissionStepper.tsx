"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { admissionSchema, AdmissionFormValues } from "../schemas/admissionSchema";
import { useAdmissionResources, useAdmissionMutation } from "../hooks/useAdmissionQuery";
import { useAdmissionInfrastructureQuery, useSalasQuery } from "@/features/hospital/hooks/useHospitalInfrastructure";
import { calculateBMI } from "@/lib/clinical";
import {
  Bed,
  Activity,
  Plus,
  Trash,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Info,
  ChevronRight,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useMedicamentosQuery } from "@/features/nursing/hooks/useCatalogQueries";
import { createMedicamento } from "@/features/nursing/services/treatmentService";

export function AdmissionStepper() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const { patients, clinicians, isLoadingPatients, isLoadingClinicians, isError } = useAdmissionResources();
  const { data: camasDisponibles, isLoading: isLoadingCamas } = useAdmissionInfrastructureQuery();
  const { data: salas, isLoading: isLoadingSalas } = useSalasQuery();
  const isLoadingInfrastructure = isLoadingCamas || isLoadingSalas;
  const { createAdmission, isSubmitting } = useAdmissionMutation();

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AdmissionFormValues>({
    resolver: zodResolver(admissionSchema),
    mode: "onChange",
    defaultValues: {
      paciente_id: 0,
      sala_id: 1,
      cama_id: 0,
      medico_id: 0,
      diagnostico_ingreso: "",
      presion_sistolica: 0,
      presion_diastolica: 0,
      frecuencia_cardiaca: 0,
      frecuencia_respiratoria: 0,
      temperatura: 0,
      saturacion_oxigeno: 0,
      peso_kg: 0,
      talla_cm: 0,
      pre_prescripciones: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "pre_prescripciones",
  });

  // Escuchar peso y talla para el cálculo del IMC
  const weight = watch("peso_kg");
  const height = watch("talla_cm");
  const { bmi, classification, color, bg } = React.useMemo(() => {
    return calculateBMI(weight, height);
  }, [weight, height]);

  // Medicamento local para añadir a la pre-prescripción
  const [localDrug, setLocalDrug] = React.useState({
    medicamento: "",
    dosis: "",
    frecuencia_horas: 8,
    via: "Oral",
    duracion_dias: 5,
  });

  // --- BUSCADOR DE PACIENTES LIBRES (Paso 1) ---
  const [patientSearch, setPatientSearch] = React.useState("");
  const filteredPatients = React.useMemo(() => {
    const term = patientSearch.toLowerCase().trim();
    if (!term) return patients;
    return patients.filter((p) => {
      const fullname = `${p.nombre || ""} ${p.apellidos || ""}`.toLowerCase();
      const ci = (p.ci || "").toLowerCase();
      return fullname.includes(term) || ci.includes(term);
    });
  }, [patients, patientSearch]);

  // --- AUTOCOMPLETADO Y REGISTRO AL VUELO DE MEDICAMENTOS (Paso 3) ---
  const queryClient = useQueryClient();
  const { data: catalogMedicamentos } = useMedicamentosQuery();
  const [showDrugSuggestions, setShowDrugSuggestions] = React.useState(false);
  const [isCreatingDrug, setIsCreatingDrug] = React.useState(false);
  const drugAutocompleteRef = React.useRef<HTMLDivElement>(null);

  const filteredDrugs = React.useMemo(() => {
    const term = localDrug.medicamento.toLowerCase().trim();
    if (!term || !catalogMedicamentos) return [];
    return catalogMedicamentos.filter((m) =>
      m.nombre.toLowerCase().includes(term)
    );
  }, [catalogMedicamentos, localDrug.medicamento]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drugAutocompleteRef.current && !drugAutocompleteRef.current.contains(e.target as Node)) {
        setShowDrugSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleQuickAddDrug = async () => {
    const nombre = localDrug.medicamento.trim();
    if (!nombre) return;
    try {
      setIsCreatingDrug(true);
      const newDrug = await createMedicamento({
        nombre,
        descripcion: "Registrado al vuelo desde Admisión",
        categoria_id: 1,
      });
      toast.success(`Fármaco "${newDrug.nombre}" registrado y añadido al catálogo.`);
      queryClient.invalidateQueries({ queryKey: ["medicamentos-catalog"] });
      setLocalDrug({ ...localDrug, medicamento: newDrug.nombre });
      setShowDrugSuggestions(false);
    } catch {
      toast.error("Error al registrar el fármaco en el servidor.");
    } finally {
      setIsCreatingDrug(false);
    }
  };

  // Filtrar camas reales disponibles según la sala seleccionada
  const selectedSalaId = watch("sala_id");
  const filteredCamas = React.useMemo(() => {
    if (!camasDisponibles || selectedSalaId <= 0) return [];
    return camasDisponibles
      .filter((c) => c.sala_id === selectedSalaId && c.disponibilidad === 1)
      .map((c) => ({ id: c.id, codigo: c.nombre, disponible: true }));
  }, [camasDisponibles, selectedSalaId]);

  const handleNext = async () => {
    let fieldsToValidate: (keyof AdmissionFormValues)[] = [];
    if (step === 1) {
      fieldsToValidate = ["paciente_id", "sala_id", "cama_id", "medico_id", "diagnostico_ingreso"];
    } else if (step === 2) {
      fieldsToValidate = [
        "presion_sistolica", "presion_diastolica", "frecuencia_cardiaca", 
        "frecuencia_respiratoria", "temperatura", "saturacion_oxigeno", 
        "peso_kg", "talla_cm"
      ];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => prev + 1);
    } else {
      if (step === 1) {
        toast.error("Por favor complete los campos obligatorios del ingreso.");
      } else {
        toast.error("Debe corregir las alertas del triage antes de continuar.");
      }
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const addDrug = () => {
    if (!localDrug.medicamento || !localDrug.dosis) {
      toast.error("Complete el nombre del fármaco y su dosificación.");
      return;
    }
    append(localDrug);
    setLocalDrug({
      medicamento: "",
      dosis: "",
      frecuencia_horas: 8,
      via: "Oral",
      duracion_dias: 5,
    });
  };

  const handleFormSubmit = async (values: AdmissionFormValues) => {
    try {
      // 1. Mapeo de Signos Vitales Fisiológicos a sus IDs canónicos en la Base de Datos
      const signos_vitales: { signo_id: number; medida: string; medida_baja?: string | null }[] = [];

      if (values.peso_kg) signos_vitales.push({ signo_id: 1, medida: String(values.peso_kg) });
      if (values.talla_cm) signos_vitales.push({ signo_id: 2, medida: String(values.talla_cm) });
      
      // Presión arterial utiliza valores duales (Sistólica / Diastólica)
      if (values.presion_sistolica && values.presion_diastolica) {
        signos_vitales.push({
          signo_id: 3,
          medida: String(values.presion_sistolica),
          medida_baja: String(values.presion_diastolica)
        });
      }
      if (values.frecuencia_cardiaca) {
        signos_vitales.push({ signo_id: 4, medida: String(values.frecuencia_cardiaca) });
      }
      if (values.frecuencia_respiratoria) {
        signos_vitales.push({ signo_id: 5, medida: String(values.frecuencia_respiratoria) });
      }
      if (values.temperatura) {
        signos_vitales.push({ signo_id: 6, medida: String(values.temperatura) });
      }
      if (values.saturacion_oxigeno) {
        signos_vitales.push({ signo_id: 7, medida: String(values.saturacion_oxigeno) });
      }

      // 2. Mapeo de Cuidados por defecto para pasar la validación
      const cuidados = [
        {
          tipo: "Cuidado General",
          descripcion: "Control de signos vitales según protocolo hospitalario",
          frecuencia: "Cada 8 horas"
        }
      ];

      // 3. Estructuración del payload anidado requerido por AdmisionController
      const backendPayload = {
        admision: {
          paciente_id: Number(values.paciente_id),
          cama_id: Number(values.cama_id),
          medico_id: Number(values.medico_id),
          motivo: "Ingreso Clínico",
          diagnostico: values.diagnostico_ingreso,
          observaciones: "Admisión guiada desde el censo clínico."
        },
        signos_vitales,
        cuidados
      };

      await createAdmission(backendPayload as any);
      toast.success("Paciente admitido e internado de forma correcta.");
      router.push("/estacion-enfermeria");
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message || error?.response?.data?.error;
      const validationErrors = error?.response?.data?.errors;
      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0];
        if (Array.isArray(firstError)) {
          toast.error(`Error de admisión: ${firstError[0]}`);
          return;
        }
      }
      toast.error(serverMessage || "Fallo al registrar la admisión en el servidor clínico.");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Stepper Header */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          {[
            { step: 1, label: "Admisión & Asignación" },
            { step: 2, label: "Triage Vital Fisiológico" },
            { step: 3, label: "Pre-Prescripciones" },
          ].map((s) => (
            <div key={s.step} className="flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all ${
                step === s.step ? "bg-primary text-white scale-110 shadow-sm" :
                step > s.step ? "bg-accent-teal text-white" : "bg-secondary text-muted-foreground"
              }`}>
                {s.step}
              </span>
              <span className={`hidden md:inline text-xs font-bold ${step === s.step ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stepper Form Content */}
      <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm min-h-96">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          
          {/* PASO 1: Admisión e Infraestructura */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Paciente Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Paciente Demográfico (Libres)</label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/80" />
                    <input
                      type="text"
                      placeholder="Buscar por Nombre, Apellidos o CI..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="w-full h-9 rounded-lg border border-border bg-secondary/30 pl-9 pr-3 text-xs outline-none focus:border-primary placeholder:text-muted-foreground/50 transition-all font-semibold"
                    />
                  </div>
                  <select
                    {...register("paciente_id", { valueAsNumber: true })}
                    className="w-full h-10 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary cursor-pointer font-semibold"
                  >
                    <option value="0">Seleccione Paciente ({filteredPatients.length} libres)...</option>
                    {filteredPatients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} {p.apellidos} {p.ci ? `(CI: ${p.ci})` : ""}
                      </option>
                    ))}
                  </select>
                  {errors.paciente_id && <span className="text-[10px] text-destructive">{errors.paciente_id.message}</span>}
                </div>

                {/* Médico Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Médico de Planta Responsable</label>
                  <select
                    {...register("medico_id", { valueAsNumber: true })}
                    className="w-full h-10 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="0">Seleccione Médico...</option>
                    {clinicians?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name || `${c.nombre ?? ""} ${c.apellidos ?? ""}`.trim() || "Médico"}</option>
                    ))}
                  </select>
                  {errors.medico_id && <span className="text-[10px] text-destructive">{errors.medico_id.message}</span>}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 border-t border-border/40 pt-4">
                {/* Sala Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Sala de Destino</label>
                  <select
                    {...register("sala_id", { valueAsNumber: true })}
                    disabled={isLoadingSalas}
                    className="w-full h-10 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary cursor-pointer disabled:opacity-50"
                  >
                    <option value={0}>{isLoadingSalas ? "Cargando salas..." : "Seleccione Sala..."}</option>
                    {salas?.filter((s) => s.estado).map((sala) => (
                      <option key={sala.id} value={sala.id}>
                        {sala.nombre} {sala.especialidad?.nombre ? `(${sala.especialidad.nombre})` : ""}
                      </option>
                    ))}
                  </select>
                  {errors.sala_id && <span className="text-[10px] text-destructive">{errors.sala_id.message}</span>}
                </div>

                {/* Cama Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Cama Física Disponible</label>
                  <select
                    {...register("cama_id", { valueAsNumber: true })}
                    disabled={selectedSalaId <= 0 || filteredCamas.length === 0}
                    className="w-full h-10 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none focus:border-primary cursor-pointer disabled:opacity-50"
                  >
                    <option value={0}>
                      {selectedSalaId <= 0
                        ? "Seleccione sala primero"
                        : filteredCamas.length === 0
                        ? "Sin camas disponibles"
                        : "Seleccione Cama..."}
                    </option>
                    {filteredCamas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.codigo}
                      </option>
                    ))}
                  </select>
                  {errors.cama_id && <span className="text-[10px] text-destructive">{errors.cama_id.message}</span>}
                </div>
              </div>

              {/* Diagnóstico de Ingreso */}
              <div className="space-y-1 border-t border-border/40 pt-4">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Diagnóstico Principal de Ingreso</label>
                <textarea
                  rows={3}
                  placeholder="ej: Paciente cursa con cuadro de abdomen agudo, sospecha de apendicitis..."
                  {...register("diagnostico_ingreso")}
                  className="w-full rounded-lg border border-border bg-secondary/50 p-3 text-xs outline-none focus:border-primary resize-none placeholder:text-muted-foreground/60"
                />
                {errors.diagnostico_ingreso && <span className="text-[10px] text-destructive block">{errors.diagnostico_ingreso.message}</span>}
              </div>
            </div>
          )}

          {/* PASO 2: Triage Signos Constantes Vitales */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/10 p-3 text-xs text-primary">
                <Info className="h-4 w-4 shrink-0" />
                <span>Ingrese los datos fisiológicos del triage. Si deja en 0, se registrarán como valores omitidos.</span>
              </div>

              {/* Grid Vitales Fisiológicas */}
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Presión Sistólica</label>
                  <input type="number" placeholder="mmHg" {...register("presion_sistolica", { valueAsNumber: true })} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs font-mono outline-none" />
                  {errors.presion_sistolica && <span className="text-[9px] text-destructive block">{errors.presion_sistolica.message}</span>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Presión Diastólica</label>
                  <input type="number" placeholder="mmHg" {...register("presion_diastolica", { valueAsNumber: true })} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs font-mono outline-none" />
                  {errors.presion_diastolica && <span className="text-[9px] text-destructive block">{errors.presion_diastolica.message}</span>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Frec. Cardíaca (FC)</label>
                  <input type="number" placeholder="lpm" {...register("frecuencia_cardiaca", { valueAsNumber: true })} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs font-mono outline-none" />
                  {errors.frecuencia_cardiaca && <span className="text-[9px] text-destructive block">{errors.frecuencia_cardiaca.message}</span>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Frec. Respiratoria (FR)</label>
                  <input type="number" placeholder="rpm" {...register("frecuencia_respiratoria", { valueAsNumber: true })} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs font-mono outline-none" />
                  {errors.frecuencia_respiratoria && <span className="text-[9px] text-destructive block">{errors.frecuencia_respiratoria.message}</span>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Temperatura</label>
                  <input type="number" step="0.1" placeholder="°C" {...register("temperatura", { valueAsNumber: true })} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs font-mono outline-none" />
                  {errors.temperatura && <span className="text-[9px] text-destructive block">{errors.temperatura.message}</span>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Saturación O2</label>
                  <input type="number" placeholder="%" {...register("saturacion_oxigeno", { valueAsNumber: true })} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs font-mono outline-none" />
                  {errors.saturacion_oxigeno && <span className="text-[9px] text-destructive block">{errors.saturacion_oxigeno.message}</span>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Peso Clínico</label>
                  <input type="number" step="0.1" placeholder="kg" {...register("peso_kg", { valueAsNumber: true })} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs font-mono outline-none" />
                  {errors.peso_kg && <span className="text-[9px] text-destructive block">{errors.peso_kg.message}</span>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Talla Corporal</label>
                  <input type="number" placeholder="cm" {...register("talla_cm", { valueAsNumber: true })} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs font-mono outline-none" />
                  {errors.talla_cm && <span className="text-[9px] text-destructive block">{errors.talla_cm.message}</span>}
                </div>
              </div>

              {/* Consola de Cálculo Automático IMC */}
              <div className="rounded-xl border border-border bg-secondary/30 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cálculo de IMC Fisiológico Automático</span>
                  <span className="text-xs text-muted-foreground mt-0.5">Calculado en base a peso y talla ingresados.</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-lg font-extrabold text-foreground">{bmi || "0.0"}</span>
                  </div>
                  <span className={`inline-block rounded-lg border px-3 py-1 text-xs font-bold ${bg} ${color}`}>
                    {classification}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: Pre-prescripciones */}
          {step === 3 && (
            <div className="space-y-4">
              
              {/* Formulario Local Fármaco */}
              <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
                <span className="text-[10px] font-bold text-foreground uppercase tracking-wider block">Indicar Fármaco al Ingreso</span>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
                  <div className="col-span-2 space-y-1 relative" ref={drugAutocompleteRef}>
                    <label className="text-[9px] font-bold text-muted-foreground block">Medicamento</label>
                    <input
                      type="text"
                      placeholder="ej: Paracetamol 500mg"
                      value={localDrug.medicamento}
                      onChange={(e) => {
                        setLocalDrug({ ...localDrug, medicamento: e.target.value });
                        setShowDrugSuggestions(true);
                      }}
                      onFocus={() => setShowDrugSuggestions(true)}
                      className="w-full h-8 rounded-md border border-border bg-background px-2.5 text-xs outline-none focus:border-primary font-semibold text-foreground"
                    />
                    
                    {/* Autocomplete Panel */}
                    {showDrugSuggestions && localDrug.medicamento.trim().length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-border bg-card shadow-xl max-h-48 overflow-y-auto">
                        <div className="p-1 space-y-0.5">
                          {filteredDrugs.length > 0 ? (
                            filteredDrugs.map((drug) => (
                              <button
                                key={drug.id}
                                type="button"
                                onClick={() => {
                                  setLocalDrug({ ...localDrug, medicamento: drug.nombre });
                                  setShowDrugSuggestions(false);
                                }}
                                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer"
                              >
                                <span className="flex-1">{drug.nombre}</span>
                                {drug.descripcion && (
                                  <span className="text-[9px] text-muted-foreground italic truncate max-w-[120px]">
                                    {drug.descripcion}
                                  </span>
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="flex flex-col p-2 text-center text-xs space-y-2">
                              <span className="text-muted-foreground font-medium text-[10px]">El fármaco no existe en el catálogo</span>
                              <button
                                type="button"
                                onClick={handleQuickAddDrug}
                                disabled={isCreatingDrug}
                                className="inline-flex h-7 items-center justify-center gap-1 rounded bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition-all cursor-pointer"
                              >
                                {isCreatingDrug ? "Registrando..." : `Crear y Usar: "${localDrug.medicamento}"`}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground">Dosis</label>
                    <input type="text" placeholder="ej: 1 tableta" value={localDrug.dosis} onChange={(e) => setLocalDrug({ ...localDrug, dosis: e.target.value })} className="w-full h-8 rounded-md border border-border bg-background px-2.5 text-xs outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground">Frecuencia (Hrs)</label>
                    <input type="number" placeholder="8" value={localDrug.frecuencia_horas} onChange={(e) => setLocalDrug({ ...localDrug, frecuencia_horas: Number(e.target.value) })} className="w-full h-8 rounded-md border border-border bg-background px-2.5 text-xs font-mono outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground">Vía</label>
                    <select value={localDrug.via} onChange={(e) => setLocalDrug({ ...localDrug, via: e.target.value })} className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs outline-none">
                      {["Oral", "Intravenosa", "Intramuscular", "Subcutánea"].map((via) => (
                        <option key={via} value={via}>{via}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button type="button" onClick={addDrug} className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-primary px-3 text-[11px] font-bold text-white shadow-sm hover:bg-primary/95 transition-all cursor-pointer">
                  <Plus className="h-3.5 w-3.5" /> Añadir Prescripción
                </button>
              </div>

              {/* Lista de Fármacos Añadidos */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30 text-[9px] font-bold text-muted-foreground uppercase">
                      <th className="p-3 pl-4">Fármaco</th>
                      <th className="p-3">Dosis</th>
                      <th className="p-3">Cada (Hrs)</th>
                      <th className="p-3">Vía</th>
                      <th className="p-3 text-right pr-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-muted-foreground">
                          Ningún fármaco pre-prescrito al ingreso.
                        </td>
                      </tr>
                    ) : (
                      fields.map((field, idx: number) => (
                        <tr key={field.id} className="border-b border-border/40 hover:bg-secondary/20">
                          <td className="p-3 pl-4 font-bold text-foreground">{field.medicamento}</td>
                          <td className="p-3">{field.dosis}</td>
                          <td className="p-3 font-mono">{field.frecuencia_horas} hrs</td>
                          <td className="p-3">{field.via}</td>
                          <td className="p-3 text-right pr-4">
                            <button type="button" onClick={() => remove(idx)} className="text-destructive hover:bg-destructive/10 p-1 rounded transition-all">
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* Stepper Footer Controls */}
          <div className="flex w-full items-center justify-between border-t border-border/40 pt-4">
            {step > 1 ? (
              <button type="button" onClick={handleBack} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-4 text-xs font-bold text-foreground hover:bg-secondary cursor-pointer">
                <ArrowLeft className="h-3.5 w-3.5" /> Atrás
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button type="button" onClick={handleNext} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-white shadow-sm hover:bg-primary/95 cursor-pointer">
                Siguiente <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit(handleFormSubmit)}
                disabled={isSubmitting}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-accent-teal px-4 text-xs font-bold text-white shadow-md hover:bg-accent-teal/95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Registrando Internación..." : <><ShieldCheck className="h-4 w-4" /> Finalizar Admisión</>}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdmissionStepper;
