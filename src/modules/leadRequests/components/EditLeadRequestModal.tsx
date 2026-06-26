import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { LeadRequestRecord, UpdateLeadRequestPayload } from '@/interfaces/lead-request.interface';
import { AppModal } from '@/components/ui/AppModal';
import {
  buildLeadRequestUpdatePayload,
  formatLeadRequestBudgetInput,
  leadRequestFieldClassName,
  LeadRequestFieldLabel,
  LEAD_REQUEST_MEDIUM_OPTIONS,
  LEAD_REQUEST_PAYMENT_METHOD_OPTIONS,
  LEAD_REQUEST_PROPERTY_TYPE_OPTIONS,
  LEAD_REQUEST_STATUS_OPTIONS,
  leadRequestSchema,
  normalizeLeadRequestBudgetValue,
  sanitizeLeadRequestName,
  sanitizeLeadRequestPhone,
  toLeadRequestDefaultValues,
  type LeadRequestFormInput,
  type LeadRequestFormValues,
} from './leadRequests.shared';

type EditLeadRequestModalProps = {
  isOpen: boolean;
  leadRequest: LeadRequestRecord | null;
  sellerOptions: Array<{ id: number; label: string }>;
  onClose: () => void;
  onEdit: (leadRequestId: number, payload: UpdateLeadRequestPayload) => Promise<string | null>;
};

export function EditLeadRequestModal({
  isOpen,
  leadRequest,
  sellerOptions,
  onClose,
  onEdit,
}: EditLeadRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<LeadRequestFormInput, unknown, LeadRequestFormValues>({
    resolver: zodResolver(leadRequestSchema),
    defaultValues: toLeadRequestDefaultValues(leadRequest),
  });

  useEffect(() => {
    reset(toLeadRequestDefaultValues(leadRequest));
    setSubmitError('');
    setIsSubmitting(false);
  }, [leadRequest, isOpen, reset]);

  if (!leadRequest) return null;
  const currentLeadRequest = leadRequest;

  function closeModal() {
    setSubmitError('');
    setIsSubmitting(false);
    onClose();
  }

  async function onSubmit(values: LeadRequestFormValues) {
    const presupuestoValue = normalizeLeadRequestBudgetValue(values.presupuesto);
    if (presupuestoValue && Number.isNaN(Number(presupuestoValue))) {
      setSubmitError('El presupuesto debe ser numérico.');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    const payload: UpdateLeadRequestPayload = buildLeadRequestUpdatePayload(values, dirtyFields);

    if (Object.keys(payload).length === 0) {
      setIsSubmitting(false);
      closeModal();
      return;
    }

    const error = await onEdit(currentLeadRequest.id, payload);
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
      title="Editar solicitud"
      subtitle="Actualiza la información comercial y mantén el seguimiento de esta solicitud al día."
      maxWidthClassName="max-w-5xl"
      panelClassName="max-h-[88vh]"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Datos de la solicitud</p>
            <p className="mt-1 text-sm text-slate-600">Revisa el estado, el vendedor asignado y la necesidad principal del cliente.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <LeadRequestFieldLabel>Estado</LeadRequestFieldLabel>
              <select {...register('estado')} className={leadRequestFieldClassName}>
                {LEAD_REQUEST_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <LeadRequestFieldLabel required>Fecha de alta</LeadRequestFieldLabel>
              <input type="date" {...register('fecha_alta')} className={leadRequestFieldClassName} />
              {errors.fecha_alta ? <span className="text-xs text-red-600">{errors.fecha_alta.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <LeadRequestFieldLabel required>Nombre</LeadRequestFieldLabel>
              <input
                type="text"
                {...register('nombre', {
                  onChange: (event) => {
                    event.target.value = sanitizeLeadRequestName(event.target.value);
                  },
                })}
                className={leadRequestFieldClassName}
              />
              {errors.nombre ? <span className="text-xs text-red-600">{errors.nombre.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <LeadRequestFieldLabel>Teléfono</LeadRequestFieldLabel>
              <input
                type="text"
                inputMode="numeric"
                {...register('telefono', {
                  onChange: (event) => {
                    event.target.value = sanitizeLeadRequestPhone(event.target.value);
                  },
                })}
                className={leadRequestFieldClassName}
                maxLength={14}
                placeholder="Ej. 9981144249"
              />
              {errors.telefono ? <span className="text-xs text-red-600">{errors.telefono.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <LeadRequestFieldLabel required>Vendedor</LeadRequestFieldLabel>
              <select {...register('vendedor_id')} className={leadRequestFieldClassName}>
                <option value="">Selecciona un vendedor</option>
                {sellerOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.vendedor_id ? <span className="text-xs text-red-600">{errors.vendedor_id.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <LeadRequestFieldLabel required>Solicitud</LeadRequestFieldLabel>
              <input type="text" {...register('solicitud')} className={leadRequestFieldClassName} placeholder="Ej. Compra, renta, casa vacacional, inversión..." />
              {errors.solicitud ? <span className="text-xs text-red-600">{errors.solicitud.message}</span> : null}
            </label>

            <div className="flex flex-col gap-1.5">
              <LeadRequestFieldLabel>Tipo de inmueble</LeadRequestFieldLabel>
              <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
                {LEAD_REQUEST_PROPERTY_TYPE_OPTIONS.map((option) => (
                  <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      value={option}
                      {...register('tipo_inmueble')}
                      className="h-4 w-4 rounded border-slate-300 text-[#312C85] focus:ring-[#312C85]"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              {errors.tipo_inmueble ? <span className="text-xs text-red-600">{errors.tipo_inmueble.message}</span> : null}
            </div>

            <label className="flex flex-col gap-1.5">
              <LeadRequestFieldLabel>Presupuesto (MXN)</LeadRequestFieldLabel>
              <input
                type="text"
                inputMode="decimal"
                {...register('presupuesto', {
                  onChange: (event) => {
                    event.target.value = formatLeadRequestBudgetInput(event.target.value);
                  },
                })}
                className={leadRequestFieldClassName}
                placeholder="Ej. 10,000,000"
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <LeadRequestFieldLabel>Método de pago</LeadRequestFieldLabel>
              <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
                {LEAD_REQUEST_PAYMENT_METHOD_OPTIONS.map((option) => (
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

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <LeadRequestFieldLabel>Ubicación</LeadRequestFieldLabel>
              <textarea {...register('ubicacion')} rows={2} className={`${leadRequestFieldClassName} resize-none`} placeholder="Ej. Zona hotelera, Lagos del Sol, Villamagna..." />
              {errors.ubicacion ? <span className="text-xs text-red-600">{errors.ubicacion.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <LeadRequestFieldLabel>N. habitaciones</LeadRequestFieldLabel>
              <input type="text" {...register('numero_habitaciones')} className={leadRequestFieldClassName} placeholder="Ej. 3 / Estudio / 300 m2" />
              {errors.numero_habitaciones ? <span className="text-xs text-red-600">{errors.numero_habitaciones.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <LeadRequestFieldLabel>Medio</LeadRequestFieldLabel>
              <select {...register('medio')} className={leadRequestFieldClassName}>
                <option value="">Selecciona un medio</option>
                {LEAD_REQUEST_MEDIUM_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.medio ? <span className="text-xs text-red-600">{errors.medio.message}</span> : null}
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Seguimiento comercial</p>
            <p className="mt-1 text-sm text-slate-600">Actualiza características y concentra el historial comercial en comentarios finales.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 md:col-span-2">
              <LeadRequestFieldLabel>Características</LeadRequestFieldLabel>
              <textarea {...register('caracteristicas')} rows={3} className={`${leadRequestFieldClassName} resize-none`} />
              {errors.caracteristicas ? <span className="text-xs text-red-600">{errors.caracteristicas.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <LeadRequestFieldLabel>Comentario final</LeadRequestFieldLabel>
              <textarea {...register('comentario_final')} rows={4} className={`${leadRequestFieldClassName} resize-none`} />
              {errors.comentario_final ? <span className="text-xs text-red-600">{errors.comentario_final.message}</span> : null}
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
