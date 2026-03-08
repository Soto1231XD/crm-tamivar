const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

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
  const response = await fetch(`${API_URL}/roles`, {
    method: 'GET',
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  const data = (await response.json().catch(() => null)) as SystemRoleRecord[] | null;

  if (!response.ok || !Array.isArray(data)) {
    return [];
  }

  return data;
}

export async function createSystemRole(
  payload: CreateSystemRolePayload,
  accessToken?: string | null,
): Promise<SystemRoleRecord> {
  const response = await fetch(`${API_URL}/roles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | SystemRoleRecord
    | { message?: string | string[] }
    | null;

  if (!response.ok || !data || Array.isArray(data)) {
    const message = Array.isArray((data as { message?: string | string[] } | null)?.message)
      ? ((data as { message: string[] }).message[0] ?? 'No fue posible crear el rol.')
      : typeof (data as { message?: string | string[] } | null)?.message === 'string'
        ? (data as { message: string }).message
        : 'No fue posible crear el rol.';
    throw new Error(message);
  }

  return data as SystemRoleRecord;
}
