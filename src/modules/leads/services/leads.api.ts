const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

export type LeadRecord = {
  id: number;
  nombres: string;
  apellidos: string;
  lada?: string | null;
  telefono: string | number;
  correo_electronico?: string | null;
  comentarios?: string | null;
  estado?: string | null;
  creado_en?: string;
  propiedad_id: number;
  propiedad?: {
    direccion?: {
      calle?: string;
      municipio?: string;
      fraccionamiento?: string;
    };
  } | null;
};

export type CreateLeadPayload = {
  nombres: string;
  apellidos: string;
  telefono: number;
  propiedad_id: number;
  creado_por_id: number;
  lada?: string;
  correo_electronico?: string;
  comentarios?: string;
  estado?: string;
};

export type UpdateLeadPayload = {
  nombres?: string;
  apellidos?: string;
  telefono?: number;
  propiedad_id?: number;
  lada?: string;
  correo_electronico?: string;
  comentarios?: string;
  estado?: string;
};

export async function getLeads(): Promise<LeadRecord[]> {
  const response = await fetch(`${API_URL}/registros`, { method: 'GET' });
  const data = (await response.json().catch(() => null)) as LeadRecord[] | null;

  if (!response.ok || !Array.isArray(data)) {
    return [];
  }

  return data;
}

export async function createLead(
  payload: CreateLeadPayload,
  accessToken?: string | null,
): Promise<LeadRecord> {
  const response = await fetch(`${API_URL}/registros`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | LeadRecord
    | { message?: string | string[] }
    | null;

  if (!response.ok || !data || Array.isArray(data)) {
    const message = Array.isArray((data as { message?: string | string[] } | null)?.message)
      ? ((data as { message: string[] }).message[0] ?? 'No fue posible crear el registro.')
      : typeof (data as { message?: string | string[] } | null)?.message === 'string'
        ? ((data as { message: string }).message)
        : 'No fue posible crear el registro.';
    throw new Error(message);
  }

  return data as LeadRecord;
}

export async function updateLead(
  id: number,
  payload: UpdateLeadPayload,
  accessToken?: string | null,
): Promise<LeadRecord> {
  const response = await fetch(`${API_URL}/registros/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | LeadRecord
    | { message?: string | string[] }
    | null;

  if (!response.ok || !data || Array.isArray(data)) {
    const message = Array.isArray((data as { message?: string | string[] } | null)?.message)
      ? ((data as { message: string[] }).message[0] ?? 'No fue posible actualizar el registro.')
      : typeof (data as { message?: string | string[] } | null)?.message === 'string'
        ? ((data as { message: string }).message)
        : 'No fue posible actualizar el registro.';
    throw new Error(message);
  }

  return data as LeadRecord;
}

export async function deleteLead(id: number, accessToken?: string | null): Promise<void> {
  const response = await fetch(`${API_URL}/registros/${id}`, {
    method: 'DELETE',
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  const data = (await response.json().catch(() => null)) as { message?: string | string[] } | null;

  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? (data?.message[0] ?? 'No fue posible eliminar el registro.')
      : typeof data?.message === 'string'
        ? data.message
        : 'No fue posible eliminar el registro.';
    throw new Error(message);
  }
}
