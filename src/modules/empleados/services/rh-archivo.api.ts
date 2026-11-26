import { apiRequest } from "@/shared/apiRequest";

export interface EmpleadoResumenItem {
  empleado_id: number;
  nombre: string;
  apellido_paterno: string;
  total: number;
  detalle: { tipo: string; count: number }[];
}

export interface ArchivoResumen {
  actas: EmpleadoResumenItem[];
  amonestaciones: EmpleadoResumenItem[];
  nominas: EmpleadoResumenItem[];
  incapacidades: EmpleadoResumenItem[];
  apoyos: EmpleadoResumenItem[];
  vacaciones: EmpleadoResumenItem[];
  faltas: EmpleadoResumenItem[];
  permisos: EmpleadoResumenItem[];
}

export const getArchivoAnios = () =>
  apiRequest<number[]>("/rh/archivo/anios");

export const getArchivoResumen = (year: number) =>
  apiRequest<ArchivoResumen>(`/rh/archivo/resumen/${year}`);
