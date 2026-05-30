import * as z from "zod";

export const patientSchema = z.object({
  nombre: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(50, "Máximo 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s-]+$/, "Nombres solo deben contener letras"),
  apellidos: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(50, "Máximo 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s-]+$/, "Apellidos solo deben contener letras"),
  ci: z
    .string()
    .min(5, "El CI debe tener al menos 5 dígitos")
    .max(20, "El CI debe tener máximo 20 caracteres")
    .regex(/^\d+$/, "El CI solo debe contener números"),
  genero: z.enum(["masculino", "femenino", "otro"], {
    message: "Debe seleccionar el género",
  }),
  fecha_nacimiento: z
    .string()
    .min(1, "Debe ingresar la fecha de nacimiento")
    .refine((val) => {
      const birth = new Date(val);
      return birth < new Date();
    }, "La fecha de nacimiento debe ser en el pasado"),
  telefono: z
    .string()
    .regex(/^\d+$/, "El celular solo debe contener números")
    .refine((val) => {
      const num = Number(val);
      if (val.length === 8) {
        return num >= 60000000 && num <= 79999999;
      }
      return val.length >= 7 && val.length <= 15;
    }, "El celular debe tener entre 7 y 15 dígitos (celulares en Bolivia deben iniciar con 6 o 7, ej: 60000000 - 79999999)"),
  direccion: z.string().min(5, "Dirección demasiado corta (mínimo 5 caracteres)").max(255, "Máximo 255 caracteres"),
  nombre_referencia: z
    .string()
    .max(50, "Máximo 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s-]*$/, "Solo se permiten letras, espacios y guiones")
    .optional()
    .or(z.literal("")),
  apellidos_referencia: z
    .string()
    .max(50, "Máximo 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s-]*$/, "Solo se permiten letras, espacios y guiones")
    .optional()
    .or(z.literal("")),
  celular_referencia: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => {
      if (!val) return true;
      if (!/^\d+$/.test(val)) return false;
      const num = Number(val);
      if (val.length === 8) {
        return num >= 60000000 && num <= 79999999;
      }
      return val.length >= 7 && val.length <= 15;
    }, "El celular de referencia solo debe contener números y tener entre 7 y 15 dígitos (iniciar con 6 o 7 si es celular de 8 dígitos)"),
});

export type PatientFormValues = z.infer<typeof patientSchema>;

// Payload que el backend espera (con mapeo de campos)
export interface PatientBackendPayload {
  nombre: string;
  apellidos: string;
  ci: string;
  fecha_nacimiento: string;
  genero: "masculino" | "femenino" | "otro";
  telefono: string;
  direccion: string;
  nombre_referencia?: string;
  apellidos_referencia?: string;
  celular_referencia?: string;
  estado: boolean;
}

export function mapPatientFormToBackend(values: PatientFormValues): PatientBackendPayload {
  return {
    nombre: values.nombre,
    apellidos: values.apellidos,
    ci: values.ci,
    fecha_nacimiento: values.fecha_nacimiento,
    genero: values.genero,
    telefono: values.telefono,
    direccion: values.direccion,
    nombre_referencia: values.nombre_referencia || undefined,
    apellidos_referencia: values.apellidos_referencia || undefined,
    celular_referencia: values.celular_referencia || undefined,
    estado: true,
  };
}
