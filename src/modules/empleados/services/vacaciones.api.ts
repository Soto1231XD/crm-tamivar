import { apiRequest } from "@/shared/apiRequest";

export interface Vacacion {
  id: number;
  empleado_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
  estatus: "Pendiente" | "Aprobada" | "Rechazada";
  creado_en: string;
  actualizado_en: string;
}

export type CreateVacacionPayload = {
  empleado_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
  estatus?: "Pendiente" | "Aprobada" | "Rechazada";
};

export type UpdateVacacionPayload = Partial<Omit<CreateVacacionPayload, "empleado_id">>;

export const getVacacionesByEmpleado = (empleadoId: number) =>
  apiRequest<Vacacion[]>(`/vacaciones/empleado/${empleadoId}`);

export const createVacacion = (data: CreateVacacionPayload) =>
  apiRequest<Vacacion>("/vacaciones", { method: "POST", data });

export const updateVacacion = (id: number, data: UpdateVacacionPayload) =>
  apiRequest<Vacacion>(`/vacaciones/${id}`, { method: "PATCH", data });

export const deleteVacacion = (id: number) =>
  apiRequest<void>(`/vacaciones/${id}`, { method: "DELETE" });

export function calcularDerechoVacaciones(anios: number): number {
  if (anios < 1)  return 0;
  if (anios === 1) return 12;
  if (anios === 2) return 14;
  if (anios === 3) return 16;
  if (anios === 4) return 18;
  if (anios === 5) return 20;
  if (anios <= 10) return 22;
  if (anios <= 15) return 24;
  if (anios <= 20) return 26;
  if (anios <= 25) return 28;
  if (anios <= 30) return 30;
  return 32;
}

// Calcula antigüedad en años completos desde fecha_ingreso
export function calcularAntigüedad(fechaIngreso: string): number {
  const ingreso = new Date(fechaIngreso);
  const hoy = new Date();
  let años = hoy.getFullYear() - ingreso.getFullYear();
  const m = hoy.getMonth() - ingreso.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < ingreso.getDate())) años--;
  return Math.max(0, años);
}

// Calcula días entre dos fechas (inclusivo)
export function calcularDias(fechaInicio: string, fechaFin: string): number {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const diff = fin.getTime() - inicio.getTime();
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
}
