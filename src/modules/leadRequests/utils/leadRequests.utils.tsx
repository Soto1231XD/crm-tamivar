import type { LeadRequestRecord } from '@/interfaces/lead-request.interface';
import { downloadTableAsExcel } from '@/components/ui/excelExport';
import { normalizeStatusKey } from '@/shared/ui/statusStyles';

export function formatLeadRequestPhone(telefono?: string | number): string {
  const digits = String(telefono ?? '').replace(/\D/g, '').slice(0, 10);
  if (digits.length !== 10) return String(telefono ?? 'Sin telefono').trim() || 'Sin telefono';
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

export function formatLeadRequestDate(value?: string | null): string {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function getComparableLeadRequestDate(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 10);
}

export function getLeadRequestMediumStyles(value: string) {
  const normalized = normalizeStatusKey(value);

  const palette: Record<string, { backgroundColor: string; color: string }> = {
    facebook: { backgroundColor: '#DBEAFE', color: '#1D4ED8' },
    instagram: { backgroundColor: '#FCE7F3', color: '#BE185D' },
    tiktok: { backgroundColor: '#EDE9FE', color: '#6D28D9' },
    'sitio web': { backgroundColor: '#CFFAFE', color: '#0F766E' },
    whatsapp: { backgroundColor: '#DCFCE7', color: '#166534' },
    llamada: { backgroundColor: '#FEF3C7', color: '#B45309' },
    referido: { backgroundColor: '#E0E7FF', color: '#4338CA' },
    otro: { backgroundColor: '#E2E8F0', color: '#334155' },
  };

  return palette[normalized] ?? { backgroundColor: '#E2E8F0', color: '#334155' };
}

export function downloadLeadRequestsAsExcel(leadRequests: LeadRequestRecord[], sellerNames: string[]) {
  const headers = [
    'Estado',
    'Fecha de alta',
    'Vendedor',
    'Nombre',
    'Telefono',
    'Solicitud',
    'Tipo de inmueble',
    'Presupuesto',
    'Metodo de pago',
    'Ubicacion',
    'N. habitaciones',
    'Caracteristicas',
    'Seguimiento',
    'Opciones enviadas',
    'Medio',
    'Comentario final',
  ];

  const rows = leadRequests.map((request, index) => [
    request.estado?.trim() || 'Sin estado',
    formatLeadRequestDate(request.fecha_alta),
    sellerNames[index] ?? 'Sin vendedor',
    request.nombre?.trim() || 'Sin nombre',
    formatLeadRequestPhone(request.telefono),
    request.solicitud?.trim() || 'Sin solicitud',
    request.tipo_inmueble?.trim() || 'Sin tipo de inmueble',
    request.presupuesto != null ? String(request.presupuesto) : 'Sin presupuesto',
    request.metodo_pago?.trim() || 'Sin metodo de pago',
    request.ubicacion?.trim() || 'Sin ubicacion',
    request.numero_habitaciones?.trim() || 'Sin dato',
    request.caracteristicas?.trim() || 'Sin caracteristicas',
    request.seguimiento?.trim() || 'Sin seguimiento',
    request.opciones_enviadas?.trim() || 'Sin opciones enviadas',
    request.medio?.trim() || 'Sin medio',
    request.comentario_final?.trim() || 'Sin comentario final',
  ]);

  downloadTableAsExcel({
    title: 'Solicitudes de leads exportadas',
    sheetName: 'Solicitudes de leads',
    fileName: 'solicitudes-leads-filtradas.xlsx',
    headers,
    rows,
  });
}
