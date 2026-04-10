import { apiRequest } from '../../../shared/apiRequest';
import type { CreateLeadPayload, LeadRecord, UpdateLeadPayload } from '@/interfaces/lead.interface';

const PATH = '/registros-leads';

export async function getLeadLeads(): Promise<LeadRecord[]> {
  const data = await apiRequest<LeadRecord[]>(PATH);
  return Array.isArray(data) ? data : [];
}

export async function createLeadLead(payload: CreateLeadPayload): Promise<LeadRecord> {
  return apiRequest<LeadRecord>(PATH, {
    method: 'POST',
    data: payload,
  });
}

export async function updateLeadLead(
  id: number,
  payload: UpdateLeadPayload,
): Promise<LeadRecord> {
  return apiRequest<LeadRecord>(`${PATH}/${id}`, {
    method: 'PATCH',
    data: payload,
  });
}

export async function deleteLeadLead(id: number): Promise<void> {
  await apiRequest<void>(`${PATH}/${id}`, {
    method: 'DELETE',
  });
}
