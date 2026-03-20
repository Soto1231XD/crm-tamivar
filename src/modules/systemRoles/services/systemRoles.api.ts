import { apiRequest } from '../../../shared/apiRequest';
import type {
  CreateSystemRolePayload,
  SystemRoleRecord,
  UpdateSystemRolePayload,
} from '@/interfaces/system-role.interface';

export async function getSystemRoles(accessToken?: string | null): Promise<SystemRoleRecord[]> {
  void accessToken;
  const data = await apiRequest<SystemRoleRecord[]>('/roles');
  return Array.isArray(data) ? data : [];
}

export async function createSystemRole(
  payload: CreateSystemRolePayload,
  accessToken?: string | null,
): Promise<SystemRoleRecord> {
  void accessToken;
  return apiRequest<SystemRoleRecord>('/roles', {
    method: 'POST',
    data: payload,
  });
}

export async function updateSystemRole(
  roleId: number,
  payload: UpdateSystemRolePayload,
  accessToken?: string | null,
): Promise<SystemRoleRecord> {
  void accessToken;
  return apiRequest<SystemRoleRecord>(`/roles/${roleId}`, {
    method: 'PATCH',
    data: payload,
  });
}

export async function deleteSystemRole(
  roleId: number,
  accessToken?: string | null,
): Promise<void> {
  void accessToken;
  await apiRequest(`/roles/${roleId}`, {
    method: 'DELETE',
  });
}
