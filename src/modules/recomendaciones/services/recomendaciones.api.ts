import { apiRequest } from '@/shared/apiRequest';
import type { RecomendacionRecord } from '@/interfaces/recomendacion.interface';

const PATH = '/recomendaciones';

export async function getRecomendacionesRecibidas(): Promise<RecomendacionRecord[]> {
  const data = await apiRequest<RecomendacionRecord[]>(`${PATH}/recibidas`);
  return Array.isArray(data) ? data : [];
}

export async function getRecomendacionesEnviadas(): Promise<RecomendacionRecord[]> {
  const data = await apiRequest<RecomendacionRecord[]>(`${PATH}/enviadas`);
  return Array.isArray(data) ? data : [];
}

export async function getNoLeidasCount(): Promise<number> {
  const res = await apiRequest<{ count: number }>(`${PATH}/no-leidas/count`);
  return res.count ?? 0;
}

export async function createRecomendacion(
  paraId: number,
  contenido: string,
  referencia?: string,
): Promise<RecomendacionRecord> {
  return apiRequest<RecomendacionRecord>(PATH, {
    method: 'POST',
    data: { para_id: paraId, contenido, referencia: referencia || undefined },
  });
}

export async function marcarRecomendacionLeida(id: number): Promise<void> {
  await apiRequest<void>(`${PATH}/${id}/leida`, { method: 'PATCH' });
}
