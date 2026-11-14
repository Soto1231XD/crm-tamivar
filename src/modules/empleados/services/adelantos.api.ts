import { apiRequest } from "@/shared/apiRequest";

export interface AdelantoEmpleado {
  id: number;
  empleado_id: number;
  monto: string;
  forma_descuento: string;
  parcialidades: number | null;
  otro_descripcion: string | null;
  estatus: string;
  monto_recuperado: string;
  fecha_solicitud: string;
  creado_en: string;
  actualizado_en: string;
}

export type CreateAdelantoPayload = {
  empleado_id: number;
  monto: number;
  forma_descuento: string;
  parcialidades?: number;
  otro_descripcion?: string;
  estatus?: string;
};

export type UpdateAdelantoPayload = Partial<Omit<CreateAdelantoPayload, "empleado_id">> & {
  monto_recuperado?: number;
};

export const getAdelantosByEmpleado = (empleadoId: number) =>
  apiRequest<AdelantoEmpleado[]>(`/adelantos-empleado/empleado/${empleadoId}`);

export const createAdelanto = (data: CreateAdelantoPayload) =>
  apiRequest<AdelantoEmpleado>("/adelantos-empleado", { method: "POST", data });

export const updateAdelanto = (id: number, data: UpdateAdelantoPayload) =>
  apiRequest<AdelantoEmpleado>(`/adelantos-empleado/${id}`, { method: "PATCH", data });

export const deleteAdelanto = (id: number) =>
  apiRequest<void>(`/adelantos-empleado/${id}`, { method: "DELETE" });
