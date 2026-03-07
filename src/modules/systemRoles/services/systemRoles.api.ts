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
