import type { LeadRecord } from '@/interfaces/lead.interface';
import { downloadTableAsExcel } from '@/components/ui/excelExport';
import {
  CHANNEL_STYLES,
  LEAD_SOURCE_STYLES,
  OPERATION_STYLES,
  PAYMENT_METHOD_STYLES,
  PRIORITY_STYLES,
  STATUS_STYLES,
} from './leads.constants';

export function getStatusStyles(estado: string): { backgroundColor: string; color: string } {
  const normalizedEstado = estado.trim().toLowerCase();
  return STATUS_STYLES[normalizedEstado] ?? { backgroundColor: '#E2E8F0', color: '#334155' };
}

export function getPriorityStyles(prioridad: string): { backgroundColor: string; color: string } {
  const normalizedPrioridad = normalizePriority(prioridad);
  return PRIORITY_STYLES[normalizedPrioridad] ?? { backgroundColor: '#E2E8F0', color: '#334155' };
}

export function getOperationStyles(operacion: string): { backgroundColor: string; color: string } {
  const normalizedOperacion = normalizeOperation(operacion);
  return OPERATION_STYLES[normalizedOperacion] ?? { backgroundColor: '#E2E8F0', color: '#334155' };
}

export function getChannelStyles(canal: string): { backgroundColor: string; color: string } {
  const normalizedChannel = normalizeOperation(canal);
  return CHANNEL_STYLES[normalizedChannel] ?? { backgroundColor: '#E2E8F0', color: '#334155' };
}

export function getPaymentMethodStyles(metodo: string): { backgroundColor: string; color: string } {
  const normalizedMethod = normalizeOperation(metodo);
  return PAYMENT_METHOD_STYLES[normalizedMethod] ?? { backgroundColor: '#E2E8F0', color: '#334155' };
}

export function getLeadSourceStyles(origen: string): { backgroundColor: string; color: string } {
  const normalizedSource = normalizeOperation(origen);
  return LEAD_SOURCE_STYLES[normalizedSource] ?? { backgroundColor: '#E2E8F0', color: '#334155' };
}

export function normalizePriority(prioridad: string): string {
  return prioridad
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function normalizeOperation(operacion: string): string {
  return operacion
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function formatPhone(lada?: string | null, telefono?: string | number): string {
  const parts = [lada ?? '', telefono != null ? String(telefono) : ''].map((part) => part.trim()).filter(Boolean);
  return parts.length ? parts.join(' ') : 'Sin telefono';
}

export function formatDate(value?: string): string {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatDateTime(value?: string | null): string {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getComparableDate(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 10);
}

export function formatCreatorName(
  creador?: { nombres?: string | null; apellido_paterno?: string | null } | null,
): string {
  const parts = [creador?.nombres, creador?.apellido_paterno]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Sin asignar';
}

export function formatAsesorExterno(
  asesorExterno?: boolean | null,
  asesorExternoNombre?: string | null,
): string {
  if (!asesorExterno) return 'N/A';
  const nombre = asesorExternoNombre?.trim();
  return nombre || 'Sin nombre';
}

export function downloadLeadsAsExcel(leads: LeadRecord[], propertyTitles: string[]) {
  const headers = [
    'ID',
    'Cliente',
    'Correo electronico',
    'Telefono',
    'Propiedad',
    'Estado',
    'Prioridad',
    'Creado por',
    'Fecha de creacion',
    'Fecha de cita',
    'Asesor externo',
    'Comentarios',
  ];

  const rows = leads.map((lead, index) => [
      String(lead.id ?? ''),
      `${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim() || 'Sin nombre',
      lead.correo_electronico?.trim() || 'Sin correo',
      formatPhone(lead.lada, lead.telefono),
      propertyTitles[index] ?? 'Sin titulo',
      lead.estado?.trim() || 'Sin estado',
      lead.prioridad?.trim() || 'Sin prioridad',
      formatCreatorName(lead.creador),
      formatDate(lead.creado_en),
      formatDateTime(lead.fecha_cita),
      formatAsesorExterno(lead.asesor_externo, lead.asesor_externo_nombre),
      lead.comentarios?.trim() || 'Sin comentarios',
    ]);

  downloadTableAsExcel({
    title: 'Registros exportados',
    sheetName: 'Registros',
    fileName: 'registros-filtrados.xls',
    headers,
    rows,
  });
}
