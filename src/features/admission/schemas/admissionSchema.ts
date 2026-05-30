import * as z from "zod";

export const prePrescriptionSchema = z.object({
  medicamento: z.string().min(2, "Debe especificar el medicamento"),
  dosis: z.string().min(1, "Debe especificar la dosis"),
  frecuencia_horas: z.number().min(1, "Frecuencia mínima es 1 hora").max(48, "Frecuencia máxima es 48 horas"),
  via: z.string().min(1, "Debe especificar la vía de administración"),
  duracion_dias: z.number().min(1, "Duración mínima es 1 día").max(90, "Duración máxima es 90 días"),
});

export const admissionSchema = z.object({
  paciente_id: z.number().min(1, "Debe seleccionar un paciente"),
  sala_id: z.number().min(1, "Debe seleccionar una sala"),
  cama_id: z.number().min(1, "Debe seleccionar una cama"),
  medico_id: z.number().min(1, "Debe seleccionar un médico responsable"),
  diagnostico_ingreso: z.string().min(5, "El diagnóstico debe tener al menos 5 caracteres"),
  
  // Triage Signos Vitales (Opcionales al ingreso pero validados si se ingresan)
  presion_sistolica: z.number().min(50, "Sistólica mínima: 50").max(250, "Sistólica máxima: 250").optional().or(z.literal(0)),
  presion_diastolica: z.number().min(30, "Diastólica mínima: 30").max(150, "Diastólica máxima: 150").optional().or(z.literal(0)),
  frecuencia_cardiaca: z.number().min(30, "FC mínima: 30").max(220, "FC máxima: 220").optional().or(z.literal(0)),
  frecuencia_respiratoria: z.number().min(8, "FR mínima: 8").max(60, "FR máxima: 60").optional().or(z.literal(0)),
  temperatura: z.number().min(30, "Temp mínima: 30°C").max(45, "Temp máxima: 45°C").optional().or(z.literal(0)),
  saturacion_oxigeno: z.number().min(50, "SatO2 mínima: 50%").max(100, "SatO2 máxima: 100%").optional().or(z.literal(0)),
  peso_kg: z.number().min(1, "Peso mínimo: 1kg").max(300, "Peso máximo: 300kg").optional().or(z.literal(0)),
  talla_cm: z.number().min(30, "Talla mínima: 30cm").max(250, "Talla máxima: 250cm").optional().or(z.literal(0)),
  
  pre_prescripciones: z.array(prePrescriptionSchema),
});

export type AdmissionFormValues = z.infer<typeof admissionSchema>;
export type PrePrescriptionValues = z.infer<typeof prePrescriptionSchema>;
export default admissionSchema;
