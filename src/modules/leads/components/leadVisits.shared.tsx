import { z } from 'zod';
import type { LeadRecord, UpdateLeadPayload } from '@/interfaces/lead.interface';

const NAME_REGEX = /^[A-Z\s]+$/;
const LADA_REGEX = /^\+?[0-9]+$/;

export const visitLeadFieldClassName =
  'w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10';

export const INITIAL_VISIT_FORM = {
  nombres: '',
  apellidos: '',
  telefono: '',
  tipo_objetivo: 'propiedad' as const,
  propiedad_id: '',
  desarrollo_id: '',
  lada: '+52',
  comentarios: '',
  estado: 'Agendado',
  fecha_cita: '',
  asesor_externo: 'no' as const,
  asesor_externo_nombre: '',
};

export const visitLeadSchema = z
  .object({
    nombres: z
      .string()
      .trim()
      .min(1, 'Nombres es obligatorio.')
      .regex(NAME_REGEX, 'Nombres solo permite letras y espacios.'),
    apellidos: z
      .string()
      .trim()
      .min(1, 'Apellidos es obligatorio.')
      .regex(NAME_REGEX, 'Apellidos solo permite letras y espacios.'),
    telefono: z
      .string()
      .trim()
      .regex(/^\d{4}$/, 'El telefono debe tener exactamente 4 digitos numericos.'),
    tipo_objetivo: z.enum(['propiedad', 'desarrollo']),
    propiedad_id: z.union([z.coerce.number().int().positive(), z.literal('')]).optional(),
    desarrollo_id: z.union([z.coerce.number().int().positive(), z.literal('')]).optional(),
    lada: z
      .string()
      .trim()
      .max(6, 'Lada no puede exceder 6 caracteres.')
      .refine((value) => value.length === 0 || LADA_REGEX.test(value), 'Lada no valida.')
      .optional(),
    comentarios: z
      .string()
      .max(500, 'Comentarios no puede exceder 500 caracteres.')
      .optional(),
    estado: z.string().optional(),
    fecha_cita: z.string().optional(),
    asesor_externo: z.enum(['si', 'no']),
    asesor_externo_nombre: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.tipo_objetivo === 'propiedad' && !values.propiedad_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['propiedad_id'],
        message: 'Propiedad es obligatoria.',
      });
    }

    if (values.tipo_objetivo === 'desarrollo' && !values.desarrollo_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['desarrollo_id'],
        message: 'Desarrollo es obligatorio.',
      });
    }

    if (values.asesor_externo === 'si' && !values.asesor_externo_nombre?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['asesor_externo_nombre'],
        message: 'El nombre del asesor externo es obligatorio.',
      });
    }
  });

export type VisitLeadFormInput = z.input<typeof visitLeadSchema>;
export type VisitLeadFormValues = z.output<typeof visitLeadSchema>;

export function VisitFieldLabel({
  children,
  required = false,
}: {
  children: string;
  required?: boolean;
}) {
  return (
    <span className="text-sm font-medium text-slate-700">
      {children}
      {required ? <span className="ml-1 font-semibold text-red-600">*</span> : null}
    </span>
  );
}

export function normalizeVisitName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .toUpperCase()
    .trimStart();
}

export function sanitizeVisitPhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, 4);
}

export function sanitizeVisitLada(value: string): string {
  const normalized = value.replace(/[^\d+]/g, '');
  if (normalized.startsWith('+')) {
    return `+${normalized.slice(1).replace(/\+/g, '').slice(0, 5)}`;
  }

  return normalized.replace(/\+/g, '').slice(0, 5);
}

function toDateTimeLocalValue(value?: string | null): string {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toVisitApiDateTimeValue(value?: string | null): string | undefined {
  const normalizedValue = value?.trim();
  if (!normalizedValue) return undefined;

  const parsedDate = new Date(normalizedValue);
  if (Number.isNaN(parsedDate.getTime())) return undefined;

  return parsedDate.toISOString();
}

export function toVisitDefaultValues(lead: LeadRecord | null): VisitLeadFormInput {
  if (!lead) {
    return INITIAL_VISIT_FORM;
  }

  return {
    nombres: lead.nombres ?? '',
    apellidos: lead.apellidos ?? '',
    telefono: lead.telefono != null ? String(lead.telefono) : '',
    tipo_objetivo: lead.desarrollo_id != null ? 'desarrollo' : 'propiedad',
    propiedad_id: lead.propiedad_id != null ? String(lead.propiedad_id) : '',
    desarrollo_id: lead.desarrollo_id != null ? String(lead.desarrollo_id) : '',
    lada: lead.lada ?? '+52',
    comentarios: lead.comentarios ?? '',
    estado: lead.estado ?? 'Agendado',
    fecha_cita: toDateTimeLocalValue(lead.fecha_cita),
    asesor_externo: lead.asesor_externo ? 'si' : 'no',
    asesor_externo_nombre: lead.asesor_externo_nombre ?? '',
  };
}

export function buildVisitUpdatePayload(
  values: VisitLeadFormValues,
  dirtyFields: Partial<Record<keyof VisitLeadFormValues, boolean>>,
): UpdateLeadPayload {
  const payload: UpdateLeadPayload = {};

  const fieldMappers: Partial<
    Record<keyof VisitLeadFormValues, (input: VisitLeadFormValues) => unknown>
  > = {
    nombres: (input) => input.nombres.trim(),
    apellidos: (input) => input.apellidos.trim(),
    telefono: (input) => input.telefono,
    lada: (input) => input.lada?.trim() || undefined,
    comentarios: (input) => input.comentarios?.trim() || undefined,
    estado: (input) => input.estado?.trim() || undefined,
    fecha_cita: (input) => toVisitApiDateTimeValue(input.fecha_cita),
  };

  for (const [field, mapper] of Object.entries(fieldMappers) as Array<
    [keyof VisitLeadFormValues, (input: VisitLeadFormValues) => unknown]
  >) {
    if (!dirtyFields[field]) continue;
    payload[field as keyof UpdateLeadPayload] = mapper(values) as never;
  }

  if (dirtyFields.tipo_objetivo || dirtyFields.propiedad_id || dirtyFields.desarrollo_id) {
    payload.propiedad_id =
      values.tipo_objetivo === 'propiedad' ? Number(values.propiedad_id) : null;
    payload.desarrollo_id =
      values.tipo_objetivo === 'desarrollo' ? Number(values.desarrollo_id) : null;
  }

  if (dirtyFields.asesor_externo || dirtyFields.asesor_externo_nombre) {
    payload.asesor_externo = values.asesor_externo === 'si';
    payload.asesor_externo_nombre =
      values.asesor_externo === 'si'
        ? values.asesor_externo_nombre?.trim() || undefined
        : undefined;
  }

  return payload;
}
