/**
 * Extracts human-readable validation messages from a Laravel 422 response.
 * Laravel returns: { message: "The given data was invalid.", errors: { field: ["msg1", "msg2"] } }
 */
export interface LaravelValidationError {
  message?: string;
  errors?: Record<string, string[]>;
}

export function extractValidationErrors(err: unknown): string {
  const response = (err as { response?: { data?: LaravelValidationError; status?: number } })?.response;
  if (response?.status === 422 && response.data?.errors) {
    const errorEntries = Object.entries(response.data.errors);
    if (errorEntries.length > 0) {
      return errorEntries
        .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
        .join("; ");
    }
    return response.data.message || "Datos de entrada inválidos. Verifique los campos.";
  }
  const genericMsg = (err as { message?: string })?.message;
  return genericMsg || "Error de comunicación con el servidor clínico.";
}

export function getFirstValidationError(err: unknown): string {
  const response = (err as { response?: { data?: LaravelValidationError; status?: number } })?.response;
  if (response?.status === 422 && response.data?.errors) {
    const firstField = Object.values(response.data.errors)[0];
    if (Array.isArray(firstField) && firstField.length > 0) {
      return firstField[0];
    }
    return response.data.message || "Datos inválidos.";
  }
  return (err as { message?: string })?.message || "Error del servidor.";
}
