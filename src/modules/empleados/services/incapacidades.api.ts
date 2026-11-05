import { apiRequest } from "@/shared/apiRequest";

export interface Incapacidad {
  id: number;
  empleado_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
  tipo: "IMSS" | "Particular";
  descripcion?: string;
  estatus: "Pendiente" | "Aprobada" | "Rechazada";
  creado_en: string;
  actualizado_en: string;
}

export type CreateIncapacidadPayload = {
  empleado_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
  tipo: "IMSS" | "Particular";
  descripcion?: string;
  estatus?: "Pendiente" | "Aprobada" | "Rechazada";
};

export type UpdateIncapacidadPayload = Partial<Omit<CreateIncapacidadPayload, "empleado_id">>;

export const getIncapacidadesByEmpleado = (empleadoId: number) =>
  apiRequest<Incapacidad[]>(`/incapacidades/empleado/${empleadoId}`);

export const createIncapacidad = (data: CreateIncapacidadPayload) =>
  apiRequest<Incapacidad>("/incapacidades", { method: "POST", data });

export const updateIncapacidad = (id: number, data: UpdateIncapacidadPayload) =>
  apiRequest<Incapacidad>(`/incapacidades/${id}`, { method: "PATCH", data });

export const deleteIncapacidad = (id: number) =>
  apiRequest<void>(`/incapacidades/${id}`, { method: "DELETE" });

export function calcularDiasIncapacidad(fechaInicio: string, fechaFin: string): number {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const diff = fin.getTime() - inicio.getTime();
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
}
