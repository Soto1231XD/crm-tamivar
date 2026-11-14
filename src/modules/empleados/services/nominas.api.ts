import { apiRequest } from "@/shared/apiRequest";

export interface NominaEmpleado {
  id: number;
  empleado_id: number;
  folio: string | null;
  periodo_inicio: string;
  periodo_fin: string;
  fecha_pago: string;
  sueldo_periodo: string;
  otros_conceptos: string | null;
  descuentos_autorizados: string | null;
  otros_descuentos: string | null;
  total_pagado: string;
  observaciones: string | null;
  creado_en: string;
  actualizado_en: string;
}

export type CreateNominaPayload = {
  empleado_id: number;
  folio?: string;
  periodo_inicio: string;
  periodo_fin: string;
  fecha_pago: string;
  sueldo_periodo: number;
  otros_conceptos?: number;
  descuentos_autorizados?: number;
  otros_descuentos?: number;
  total_pagado: number;
  observaciones?: string;
};

export type UpdateNominaPayload = Partial<Omit<CreateNominaPayload, "empleado_id">>;

export const getNominasByEmpleado = (empleadoId: number) =>
  apiRequest<NominaEmpleado[]>(`/nominas-empleado/empleado/${empleadoId}`);

export const createNomina = (data: CreateNominaPayload) =>
  apiRequest<NominaEmpleado>("/nominas-empleado", { method: "POST", data });

export const updateNomina = (id: number, data: UpdateNominaPayload) =>
  apiRequest<NominaEmpleado>(`/nominas-empleado/${id}`, { method: "PATCH", data });

export const deleteNomina = (id: number) =>
  apiRequest<void>(`/nominas-empleado/${id}`, { method: "DELETE" });
