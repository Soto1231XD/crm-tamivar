import { apiRequest } from "@/shared/apiRequest";

export interface Falta {
  id: number;
  empleado_id: number;
  fecha: string;
  tipo: "Justificada" | "Injustificada";
  descripcion: string | null;
  creado_en: string;
  actualizado_en: string;
}

export type CreateFaltaPayload = {
  empleado_id: number;
  fecha: string;
  tipo: "Justificada" | "Injustificada";
  descripcion?: string;
};

export type UpdateFaltaPayload = Partial<Omit<CreateFaltaPayload, "empleado_id">>;

export const getFaltasByEmpleado = (empleadoId: number) =>
  apiRequest<Falta[]>(`/faltas/empleado/${empleadoId}`);

export const createFalta = (data: CreateFaltaPayload) =>
  apiRequest<Falta>("/faltas", { method: "POST", data });

export const updateFalta = (id: number, data: UpdateFaltaPayload) =>
  apiRequest<Falta>(`/faltas/${id}`, { method: "PATCH", data });

export const deleteFalta = (id: number) =>
  apiRequest<void>(`/faltas/${id}`, { method: "DELETE" });
