import { apiRequest } from "@/shared/apiRequest";

export interface Empleado {
  id: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  area: string;
  puesto: string;
  fecha_ingreso: string;
  sueldo: string;
  foto_url: string | null;
  telefono: string | null;
  correo: string | null;
  curp: string | null;
  rfc: string | null;
  genero: string | null;
  nss: string | null;
  direccion: string | null;
  estatus: "Activo" | "Baja";
  creado_en: string;
  actualizado_en: string;
}

export type CreateEmpleadoPayload = {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  area: string;
  puesto: string;
  fecha_ingreso: string;
  sueldo: number;
  telefono?: string;
  correo?: string;
  curp?: string;
  rfc?: string;
  genero?: string;
  nss?: string;
  direccion?: string;
};

export type UpdateEmpleadoPayload = Partial<CreateEmpleadoPayload> & {
  estatus?: "Activo" | "Baja";
};

export const getEmpleados = (estatus?: string) =>
  apiRequest<Empleado[]>("/empleados" + (estatus ? `?estatus=${estatus}` : ""));

export const getEmpleado = (id: number) =>
  apiRequest<Empleado>(`/empleados/${id}`);

export const createEmpleado = (data: CreateEmpleadoPayload) =>
  apiRequest<Empleado>("/empleados", { method: "POST", data });

export const updateEmpleado = (id: number, data: UpdateEmpleadoPayload) =>
  apiRequest<Empleado>(`/empleados/${id}`, { method: "PATCH", data });

export const deleteEmpleado = (id: number) =>
  apiRequest<void>(`/empleados/${id}`, { method: "DELETE" });

export const uploadFotoEmpleado = (id: number, file: File) => {
  const form = new FormData();
  form.append("file", file);
  return apiRequest<Empleado>(`/empleados/${id}/foto`, { method: "PATCH", data: form });
};
