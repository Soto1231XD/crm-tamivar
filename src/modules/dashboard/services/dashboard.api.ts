export type DashboardSummary = {
  propiedades_disponibles: number;
  registros: number;
  usuarios_sistema: number;
  registros_recientes: Array<{
    nombre: string;
    apellido: string;
    correo: string;
    estado: string;
  }>;
  propiedades_recientes: Array<{
    tipo_inmueble: string;
    direccion: {
      calle: string;
      municipio: string;
      fraccionamiento: string;
    };
    estatus: string;
    precio: string;
  }>;
  usuarios_recientes: Array<{
    nombres: string;
    apellido_paterno: string;
    correo_electronico: string;
    rol: string;
  }>;
  mis_publicaciones: Array<{
    titulo: string;
    fecha_creacion: string;
    publicado: boolean;
  }>;
};

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

export type RecentProperty = {
  tipo_inmueble: string;
  direccion: {
    calle: string;
    municipio: string;
    fraccionamiento: string;
  };
  estatus: string;
  precio: string;
};

export async function getDashboardSummary(accessToken: string): Promise<DashboardSummary> {
  const response = await fetch(`${API_URL}/dashboard/summary`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = (await response.json().catch(() => null)) as DashboardSummary | { message?: string } | null;

  if (!response.ok) {
    const message = typeof (data as { message?: string } | null)?.message === 'string'
      ? (data as { message: string }).message
      : 'No fue posible cargar el resumen del dashboard.';
    throw new Error(message);
  }

  return data as DashboardSummary;
}

export async function getRecentPropertiesFallback(): Promise<RecentProperty[]> {
  const response = await fetch(`${API_URL}/properties`, {
    method: 'GET',
  });

  const data = (await response.json().catch(() => null)) as
    | Array<{
        tipo_inmueble?: string;
        direccion?: unknown;
        estatus?: string;
        precio?: string | number;
        creado_en?: string;
      }>
    | { message?: string }
    | null;

  if (!response.ok || !Array.isArray(data)) {
    return [];
  }

  return data
    .sort((a, b) => {
      const left = a.creado_en ? new Date(a.creado_en).getTime() : 0;
      const right = b.creado_en ? new Date(b.creado_en).getTime() : 0;
      return right - left;
    })
    .slice(0, 5)
    .map((item) => {
      const direccionObj =
        item.direccion && typeof item.direccion === 'object' && !Array.isArray(item.direccion)
          ? (item.direccion as Record<string, unknown>)
          : {};

      return {
        tipo_inmueble: typeof item.tipo_inmueble === 'string' ? item.tipo_inmueble : 'Sin tipo',
        direccion: {
          calle: typeof direccionObj.calle === 'string' ? direccionObj.calle : '',
          municipio: typeof direccionObj.municipio === 'string' ? direccionObj.municipio : '',
          fraccionamiento:
            typeof direccionObj.fraccionamiento === 'string' ? direccionObj.fraccionamiento : '',
        },
        estatus: typeof item.estatus === 'string' ? item.estatus : 'Sin estatus',
        precio: item.precio != null ? String(item.precio) : '0',
      };
    });
}
