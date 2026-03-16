import { apiRequest } from '../../../shared/apiRequest';
import type {
  CreateUserPayload,
  RoleOptionRecord,
  ToggleUserStatusResponse,
  UpdateUserPayload,
  UserRecord,
} from '@/interfaces/user.interface';

export async function getUsers(accessToken?: string | null): Promise<UserRecord[]> {
  void accessToken;
  const data = await apiRequest<UserRecord[]>('/users');
  return Array.isArray(data) ? data : [];
}

export async function getRoles(accessToken?: string | null): Promise<RoleOptionRecord[]> {
  void accessToken;
  const data = await apiRequest<RoleOptionRecord[]>('/roles');
  return Array.isArray(data) ? data : [];
}

export async function createUser(payload: CreateUserPayload, accessToken?: string | null): Promise<UserRecord> {
  void accessToken;
  return apiRequest<UserRecord>('/users', {
    method: 'POST',
    data: payload,
  });
}

export async function updateUser(
  id: number,
  payload: UpdateUserPayload,
  accessToken?: string | null,
): Promise<UserRecord> {
  void accessToken;
  return apiRequest<UserRecord>(`/users/${id}`, {
    method: 'PATCH',
    data: payload,
  });
}

export async function toggleUserStatus(
  id: number,
  accessToken?: string | null,
): Promise<ToggleUserStatusResponse> {
  void accessToken;
  return apiRequest<ToggleUserStatusResponse>(`/users/${id}`, {
    method: 'DELETE',
  });
}
