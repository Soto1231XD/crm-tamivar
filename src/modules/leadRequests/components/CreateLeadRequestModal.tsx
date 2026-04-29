import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateLeadRequestPayload } from '@/interfaces/lead-request.interface';
import { AppModal } from '@/components/ui/AppModal';
import {
  formatLeadRequestBudgetInput,
  INITIAL_LEAD_REQUEST_FORM,
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
  type LeadRequestFormInput,
  type LeadRequestFormValues,
} from './leadRequests.shared';

type UserOption = {
  id: number;
  label: string;
};

type CreateLeadRequestModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: Omit<CreateLeadRequestPayload, 'creado_por_id'>) => Promise<string | null>;
  userOptions: UserOption[];
};

export function CreateLeadRequestModal({
  isOpen,
  onClose,
  onCreate,
  userOptions,
}: CreateLeadRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadRequestFormInput, unknown, LeadRequestFormValues>({
    resolver: zodResolver(leadRequestSchema),
    defaultValues: INITIAL_LEAD_REQUEST_FORM,
  });

  function resetAndClose() {
    reset(INITIAL_LEAD_REQUEST_FORM);
    setIsSubmitting(false);
    setSubmitError('');
    onClose();
  }

  async function onSubmit(values: LeadRequestFormValues) {
    setSubmitError('');

    const presupuestoValue = normalizeLeadRequestBudgetValue(values.presupuesto);
    if (presupuestoValue && Number.isNaN(Number(presupuestoValue))) {
      setSubmitError('El presupuesto debe ser numérico.');
      return;
    }

    const payload: Omit<CreateLeadRequestPayload, 'creado_por_id'> = {
      estado: values.estado?.trim() || undefined,
      fecha_alta: values.fecha_alta,
      vendedor_id: Number(values.vendedor_id),
      nombre: values.nombre.trim(),
      telefono: values.telefono?.trim() || undefined,
      solicitud: values.solicitud.trim(),
      tipo_inmueble: values.tipo_inmueble?.trim() || undefined,
      presupuesto: presupuestoValue ? Number(presupuestoValue) : undefined,
      metodo_pago: values.metodo_pago.length > 0 ? values.metodo_pago.join(', ') : undefined,
      ubicacion: values.ubicacion?.trim() || undefined,
      numero_habitaciones: values.numero_habitaciones?.trim() || undefined,
      caracteristicas: values.caracteristicas?.trim() || undefined,
      seguimiento: values.seguimiento?.trim() || undefined,
      opciones_enviadas: values.opciones_enviadas?.trim() || undefined,
      medio: values.medio?.trim() || undefined,
      comentario_final: values.comentario_final?.trim() || undefined,
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
      title="Registrar nueva solicitud"
      subtitle="Captura la solicitud comercial del lead y documenta el seguimiento desde esta vista."
      maxWidthClassName="max-w-5xl"
      panelClassName="max-h-[88vh]"
    >
      <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-slate-600">
        <span className="font-semibold text-red-600">*</span> Campo obligatorio
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Datos de la solicitud</p>
            <p className="mt-1 text-sm text-slate-600">Documenta al cliente, el vendedor y la necesidad principal para iniciar el seguimiento.</p>
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
              <LeadRequestFieldLabel required>Vendedor</LeadRequestFieldLabel>
              <select {...register('vendedor_id')} className={leadRequestFieldClassName}>
                <option value="">Selecciona un usuario</option>
                {userOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.vendedor_id ? <span className="text-xs text-red-600">{errors.vendedor_id.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <LeadRequestFieldLabel required>Nombre del cliente</LeadRequestFieldLabel>
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
                maxLength={10}
                placeholder="9981144249"
              />
              {errors.telefono ? <span className="text-xs text-red-600">{errors.telefono.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <LeadRequestFieldLabel required>Solicitud</LeadRequestFieldLabel>
              <input
                type="text"
                {...register('solicitud')}
                className={leadRequestFieldClassName}
                placeholder="Compra, renta, casa vacacional, inversion..."
              />
              {errors.solicitud ? <span className="text-xs text-red-600">{errors.solicitud.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <LeadRequestFieldLabel>Tipo de inmueble</LeadRequestFieldLabel>
              <select {...register('tipo_inmueble')} className={leadRequestFieldClassName}>
                <option value="">Selecciona un tipo</option>
                {LEAD_REQUEST_PROPERTY_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

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
                placeholder="10,000,000"
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
              <textarea
                {...register('ubicacion')}
                rows={2}
                className={`${leadRequestFieldClassName} resize-none`}
                placeholder="Zona hotelera, Lagos del Sol, Villamagna..."
              />
              {errors.ubicacion ? <span className="text-xs text-red-600">{errors.ubicacion.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <LeadRequestFieldLabel>N. habitaciones</LeadRequestFieldLabel>
              <input
                type="text"
                {...register('numero_habitaciones')}
                className={leadRequestFieldClassName}
                placeholder="3 / Estudio / 300m2"
              />
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
            <p className="mt-1 text-sm text-slate-600">Registra las características, el seguimiento operativo y el cierre de esta solicitud.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 md:col-span-2">
              <LeadRequestFieldLabel>Características</LeadRequestFieldLabel>
              <textarea {...register('caracteristicas')} rows={3} className={`${leadRequestFieldClassName} resize-none`} />
              {errors.caracteristicas ? <span className="text-xs text-red-600">{errors.caracteristicas.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <LeadRequestFieldLabel>Seguimiento</LeadRequestFieldLabel>
              <textarea {...register('seguimiento')} rows={3} className={`${leadRequestFieldClassName} resize-none`} />
              {errors.seguimiento ? <span className="text-xs text-red-600">{errors.seguimiento.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <LeadRequestFieldLabel>Opciones enviadas</LeadRequestFieldLabel>
              <textarea {...register('opciones_enviadas')} rows={3} className={`${leadRequestFieldClassName} resize-none`} />
              {errors.opciones_enviadas ? <span className="text-xs text-red-600">{errors.opciones_enviadas.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <LeadRequestFieldLabel>Comentario final</LeadRequestFieldLabel>
              <textarea {...register('comentario_final')} rows={3} className={`${leadRequestFieldClassName} resize-none`} />
              {errors.comentario_final ? <span className="text-xs text-red-600">{errors.comentario_final.message}</span> : null}
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
