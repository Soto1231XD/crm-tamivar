import { apiRequest } from "@/shared/apiRequest";

export interface PermisoEmpleado {
  id: number;
  empleado_id: number;
  fecha: string;
  tipo: "Personal" | "Médico" | "Familiar" | "Tardanza" | "Entrada Tarde" | "Inasistencia" | "Lactancia" | "Falta Justificada" | "Permiso para llegar tarde";
  con_goce: boolean;
  descripcion?: string;
  hora_llegada?: string | null;
  fecha_recuperacion?: string | null;
  estatus: "Pendiente" | "Aprobado" | "Rechazado";
  creado_en: string;
  actualizado_en: string;
}

export type CreatePermisoPayload = {
  empleado_id: number;
  fecha: string;
  tipo: "Personal" | "Médico" | "Familiar" | "Tardanza" | "Entrada Tarde" | "Inasistencia" | "Lactancia" | "Falta Justificada" | "Permiso para llegar tarde";
  con_goce: boolean;
  descripcion?: string;
  hora_llegada?: string | null;
  fecha_recuperacion?: string | null;
  estatus?: "Pendiente" | "Aprobado" | "Rechazado";
};

export type UpdatePermisoPayload = Partial<Omit<CreatePermisoPayload, "empleado_id">>;

export const getPermisosByEmpleado = (empleadoId: number) =>
  apiRequest<PermisoEmpleado[]>(`/permisos-empleado/empleado/${empleadoId}`);

export const createPermiso = (data: CreatePermisoPayload) =>
  apiRequest<PermisoEmpleado>("/permisos-empleado", { method: "POST", data });

export const updatePermiso = (id: number, data: UpdatePermisoPayload) =>
  apiRequest<PermisoEmpleado>(`/permisos-empleado/${id}`, { method: "PATCH", data });

export const deletePermiso = (id: number) =>
  apiRequest<void>(`/permisos-empleado/${id}`, { method: "DELETE" });
