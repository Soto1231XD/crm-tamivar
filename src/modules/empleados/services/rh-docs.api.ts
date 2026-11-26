import { apiRequest } from "@/shared/apiRequest";
import api from "@/shared/apiRequest";

export interface RhArea {
  id: number;
  nombre: string;
  color: string;
  creado_en: string;
  _count?: { documentos: number };
}

export interface RhDocumento {
  id: number;
  nombre: string;
  descripcion: string | null;
  archivo: string;
  mime_type: string;
  area_id: number;
  creado_en: string;
}

/* ── Áreas ── */
export const getRhAreas = () =>
  apiRequest<RhArea[]>("/rh/docs/areas");

export const createRhArea = (data: { nombre: string; color: string }) =>
  apiRequest<RhArea>("/rh/docs/areas", { method: "POST", data });

export const updateRhArea = (id: number, data: { nombre?: string; color?: string }) =>
  apiRequest<RhArea>(`/rh/docs/areas/${id}`, { method: "PATCH", data });

export const deleteRhArea = (id: number) =>
  apiRequest<void>(`/rh/docs/areas/${id}`, { method: "DELETE" });

/* ── Documentos ── */
export const getRhDocumentos = (areaId: number) =>
  apiRequest<RhDocumento[]>(`/rh/docs/areas/${areaId}/documentos`);

export const uploadRhDocumento = (
  areaId: number,
  file: File,
  nombre: string,
  descripcion?: string,
): Promise<RhDocumento> => {
  const form = new FormData();
  form.append("file", file);
  form.append("nombre", nombre);
  if (descripcion) form.append("descripcion", descripcion);
  return apiRequest<RhDocumento>(`/rh/docs/areas/${areaId}/documentos`, {
    method: "POST",
    data: form,
  });
};

export const deleteRhDocumento = (id: number) =>
  apiRequest<void>(`/rh/docs/documentos/${id}`, { method: "DELETE" });

export const downloadRhDocumento = async (doc: RhDocumento): Promise<void> => {
  const fileExt = doc.archivo.split(".").pop() ?? "";
  const filename = `${doc.nombre}.${fileExt}`;
  const res = await api.get<Blob>(`/rh/docs/documentos/${doc.id}/download`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/* helper so the page can show a file-type icon */
export function mimeToExt(mime: string): string {
  if (mime === "application/pdf") return "PDF";
  if (mime.includes("word")) return "Word";
  if (mime.startsWith("image/")) return "Imagen";
  return "Archivo";
}
