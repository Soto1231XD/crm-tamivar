import { apiRequest } from "@/shared/apiRequest";

export interface DatosVehiculo {
  marca: string;
  modelo: string;
  anio: string;
  color: string;
  placas: string;
  num_serie: string;
}

export interface FilaMaterial {
  herramienta: string;
  descripcion: string;
  uso: string;
}

export interface DatosMateriales {
  filas: FilaMaterial[];
  fecha_entrega: string;
  fecha_devolucion?: string;
  condiciones?: string;
  fotos?: string[];
}

export type TipoResponsiva = "Vehículo" | "Materiales" | "Herramientas";

export interface FilaHerramienta {
  herramienta: string;
  marca_modelo: string;
  num_serie: string;
  estado: "Nuevo" | "Bueno" | "Regular" | "Usado";
  observaciones: string;
}

export interface DatosHerramientas {
  lugar_trabajo: string;
  usos: string[];
  filas: FilaHerramienta[];
  fecha_entrega: string;
  fecha_devolucion?: string;
}

export interface ResponsivaEmpleado {
  id: number;
  empleado_id: number;
  tipo: TipoResponsiva;
  fecha: string;
  datos: string;
  creado_en: string;
  actualizado_en: string;
}

export type CreateResponsivaPayload = {
  empleado_id: number;
  tipo: TipoResponsiva;
  fecha: string;
  datos: string;
};

export type UpdateResponsivaPayload = Partial<Omit<CreateResponsivaPayload, "empleado_id">>;

export const getResponsivasByEmpleado = (empleadoId: number) =>
  apiRequest<ResponsivaEmpleado[]>(`/responsivas-empleado/empleado/${empleadoId}`);

export const createResponsiva = (data: CreateResponsivaPayload) =>
  apiRequest<ResponsivaEmpleado>("/responsivas-empleado", { method: "POST", data });

export const updateResponsiva = (id: number, data: UpdateResponsivaPayload) =>
  apiRequest<ResponsivaEmpleado>(`/responsivas-empleado/${id}`, { method: "PATCH", data });

export const deleteResponsiva = (id: number) =>
  apiRequest<void>(`/responsivas-empleado/${id}`, { method: "DELETE" });
