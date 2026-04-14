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
  const formData = buildUserFormData(payload);
  return apiRequest<UserRecord>('/users', {
    method: 'POST',
    data: formData,
  });
}

export async function updateUser(
  id: number,
  payload: UpdateUserPayload,
  accessToken?: string | null,
): Promise<UserRecord> {
  void accessToken;
  const formData = buildUserFormData(payload);
  return apiRequest<UserRecord>(`/users/${id}`, {
    method: 'PATCH',
    data: formData,
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

function buildUserFormData(payload: CreateUserPayload | UpdateUserPayload): FormData {
  const formData = new FormData();
  const { photoFile, ...data } = payload as (CreateUserPayload | UpdateUserPayload) & {
    photoFile?: File | null;
  };

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, String(item)));
      return;
    }

    formData.append(key, String(value));
  });

  if (photoFile instanceof File) {
    formData.append('file', photoFile);
  }

  return formData;
}
