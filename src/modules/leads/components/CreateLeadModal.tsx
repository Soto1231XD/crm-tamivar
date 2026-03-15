import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import cerrarIcon from '../../../assets/images/Cerrar.png';
import type { CreateLeadPayload } from '../services/leads.api';

const LEAD_STATUS_OPTIONS = [
  'Contactado',
  'En seguimiento',
  'Cancelado',
  'Cita agendada',
  'En espera',
  'En proceso',
  'Cerrado',
] as const;

const LEAD_PRIORITY_OPTIONS = ['Urgente', 'Normal', 'Bajo Interés'] as const;

const NAME_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;
const LADA_REGEX = /^\+?[0-9]+$/;

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
  correo_electronico: '',
  comentarios: '',
  estado: 'Contactado',
  prioridad: 'Normal',
  fecha_cita: '',
};

const createLeadSchema = z.object({
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
    .regex(/^\d{10}$/, 'El teléfono debe tener exactamente 10 dígitos numéricos.'),
  propiedad_id: z.coerce.number().int().positive('Propiedad es obligatoria.'),
  lada: z
    .string()
    .trim()
    .max(6, 'Lada no puede exceder 6 caracteres.')
    .refine((value) => value.length === 0 || LADA_REGEX.test(value), 'Lada no válida.')
    .optional(),
  correo_electronico: z
    .union([z.literal(''), z.string().email('Correo electrónico no válido.')])
    .optional(),
  comentarios: z.string().max(500, 'Comentarios no puede exceder 500 caracteres.').optional(),
  estado: z.string().optional(),
  prioridad: z.string().trim().min(1, 'Prioridad es obligatoria.'),
  fecha_cita: z.string().optional(),
});

type CreateLeadFormInput = z.input<typeof createLeadSchema>;
type CreateLeadFormValues = z.output<typeof createLeadSchema>;

export function CreateLeadModal({ isOpen, onClose, onCreate, propertyOptions }: CreateLeadModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateLeadFormInput, unknown, CreateLeadFormValues>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: INITIAL_FORM,
  });

  if (!isOpen) return null;

  function sanitizeName(value: string): string {
    return value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, '');
  }

  function sanitizePhone(value: string): string {
    return value.replace(/\D/g, '').slice(0, 10);
  }

  function sanitizeLada(value: string): string {
    const normalized = value.replace(/[^\d+]/g, '');
    if (normalized.startsWith('+')) {
      return `+${normalized.slice(1).replace(/\+/g, '').slice(0, 5)}`;
    }
    return normalized.replace(/\+/g, '').slice(0, 5);
  }

  function resetAndClose() {
    reset(INITIAL_FORM);
    setIsSubmitting(false);
    setSubmitError('');
    onClose();
  }

  async function onSubmit(values: CreateLeadFormValues) {
    setSubmitError('');
    const payload: Omit<CreateLeadPayload, 'creado_por_id'> = {
      nombres: values.nombres.trim(),
      apellidos: values.apellidos.trim(),
      telefono: values.telefono,
      propiedad_id: values.propiedad_id,
      lada: values.lada?.trim() || undefined,
      correo_electronico: values.correo_electronico?.trim() || undefined,
      comentarios: values.comentarios?.trim() || undefined,
      estado: values.estado?.trim() || undefined,
      prioridad: values.prioridad.trim(),
      fecha_cita: values.fecha_cita?.trim() || undefined,
    };

    setIsSubmitting(true);
    const submitError = await onCreate(payload);
    setIsSubmitting(false);

    if (submitError) {
      setSubmitError(submitError);
      return;
    }

    resetAndClose();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-3 sm:p-4">
      <div className="mx-auto flex min-h-full w-full max-w-2xl items-start justify-center py-3 sm:py-6">
        <div className="flex max-h-[88vh] w-full flex-col rounded-xl bg-white p-4 shadow-xl sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Registrar nuevo registro</h3>
            <button
              type="button"
              onClick={resetAndClose}
              aria-label="Cerrar modal"
              title="Cerrar"
              className="rounded-md p-1 hover:bg-slate-100"
            >
              <img src={cerrarIcon} alt="" className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <p className="mb-4 text-sm text-slate-600">
            <span className="font-semibold text-red-600">*</span> Campo obligatorio
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 space-y-4 overflow-y-auto pr-1">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span>
                  Nombres<span className="ml-0.5 font-semibold text-red-600">*</span>
                </span>
                <input
                  type="text"
                  {...register('nombres', {
                    onChange: (event) => {
                      event.target.value = sanitizeName(event.target.value);
                    },
                  })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                />
                {errors.nombres ? <span className="text-xs text-red-600">{errors.nombres.message}</span> : null}
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span>
                  Apellidos<span className="ml-0.5 font-semibold text-red-600">*</span>
                </span>
                <input
                  type="text"
                  {...register('apellidos', {
                    onChange: (event) => {
                      event.target.value = sanitizeName(event.target.value);
                    },
                  })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                />
                {errors.apellidos ? <span className="text-xs text-red-600">{errors.apellidos.message}</span> : null}
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-700">
                Lada
                <input
                  type="text"
                  {...register('lada', {
                    onChange: (event) => {
                      event.target.value = sanitizeLada(event.target.value);
                    },
                  })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                  placeholder="+52"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span>
                  Teléfono<span className="ml-0.5 font-semibold text-red-600">*</span>
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  {...register('telefono', {
                    onChange: (event) => {
                      event.target.value = sanitizePhone(event.target.value);
                    },
                  })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                  maxLength={10}
                  placeholder="9981144249"
                />
                {errors.telefono ? <span className="text-xs text-red-600">{errors.telefono.message}</span> : null}
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
                Correo electrónico
                <input
                  type="email"
                  {...register('correo_electronico')}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                  placeholder="usuario@correo.com"
                />
                {errors.correo_electronico ? (
                  <span className="text-xs text-red-600">{errors.correo_electronico.message}</span>
                ) : null}
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span>
                  Propiedad<span className="ml-0.5 font-semibold text-red-600">*</span>
                </span>
                <select
                  {...register('propiedad_id')}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                >
                  <option value="">Selecciona una propiedad</option>
                  {propertyOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.propiedad_id ? <span className="text-xs text-red-600">{errors.propiedad_id.message}</span> : null}
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-700">
                Estado
                <select
                  {...register('estado')}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                >
                  {LEAD_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-700">
                Fecha de cita
                <input
                  type="datetime-local"
                  {...register('fecha_cita')}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span>
                  Prioridad<span className="ml-0.5 font-semibold text-red-600">*</span>
                </span>
                <select
                  {...register('prioridad')}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                >
                  {LEAD_PRIORITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.prioridad ? <span className="text-xs text-red-600">{errors.prioridad.message}</span> : null}
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
                Comentarios
                <textarea
                  {...register('comentarios')}
                  rows={3}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                  placeholder="Comentarios del registro"
                />
              </label>
            </div>

            {submitError ? <p className="text-sm font-medium text-red-600">{submitError}</p> : null}

            <div className="sticky bottom-0 flex items-center justify-center gap-2 border-t border-slate-200 bg-white pt-3">
              <button
                type="button"
                onClick={resetAndClose}
                className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white"
              >
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
        </div>
      </div>
    </div>
  );
}
