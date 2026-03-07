const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

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
  const response = await fetch(`${API_URL}/users`, {
    method: 'GET',
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  const data = (await response.json().catch(() => null)) as UserRecord[] | null;

  if (!response.ok || !Array.isArray(data)) {
    return [];
  }

  return data;
}

export async function getRoles(accessToken?: string | null): Promise<RoleOptionRecord[]> {
  const response = await fetch(`${API_URL}/roles`, {
    method: 'GET',
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  const data = (await response.json().catch(() => null)) as RoleOptionRecord[] | null;

  if (!response.ok || !Array.isArray(data)) {
    return [];
  }

  return data;
}

export async function createUser(
  payload: CreateUserPayload,
  accessToken?: string | null,
): Promise<UserRecord> {
  const response = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as UserRecord | { message?: string | string[] } | null;

  if (!response.ok || !data || Array.isArray(data)) {
    const message = Array.isArray((data as { message?: string | string[] } | null)?.message)
      ? ((data as { message: string[] }).message[0] ?? 'No fue posible crear el usuario.')
      : typeof (data as { message?: string | string[] } | null)?.message === 'string'
        ? (data as { message: string }).message
        : 'No fue posible crear el usuario.';
    throw new Error(message);
  }

  return data as UserRecord;
}

export async function updateUser(
  id: number,
  payload: UpdateUserPayload,
  accessToken?: string | null,
): Promise<UserRecord> {
  const response = await fetch(`${API_URL}/users/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as UserRecord | { message?: string | string[] } | null;

  if (!response.ok || !data || Array.isArray(data)) {
    const message = Array.isArray((data as { message?: string | string[] } | null)?.message)
      ? ((data as { message: string[] }).message[0] ?? 'No fue posible actualizar el usuario.')
      : typeof (data as { message?: string | string[] } | null)?.message === 'string'
        ? (data as { message: string }).message
        : 'No fue posible actualizar el usuario.';
    throw new Error(message);
  }

  return data as UserRecord;
}

export async function toggleUserStatus(
  id: number,
  accessToken?: string | null,
): Promise<ToggleUserStatusResponse> {
  const response = await fetch(`${API_URL}/users/${id}`, {
    method: 'DELETE',
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  const data = (await response.json().catch(() => null)) as ToggleUserStatusResponse | { message?: string | string[] } | null;

  if (!response.ok || !data || Array.isArray(data)) {
    const message = Array.isArray((data as { message?: string | string[] } | null)?.message)
      ? ((data as { message: string[] }).message[0] ?? 'No fue posible cambiar el estado del usuario.')
      : typeof (data as { message?: string | string[] } | null)?.message === 'string'
        ? (data as { message: string }).message
        : 'No fue posible cambiar el estado del usuario.';
    throw new Error(message);
  }

  return data as ToggleUserStatusResponse;
}
