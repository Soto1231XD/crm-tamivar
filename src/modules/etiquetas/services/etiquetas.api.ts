import { apiRequest } from '@/shared/apiRequest';
import type { Etiqueta } from '@/interfaces/lead.interface';

export async function getEtiquetas(scope?: 'personal' | 'admin-shared'): Promise<Etiqueta[]> {
  const url = scope ? `/etiquetas?scope=${scope}` : '/etiquetas';
  const data = await apiRequest<Etiqueta[]>(url);
  return Array.isArray(data) ? data : [];
}

export async function createEtiqueta(payload: { nombre: string; color: string }): Promise<Etiqueta> {
  return apiRequest<Etiqueta>('/etiquetas', { method: 'POST', data: payload });
}

export async function updateEtiqueta(id: number, payload: { nombre?: string; color?: string }): Promise<Etiqueta> {
  return apiRequest<Etiqueta>(`/etiquetas/${id}`, { method: 'PATCH', data: payload });
}

export async function deleteEtiqueta(id: number): Promise<void> {
  await apiRequest<void>(`/etiquetas/${id}`, { method: 'DELETE' });
}

export async function assignEtiquetaToLeadExterno(leadId: number, etiquetaId: number): Promise<void> {
  await apiRequest<void>(`/etiquetas/lead-externo/${leadId}/asignar`, {
    method: 'POST',
    data: { etiqueta_id: etiquetaId },
  });
}

export async function removeEtiquetaFromLeadExterno(leadId: number, etiquetaId: number): Promise<void> {
  await apiRequest<void>(`/etiquetas/lead-externo/${leadId}/${etiquetaId}`, { method: 'DELETE' });
}

export async function assignEtiquetaToRegistroLead(leadId: number, etiquetaId: number): Promise<void> {
  await apiRequest<void>(`/etiquetas/registro-lead/${leadId}/asignar`, {
    method: 'POST',
    data: { etiqueta_id: etiquetaId },
  });
}

export async function removeEtiquetaFromRegistroLead(leadId: number, etiquetaId: number): Promise<void> {
  await apiRequest<void>(`/etiquetas/registro-lead/${leadId}/${etiquetaId}`, { method: 'DELETE' });
}
