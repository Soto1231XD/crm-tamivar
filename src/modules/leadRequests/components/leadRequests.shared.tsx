import { z } from 'zod';
import type { LeadRequestRecord, UpdateLeadRequestPayload } from '@/interfaces/lead-request.interface';

export const LEAD_REQUEST_STATUS_OPTIONS = ['Activo', 'En seguimiento', 'En espera', 'Cerrado', 'Cancelado'] as const;

export const LEAD_REQUEST_PROPERTY_TYPE_OPTIONS = [
  'Casa',
  'Departamento',
  'Desarrollo',
  'Terreno',
  'Local comercial',
  'Edificio comercial',
  'Bodega',
  'Oficina',
  'Otro',
] as const;

export const LEAD_REQUEST_PAYMENT_METHOD_OPTIONS = [
  'Recursos propios',
  'Credito bancario',
  'Recursos propios con credito bancario',
  'Infonavit',
  'Cofinavit',
  'Fovissste',
  'Issfam',
  'Otro',
] as const;

export const LEAD_REQUEST_MEDIUM_OPTIONS = [
  'Facebook',
  'Instagram',
  'Tiktok',
  'Sitio web',
  'Whatsapp',
  'Llamada',
  'Referido',
  'Otro',
] as const;

export const leadRequestFieldClassName =
  'w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10';

const NAME_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;

function getCurrentLocalDateValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export const INITIAL_LEAD_REQUEST_FORM = {
  estado: 'Activo',
  fecha_alta: getCurrentLocalDateValue(),
  nombre: '',
  telefono: '',
  vendedor_id: '',
  solicitud: '',
  tipo_inmueble: [] as string[],
  presupuesto: '',
  metodo_pago: [] as string[],
  ubicacion: '',
  numero_habitaciones: '',
  caracteristicas: '',
  medio: '',
  comentario_final: '',
};

export const leadRequestSchema = z.object({
  estado: z.string().optional(),
  fecha_alta: z.string().trim().min(1, 'Fecha de alta es obligatoria.'),
  nombre: z
    .string()
    .trim()
    .min(1, 'Nombre es obligatorio.')
    .refine((value) => isValidLeadRequestName(value), 'Nombre solo permite letras y espacios.'),
  telefono: z
    .string()
    .trim()
    .refine((value) => value.length === 0 || /^\d{10}$/.test(value), 'El teléfono debe tener exactamente 10 dígitos numéricos.')
    .optional(),
  vendedor_id: z.string().trim().min(1, 'Vendedor es obligatorio.'),
  solicitud: z.string().trim().min(1, 'Solicitud es obligatoria.').max(1000, 'Solicitud no puede exceder 1000 caracteres.'),
  tipo_inmueble: z.array(z.string()).optional().default([]),
  presupuesto: z.string().optional(),
  metodo_pago: z.array(z.string()).optional().default([]),
  ubicacion: z.string().max(1000, 'Ubicación no puede exceder 1000 caracteres.').optional(),
  numero_habitaciones: z.string().max(120, 'N. habitaciones no puede exceder 120 caracteres.').optional(),
  caracteristicas: z.string().max(1500, 'Características no puede exceder 1500 caracteres.').optional(),
  medio: z.string().max(150, 'Medio no puede exceder 150 caracteres.').optional(),
  comentario_final: z.string().max(1500, 'Comentario final no puede exceder 1500 caracteres.').optional(),
});

export type LeadRequestFormInput = z.input<typeof leadRequestSchema>;
export type LeadRequestFormValues = z.output<typeof leadRequestSchema>;
type LeadRequestDirtyFields = Partial<Record<keyof LeadRequestFormValues, boolean | boolean[]>>;

export function LeadRequestFieldLabel({ children, required = false }: { children: string; required?: boolean }) {
  return (
    <span className="text-sm font-medium text-slate-700">
      {children}
      {required ? <span className="ml-1 font-semibold text-red-600">*</span> : null}
    </span>
  );
}

export function sanitizeLeadRequestName(value: string): string {
  return value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, '');
}

export function sanitizeLeadRequestPhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

export function isValidLeadRequestName(value: string): boolean {
  return NAME_REGEX.test(value);
}

export function formatLeadRequestBudgetInput(value: string): string {
  const normalized = value.replace(/[^\d.]/g, '');
  const [integerPart = '', decimalPart = ''] = normalized.split('.');
  const cleanInteger = integerPart.replace(/^0+(?=\d)/, '');
  const formattedInteger = (cleanInteger || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (!normalized.includes('.')) {
    return cleanInteger ? formattedInteger : '';
  }

  return `${formattedInteger}.${decimalPart.slice(0, 2)}`;
}

export function normalizeLeadRequestBudgetValue(value?: string): string {
  return (value ?? '').replace(/,/g, '').trim();
}

export function parseLeadRequestPaymentMethods(value?: string | null): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseLeadRequestPropertyTypes(value?: string | null): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toLeadRequestDefaultValues(request: LeadRequestRecord | null): LeadRequestFormInput {
  if (!request) {
    return INITIAL_LEAD_REQUEST_FORM;
  }

  return {
    estado: request.estado ?? 'Activo',
    fecha_alta: request.fecha_alta ? request.fecha_alta.slice(0, 10) : getCurrentLocalDateValue(),
    nombre: request.nombre ?? '',
    telefono: request.telefono != null ? String(request.telefono) : '',
    vendedor_id: request.vendedor_id != null ? String(request.vendedor_id) : '',
    solicitud: request.solicitud ?? '',
    tipo_inmueble: parseLeadRequestPropertyTypes(request.tipo_inmueble),
    presupuesto: request.presupuesto != null ? formatLeadRequestBudgetInput(String(request.presupuesto)) : '',
    metodo_pago: parseLeadRequestPaymentMethods(request.metodo_pago),
    ubicacion: request.ubicacion ?? '',
    numero_habitaciones: request.numero_habitaciones ?? '',
    caracteristicas: request.caracteristicas ?? '',
    medio: request.medio ?? '',
    comentario_final: request.comentario_final ?? '',
  };
}

export function buildLeadRequestUpdatePayload(
  values: LeadRequestFormValues,
  dirtyFields: LeadRequestDirtyFields,
): UpdateLeadRequestPayload {
  const payload: UpdateLeadRequestPayload = {};

  const fieldMappers: Partial<Record<keyof LeadRequestFormValues, (input: LeadRequestFormValues) => unknown>> = {
    estado: (input) => input.estado?.trim() || undefined,
    fecha_alta: (input) => input.fecha_alta,
    nombre: (input) => input.nombre.trim(),
    telefono: (input) => input.telefono?.trim() || undefined,
    vendedor_id: (input) => Number(input.vendedor_id),
    solicitud: (input) => input.solicitud.trim(),
    tipo_inmueble: (input) => (input.tipo_inmueble.length > 0 ? input.tipo_inmueble.join(', ') : undefined),
    metodo_pago: (input) => (input.metodo_pago.length > 0 ? input.metodo_pago.join(', ') : undefined),
    ubicacion: (input) => input.ubicacion?.trim() || undefined,
    numero_habitaciones: (input) => input.numero_habitaciones?.trim() || undefined,
    caracteristicas: (input) => input.caracteristicas?.trim() || undefined,
    medio: (input) => input.medio?.trim() || undefined,
    comentario_final: (input) => input.comentario_final?.trim() || undefined,
  };

  for (const [field, mapper] of Object.entries(fieldMappers) as Array<
    [keyof LeadRequestFormValues, (input: LeadRequestFormValues) => unknown]
  >) {
    if (!dirtyFields[field]) continue;
    payload[field as keyof UpdateLeadRequestPayload] = mapper(values) as never;
  }

  if (dirtyFields.presupuesto) {
    const presupuestoValue = normalizeLeadRequestBudgetValue(values.presupuesto);
    payload.presupuesto = presupuestoValue ? Number(presupuestoValue) : undefined;
  }

  return payload;
}
