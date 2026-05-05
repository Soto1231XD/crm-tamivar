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
  const normalized = value.slice(0, 10);
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

export function getComparableLeadRequestDate(value?: string | null): string {
  if (!value) return '';
  const normalized = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : '';
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

export function downloadLeadRequestsAsExcel(leadRequests: LeadRequestRecord[]) {
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
    'Medio',
    'Comentario final',
  ];

  const rows = leadRequests.map((request) => [
    request.estado?.trim() || 'Sin estado',
    formatLeadRequestDate(request.fecha_alta),
    request.vendedor
      ? [request.vendedor.nombres, request.vendedor.apellido_paterno, request.vendedor.apellido_materno]
          .filter(Boolean)
          .join(' ')
          .trim() || 'Sin vendedor'
      : 'Sin vendedor',
    request.nombre?.trim() || 'Sin nombre',
    formatLeadRequestPhone(request.telefono),
    request.solicitud?.trim() || 'Sin solicitud',
    request.tipo_inmueble?.trim() || 'Sin tipo de inmueble',
    request.presupuesto != null ? String(request.presupuesto) : 'Sin presupuesto',
    request.metodo_pago?.trim() || 'Sin metodo de pago',
    request.ubicacion?.trim() || 'Sin ubicacion',
    request.numero_habitaciones?.trim() || 'Sin dato',
    request.caracteristicas?.trim() || 'Sin caracteristicas',
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
