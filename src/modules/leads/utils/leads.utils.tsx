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

export function formatPhoneLastFour(telefono?: string | number): string {
  const digits = String(telefono ?? '')
    .replace(/\D/g, '')
    .slice(-4);

  if (!digits) return 'Sin telefono';
  return `**** ${digits}`;
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
    'Cliente',
    'Telefono',
    'Propiedad',
    'Estado',
    'Creado por',
    'Fecha de creacion',
    'Fecha de cita',
    'Asesor externo',
    'Comentarios',
  ];

  const rows = leads.map((lead, index) => [
      `${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim() || 'Sin nombre',
      formatPhone(lead.lada, lead.telefono),
      propertyTitles[index] ?? 'Sin titulo',
      lead.estado?.trim() || 'Sin estado',
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

export function downloadLeadLeadsAsExcel(
  leads: LeadRecord[],
  propertyAddresses: string[],
  userNames: string[],
) {
  const headers = [
    'Fecha de lead',
    'Estatus',
    'Nombre',
    'Prioridad',
    'Vendedor asignado',
    'Celular',
    'Operacion',
    'Canal',
    'Solicitud',
    'Presupuesto',
    'Ubicacion de la propiedad',
    'Metodo de pago',
    'Caracteristicas',
    'Comentarios',
    'Origen de lead',
  ];

  const rows = leads.map((lead, index) => [
    formatDate(lead.creado_en),
    lead.estado?.trim() || 'Sin estatus',
    `${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim() || 'Sin nombre',
    lead.prioridad?.trim() || 'Sin prioridad',
    userNames[index] ?? 'Sin asignar',
    formatPhone(lead.lada, lead.telefono),
    lead.operacion?.trim() || 'Sin operacion',
    lead.canal?.trim() || 'Sin canal',
    lead.solicitud?.trim() || 'Sin solicitud',
    lead.presupuesto != null ? String(lead.presupuesto) : 'Sin presupuesto',
    propertyAddresses[index] ?? 'Sin ubicacion',
    lead.metodo_pago?.trim() || 'Sin metodo',
    lead.caracteristicas?.trim() || 'Sin caracteristicas',
    lead.comentarios?.trim() || 'Sin comentarios',
    lead.origen_lead?.trim() || 'Sin origen',
  ]);

  downloadTableAsExcel({
    title: 'Registros leads exportados',
    sheetName: 'Registros leads',
    fileName: 'registros-leads-filtrados.xls',
    headers,
    rows,
  });
}
