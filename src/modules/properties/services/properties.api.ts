const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

export type PropertyRecord = {
  id: number;
  tipo_inmueble: string;
  direccion: {
    calle?: string;
    municipio?: string;
    fraccionamiento?: string;
  };
  precio: string | number;
  estatus: string;
};

export async function getProperties(): Promise<PropertyRecord[]> {
  const response = await fetch(`${API_URL}/properties`, { method: 'GET' });
  const data = (await response.json().catch(() => null)) as PropertyRecord[] | null;

  if (!response.ok || !Array.isArray(data)) {
    return [];
  }

  return data;
}

