import { apiRequest } from '../../../shared/apiRequest';

export type PermissionRecord = {
  id: number;
  modulo: string;
  accion: string;
};

export type RolePermissionRecord = {
  permiso: PermissionRecord;
};

export type SystemRoleRecord = {
  id: number;
  rol: string;
  permisos?: RolePermissionRecord[];
};

export type CreateSystemRolePayload = {
  rol: string;
  permisosIds: number[];
};

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
