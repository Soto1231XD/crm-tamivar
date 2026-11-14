import { apiRequest } from "@/shared/apiRequest";

export interface Candidato {
  id: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  tipo: "Empleado" | "Becario";
  puesto_solicitado: string;
  area: string;
  telefono: string | null;
  correo: string | null;
  fecha_entrevista: string | null;
  notas: string | null;
  estatus: "Pendiente" | "Entrevistado" | "Aprobado" | "Rechazado";
  creado_en: string;
  actualizado_en: string;
}

export type CreateCandidatoPayload = {
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  tipo: "Empleado" | "Becario";
  puesto_solicitado: string;
  area: string;
  telefono?: string;
  correo?: string;
  fecha_entrevista?: string;
  notas?: string;
  estatus?: string;
};

export type UpdateCandidatoPayload = Partial<CreateCandidatoPayload>;

export const getCandidatos = () =>
  apiRequest<Candidato[]>("/candidatos");

export const createCandidato = (data: CreateCandidatoPayload) =>
  apiRequest<Candidato>("/candidatos", { method: "POST", data });

export const updateCandidato = (id: number, data: UpdateCandidatoPayload) =>
  apiRequest<Candidato>(`/candidatos/${id}`, { method: "PATCH", data });

export const deleteCandidato = (id: number) =>
  apiRequest<void>(`/candidatos/${id}`, { method: "DELETE" });
