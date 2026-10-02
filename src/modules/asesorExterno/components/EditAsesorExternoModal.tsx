import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppModal } from '@/components/ui/AppModal';
import type { LeadRecord } from '@/interfaces/lead.interface';
import type { UpdateAsesorExternoPayload } from '../services/asesorExterno.api';
import {
  ASESOR_EXTERNO_OPERATION_OPTIONS,
  ASESOR_EXTERNO_PAYMENT_METHOD_OPTIONS,
  ASESOR_EXTERNO_PRIORITY_OPTIONS,
  ASESOR_EXTERNO_STATUS_OPTIONS,
  AsesorExternoFieldLabel,
  asesorExternoFieldClassName,
  asesorExternoSchema,
  formatLeadBudget,
  normalizeLeadBudget,
  parsePaymentMethods,
  sanitizeAsesorExternoName,
  sanitizeAsesorExternoPhone,
  toAsesorExternoDefaultValues,
  type AsesorExternoFormInput,
  type AsesorExternoFormValues,
} from './asesorExterno.shared';

type Props = {
  isOpen: boolean;
  lead: LeadRecord | null;
  onClose: () => void;
  onEdit: (id: number, payload: UpdateAsesorExternoPayload) => Promise<string | null>;
};

export function EditAsesorExternoModal({ isOpen, lead, onClose, onEdit }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<AsesorExternoFormInput, unknown, AsesorExternoFormValues>({
    resolver: zodResolver(asesorExternoSchema),
    defaultValues: toAsesorExternoDefaultValues(lead),
  });

  const metodoPago = watch('metodo_pago') ?? [];

  useEffect(() => {
    if (lead) reset(toAsesorExternoDefaultValues(lead));
  }, [lead, reset]);

  function togglePaymentMethod(method: string) {
    const current = metodoPago;
    setValue(
      'metodo_pago',
      current.includes(method)
        ? current.filter((m) => m !== method)
        : [...current, method],
      { shouldDirty: true },
    );
  }

  async function onSubmit(values: AsesorExternoFormValues) {
    if (!lead) return;
    setIsSubmitting(true);
    setSubmitError('');

    const payload: UpdateAsesorExternoPayload = {};
    if (dirtyFields.nombres) payload.nombres = values.nombres.trim();
    if (dirtyFields.apellidos) payload.apellidos = values.apellidos.trim();
    if (dirtyFields.telefono) payload.telefono = values.telefono;
    if (dirtyFields.estado) payload.estado = values.estado?.trim();
    if (dirtyFields.prioridad) payload.prioridad = values.prioridad.trim();
    if (dirtyFields.operacion) payload.operacion = values.operacion.trim();
    if (dirtyFields.comentarios) payload.comentarios = values.comentarios?.trim();
    if (dirtyFields.solicitud) payload.solicitud = values.solicitud?.trim();
    if (dirtyFields.ubicacion_propiedad)
      payload.ubicacion_propiedad = values.ubicacion_propiedad?.trim();
    if (dirtyFields.caracteristicas)
      payload.caracteristicas = values.caracteristicas?.trim();
    if (dirtyFields.fecha_registro) payload.fecha_registro = values.fecha_registro;
    if (dirtyFields.presupuesto) {
      const raw = normalizeLeadBudget(values.presupuesto);
      payload.presupuesto = raw ? Number(raw) : undefined;
    }
    if (dirtyFields.metodo_pago) {
      payload.metodo_pago =
        (values.metodo_pago ?? []).length > 0
          ? values.metodo_pago!.join(', ')
          : undefined;
    }

    const error = await onEdit(lead.id, payload);
    setIsSubmitting(false);
    if (error) {
      setSubmitError(error);
    } else {
      onClose();
    }
  }

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar lead externo"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--crm-text-muted)]">
            Datos del cliente
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <AsesorExternoFieldLabel required>Nombres</AsesorExternoFieldLabel>
              <input
                {...register('nombres')}
                className={asesorExternoFieldClassName}
                onChange={(e) =>
                  setValue('nombres', sanitizeAsesorExternoName(e.target.value), {
                    shouldDirty: true,
                  })
                }
              />
              {errors.nombres && (
                <p className="text-xs text-[var(--crm-danger-text)]">
                  {errors.nombres.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <AsesorExternoFieldLabel required>Apellidos</AsesorExternoFieldLabel>
              <input
                {...register('apellidos')}
                className={asesorExternoFieldClassName}
                onChange={(e) =>
                  setValue(
                    'apellidos',
                    sanitizeAsesorExternoName(e.target.value),
                    { shouldDirty: true },
                  )
                }
              />
              {errors.apellidos && (
                <p className="text-xs text-[var(--crm-danger-text)]">
                  {errors.apellidos.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <AsesorExternoFieldLabel required>
                Últimos 4 dígitos del teléfono
              </AsesorExternoFieldLabel>
              <input
                {...register('telefono')}
                className={asesorExternoFieldClassName}
                maxLength={4}
                inputMode="numeric"
                onChange={(e) =>
                  setValue(
                    'telefono',
                    sanitizeAsesorExternoPhone(e.target.value),
                    { shouldDirty: true },
                  )
                }
              />
              {errors.telefono && (
                <p className="text-xs text-[var(--crm-danger-text)]">
                  {errors.telefono.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <AsesorExternoFieldLabel>Zona de preferencia</AsesorExternoFieldLabel>
              <input
                {...register('ubicacion_propiedad')}
                className={asesorExternoFieldClassName}
              />
            </div>
          </div>

          <div className="space-y-1">
            <AsesorExternoFieldLabel>Fecha de registro</AsesorExternoFieldLabel>
            <input
              type="date"
              {...register('fecha_registro')}
              className={asesorExternoFieldClassName}
              max={new Date().toISOString().slice(0, 10)}
            />
          </div>
        </div>

        <div className="space-y-3 border-t border-[var(--crm-border)] pt-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--crm-text-muted)]">
            Seguimiento comercial
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <AsesorExternoFieldLabel>Estado</AsesorExternoFieldLabel>
              <select {...register('estado')} className={asesorExternoFieldClassName}>
                {ASESOR_EXTERNO_STATUS_OPTIONS.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <AsesorExternoFieldLabel required>Prioridad</AsesorExternoFieldLabel>
              <select
                {...register('prioridad')}
                className={asesorExternoFieldClassName}
              >
                {ASESOR_EXTERNO_PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <AsesorExternoFieldLabel required>Operación</AsesorExternoFieldLabel>
              <select
                {...register('operacion')}
                className={asesorExternoFieldClassName}
              >
                <option value="">Selecciona...</option>
                {ASESOR_EXTERNO_OPERATION_OPTIONS.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <AsesorExternoFieldLabel>Presupuesto (MXN)</AsesorExternoFieldLabel>
              <input
                {...register('presupuesto')}
                className={asesorExternoFieldClassName}
                onChange={(e) =>
                  setValue('presupuesto', formatLeadBudget(e.target.value), {
                    shouldDirty: true,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <AsesorExternoFieldLabel>Método de pago</AsesorExternoFieldLabel>
            <div className="flex flex-wrap gap-2">
              {ASESOR_EXTERNO_PAYMENT_METHOD_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => togglePaymentMethod(opt)}
                  className={[
                    'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                    metodoPago.includes(opt)
                      ? 'border-[var(--crm-primary)] bg-[var(--crm-primary)] text-white'
                      : 'border-[var(--crm-border-strong)] bg-[var(--crm-surface-soft)] text-[var(--crm-text-muted)] hover:border-[var(--crm-primary)]',
                  ].join(' ')}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <AsesorExternoFieldLabel>Solicitud</AsesorExternoFieldLabel>
            <textarea
              {...register('solicitud')}
              className={asesorExternoFieldClassName}
              rows={2}
            />
          </div>

          <div className="space-y-1">
            <AsesorExternoFieldLabel>Características</AsesorExternoFieldLabel>
            <textarea
              {...register('caracteristicas')}
              className={asesorExternoFieldClassName}
              rows={2}
            />
          </div>

          <div className="space-y-1">
            <AsesorExternoFieldLabel>Comentarios</AsesorExternoFieldLabel>
            <textarea
              {...register('comentarios')}
              className={asesorExternoFieldClassName}
              rows={2}
              maxLength={1500}
            />
          </div>
        </div>

        {submitError && (
          <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {submitError}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--crm-border-strong)] px-4 py-2 text-sm font-medium text-[var(--crm-text-muted)] transition hover:bg-[var(--crm-surface-soft)]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-[#312C85] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#27226f] disabled:opacity-60"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
