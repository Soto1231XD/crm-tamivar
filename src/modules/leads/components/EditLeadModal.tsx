import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { LeadRecord, UpdateLeadPayload } from '@/interfaces/lead.interface';
import { AppModal } from '@/components/ui/AppModal';
import { VISIT_STATUS_OPTIONS } from '../utils/leads.constants';
import {
  buildVisitUpdatePayload,
  VisitFieldLabel,
  sanitizeVisitLada,
  sanitizeVisitPhone,
  normalizeVisitName,
  toVisitDefaultValues,
  visitLeadFieldClassName,
  visitLeadSchema,
  type VisitLeadFormInput,
  type VisitLeadFormValues,
} from './leadVisits.shared';

type PropertyOption = {
  id: number;
  label: string;
};

type DevelopmentOption = {
  id: number;
  label: string;
};

type EditLeadModalProps = {
  isOpen: boolean;
  lead: LeadRecord | null;
  onClose: () => void;
  onEdit: (leadId: number, payload: UpdateLeadPayload) => Promise<string | null>;
  propertyOptions: PropertyOption[];
  developmentOptions: DevelopmentOption[];
};

export function EditLeadModal({
  isOpen,
  lead,
  onClose,
  onEdit,
  propertyOptions,
  developmentOptions,
}: EditLeadModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    reset,
    handleSubmit,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<VisitLeadFormInput, unknown, VisitLeadFormValues>({
    resolver: zodResolver(visitLeadSchema),
    defaultValues: toVisitDefaultValues(lead),
  });

  useEffect(() => {
    reset(toVisitDefaultValues(lead));
    setSubmitError('');
    setIsSubmitting(false);
  }, [lead, isOpen, reset]);

  if (!lead) return null;
  const currentLead = lead;
  const asesorExterno = watch('asesor_externo');
  const tipoObjetivo = watch('tipo_objetivo');

  function closeModal() {
    setSubmitError('');
    setIsSubmitting(false);
    onClose();
  }

  async function onSubmit(values: VisitLeadFormValues) {
    setSubmitError('');
    setIsSubmitting(true);

    const payload = buildVisitUpdatePayload(values, dirtyFields);

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
      title="Editar registro"
      subtitle="Actualiza la información del cliente y ajusta el seguimiento sin salir de la vista."
      maxWidthClassName="max-w-2xl"
      panelClassName="max-h-[88vh]"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Detalles del registro
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Revisa los datos clave del cliente antes de guardar cambios en la oportunidad.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <VisitFieldLabel required>Nombres</VisitFieldLabel>
              <input
                type="text"
                {...register('nombres', {
                  onChange: (event) => {
                    event.target.value = normalizeVisitName(event.target.value);
                  },
                })}
                className={visitLeadFieldClassName}
              />
              {errors.nombres ? <span className="text-xs text-red-600">{errors.nombres.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <VisitFieldLabel required>Apellidos</VisitFieldLabel>
              <input
                type="text"
                {...register('apellidos', {
                  onChange: (event) => {
                    event.target.value = normalizeVisitName(event.target.value);
                  },
                })}
                className={visitLeadFieldClassName}
              />
              {errors.apellidos ? <span className="text-xs text-red-600">{errors.apellidos.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <VisitFieldLabel>Lada</VisitFieldLabel>
              <input
                type="text"
                {...register('lada', {
                  onChange: (event) => {
                    event.target.value = sanitizeVisitLada(event.target.value);
                  },
                })}
                className={visitLeadFieldClassName}
                placeholder="Ej. +52"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <VisitFieldLabel required>Últimos 4 dígitos del teléfono del cliente</VisitFieldLabel>
              <input
                type="text"
                inputMode="numeric"
                {...register('telefono', {
                  onChange: (event) => {
                    event.target.value = sanitizeVisitPhone(event.target.value);
                  },
                })}
                className={visitLeadFieldClassName}
                maxLength={4}
                placeholder="Ej. 6678"
              />
              {errors.telefono ? <span className="text-xs text-red-600">{errors.telefono.message}</span> : null}
              <span className="text-xs text-slate-500">
                Actualiza solo los últimos 4 dígitos con los que se identifica este registro.
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <VisitFieldLabel required>Propiedad o desarrollo</VisitFieldLabel>
              <select {...register('tipo_objetivo')} className={visitLeadFieldClassName}>
                <option value="propiedad">Propiedad</option>
                <option value="desarrollo">Desarrollo</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <VisitFieldLabel required>
                {tipoObjetivo === 'desarrollo' ? 'Seleccionar desarrollo' : 'Seleccionar propiedad'}
              </VisitFieldLabel>
              {tipoObjetivo === 'desarrollo' ? (
                <select {...register('desarrollo_id')} className={visitLeadFieldClassName}>
                  <option value="">Selecciona un desarrollo</option>
                  {developmentOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <select {...register('propiedad_id')} className={visitLeadFieldClassName}>
                  <option value="">Selecciona una propiedad</option>
                  {propertyOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
              {tipoObjetivo === 'desarrollo' ? (
                errors.desarrollo_id ? <span className="text-xs text-red-600">{errors.desarrollo_id.message}</span> : null
              ) : (
                errors.propiedad_id ? <span className="text-xs text-red-600">{errors.propiedad_id.message}</span> : null
              )}
            </label>

            <label className="flex flex-col gap-1.5">
              <VisitFieldLabel>Estado</VisitFieldLabel>
              <select {...register('estado')} className={visitLeadFieldClassName}>
                {VISIT_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <VisitFieldLabel>Fecha de cita</VisitFieldLabel>
              <input type="datetime-local" {...register('fecha_cita')} className={visitLeadFieldClassName} />
            </label>

            <label className="flex flex-col gap-1.5">
              <VisitFieldLabel>Asesor externo</VisitFieldLabel>
              <select {...register('asesor_externo')} className={visitLeadFieldClassName}>
                <option value="no">No</option>
                <option value="si">Si</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <VisitFieldLabel required={asesorExterno === 'si'}>Nombre del asesor externo</VisitFieldLabel>
              <input
                type="text"
                {...register('asesor_externo_nombre', {
                  onChange: (event) => {
                    event.target.value = normalizeVisitName(event.target.value);
                  },
                })}
                className={visitLeadFieldClassName}
                disabled={asesorExterno !== 'si'}
                placeholder={asesorExterno === 'si' ? 'Ej. Nombre del broker externo' : 'No aplica'}
              />
              {errors.asesor_externo_nombre ? (
                <span className="text-xs text-red-600">{errors.asesor_externo_nombre.message}</span>
              ) : null}
            </label>

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <VisitFieldLabel>Comentarios</VisitFieldLabel>
              <textarea
                {...register('comentarios')}
                rows={3}
                className={`${visitLeadFieldClassName} resize-none`}
                placeholder="Ej. Comentarios del registro"
              />
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
