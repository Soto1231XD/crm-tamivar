import { apiRequest } from '@/shared/apiRequest';
import type {
  CreateLeadRequestPayload,
  LeadRequestRecord,
  UpdateLeadRequestPayload,
} from '@/interfaces/lead-request.interface';

const PATH = '/solicitudes-leads';

export async function getLeadRequests(): Promise<LeadRequestRecord[]> {
  const data = await apiRequest<LeadRequestRecord[]>(PATH);
  return Array.isArray(data) ? data : [];
}

export async function createLeadRequest(payload: CreateLeadRequestPayload): Promise<LeadRequestRecord> {
  return apiRequest<LeadRequestRecord>(PATH, {
    method: 'POST',
    data: payload,
  });
}

export async function updateLeadRequest(
  id: number,
  payload: UpdateLeadRequestPayload,
): Promise<LeadRequestRecord> {
  return apiRequest<LeadRequestRecord>(`${PATH}/${id}`, {
    method: 'PATCH',
    data: payload,
  });
}

export async function deleteLeadRequest(id: number): Promise<void> {
  await apiRequest<void>(`${PATH}/${id}`, {
    method: 'DELETE',
  });
}
