import api from "@/services/api";

export interface DischargePayload {
  tipo_alta: string;
  observaciones_alta?: string;
}

export async function darDeAlta(
  internacionId: number,
  payload: DischargePayload
): Promise<void> {
  await api.put(`/internaciones/${internacionId}/alta`, payload);
}

export async function descargarEpicrisis(
  internacionId: number,
  apellidos: string,
  ci: string
): Promise<void> {
  const res = await api.get(`/reportes/epicrisis/${internacionId}`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([res.data as BlobPart]));
  const link = document.createElement("a");
  link.href = url;
  const date = new Date().toLocaleDateString("es-ES").replace(/\//g, "");
  link.setAttribute("download", `Epicrisis_${apellidos}_${ci}_${date}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function descargarEvolucionClinica(
  internacionId: number,
  apellidos: string,
  ci: string
): Promise<void> {
  const res = await api.get(`/reportes/evolucion-clinica/${internacionId}`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([res.data as BlobPart]));
  const link = document.createElement("a");
  link.href = url;
  const date = new Date().toLocaleDateString("es-ES").replace(/\//g, "");
  link.setAttribute("download", `EvolucionClinica_${apellidos}_${ci}_${date}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
