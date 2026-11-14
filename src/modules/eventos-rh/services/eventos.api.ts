import { apiRequest } from "@/shared/apiRequest";

export interface EmpleadoResumen {
  id: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  puesto: string;
}

export interface EventoParticipante {
  id: number;
  evento_id: number;
  empleado_id: number | null;
  nombre_externo: string | null;
  empleado: EmpleadoResumen | null;
}

export interface EventoGasto {
  id: number;
  evento_id: number;
  concepto: string;
  monto: string;
}

export interface EventoRH {
  id: number;
  nombre: string;
  fecha: string;
  descripcion: string | null;
  creado_en: string;
  actualizado_en: string;
  participantes: EventoParticipante[];
  gastos: EventoGasto[];
}

export const getEventos = () => apiRequest<EventoRH[]>("/eventos-rh");

export const getEvento = (id: number) => apiRequest<EventoRH>(`/eventos-rh/${id}`);

export const createEvento = (data: { nombre: string; fecha: string; descripcion?: string }) =>
  apiRequest<EventoRH>("/eventos-rh", { method: "POST", data });

export const updateEvento = (id: number, data: { nombre?: string; fecha?: string; descripcion?: string }) =>
  apiRequest<EventoRH>(`/eventos-rh/${id}`, { method: "PATCH", data });

export const deleteEvento = (id: number) =>
  apiRequest<void>(`/eventos-rh/${id}`, { method: "DELETE" });

export const addParticipante = (eventoId: number, data: { empleado_id?: number; nombre_externo?: string }) =>
  apiRequest<EventoParticipante>(`/eventos-rh/${eventoId}/participantes`, { method: "POST", data });

export const removeParticipante = (participanteId: number) =>
  apiRequest<void>(`/eventos-rh/participantes/${participanteId}`, { method: "DELETE" });

export const addGasto = (eventoId: number, data: { concepto: string; monto: number }) =>
  apiRequest<EventoGasto>(`/eventos-rh/${eventoId}/gastos`, { method: "POST", data });

export const removeGasto = (gastoId: number) =>
  apiRequest<void>(`/eventos-rh/gastos/${gastoId}`, { method: "DELETE" });

export const getReporte = (desde: string, hasta: string) =>
  apiRequest<EventoRH[]>(`/eventos-rh/reporte?desde=${desde}&hasta=${hasta}`);
