import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { LeadRecord, UpdateLeadPayload } from '@/interfaces/lead.interface';
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
  parseLeadPaymentMethods,
  sanitizeLeadLeadLada,
  sanitizeLeadLeadName,
  sanitizeLeadLeadPhone,
} from './leadLeads.shared';

const LADA_REGEX = /^\+?[0-9]+$/;

type UserOption = {
  id: number;
  label: string;
};

type EditLeadLeadModalProps = {
  isOpen: boolean;
  lead: LeadRecord | null;
  onClose: () => void;
  onEdit: (leadId: number, payload: UpdateLeadPayload) => Promise<string | null>;
  userOptions: UserOption[];
};

const editLeadLeadSchema = z.object({
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

type EditLeadLeadFormInput = z.input<typeof editLeadLeadSchema>;
type EditLeadLeadFormValues = z.output<typeof editLeadLeadSchema>;

function FieldLabel({ children, required = false }: { children: string; required?: boolean }) {
  return (
    <span className="text-sm font-medium text-slate-700">
      {children}
      {required ? <span className="ml-1 font-semibold text-red-600">*</span> : null}
    </span>
  );
}

function toDefaultValues(lead: LeadRecord | null): EditLeadLeadFormInput {
  return {
    nombres: lead?.nombres ?? '',
    apellidos: lead?.apellidos ?? '',
    telefono: lead?.telefono != null ? String(lead.telefono) : '',
    lada: lead?.lada ?? '+52',
    comentarios: lead?.comentarios ?? '',
    estado: lead?.estado ?? 'En seguimiento',
    prioridad: lead?.prioridad ?? 'Normal',
    vendedor_asignado_id: lead?.vendedor_asignado_id != null ? String(lead.vendedor_asignado_id) : '',
    operacion: lead?.operacion ?? '',
    canal: lead?.canal ?? '',
    solicitud: lead?.solicitud ?? '',
    presupuesto: lead?.presupuesto != null ? formatLeadBudgetInput(String(lead.presupuesto)) : '',
    ubicacion_propiedad: lead?.ubicacion_propiedad ?? '',
    metodo_pago: parseLeadPaymentMethods(lead?.metodo_pago),
    caracteristicas: lead?.caracteristicas ?? '',
    origen_lead: lead?.origen_lead ?? '',
  };
}

export function EditLeadLeadModal({
  isOpen,
  lead,
  onClose,
  onEdit,
  userOptions,
}: EditLeadLeadModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<EditLeadLeadFormInput, unknown, EditLeadLeadFormValues>({
    resolver: zodResolver(editLeadLeadSchema),
    defaultValues: toDefaultValues(lead),
  });

  useEffect(() => {
    reset(toDefaultValues(lead));
    setSubmitError('');
    setIsSubmitting(false);
  }, [lead, isOpen, reset]);

  if (!lead) return null;
  const currentLead = lead;

  function closeModal() {
    setSubmitError('');
    setIsSubmitting(false);
    onClose();
  }

  async function onSubmit(values: EditLeadLeadFormValues) {
    const presupuestoValue = normalizeLeadBudgetValue(values.presupuesto);
    if (presupuestoValue && Number.isNaN(Number(presupuestoValue))) {
      setSubmitError('El presupuesto debe ser numerico.');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    const payload: UpdateLeadPayload = {};

    if (dirtyFields.nombres) payload.nombres = values.nombres.trim();
    if (dirtyFields.apellidos) payload.apellidos = values.apellidos.trim();
    if (dirtyFields.telefono) payload.telefono = values.telefono;
    if (dirtyFields.lada) payload.lada = values.lada?.trim() || undefined;
    if (dirtyFields.comentarios) payload.comentarios = values.comentarios?.trim() || undefined;
    if (dirtyFields.estado) payload.estado = values.estado?.trim() || undefined;
    if (dirtyFields.prioridad) payload.prioridad = values.prioridad.trim();
    if (dirtyFields.vendedor_asignado_id) payload.vendedor_asignado_id = Number(values.vendedor_asignado_id);
    if (dirtyFields.operacion) payload.operacion = values.operacion.trim();
    if (dirtyFields.canal) payload.canal = values.canal.trim();
    if (dirtyFields.solicitud) payload.solicitud = values.solicitud?.trim() || undefined;
    if (dirtyFields.presupuesto) payload.presupuesto = presupuestoValue ? Number(presupuestoValue) : undefined;
    if (dirtyFields.ubicacion_propiedad) payload.ubicacion_propiedad = values.ubicacion_propiedad?.trim() || undefined;
    if (dirtyFields.metodo_pago) payload.metodo_pago = values.metodo_pago.join(', ');
    if (dirtyFields.caracteristicas) payload.caracteristicas = values.caracteristicas?.trim() || undefined;
    if (dirtyFields.origen_lead) payload.origen_lead = values.origen_lead.trim();

    if (Object.keys(payload).length === 0) {
      setIsSubmitting(false);
      closeModal();
      return;
    }

    const error = await onEdit(currentLead.id, payload);
    setIsSubmitting(false);

    if (error) {
      setSubmitError(error);
      return;
    }

    closeModal();
  }

  return (
    <AppModal
      isOpen={isOpen}
      onClose={closeModal}
      title="Editar lead"
      subtitle="Actualiza la información del lead y mantiene el seguimiento comercial al dia."
      maxWidthClassName="max-w-4xl"
      panelClassName="max-h-[88vh]"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Datos del lead</p>
            <p className="mt-1 text-sm text-slate-600">Revisa los datos de contacto, la zona de preferencia y la asignación comercial.</p>
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
            <p className="mt-1 text-sm text-slate-600">Actualiza el contexto de negocio y el seguimiento del vendedor asignado.</p>
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
              <FieldLabel required>Operación</FieldLabel>
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
              <FieldLabel required>Método de pago</FieldLabel>
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
              <FieldLabel>Presupuesto</FieldLabel>
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
              <FieldLabel>Características</FieldLabel>
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
                placeholder="Actualización del vendedor asignado"
              />
              {errors.comentarios ? <span className="text-xs text-red-600">{errors.comentarios.message}</span> : null}
            </label>
          </div>
        </div>

        {submitError ? <p className="text-sm font-medium text-red-600">{submitError}</p> : null}

        <div className="flex items-center justify-center gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={closeModal} className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
