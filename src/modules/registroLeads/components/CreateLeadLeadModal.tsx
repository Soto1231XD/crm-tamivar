import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateLeadPayload } from '@/interfaces/lead.interface';
import { AppModal } from '@/components/ui/AppModal';
import {
  LEAD_LEADS_CHANNEL_OPTIONS,
  LEAD_LEADS_OPERATION_OPTIONS,
  LEAD_LEADS_PAYMENT_METHOD_OPTIONS,
  LEAD_LEADS_PRIORITY_OPTIONS,
  LEAD_LEADS_SOURCE_OPTIONS,
  LEAD_LEADS_STATUS_OPTIONS,
  formatLeadBudgetInput,
  isValidLeadLeadName,
  leadLeadFieldClassName,
  normalizeLeadBudgetValue,
  sanitizeLeadLeadLada,
  sanitizeLeadLeadName,
  sanitizeLeadLeadPhone,
} from './leadLeads.shared';

const LADA_REGEX = /^\+?[0-9]+$/;

type UserOption = {
  id: number;
  label: string;
};

type CreateLeadLeadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: Omit<CreateLeadPayload, 'creado_por_id'>) => Promise<string | null>;
  userOptions: UserOption[];
};

const INITIAL_FORM = {
  nombres: '',
  apellidos: '',
  telefono: '',
  lada: '+52',
  comentarios: '',
  estado: 'En seguimiento',
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
};

const createLeadLeadSchema = z.object({
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
  telefono: z.string().trim().regex(/^\d{10}$/, 'El telefono debe tener exactamente 10 digitos numericos.'),
  lada: z
    .string()
    .trim()
    .max(6, 'Lada no puede exceder 6 caracteres.')
    .refine((value) => value.length === 0 || LADA_REGEX.test(value), 'Lada no valida.')
    .optional(),
  comentarios: z.string().max(500, 'Comentarios no puede exceder 500 caracteres.').optional(),
  estado: z.string().optional(),
  prioridad: z.string().trim().min(1, 'Prioridad es obligatoria.'),
  vendedor_asignado_id: z.string().trim().min(1, 'Vendedor asignado es obligatorio.'),
  operacion: z.string().trim().min(1, 'Operacion es obligatoria.'),
  canal: z.string().trim().min(1, 'Canal es obligatorio.'),
  solicitud: z.string().max(1000, 'Solicitud no puede exceder 1000 caracteres.').optional(),
  presupuesto: z.string().optional(),
  ubicacion_propiedad: z.string().max(1000, 'La zona de preferencia no puede exceder 1000 caracteres.').optional(),
  metodo_pago: z.array(z.string()).min(1, 'Metodo de pago es obligatorio.'),
  caracteristicas: z.string().max(1000, 'Caracteristicas no puede exceder 1000 caracteres.').optional(),
  origen_lead: z.string().trim().min(1, 'Origen del lead es obligatorio.'),
});

type CreateLeadLeadFormInput = z.input<typeof createLeadLeadSchema>;
type CreateLeadLeadFormValues = z.output<typeof createLeadLeadSchema>;

function FieldLabel({ children, required = false }: { children: string; required?: boolean }) {
  return (
    <span className="text-sm font-medium text-slate-700">
      {children}
      {required ? <span className="ml-1 font-semibold text-red-600">*</span> : null}
    </span>
  );
}

export function CreateLeadLeadModal({
  isOpen,
  onClose,
  onCreate,
  userOptions,
}: CreateLeadLeadModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateLeadLeadFormInput, unknown, CreateLeadLeadFormValues>({
    resolver: zodResolver(createLeadLeadSchema),
    defaultValues: INITIAL_FORM,
  });

  function resetAndClose() {
    reset(INITIAL_FORM);
    setIsSubmitting(false);
    setSubmitError('');
    onClose();
  }

  async function onSubmit(values: CreateLeadLeadFormValues) {
    setSubmitError('');

    const presupuestoValue = normalizeLeadBudgetValue(values.presupuesto);
    if (presupuestoValue && Number.isNaN(Number(presupuestoValue))) {
      setSubmitError('El presupuesto debe ser numerico.');
      return;
    }

    const payload: Omit<CreateLeadPayload, 'creado_por_id'> = {
      nombres: values.nombres.trim(),
      apellidos: values.apellidos.trim(),
      telefono: values.telefono,
      lada: values.lada?.trim() || undefined,
      comentarios: values.comentarios?.trim() || undefined,
      estado: values.estado?.trim() || undefined,
      prioridad: values.prioridad.trim(),
      vendedor_asignado_id: Number(values.vendedor_asignado_id),
      operacion: values.operacion.trim(),
      canal: values.canal.trim(),
      solicitud: values.solicitud?.trim() || undefined,
      presupuesto: presupuestoValue ? Number(presupuestoValue) : undefined,
      ubicacion_propiedad: values.ubicacion_propiedad?.trim() || undefined,
      metodo_pago: values.metodo_pago.join(', '),
      caracteristicas: values.caracteristicas?.trim() || undefined,
      origen_lead: values.origen_lead.trim(),
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
      title="Registrar nuevo lead"
      subtitle="Captura la informacion comercial del lead y asigna el seguimiento desde esta vista."
      maxWidthClassName="max-w-4xl"
      panelClassName="max-h-[88vh]"
    >
      <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-slate-600">
        <span className="font-semibold text-red-600">*</span> Campo obligatorio
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Datos del lead</p>
            <p className="mt-1 text-sm text-slate-600">Completa la informacion base del prospecto y la asignacion comercial.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <FieldLabel required>Nombres</FieldLabel>
              <input
                type="text"
                {...register('nombres', {
                  onChange: (event) => {
                    event.target.value = sanitizeLeadLeadName(event.target.value);
                  },
                })}
                className={leadLeadFieldClassName}
              />
              {errors.nombres ? <span className="text-xs text-red-600">{errors.nombres.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <FieldLabel required>Apellidos</FieldLabel>
              <input
                type="text"
                {...register('apellidos', {
                  onChange: (event) => {
                    event.target.value = sanitizeLeadLeadName(event.target.value);
                  },
                })}
                className={leadLeadFieldClassName}
              />
              {errors.apellidos ? <span className="text-xs text-red-600">{errors.apellidos.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <FieldLabel>Lada</FieldLabel>
              <input
                type="text"
                {...register('lada', {
                  onChange: (event) => {
                    event.target.value = sanitizeLeadLeadLada(event.target.value);
                  },
                })}
                className={leadLeadFieldClassName}
                placeholder="+52"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <FieldLabel required>Celular</FieldLabel>
              <input
                type="text"
                inputMode="numeric"
                {...register('telefono', {
                  onChange: (event) => {
                    event.target.value = sanitizeLeadLeadPhone(event.target.value);
                  },
                })}
                className={leadLeadFieldClassName}
                maxLength={10}
                placeholder="9981144249"
              />
              {errors.telefono ? <span className="text-xs text-red-600">{errors.telefono.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <FieldLabel>Zona de preferencia</FieldLabel>
              <input
                type="text"
                {...register('ubicacion_propiedad')}
                className={leadLeadFieldClassName}
                placeholder="Ej. Zona hotelera, Playa del Carmen, Centro de Cancun"
              />
              {errors.ubicacion_propiedad ? (
                <span className="text-xs text-red-600">{errors.ubicacion_propiedad.message}</span>
              ) : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <FieldLabel required>Vendedor asignado</FieldLabel>
              <select {...register('vendedor_asignado_id')} className={leadLeadFieldClassName}>
                <option value="">Selecciona un usuario</option>
                {userOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.vendedor_asignado_id ? <span className="text-xs text-red-600">{errors.vendedor_asignado_id.message}</span> : null}
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Seguimiento comercial</p>
            <p className="mt-1 text-sm text-slate-600">Asigna el contexto de negocio y el estado actual del lead.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <FieldLabel>Estado</FieldLabel>
              <select {...register('estado')} className={leadLeadFieldClassName}>
                {LEAD_LEADS_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <FieldLabel required>Prioridad</FieldLabel>
              <select {...register('prioridad')} className={leadLeadFieldClassName}>
                {LEAD_LEADS_PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.prioridad ? <span className="text-xs text-red-600">{errors.prioridad.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <FieldLabel required>Operacion</FieldLabel>
              <select {...register('operacion')} className={leadLeadFieldClassName}>
                <option value="">Selecciona una operacion</option>
                {LEAD_LEADS_OPERATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.operacion ? <span className="text-xs text-red-600">{errors.operacion.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <FieldLabel required>Canal</FieldLabel>
              <select {...register('canal')} className={leadLeadFieldClassName}>
                <option value="">Selecciona un canal</option>
                {LEAD_LEADS_CHANNEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.canal ? <span className="text-xs text-red-600">{errors.canal.message}</span> : null}
            </label>

            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Metodo de pago</FieldLabel>
              <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
                {LEAD_LEADS_PAYMENT_METHOD_OPTIONS.map((option) => (
                  <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      value={option}
                      {...register('metodo_pago')}
                      className="h-4 w-4 rounded border-slate-300 text-[#312C85] focus:ring-[#312C85]"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              {errors.metodo_pago ? <span className="text-xs text-red-600">{errors.metodo_pago.message}</span> : null}
            </div>

            <label className="flex flex-col gap-1.5">
              <FieldLabel>Presupuesto (MXN)</FieldLabel>
              <input
                type="text"
                inputMode="decimal"
                {...register('presupuesto', {
                  onChange: (event) => {
                    event.target.value = formatLeadBudgetInput(event.target.value);
                  },
                })}
                className={leadLeadFieldClassName}
                placeholder="3,500,000"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <FieldLabel required>Origen del lead</FieldLabel>
              <select {...register('origen_lead')} className={leadLeadFieldClassName}>
                <option value="">Selecciona un origen</option>
                {LEAD_LEADS_SOURCE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.origen_lead ? <span className="text-xs text-red-600">{errors.origen_lead.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <FieldLabel>Solicitud</FieldLabel>
              <textarea
                {...register('solicitud')}
                rows={3}
                className={`${leadLeadFieldClassName} resize-none`}
                placeholder="Detalle de la solicitud del cliente"
              />
              {errors.solicitud ? <span className="text-xs text-red-600">{errors.solicitud.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <FieldLabel>Caracteristicas</FieldLabel>
              <textarea
                {...register('caracteristicas')}
                rows={3}
                className={`${leadLeadFieldClassName} resize-none`}
                placeholder="Preferencias del cliente"
              />
              {errors.caracteristicas ? <span className="text-xs text-red-600">{errors.caracteristicas.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <FieldLabel>Comentarios</FieldLabel>
              <textarea
                {...register('comentarios')}
                rows={3}
                className={`${leadLeadFieldClassName} resize-none`}
                placeholder="Actualizacion del vendedor asignado"
              />
              {errors.comentarios ? <span className="text-xs text-red-600">{errors.comentarios.message}</span> : null}
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
