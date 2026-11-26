import { apiRequest } from "@/shared/apiRequest";

export interface ActaAdministrativa {
  id: number;
  empleado_id: number;
  tipo: string;
  fecha_acta: string;
  hora_inicio: string;
  hora_cierre: string;
  fecha_hechos: string | null;
  empleado_clave_ine: string | null;
  testigo_nombre: string | null;
  testigo_clave_ine: string | null;
  hechos: string | null;
  declaracion_testigo: string | null;
  plan_mejora: boolean;
  plan_mejora_data: string | null;
  creado_en: string;
  actualizado_en: string;
}

export type CreateActaPayload = {
  empleado_id: number;
  tipo?: string;
  fecha_acta: string;
  hora_inicio: string;
  hora_cierre: string;
  fecha_hechos?: string;
  empleado_clave_ine?: string;
  testigo_nombre?: string;
  testigo_clave_ine?: string;
  hechos?: string;
  declaracion_testigo?: string;
  plan_mejora?: boolean;
  plan_mejora_data?: string;
};

export type UpdateActaPayload = Partial<Omit<CreateActaPayload, "empleado_id">>;

export const getActasByEmpleado = (empleadoId: number) =>
  apiRequest<ActaAdministrativa[]>(`/actas-administrativas/empleado/${empleadoId}`);

export const createActa = (data: CreateActaPayload) =>
  apiRequest<ActaAdministrativa>("/actas-administrativas", { method: "POST", data });

export const updateActa = (id: number, data: UpdateActaPayload) =>
  apiRequest<ActaAdministrativa>(`/actas-administrativas/${id}`, { method: "PATCH", data });

export const deleteActa = (id: number) =>
  apiRequest<void>(`/actas-administrativas/${id}`, { method: "DELETE" });
