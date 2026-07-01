import { z } from 'zod';
import type { LeadRecord, UpdateLeadPayload } from '@/interfaces/lead.interface';

export const LEAD_LEADS_STATUS_OPTIONS = [
  'En espera',
  'Contactado',
  'En seguimiento',
  'Cita agendada',
  'En proceso',
  'Cerrado',
  'Cancelado',
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
  'Recursos propios',
  'Infonavit',
  'Cofinavit',
  'Credito bancario',
  'Fovissste',
  'Issfam',
  'Otro',
] as const;

export const LEAD_LEADS_SOURCE_OPTIONS = ['Orgánico', 'Campaña', 'Otro'] as const;

export const leadLeadFieldClassName =
  'w-full rounded-xl border border-[var(--crm-border-strong)] bg-[var(--crm-surface-soft)] px-3.5 py-2.5 text-sm text-[var(--crm-text)] outline-none transition placeholder:text-[var(--crm-placeholder)] focus:border-[var(--crm-primary)] focus:bg-[var(--crm-surface)] focus:ring-2 focus:ring-[var(--crm-primary-soft)]';

const NAME_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;
const LADA_REGEX = /^\+?[0-9]+$/;

export const INITIAL_LEAD_LEAD_FORM = {
  nombres: '',
  apellidos: '',
  telefono: '',
  lada: '+52',
  comentarios: '',
  estado: 'En espera',
  prioridad: 'Normal',
  vendedor_asignado_id: '',
  operacion: '',
  canal: '',
  solicitud: '',
  presupuesto: '',
  ubicacion_propiedad: '',
  metodo_pago: [] as string[],
  caracteristicas: '',
  origen_lead: '',
  fecha_registro: '',
};

export const leadLeadSchema = z.object({
  nombres: z
    .string()
    .trim()
    .min(1, 'Nombres es obligatorio.')
    .refine((value) => isValidLeadLeadName(value), 'Nombres solo permite letras y espacios.'),
  apellidos: z
    .string()
    .trim()
    .min(1, 'Apellidos es obligatorio.')
    .refine((value) => isValidLeadLeadName(value), 'Apellidos solo permite letras y espacios.'),
  telefono: z.string().trim().regex(/^\d{10}$/, 'El teléfono debe tener exactamente 10 dígitos numéricos.'),
  lada: z
    .string()
    .trim()
    .max(6, 'Lada no puede exceder 6 caracteres.')
    .refine((value) => value.length === 0 || LADA_REGEX.test(value), 'Lada no valida.')
    .optional(),
  comentarios: z.string().max(1500, 'Comentarios no puede exceder 1500 caracteres.').optional(),
  estado: z.string().optional(),
  prioridad: z.string().trim().min(1, 'Prioridad es obligatoria.'),
  vendedor_asignado_id: z.string().trim().min(1, 'Vendedor asignado es obligatorio.'),
  operacion: z.string().trim().min(1, 'Operación es obligatoria.'),
  canal: z.string().trim().min(1, 'Canal es obligatorio.'),
  solicitud: z.string().max(1000, 'Solicitud no puede exceder 1000 caracteres.').optional(),
  presupuesto: z.string().optional(),
  ubicacion_propiedad: z.string().max(1000, 'La zona de preferencia no puede exceder 1000 caracteres.').optional(),
  metodo_pago: z.array(z.string()).optional().default([]),
  caracteristicas: z.string().max(1000, 'Características no puede exceder 1000 caracteres.').optional(),
  origen_lead: z.string().trim().min(1, 'Origen del lead es obligatorio.'),
  fecha_registro: z.string().optional(),
});

export type LeadLeadFormInput = z.input<typeof leadLeadSchema>;
export type LeadLeadFormValues = z.output<typeof leadLeadSchema>;
type LeadLeadDirtyFields = Partial<Record<keyof LeadLeadFormValues, boolean | boolean[]>>;

export function LeadLeadFieldLabel({ children, required = false }: { children: string; required?: boolean }) {
  return (
    <span className="text-sm font-medium text-[var(--crm-text-muted)]">
      {children}
      {required ? <span className="ml-1 font-semibold text-[var(--crm-danger-text)]">*</span> : null}
    </span>
  );
}

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

export function toLeadLeadDefaultValues(lead: LeadRecord | null): LeadLeadFormInput {
  if (!lead) {
    return INITIAL_LEAD_LEAD_FORM;
  }

  return {
    nombres: lead.nombres ?? '',
    apellidos: lead.apellidos ?? '',
    telefono: lead.telefono != null ? String(lead.telefono) : '',
    lada: lead.lada ?? '+52',
    comentarios: lead.comentarios ?? '',
    estado: lead.estado ?? 'En seguimiento',
    prioridad: lead.prioridad ?? 'Normal',
    vendedor_asignado_id: lead.vendedor_asignado_id != null ? String(lead.vendedor_asignado_id) : '',
    operacion: lead.operacion ?? '',
    canal: lead.canal ?? '',
    solicitud: lead.solicitud ?? '',
    presupuesto: lead.presupuesto != null ? formatLeadBudgetInput(String(lead.presupuesto)) : '',
    ubicacion_propiedad: lead.ubicacion_propiedad ?? '',
    metodo_pago: parseLeadPaymentMethods(lead.metodo_pago),
    caracteristicas: lead.caracteristicas ?? '',
    origen_lead: lead.origen_lead ?? '',
    fecha_registro: lead.creado_en
      ? new Date(lead.creado_en).toISOString().slice(0, 10)
      : '',
  };
}

export function buildLeadLeadUpdatePayload(
  values: LeadLeadFormValues,
  dirtyFields: LeadLeadDirtyFields,
): UpdateLeadPayload {
  const payload: UpdateLeadPayload = {};

  const fieldMappers: Partial<
    Record<keyof LeadLeadFormValues, (input: LeadLeadFormValues) => unknown>
  > = {
    nombres: (input) => input.nombres.trim(),
    apellidos: (input) => input.apellidos.trim(),
    telefono: (input) => input.telefono,
    lada: (input) => input.lada?.trim() || undefined,
    comentarios: (input) => input.comentarios?.trim() || undefined,
    estado: (input) => input.estado?.trim() || undefined,
    prioridad: (input) => input.prioridad.trim(),
    vendedor_asignado_id: (input) => Number(input.vendedor_asignado_id),
    operacion: (input) => input.operacion.trim(),
    canal: (input) => input.canal.trim(),
    solicitud: (input) => input.solicitud?.trim() || undefined,
    ubicacion_propiedad: (input) => input.ubicacion_propiedad?.trim() || undefined,
    metodo_pago: (input) => input.metodo_pago.length > 0 ? input.metodo_pago.join(', ') : undefined,
    caracteristicas: (input) => input.caracteristicas?.trim() || undefined,
    origen_lead: (input) => input.origen_lead.trim(),
    fecha_registro: (input) => input.fecha_registro || undefined,
  };

  for (const [field, mapper] of Object.entries(fieldMappers) as Array<
    [keyof LeadLeadFormValues, (input: LeadLeadFormValues) => unknown]
  >) {
    if (!dirtyFields[field]) continue;
    payload[field as keyof UpdateLeadPayload] = mapper(values) as never;
  }

  if (dirtyFields.presupuesto) {
    const presupuestoValue = normalizeLeadBudgetValue(values.presupuesto);
    payload.presupuesto = presupuestoValue ? Number(presupuestoValue) : undefined;
  }

  return payload;
}
