const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

export type PropertyRecord = {
  id: number;
  activo?: boolean;
  titulo?: string;
  tipo_inmueble: string;
  tipo_operacion?: string;
  descripcion?: string;
  precio_condicionado?: {
    descripcion?: string;
    monto?: number;
  };
  tipos_pago?: string[];
  direccion: {
    cp?: number;
    calle?: string;
    municipio?: string;
    fraccionamiento?: string;
    smz?: number;
    mza?: number;
    lote?: number;
    num_ext?: number;
    num_int?: number;
    estado?: string;
    referencias?: string;
  };
  precio: string | number;
  estatus: string;
  tiene_gravamen?: boolean;
  cuota_mantenimiento?: string | number;
  comentarios?: string;
  pisos_tiene?: number;
  servicios_instalaciones?: string;
  amenidades?: string;
  medidas?: {
    terreno_m2?: number;
    construccion_m2?: number;
    frente?: number;
    fondo?: number;
  };
  caracteristicas?: {
    banos?: number;
    recamaras?: number;
    estacionamiento?: number;
    sala?: boolean;
    comedor?: boolean;
    cocina?: boolean;
    area_servicio?: boolean;
    patio?: boolean;
    jardin?: boolean;
    alberca?: boolean;
    terraza?: boolean;
    amueblado?: boolean;
    bodega?: boolean;
  };
  imagenes?: Array<{
    url?: string;
    titulo?: string;
    principal?: boolean;
  }>;
};

export type CreatePropertyPayload = {
  titulo: string;
  tipo_inmueble: string;
  tipo_operacion: string;
  descripcion?: string;
  precio_condicionado?: {
    descripcion?: string;
    monto: number;
  };
  tipos_pago: string[];
  estatus: string;
  tiene_gravamen?: boolean;
  cuota_mantenimiento?: number;
  comentarios?: string;
  pisos_tiene?: number;
  servicios_instalaciones?: string;
  amenidades?: string;
  medidas: {
    terreno_m2: number;
    construccion_m2: number;
    frente: number;
    fondo: number;
  };
  direccion: {
    cp: number;
    fraccionamiento: string;
    smz?: number;
    mza?: number;
    lote?: number;
    calle: string;
    num_ext: number;
    num_int?: number;
    municipio: string;
    estado: string;
    referencias?: string;
  };
  caracteristicas: {
    banos: number;
    recamaras: number;
    estacionamiento: number;
    sala: boolean;
    comedor: boolean;
    cocina: boolean;
    area_servicio: boolean;
    patio: boolean;
    jardin: boolean;
    alberca: boolean;
    terraza: boolean;
    amueblado: boolean;
    bodega: boolean;
  };
  imagenes: Array<{
    url: string;
    titulo: string;
    principal: boolean;
  }>;
  precio: number;
  creado_por_id: number;
};

export type UpdatePropertyPayload = Partial<CreatePropertyPayload>;

export type UpdatePropertyStatusPayload = {
  activo: boolean;
};

export async function getProperties(): Promise<PropertyRecord[]> {
  const response = await fetch(`${API_URL}/properties`, { method: 'GET' });
  const data = (await response.json().catch(() => null)) as PropertyRecord[] | null;

  if (!response.ok || !Array.isArray(data)) {
    return [];
  }

  return data;
}

export async function createProperty(
  payload: CreatePropertyPayload,
  accessToken?: string | null,
): Promise<PropertyRecord> {
  const response = await fetch(`${API_URL}/properties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | PropertyRecord
    | { message?: string | string[] }
    | null;

  if (!response.ok || !data || Array.isArray(data)) {
    const message = Array.isArray((data as { message?: string | string[] } | null)?.message)
      ? ((data as { message: string[] }).message[0] ?? 'No fue posible crear la propiedad.')
      : typeof (data as { message?: string | string[] } | null)?.message === 'string'
        ? ((data as { message: string }).message)
        : 'No fue posible crear la propiedad.';
    throw new Error(message);
  }

  return data as PropertyRecord;
}

export async function updateProperty(
  id: number,
  payload: UpdatePropertyPayload,
  accessToken?: string | null,
): Promise<PropertyRecord> {
  const response = await fetch(`${API_URL}/properties/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | PropertyRecord
    | { message?: string | string[] }
    | null;

  if (!response.ok || !data || Array.isArray(data)) {
    const message = Array.isArray((data as { message?: string | string[] } | null)?.message)
      ? ((data as { message: string[] }).message[0] ?? 'No fue posible actualizar la propiedad.')
      : typeof (data as { message?: string | string[] } | null)?.message === 'string'
        ? ((data as { message: string }).message)
        : 'No fue posible actualizar la propiedad.';
    throw new Error(message);
  }

  return data as PropertyRecord;
}

export async function updatePropertyStatus(
  id: number,
  payload: UpdatePropertyStatusPayload,
  accessToken?: string | null,
): Promise<PropertyRecord> {
  const response = await fetch(`${API_URL}/properties/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | PropertyRecord
    | { message?: string | string[] }
    | null;

  if (!response.ok || !data || Array.isArray(data)) {
    const message = Array.isArray((data as { message?: string | string[] } | null)?.message)
      ? ((data as { message: string[] }).message[0] ?? 'No fue posible actualizar el estado de la propiedad.')
      : typeof (data as { message?: string | string[] } | null)?.message === 'string'
        ? (data as { message: string }).message
        : 'No fue posible actualizar el estado de la propiedad.';
    throw new Error(message);
  }

  return data as PropertyRecord;
}
