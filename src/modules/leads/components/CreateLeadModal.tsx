import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateLeadPayload } from '@/interfaces/lead.interface';
import { AppModal } from '@/components/ui/AppModal';
import { VISIT_STATUS_OPTIONS } from '../utils/leads.constants';

const NAME_REGEX = /^[A-Z\s]+$/;
const LADA_REGEX = /^\+?[0-9]+$/;

const fieldClassName =
  'w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10';

type PropertyOption = {
  id: number;
  label: string;
};

type CreateLeadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: Omit<CreateLeadPayload, 'creado_por_id'>) => Promise<string | null>;
  propertyOptions: PropertyOption[];
};

const INITIAL_FORM = {
  nombres: '',
  apellidos: '',
  telefono: '',
  propiedad_id: '',
  lada: '+52',
  comentarios: '',
  estado: 'Agendado',
  fecha_cita: '',
  asesor_externo: 'no' as const,
  asesor_externo_nombre: '',
};

const createLeadSchema = z
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
    propiedad_id: z.coerce.number().int().positive('Propiedad es obligatoria.'),
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
    if (values.asesor_externo === 'si' && !values.asesor_externo_nombre?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['asesor_externo_nombre'],
        message: 'El nombre del asesor externo es obligatorio.',
      });
    }
  });

type CreateLeadFormInput = z.input<typeof createLeadSchema>;
type CreateLeadFormValues = z.output<typeof createLeadSchema>;

function FieldLabel({ children, required = false }: { children: string; required?: boolean }) {
  return (
    <span className="text-sm font-medium text-slate-700">
      {children}
      {required ? <span className="ml-1 font-semibold text-red-600">*</span> : null}
    </span>
  );
}

function normalizeVisitName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .toUpperCase()
    .trimStart();
}

function sanitizePhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, 4);
}

function sanitizeLada(value: string): string {
  const normalized = value.replace(/[^\d+]/g, '');
  if (normalized.startsWith('+')) {
    return `+${normalized.slice(1).replace(/\+/g, '').slice(0, 5)}`;
  }

  return normalized.replace(/\+/g, '').slice(0, 5);
}

export function CreateLeadModal({
  isOpen,
  onClose,
  onCreate,
  propertyOptions,
}: CreateLeadModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    reset,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateLeadFormInput, unknown, CreateLeadFormValues>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: INITIAL_FORM,
  });

  function resetAndClose() {
    reset(INITIAL_FORM);
    setIsSubmitting(false);
    setSubmitError('');
    onClose();
  }

  const asesorExterno = watch('asesor_externo');

  async function onSubmit(values: CreateLeadFormValues) {
    setSubmitError('');

    const payload: Omit<CreateLeadPayload, 'creado_por_id'> = {
      nombres: values.nombres.trim(),
      apellidos: values.apellidos.trim(),
      telefono: values.telefono,
      propiedad_id: values.propiedad_id,
      lada: values.lada?.trim() || undefined,
      comentarios: values.comentarios?.trim() || undefined,
      estado: values.estado?.trim() || undefined,
      fecha_cita: values.fecha_cita?.trim() || undefined,
      asesor_externo: values.asesor_externo === 'si',
      asesor_externo_nombre:
        values.asesor_externo === 'si'
          ? values.asesor_externo_nombre?.trim() || undefined
          : undefined,
    };

    setIsSubmitting(true);
    const error = await onCreate(payload);
    setIsSubmitting(false);

    if (error) {
      setSubmitError(error);
      return;
    }

    resetAndClose();
  }

  return (
    <AppModal
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Registrar nuevo registro"
      subtitle="Captura la informacion principal del cliente, la propiedad de interes y el seguimiento comercial."
      maxWidthClassName="max-w-2xl"
      panelClassName="max-h-[88vh]"
    >
      <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-slate-600">
        <span className="font-semibold text-red-600">*</span> Campo obligatorio
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Informacion del registro
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Completa los datos de contacto y seguimiento sin perder el contexto de la oportunidad.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <FieldLabel required>Nombres</FieldLabel>
              <input
                type="text"
                {...register('nombres', {
                  onChange: (event) => {
                    event.target.value = normalizeVisitName(event.target.value);
                  },
                })}
                className={fieldClassName}
              />
              {errors.nombres ? <span className="text-xs text-red-600">{errors.nombres.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <FieldLabel required>Apellidos</FieldLabel>
              <input
                type="text"
                {...register('apellidos', {
                  onChange: (event) => {
                    event.target.value = normalizeVisitName(event.target.value);
                  },
                })}
                className={fieldClassName}
              />
              {errors.apellidos ? <span className="text-xs text-red-600">{errors.apellidos.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <FieldLabel>Lada</FieldLabel>
              <input
                type="text"
                {...register('lada', {
                  onChange: (event) => {
                    event.target.value = sanitizeLada(event.target.value);
                  },
                })}
                className={fieldClassName}
                placeholder="+52"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <FieldLabel required>Ultimos 4 digitos del telefono del cliente</FieldLabel>
              <input
                type="text"
                inputMode="numeric"
                {...register('telefono', {
                  onChange: (event) => {
                    event.target.value = sanitizePhone(event.target.value);
                  },
                })}
                className={fieldClassName}
                maxLength={4}
                placeholder="6678"
              />
              {errors.telefono ? <span className="text-xs text-red-600">{errors.telefono.message}</span> : null}
              <span className="text-xs text-slate-500">
                Ingresa solo los ultimos 4 digitos para identificar este registro.
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <FieldLabel required>Propiedad</FieldLabel>
              <select {...register('propiedad_id')} className={fieldClassName}>
                <option value="">Selecciona una propiedad</option>
                {propertyOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.propiedad_id ? <span className="text-xs text-red-600">{errors.propiedad_id.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <FieldLabel>Estado</FieldLabel>
              <select {...register('estado')} className={fieldClassName}>
                {VISIT_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <FieldLabel>Fecha de cita</FieldLabel>
              <input type="datetime-local" {...register('fecha_cita')} className={fieldClassName} />
            </label>

            <label className="flex flex-col gap-1.5">
              <FieldLabel>Asesor externo</FieldLabel>
              <select {...register('asesor_externo')} className={fieldClassName}>
                <option value="no">No</option>
                <option value="si">Si</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <FieldLabel required={asesorExterno === 'si'}>Nombre del asesor externo</FieldLabel>
              <input
                type="text"
                {...register('asesor_externo_nombre', {
                  onChange: (event) => {
                    event.target.value = normalizeVisitName(event.target.value);
                  },
                })}
                className={fieldClassName}
                disabled={asesorExterno !== 'si'}
                placeholder={asesorExterno === 'si' ? 'Nombre del broker externo' : 'N/A'}
              />
              {errors.asesor_externo_nombre ? (
                <span className="text-xs text-red-600">{errors.asesor_externo_nombre.message}</span>
              ) : null}
            </label>

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <FieldLabel>Comentarios</FieldLabel>
              <textarea
                {...register('comentarios')}
                rows={3}
                className={`${fieldClassName} resize-none`}
                placeholder="Comentarios del registro"
              />
            </label>
          </div>
        </div>

        {submitError ? <p className="text-sm font-medium text-red-600">{submitError}</p> : null}

        <div className="flex items-center justify-center gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={resetAndClose} className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Guardando...' : 'Crear'}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
