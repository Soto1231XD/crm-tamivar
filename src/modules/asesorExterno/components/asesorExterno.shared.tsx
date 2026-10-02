import { z } from 'zod';
import type { LeadRecord } from '@/interfaces/lead.interface';

export const ASESOR_EXTERNO_STATUS_OPTIONS = [
  'En espera',
  'Contactado',
  'En seguimiento',
  'Cita agendada',
  'En proceso',
  'Cerrado',
  'Cancelado',
] as const;

export const ASESOR_EXTERNO_PRIORITY_OPTIONS = [
  'Urgente',
  'Normal',
  'Bajo Interes',
] as const;

export const ASESOR_EXTERNO_OPERATION_OPTIONS = [
  'Venta',
  'Renta',
  'Sub-renta',
  'Compra',
  'Broker',
  'Inversion',
  'Asesoria',
] as const;

export const ASESOR_EXTERNO_PAYMENT_METHOD_OPTIONS = [
  'Recursos propios',
  'Infonavit',
  'Cofinavit',
  'Credito bancario',
  'Fovissste',
  'Issfam',
  'Otro',
] as const;

export const asesorExternoFieldClassName =
  'w-full rounded-xl border border-[var(--crm-border-strong)] bg-[var(--crm-surface-soft)] px-3.5 py-2.5 text-sm text-[var(--crm-text)] outline-none transition placeholder:text-[var(--crm-placeholder)] focus:border-[var(--crm-primary)] focus:bg-[var(--crm-surface)] focus:ring-2 focus:ring-[var(--crm-primary-soft)]';

const NAME_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;

export const INITIAL_ASESOR_EXTERNO_FORM = {
  nombres: '',
  apellidos: '',
  telefono: '',
  estado: 'En espera',
  prioridad: 'Normal',
  operacion: '',
  comentarios: '',
  solicitud: '',
  presupuesto: '',
  ubicacion_propiedad: '',
  metodo_pago: [] as string[],
  caracteristicas: '',
  fecha_registro: '',
};

export const asesorExternoSchema = z.object({
  nombres: z
    .string()
    .trim()
    .min(1, 'Nombres es obligatorio.')
    .refine((v) => NAME_REGEX.test(v), 'Nombres solo permite letras y espacios.'),
  apellidos: z
    .string()
    .trim()
    .min(1, 'Apellidos es obligatorio.')
    .refine((v) => NAME_REGEX.test(v), 'Apellidos solo permite letras y espacios.'),
  telefono: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'Ingresa exactamente los últimos 4 dígitos del teléfono.'),
  estado: z.string().optional(),
  prioridad: z.string().trim().min(1, 'Prioridad es obligatoria.'),
  operacion: z.string().trim().min(1, 'Operación es obligatoria.'),
  comentarios: z.string().max(1500).optional(),
  solicitud: z.string().max(1000).optional(),
  presupuesto: z.string().optional(),
  ubicacion_propiedad: z.string().max(1000).optional(),
  metodo_pago: z.array(z.string()).optional().default([]),
  caracteristicas: z.string().max(1000).optional(),
  fecha_registro: z.string().optional(),
});

export type AsesorExternoFormInput = z.input<typeof asesorExternoSchema>;
export type AsesorExternoFormValues = z.output<typeof asesorExternoSchema>;

export function AsesorExternoFieldLabel({
  children,
  required = false,
}: {
  children: string;
  required?: boolean;
}) {
  return (
    <span className="text-sm font-medium text-[var(--crm-text-muted)]">
      {children}
      {required ? (
        <span className="ml-1 font-semibold text-[var(--crm-danger-text)]">*</span>
      ) : null}
    </span>
  );
}

export function sanitizeAsesorExternoName(value: string): string {
  return value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, '');
}

export function sanitizeAsesorExternoPhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, 4);
}

export function formatLeadBudget(value: string): string {
  const normalized = value.replace(/[^\d.]/g, '');
  const [intPart = '', decPart = ''] = normalized.split('.');
  const clean = intPart.replace(/^0+(?=\d)/, '');
  const formatted = (clean || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (!normalized.includes('.')) return clean ? formatted : '';
  return `${formatted}.${decPart.slice(0, 2)}`;
}

export function normalizeLeadBudget(value?: string): string {
  return (value ?? '').replace(/,/g, '').trim();
}

export function parsePaymentMethods(value?: string | null): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toAsesorExternoDefaultValues(
  lead: LeadRecord | null,
): AsesorExternoFormInput {
  if (!lead) return INITIAL_ASESOR_EXTERNO_FORM;
  return {
    nombres: lead.nombres ?? '',
    apellidos: lead.apellidos ?? '',
    telefono: lead.telefono != null ? String(lead.telefono) : '',
    estado: lead.estado ?? 'En espera',
    prioridad: lead.prioridad ?? 'Normal',
    operacion: lead.operacion ?? '',
    comentarios: lead.comentarios ?? '',
    solicitud: lead.solicitud ?? '',
    presupuesto:
      lead.presupuesto != null
        ? formatLeadBudget(String(lead.presupuesto))
        : '',
    ubicacion_propiedad: lead.ubicacion_propiedad ?? '',
    metodo_pago: parsePaymentMethods(lead.metodo_pago),
    caracteristicas: lead.caracteristicas ?? '',
    fecha_registro: lead.creado_en
      ? new Date(lead.creado_en).toISOString().slice(0, 10)
      : '',
  };
}
