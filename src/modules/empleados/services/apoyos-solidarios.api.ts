import { apiRequest } from "@/shared/apiRequest";

export interface ApoSolidario {
  id: number;
  empleado_id: number;
  fecha_incidente: string;
  hora_incidente: string;
  descripcion: string;
  monto: string;
  estatus: "Pendiente" | "Autorizado" | "Cancelado";
  creado_en: string;
  actualizado_en: string;
}

export type CreateApoSolidarioPayload = {
  empleado_id: number;
  fecha_incidente: string;
  hora_incidente: string;
  descripcion: string;
  monto: string;
  estatus?: "Pendiente" | "Autorizado" | "Cancelado";
};

export type UpdateApoSolidarioPayload = Partial<Omit<CreateApoSolidarioPayload, "empleado_id">>;

export const getApoyosByEmpleado = (empleadoId: number) =>
  apiRequest<ApoSolidario[]>(`/apoyos-solidarios/empleado/${empleadoId}`);

export const createApoSolidario = (data: CreateApoSolidarioPayload) =>
  apiRequest<ApoSolidario>("/apoyos-solidarios", { method: "POST", data });

export const updateApoSolidario = (id: number, data: UpdateApoSolidarioPayload) =>
  apiRequest<ApoSolidario>(`/apoyos-solidarios/${id}`, { method: "PATCH", data });

export const deleteApoSolidario = (id: number) =>
  apiRequest<void>(`/apoyos-solidarios/${id}`, { method: "DELETE" });
