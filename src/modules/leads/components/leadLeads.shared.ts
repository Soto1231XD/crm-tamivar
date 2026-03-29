export const LEAD_LEADS_STATUS_OPTIONS = [
  'En seguimiento',
  'En espera',
  'Contactado',
  'Cancelado',
  'Cita agendada',
  'En proceso',
  'Cerrado',
] as const;

export const LEAD_LEADS_PRIORITY_OPTIONS = ['Urgente', 'Normal', 'Bajo Interes'] as const;

export const LEAD_LEADS_OPERATION_OPTIONS = [
  'Venta',
  'Renta',
  'Sub-renta',
  'Compra',
  'Broker',
  'Inversion',
  'Asesoria',
] as const;

export const LEAD_LEADS_CHANNEL_OPTIONS = [
  'Facebook',
  'Instagram',
  'Tiktok',
  'Youtube',
  'Sitio web',
  'Otro',
] as const;

export const LEAD_LEADS_PAYMENT_METHOD_OPTIONS = [
  'Efectivo',
  'Infonavit',
  'Cofinavit',
  'Credito bancario',
  'Fovissste',
  'Issfam',
  'Otro',
] as const;

export const LEAD_LEADS_SOURCE_OPTIONS = ['Orgánico', 'Campaña', 'Otro'] as const;

export const leadLeadFieldClassName =
  'w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10';

const NAME_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;

export function sanitizeLeadLeadName(value: string): string {
  return value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, '');
}

export function sanitizeLeadLeadPhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

export function sanitizeLeadLeadLada(value: string): string {
  const normalized = value.replace(/[^\d+]/g, '');
  if (normalized.startsWith('+')) {
    return `+${normalized.slice(1).replace(/\+/g, '').slice(0, 5)}`;
  }

  return normalized.replace(/\+/g, '').slice(0, 5);
}

export function isValidLeadLeadName(value: string): boolean {
  return NAME_REGEX.test(value);
}

export function toLeadDateTimeLocalValue(value?: string | null): string {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
}

export function formatLeadBudgetInput(value: string): string {
  const normalized = value.replace(/[^\d.]/g, '');
  const [integerPart = '', decimalPart = ''] = normalized.split('.');
  const cleanInteger = integerPart.replace(/^0+(?=\d)/, '');
  const formattedInteger = (cleanInteger || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (!normalized.includes('.')) {
    return cleanInteger ? formattedInteger : '';
  }

  return `${formattedInteger}.${decimalPart.slice(0, 2)}`;
}

export function normalizeLeadBudgetValue(value?: string): string {
  return (value ?? '').replace(/,/g, '').trim();
}

export function parseLeadPaymentMethods(value?: string | null): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
