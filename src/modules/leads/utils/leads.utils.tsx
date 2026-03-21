import type { LeadRecord } from '@/interfaces/lead.interface';
import { PRIORITY_STYLES, STATUS_STYLES } from './leads.constants';

export function getStatusStyles(estado: string): { backgroundColor: string; color: string } {
  const normalizedEstado = estado.trim().toLowerCase();
  return STATUS_STYLES[normalizedEstado] ?? { backgroundColor: '#E2E8F0', color: '#334155' };
}

export function getPriorityStyles(prioridad: string): { backgroundColor: string; color: string } {
  const normalizedPrioridad = normalizePriority(prioridad);
  return PRIORITY_STYLES[normalizedPrioridad] ?? { backgroundColor: '#E2E8F0', color: '#334155' };
}

export function normalizePriority(prioridad: string): string {
  return prioridad
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

export function downloadLeadsAsExcel(leads: LeadRecord[], propertyTitles: string[]) {
  const rows = [
    [
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
      'Comentarios',
    ],
    ...leads.map((lead, index) => [
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
      lead.comentarios?.trim() || 'Sin comentarios',
    ]),
  ];

  const tableRows = rows
    .map(
      (columns, rowIndex) => `
        <tr>
          ${columns
            .map(
              (column) =>
                `<td style="${rowIndex === 0 ? HEADER_CELL_STYLE : VALUE_CELL_STYLE}">${escapeHtml(column)}</td>`,
            )
            .join('')}
        </tr>`,
    )
    .join('');

  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8" />
        <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Registros</x:Name>
                  <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
        <![endif]-->
      </head>
      <body>
        <table border="1" cellspacing="0" cellpadding="0">
          ${tableRows}
        </table>
      </body>
    </html>`;

  const blob = new Blob([`\ufeff${excelContent}`], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'registros-filtrados.xls';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const HEADER_CELL_STYLE =
  'background:#E2E8F0;font-weight:700;color:#0F172A;padding:8px 12px;border:1px solid #CBD5E1;';
const VALUE_CELL_STYLE = 'color:#0F172A;padding:8px 12px;border:1px solid #CBD5E1;';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
