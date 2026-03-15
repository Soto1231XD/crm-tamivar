import { apiRequest } from '../../../shared/apiRequest';

export type RoleOptionRecord = {
  id: number;
  rol: string;
};

export type UserRoleRecord =
  | string
  | {
      rol?:
        | string
        | {
            id?: number;
            rol?: string | null;
            nombre?: string | null;
          }
        | null;
      nombre?: string | null;
    };

export type UserRecord = {
  id: number;
  nombres?: string | null;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  telefono?: string | number | null;
  correo_electronico?: string | null;
  foto_url?: string | null;
  folio_certificacion?: string | null;
  activo?: boolean | null;
  rol?: UserRoleRecord | string | null;
  roles?: UserRoleRecord[] | string[] | null;
};

export type CreateUserPayload = {
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  telefono: string;
  correo_electronico: string;
  contrasena: string;
  foto_url?: string;
  folio_certificacion?: string;
  creado_por_id?: number;
  roles_ids: number[];
};

export type UpdateUserPayload = Partial<CreateUserPayload>;

export type ToggleUserStatusResponse = {
  message: string;
  activo: boolean;
};

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
