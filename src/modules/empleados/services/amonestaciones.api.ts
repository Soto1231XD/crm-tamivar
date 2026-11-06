import { apiRequest } from "@/shared/apiRequest";

export interface Amonestacion {
  id: number;
  empleado_id: number;
  fecha: string;
  tipo: string;
  descripcion: string | null;
  creado_en: string;
}

export type CreateAmonestacionPayload = {
  empleado_id: number;
  fecha: string;
  tipo: string;
  descripcion?: string;
};

export type UpdateAmonestacionPayload = Partial<Omit<CreateAmonestacionPayload, "empleado_id">>;

export const getAmonestacionesByEmpleado = (empleadoId: number) =>
  apiRequest<Amonestacion[]>(`/amonestaciones/empleado/${empleadoId}`);

export const createAmonestacion = (data: CreateAmonestacionPayload) =>
  apiRequest<Amonestacion>("/amonestaciones", { method: "POST", data });

export const updateAmonestacion = (id: number, data: UpdateAmonestacionPayload) =>
  apiRequest<Amonestacion>(`/amonestaciones/${id}`, { method: "PATCH", data });

export const deleteAmonestacion = (id: number) =>
  apiRequest<void>(`/amonestaciones/${id}`, { method: "DELETE" });
