import { differenceInYears } from "date-fns";

/**
 * Calcula la edad exacta de un paciente basándose en su fecha de nacimiento
 */
export function calculateAge(birthDateString: string | Date | null | undefined): number {
  if (!birthDateString) return 0;
  const birthDate = new Date(birthDateString);
  if (isNaN(birthDate.getTime())) return 0;
  return differenceInYears(new Date(), birthDate);
}

/**
 * Calcula el Índice de Masa Corporal (IMC) y retorna su clasificación clínica
 */
export function calculateBMI(
  weightKg: number | string | null | undefined,
  heightCm: number | string | null | undefined
): { bmi: number; classification: string; color: string; bg: string } {
  const w = typeof weightKg === "string" ? parseFloat(weightKg) : weightKg;
  const h = typeof heightCm === "string" ? parseFloat(heightCm) : heightCm;

  if (!w || !h || w <= 0 || h <= 0) {
    return { bmi: 0, classification: "S/D", color: "text-muted-foreground", bg: "bg-secondary/40" };
  }

  // Convertir altura a metros
  const heightMeters = h > 3 ? h / 100 : h; // si está en cm (>3), dividir entre 100
  const bmi = parseFloat((w / (heightMeters * heightMeters)).toFixed(1));

  let classification = "Normal";
  let color = "text-accent-teal";
  let bg = "bg-accent-teal/10 border-accent-teal/20";

  if (bmi < 18.5) {
    classification = "Bajo Peso";
    color = "text-primary";
    bg = "bg-primary/10 border-primary/20";
  } else if (bmi >= 25 && bmi < 30) {
    classification = "Sobrepeso";
    color = "text-accent-amber";
    bg = "bg-accent-amber/10 border-accent-amber/20";
  } else if (bmi >= 30) {
    classification = "Obesidad";
    color = "text-destructive";
    bg = "bg-destructive/10 border-destructive/20";
  }

  return { bmi, classification, color, bg };
}

/**
 * Formatea una Cédula de Identidad (CI) de Bolivia con su extensión departamental
 */
export function formatBoliviaCI(ci: string | number | null | undefined, ext?: string): string {
  if (!ci) return "S/N";
  const base = ci.toString().trim();
  const department = ext ? ext.toUpperCase().trim() : "";
  return department ? `${base} - ${department}` : base;
}

/**
 * Formatea un número de celular de Bolivia al estándar visual
 */
export function formatBoliviaPhone(phone: string | number | null | undefined): string {
  if (!phone) return "S/N";
  const raw = phone.toString().replace(/\D/g, "");
  if (raw.length === 8) {
    return `${raw.slice(0, 4)} - ${raw.slice(4)}`;
  }
  return phone.toString();
}

/**
 * Genera un enlace de WhatsApp Web para compartir de forma ágil datos clínicos
 */
export function generateWhatsAppLink(phone: string | null | undefined, text: string): string {
  if (!phone) return "";
  const rawPhone = phone.toString().replace(/\D/g, "");
  // Agregar prefijo de Bolivia (591) si tiene 8 dígitos y no lo tiene
  const formattedPhone = rawPhone.length === 8 ? `591${rawPhone}` : rawPhone;
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${formattedPhone}?text=${encodedText}`;
}
