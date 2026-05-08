import { apiRequest } from '../../../shared/apiRequest';
import type { CreateLeadPayload, LeadRecord, UpdateLeadPayload } from '@/interfaces/lead.interface';

export async function getLeads(): Promise<LeadRecord[]> {
  const data = await apiRequest<LeadRecord[]>('/registros');
  return Array.isArray(data) ? data : [];
}

export async function getLeadsByProperty(propertyId: number): Promise<LeadRecord[]> {
  const data = await apiRequest<LeadRecord[]>(`/registros/property/${propertyId}`);
  return Array.isArray(data) ? data : [];
}

export async function getLeadsByDevelopment(developmentId: number): Promise<LeadRecord[]> {
  const data = await apiRequest<LeadRecord[]>(`/registros/development/${developmentId}`);
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
