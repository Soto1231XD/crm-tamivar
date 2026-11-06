import { apiRequest } from "@/shared/apiRequest";

export interface HistorialIngreso {
  id: number;
  empleado_id: number;
  fecha: string;
  tipo: string;
  descripcion: string | null;
  creado_en: string;
}

export const getHistorialIngresos = (empleadoId: number) =>
  apiRequest<HistorialIngreso[]>(`/historial-ingreso/empleado/${empleadoId}`);

export const reactivarEmpleado = (id: number, fechaReingreso: string) =>
  apiRequest<{ id: number; estatus: string }>(`/empleados/${id}/reactivar`, {
    method: "PATCH",
    data: { fecha_reingreso: fechaReingreso },
  });
