import { apiRequest } from '../../../shared/apiRequest';
import type { LeadRecord } from '@/interfaces/lead.interface';

const PATH = '/asesor-externo';

export type CreateAsesorExternoPayload = {
  nombres: string;
  apellidos: string;
  telefono: string;
  creado_por_id: number;
  estado: string;
  prioridad: string;
  operacion: string;
  comentarios?: string;
  solicitud?: string;
  presupuesto?: number;
  ubicacion_propiedad?: string;
  metodo_pago?: string;
  caracteristicas?: string;
  fecha_registro?: string;
};

export type UpdateAsesorExternoPayload = Partial<CreateAsesorExternoPayload> & {
  registro_lead_id?: number;
};

export async function getAsesorExternoLeads(): Promise<LeadRecord[]> {
  const data = await apiRequest<LeadRecord[]>(PATH);
  return Array.isArray(data) ? data : [];
}

export async function createAsesorExternoLead(
  payload: CreateAsesorExternoPayload,
): Promise<LeadRecord> {
  return apiRequest<LeadRecord>(PATH, { method: 'POST', data: payload });
}

export async function updateAsesorExternoLead(
  id: number,
  payload: UpdateAsesorExternoPayload,
): Promise<LeadRecord> {
  return apiRequest<LeadRecord>(`${PATH}/${id}`, {
    method: 'PATCH',
    data: payload,
  });
}

export async function deleteAsesorExternoLead(id: number): Promise<void> {
  await apiRequest<void>(`${PATH}/${id}`, { method: 'DELETE' });
}
