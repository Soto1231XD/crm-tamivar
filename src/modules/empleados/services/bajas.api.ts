import { apiRequest } from "@/shared/apiRequest";

export interface Baja {
  id: number;
  empleado_id: number;
  fecha_baja: string;
  tipo: "Renuncia" | "Despido" | "Fin de contrato";
  descripcion?: string;
  creado_en: string;
  actualizado_en: string;
}

export type CreateBajaPayload = {
  empleado_id: number;
  fecha_baja: string;
  tipo: "Renuncia" | "Despido" | "Fin de contrato";
  descripcion?: string;
};

export type UpdateBajaPayload = Partial<Omit<CreateBajaPayload, "empleado_id">>;

export const getBajasByEmpleado = (empleadoId: number) =>
  apiRequest<Baja[]>(`/bajas/empleado/${empleadoId}`);

export const createBaja = (data: CreateBajaPayload) =>
  apiRequest<Baja>("/bajas", { method: "POST", data });

export const updateBaja = (id: number, data: UpdateBajaPayload) =>
  apiRequest<Baja>(`/bajas/${id}`, { method: "PATCH", data });

export const deleteBaja = (id: number) =>
  apiRequest<void>(`/bajas/${id}`, { method: "DELETE" });
