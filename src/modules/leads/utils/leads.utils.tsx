import type { LeadRecord } from '@/interfaces/lead.interface';
import { downloadTableAsExcel, downloadTableAsExcelWithCharts } from '@/components/ui/excelExport';
import { drawPieChartPng, assignColors, type PieSegment } from '@/components/ui/pieChart';
export {
  getChannelStyles,
  getLeadSourceStyles,
  getOperationStyles,
  getPaymentMethodStyles,
  getPriorityStyles,
  getStatusStyles,
} from '@/shared/ui/statusStyles';
import {
  normalizeStatusKey,
} from '@/shared/ui/statusStyles';

export function normalizePriority(prioridad: string): string {
  return normalizeStatusKey(prioridad);
}

export function normalizeOperation(operacion: string): string {
  return normalizeStatusKey(operacion);
}

export function formatPhone(lada?: string | null, telefono?: string | number): string {
  const parts = [lada ?? '', telefono != null ? String(telefono) : ''].map((part) => part.trim()).filter(Boolean);
  return parts.length ? parts.join(' ') : 'Sin teléfono';
}

export function formatPhoneLastFour(telefono?: string | number): string {
  const digits = String(telefono ?? '')
    .replace(/\D/g, '')
    .slice(-4);

  if (!digits) return 'Sin teléfono';
  return digits;
}

export function formatDate(value?: string): string {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC',
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

export function downloadLeadsAsExcel(leads: LeadRecord[], targetTitles: string[]) {
  const headers = [
    'Cliente',
    'Telefono',
    'Propiedad / desarrollo',
    'Estado',
    'Responsable',
    'Fecha de creacion',
    'Fecha de cita',
    'Asesor externo',
    'Comentarios',
  ];

  const rows = leads.map((lead, index) => [
      `${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim() || 'Sin nombre',
      formatPhone(lead.lada, lead.telefono),
      targetTitles[index] ?? 'Sin referencia',
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
    fileName: 'registros-filtrados.xlsx',
    headers,
    rows,
  });
}

function extractBudgetFromText(text: string | null | undefined): string | null {
  if (!text?.trim()) return null;

  const t = text.toLowerCase().replace(/\s+/g, ' ');

  const toAmount = (raw: string, mult?: string): string => {
    // "1,200,000" → remove thousands commas; "1,4" → convert decimal comma
    const normalized = raw
      .replace(/,(\d{3})(?!\d)/g, '$1') // coma de miles: 800,000 → 800000
      .replace(/,(\d{1,2})$/, '.$1');   // coma decimal mexicana: 1,4 → 1.4
    const n = parseFloat(normalized);
    if (isNaN(n) || n <= 0) return '';
    let amount = n;
    const m = (mult ?? '').trim().toLowerCase();
    if (m === 'k') amount = n * 1_000;
    else if (m === 'mil') amount = n * 1_000;
    else if (m.startsWith('mill') || m.startsWith('millón')) amount = n * 1_000_000;
    else if (m === 'mdp' || m === 'mpd') amount = n * 1_000_000;
    return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  // 1. $X [k|mil|millones|MDP]: "$500,000" / "$1.5 millones" / "$500k" / "$1.5MDP"
  const m1 = t.match(/\$\s*([\d,.]+)\s*(k|mill?(?:[oó]n(?:es)?)?|m(?:dp|pd))?(?:\s*(?:pesos?|mxn))?/);
  if (m1) { const r = toAmount(m1[1], m1[2]); if (r) return r; }

  // 2. X MDP/MPD (millones de pesos): "1,4MDP" / "1.5MPD" / "2mdp"
  const m2 = t.match(/\b([\d,.]+)\s*m(?:dp|pd)\b/);
  if (m2) { const r = toAmount(m2[1], 'mdp'); if (r) return r; }

  // 3. X mil/millones (con o sin espacio): "800mil" / "500 mil" / "1.5 millones"
  const m3 = t.match(/\b([\d,.]+)\s*(mill?(?:[oó]n(?:es)?)?|mil)\b/);
  if (m3) { const r = toAmount(m3[1], m3[2]); if (r) return r; }

  // 4. Xk: "500k" / "800k"
  const m4 = t.match(/\b([\d,.]+)\s*k\b/);
  if (m4) { const r = toAmount(m4[1], 'k'); if (r) return r; }

  // 5. X pesos / X MXN (mínimo 4 dígitos)
  const m5 = t.match(/\b(\d{4,}(?:[,.]\d+)?)\s*(?:pesos?|mxn)\b/);
  if (m5) { const r = toAmount(m5[1]); if (r) return r; }

  // 6. Palabras clave + número:
  //    "presupuesto de $500k", "máximo 1millon", "cuento/cuenta con 800,000", "hasta 900,000"
  const m6 = t.match(
    /(?:presupuesto|m[aá]xim[oa]|cuent[ao]\s+con|hasta|precio)\s*(?:de\s*|es\s*|:\s*)?\$?\s*([\d,.]+)\s*(k|mill?(?:[oó]n(?:es)?)?|m(?:dp|pd)|mil)?\b/,
  );
  if (m6) { const r = toAmount(m6[1], m6[2]); if (r) return r; }

  // 7. Número grande con coma de miles como último recurso: "800,000" / "1,200,000"
  //    Requiere al menos un grupo de 3 dígitos separado por coma → mínimo 4 dígitos
  const m7 = t.match(/\b(\d{1,3}(?:,\d{3})+)\b/);
  if (m7) { const r = toAmount(m7[1]); if (r) return r; }

  return null;
}

function getEffectiveBudget(lead: LeadRecord): string {
  const raw = lead.presupuesto;
  if (raw != null && raw !== '' && Number(raw) !== 0) return String(raw);

  const fromSolicitud = extractBudgetFromText(lead.solicitud);
  if (fromSolicitud) return fromSolicitud;

  const fromComentarios = extractBudgetFromText(lead.comentarios);
  if (fromComentarios) return fromComentarios;

  return 'Sin presupuesto';
}

// ─── Segmentos para gráficas de pastel ──────────────────────────────────────

const BUDGET_RANGES = [
  { label: 'Sin presupuesto',  min: 0,         max: 0         },
  { label: 'Hasta $500k',      min: 1,         max: 500_000   },
  { label: '$500k – $800k',    min: 500_001,   max: 800_000   },
  { label: '$800k – $1.2M',    min: 800_001,   max: 1_200_000 },
  { label: '$1.2M – $1.6M',    min: 1_200_001, max: 1_600_000 },
  { label: 'Más de $1.6M',     min: 1_600_001, max: Infinity  },
];

function getNumericBudget(lead: LeadRecord): number | null {
  const raw = lead.presupuesto;
  if (raw != null && raw !== '') {
    const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[$,]/g, ''));
    if (!isNaN(n) && n > 0) return n;
  }
  const extracted = extractBudgetFromText(lead.solicitud) ?? extractBudgetFromText(lead.comentarios);
  if (!extracted) return null;
  const n = parseFloat(extracted.replace(/[$,]/g, ''));
  return isNaN(n) || n <= 0 ? null : n;
}

function prepareBudgetSegments(leads: LeadRecord[]): PieSegment[] {
  const active = BUDGET_RANGES.map(range => {
    const count = leads.filter(l => {
      const n = getNumericBudget(l);
      if (range.max === 0)        return n === null || n === 0;
      if (range.max === Infinity) return n !== null && n >= range.min;
      return n !== null && n >= range.min && n <= range.max;
    }).length;
    return { label: range.label, count };
  }).filter(r => r.count > 0);

  const colors = assignColors(active.map(r => r.label));
  return active.map((r, i) => ({ label: r.label, value: r.count, color: colors[i] }));
}

function preparePaymentSegments(leads: LeadRecord[]): PieSegment[] {
  const map = new Map<string, number>();
  leads.forEach(l => {
    const key = l.metodo_pago?.trim() || 'Sin método';
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
  const colors = assignColors(sorted.map(([label]) => label));
  return sorted.map(([label, value], i) => ({ label, value, color: colors[i] }));
}

export async function downloadLeadLeadsAsExcel(
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
    getEffectiveBudget(lead),
    propertyAddresses[index] ?? 'Sin ubicacion',
    lead.metodo_pago?.trim() || 'Sin metodo',
    lead.caracteristicas?.trim() || 'Sin caracteristicas',
    lead.comentarios?.trim() || 'Sin comentarios',
    lead.origen_lead?.trim() || 'Sin origen',
  ]);

  const budgetPng  = drawPieChartPng(prepareBudgetSegments(leads),  'Distribución de Presupuesto');
  const paymentPng = drawPieChartPng(preparePaymentSegments(leads), 'Método de Pago');

  await downloadTableAsExcelWithCharts(
    {
      title:     'Registros leads exportados',
      sheetName: 'Registros leads',
      fileName:  'registros-leads-filtrados.xlsx',
      headers,
      rows,
    },
    'Gráficas',
    [budgetPng, paymentPng],
  );
}
