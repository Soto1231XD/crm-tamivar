import { apiRequest } from '../../../shared/apiRequest';

export type LeadRecord = {
  id: number;
  nombres: string;
  apellidos: string;
  lada?: string | null;
  telefono: string | number;
  correo_electronico?: string | null;
  comentarios?: string | null;
  estado?: string | null;
  prioridad?: string | null;
  creado_en?: string;
  propiedad_id: number;
  creador?: {
    id: number;
    nombres?: string | null;
    apellido_paterno?: string | null;
  } | null;
  propiedad?: {
    direccion?: {
      calle?: string;
      municipio?: string;
      fraccionamiento?: string;
    };
  } | null;
};

export type CreateLeadPayload = {
  nombres: string;
  apellidos: string;
  telefono: string;
  propiedad_id: number;
  creado_por_id: number;
  lada?: string;
  correo_electronico?: string;
  comentarios?: string;
  estado?: string;
  prioridad: string;
};

export type UpdateLeadPayload = {
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  propiedad_id?: number;
  lada?: string;
  correo_electronico?: string;
  comentarios?: string;
  estado?: string;
  prioridad?: string;
};

export async function getLeads(): Promise<LeadRecord[]> {
  const data = await apiRequest<LeadRecord[]>('/registros');
  return Array.isArray(data) ? data : [];
}

export async function createLead(payload: CreateLeadPayload, accessToken?: string | null): Promise<LeadRecord> {
  void accessToken;
  return apiRequest<LeadRecord>('/registros', {
    method: 'POST',
    data: payload,
  });
}

export async function updateLead(
  id: number,
  payload: UpdateLeadPayload,
  accessToken?: string | null,
): Promise<LeadRecord> {
  void accessToken;
  return apiRequest<LeadRecord>(`/registros/${id}`, {
    method: 'PATCH',
    data: payload,
  });
}

export async function deleteLead(id: number, accessToken?: string | null): Promise<void> {
  void accessToken;
  await apiRequest<void>(`/registros/${id}`, {
    method: 'DELETE',
  });
}
