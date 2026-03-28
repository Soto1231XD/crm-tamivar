import { apiRequest } from "@/shared/apiRequest";
import type {
  PropertyRecord,
  CreatePropertyPayload,
  UpdatePropertyPayload,
} from "@/interfaces/property.interface";

const PATH = "/properties";

export type PropertySearchParams = {
  tipo_operacion?: string;
};

// Obtener todas las propiedades
export async function getProperties(): Promise<PropertyRecord[]> {
  return apiRequest<PropertyRecord[]>(PATH);
}

export async function searchProperties(
  params: PropertySearchParams,
): Promise<PropertyRecord[]> {
  return apiRequest<PropertyRecord[]>(`${PATH}/search`, {
    params,
  });
}

// Obtener una propiedad por ID
export async function getProperty(id: number): Promise<PropertyRecord> {
  return apiRequest<PropertyRecord>(`${PATH}/${id}`);
}

// Crear propiedad
export async function createProperty(
  payload: CreatePropertyPayload,
  files: File[],
): Promise<PropertyRecord> {
  const formData = new FormData();
  const carpetaId = payload.carpeta_id || crypto.randomUUID();

  // Agregar archivos al FormData
  files.forEach((file) => formData.append("files", file));

  // Agregar todo el JSON empaquetado en un solo campo llamado "datos"
  formData.append("datos", JSON.stringify({ ...payload, carpeta_id: carpetaId }));
  formData.append("carpeta_id", carpetaId);

  console.log("Archivos a punto de enviarse:", files.length, files);
  return apiRequest<PropertyRecord>(PATH, {
    method: "POST",
    data: formData,
  });
}

// Actualizar propiedad
export async function updateProperty(
  id: number,
  payload: UpdatePropertyPayload,
  files: File[] = [],
): Promise<PropertyRecord> {
  const formData = new FormData();

  // Si hay archivos nuevos, los agregamos
  if (files && files.length > 0) {
    files.forEach((file) => formData.append("files", file));
  }

  // Empaquetamos todo el JSON en el campo "datos"
  formData.append("datos", JSON.stringify(payload));

  return apiRequest<PropertyRecord>(`${PATH}/${id}`, {
    method: "PATCH",
    data: formData,
  });
}

// Eliminar propiedad
export async function deleteProperty(id: number): Promise<void> {
  return apiRequest<void>(`${PATH}/${id}`, {
    method: "DELETE",
  });
}
