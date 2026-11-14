import { apiRequest } from "@/shared/apiRequest";

export interface Empleado {
  id: number;
  tipo: "Empleado" | "Becario";
  periodicidad_sueldo: string;
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
  tipo_sangre: string | null;
  contacto_emergencia_nombre: string | null;
  contacto_emergencia_telefono: string | null;
  estatus: "Activo" | "Baja";
  creado_en: string;
  actualizado_en: string;
}

export type CreateEmpleadoPayload = {
  tipo?: "Empleado" | "Becario";
  periodicidad_sueldo?: string;
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
  tipo_sangre?: string;
  contacto_emergencia_nombre?: string;
  contacto_emergencia_telefono?: string;
};

export type UpdateEmpleadoPayload = Partial<CreateEmpleadoPayload> & {
  estatus?: "Activo" | "Baja";
};

export const getEmpleados = (params?: { estatus?: string; tipo?: string }) => {
  const qs = new URLSearchParams();
  if (params?.estatus) qs.set("estatus", params.estatus);
  if (params?.tipo)    qs.set("tipo", params.tipo);
  const q = qs.toString();
  return apiRequest<Empleado[]>("/empleados" + (q ? `?${q}` : ""));
};

export const convertirAEmpleado = (id: number) =>
  apiRequest<Empleado>(`/empleados/${id}/convertir-empleado`, { method: "PATCH" });

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
