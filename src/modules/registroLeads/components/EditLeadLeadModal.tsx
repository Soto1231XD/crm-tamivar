import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { LeadRecord, UpdateLeadPayload } from '@/interfaces/lead.interface';
import { AppModal } from '@/components/ui/AppModal';
import {
  buildLeadLeadUpdatePayload,
  LeadLeadFieldLabel,
  LEAD_LEADS_CHANNEL_OPTIONS,
  LEAD_LEADS_OPERATION_OPTIONS,
  LEAD_LEADS_PAYMENT_METHOD_OPTIONS,
  LEAD_LEADS_PRIORITY_OPTIONS,
  LEAD_LEADS_SOURCE_OPTIONS,
  LEAD_LEADS_STATUS_OPTIONS,
  formatLeadBudgetInput,
  leadLeadSchema,
  leadLeadFieldClassName,
  normalizeLeadBudgetValue,
  sanitizeLeadLeadLada,
  sanitizeLeadLeadName,
  sanitizeLeadLeadPhone,
  toLeadLeadDefaultValues,
  type LeadLeadFormInput,
  type LeadLeadFormValues,
} from './leadLeads.shared';

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
  } = useForm<LeadLeadFormInput, unknown, LeadLeadFormValues>({
    resolver: zodResolver(leadLeadSchema),
    defaultValues: toLeadLeadDefaultValues(lead),
  });

  useEffect(() => {
    reset(toLeadLeadDefaultValues(lead));
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

  async function onSubmit(values: LeadLeadFormValues) {
    const presupuestoValue = normalizeLeadBudgetValue(values.presupuesto);
    if (presupuestoValue && Number.isNaN(Number(presupuestoValue))) {
      setSubmitError('El presupuesto debe ser numérico.');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    const payload: UpdateLeadPayload = buildLeadLeadUpdatePayload(values, dirtyFields);

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
              <LeadLeadFieldLabel required>Nombres</LeadLeadFieldLabel>
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
              <LeadLeadFieldLabel required>Apellidos</LeadLeadFieldLabel>
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
              <LeadLeadFieldLabel>Lada</LeadLeadFieldLabel>
              <input
                type="text"
                {...register('lada', {
                  onChange: (event) => {
                    event.target.value = sanitizeLeadLeadLada(event.target.value);
                  },
                })}
                className={leadLeadFieldClassName}
                placeholder="Ej. +52"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <LeadLeadFieldLabel required>Celular</LeadLeadFieldLabel>
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
                placeholder="Ej. 9981144249"
              />
              {errors.telefono ? <span className="text-xs text-red-600">{errors.telefono.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <LeadLeadFieldLabel>Zona de preferencia</LeadLeadFieldLabel>
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
              <LeadLeadFieldLabel required>Vendedor asignado</LeadLeadFieldLabel>
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
              <LeadLeadFieldLabel>Estado</LeadLeadFieldLabel>
              <select {...register('estado')} className={leadLeadFieldClassName}>
                {LEAD_LEADS_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <LeadLeadFieldLabel required>Prioridad</LeadLeadFieldLabel>
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
              <LeadLeadFieldLabel required>Operación</LeadLeadFieldLabel>
              <select {...register('operacion')} className={leadLeadFieldClassName}>
                <option value="">Selecciona una operación</option>
                {LEAD_LEADS_OPERATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.operacion ? <span className="text-xs text-red-600">{errors.operacion.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <LeadLeadFieldLabel required>Canal</LeadLeadFieldLabel>
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
              <LeadLeadFieldLabel>Método de pago</LeadLeadFieldLabel>
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
              <LeadLeadFieldLabel>Presupuesto</LeadLeadFieldLabel>
              <input
                type="text"
                inputMode="decimal"
                {...register('presupuesto', {
                  onChange: (event) => {
                    event.target.value = formatLeadBudgetInput(event.target.value);
                  },
                })}
                className={leadLeadFieldClassName}
                placeholder="Ej. 3,500,000"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <LeadLeadFieldLabel required>Origen del lead</LeadLeadFieldLabel>
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
              <LeadLeadFieldLabel>Solicitud</LeadLeadFieldLabel>
              <textarea
                {...register('solicitud')}
                rows={3}
                className={`${leadLeadFieldClassName} resize-none`}
                placeholder="Ej. Detalle de la solicitud del cliente"
              />
              {errors.solicitud ? <span className="text-xs text-red-600">{errors.solicitud.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <LeadLeadFieldLabel>Características</LeadLeadFieldLabel>
              <textarea
                {...register('caracteristicas')}
                rows={3}
                className={`${leadLeadFieldClassName} resize-none`}
                placeholder="Ej. Preferencias del cliente"
              />
              {errors.caracteristicas ? <span className="text-xs text-red-600">{errors.caracteristicas.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <LeadLeadFieldLabel>Comentarios</LeadLeadFieldLabel>
              <textarea
                {...register('comentarios')}
                rows={3}
                className={`${leadLeadFieldClassName} resize-none`}
                placeholder="Ej. Actualización del vendedor asignado"
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
