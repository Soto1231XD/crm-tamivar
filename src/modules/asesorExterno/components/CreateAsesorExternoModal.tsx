import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppModal } from '@/components/ui/AppModal';
import type { CreateAsesorExternoPayload } from '../services/asesorExterno.api';
import {
  ASESOR_EXTERNO_OPERATION_OPTIONS,
  ASESOR_EXTERNO_PAYMENT_METHOD_OPTIONS,
  ASESOR_EXTERNO_PRIORITY_OPTIONS,
  ASESOR_EXTERNO_STATUS_OPTIONS,
  AsesorExternoFieldLabel,
  INITIAL_ASESOR_EXTERNO_FORM,
  asesorExternoFieldClassName,
  asesorExternoSchema,
  formatLeadBudget,
  normalizeLeadBudget,
  sanitizeAsesorExternoName,
  sanitizeAsesorExternoPhone,
  type AsesorExternoFormInput,
  type AsesorExternoFormValues,
} from './asesorExterno.shared';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: Omit<CreateAsesorExternoPayload, 'creado_por_id'>) => Promise<string | null>;
};

export function CreateAsesorExternoModal({ isOpen, onClose, onCreate }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<AsesorExternoFormInput, unknown, AsesorExternoFormValues>({
    resolver: zodResolver(asesorExternoSchema),
    defaultValues: {
      ...INITIAL_ASESOR_EXTERNO_FORM,
      fecha_registro: new Date().toISOString().slice(0, 10),
    },
  });

  const metodoPago = watch('metodo_pago') ?? [];

  function togglePaymentMethod(method: string) {
    const current = metodoPago;
    setValue(
      'metodo_pago',
      current.includes(method)
        ? current.filter((m) => m !== method)
        : [...current, method],
    );
  }

  async function onSubmit(values: AsesorExternoFormValues) {
    setIsSubmitting(true);
    setSubmitError('');
    const presupuestoRaw = normalizeLeadBudget(values.presupuesto);
    const error = await onCreate({
      nombres: values.nombres.trim(),
      apellidos: values.apellidos.trim(),
      telefono: values.telefono,
      estado: values.estado?.trim() || 'En espera',
      prioridad: values.prioridad.trim(),
      operacion: values.operacion.trim(),
      comentarios: values.comentarios?.trim() || undefined,
      solicitud: values.solicitud?.trim() || undefined,
      presupuesto: presupuestoRaw ? Number(presupuestoRaw) : undefined,
      ubicacion_propiedad: values.ubicacion_propiedad?.trim() || undefined,
      metodo_pago:
        (values.metodo_pago ?? []).length > 0
          ? values.metodo_pago!.join(', ')
          : undefined,
      caracteristicas: values.caracteristicas?.trim() || undefined,
      fecha_registro: values.fecha_registro || undefined,
    });
    setIsSubmitting(false);
    if (error) {
      setSubmitError(error);
    } else {
      reset({
        ...INITIAL_ASESOR_EXTERNO_FORM,
        fecha_registro: new Date().toISOString().slice(0, 10),
      });
      onClose();
    }
  }

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo lead externo"
      maxWidthClassName="max-w-2xl"
    >
      <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-slate-600">
        <span className="font-semibold text-red-600">*</span> Campo obligatorio
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Datos del cliente */}
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
                placeholder="Ej. Juan"
                onChange={(e) =>
                  setValue('nombres', sanitizeAsesorExternoName(e.target.value))
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
                placeholder="Ej. Pérez García"
                onChange={(e) =>
                  setValue('apellidos', sanitizeAsesorExternoName(e.target.value))
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
                placeholder="1234"
                maxLength={4}
                inputMode="numeric"
                onChange={(e) =>
                  setValue('telefono', sanitizeAsesorExternoPhone(e.target.value))
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
                placeholder="Ej. Cancún centro"
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

        {/* Seguimiento comercial */}
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
              <select {...register('prioridad')} className={asesorExternoFieldClassName}>
                <option value="">Selecciona...</option>
                {ASESOR_EXTERNO_PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
              {errors.prioridad && (
                <p className="text-xs text-[var(--crm-danger-text)]">
                  {errors.prioridad.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <AsesorExternoFieldLabel required>Operación</AsesorExternoFieldLabel>
              <select {...register('operacion')} className={asesorExternoFieldClassName}>
                <option value="">Selecciona...</option>
                {ASESOR_EXTERNO_OPERATION_OPTIONS.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
              {errors.operacion && (
                <p className="text-xs text-[var(--crm-danger-text)]">
                  {errors.operacion.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <AsesorExternoFieldLabel>Presupuesto (MXN)</AsesorExternoFieldLabel>
              <input
                {...register('presupuesto')}
                className={asesorExternoFieldClassName}
                placeholder="Ej. 1,500,000"
                onChange={(e) =>
                  setValue('presupuesto', formatLeadBudget(e.target.value))
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
              placeholder="¿Qué busca el cliente?"
            />
          </div>

          <div className="space-y-1">
            <AsesorExternoFieldLabel>Características</AsesorExternoFieldLabel>
            <textarea
              {...register('caracteristicas')}
              className={asesorExternoFieldClassName}
              rows={2}
              placeholder="Recámaras, baños, etc."
            />
          </div>

          <div className="space-y-1">
            <AsesorExternoFieldLabel>Comentarios</AsesorExternoFieldLabel>
            <textarea
              {...register('comentarios')}
              className={asesorExternoFieldClassName}
              rows={2}
              maxLength={1500}
              placeholder="Notas adicionales..."
            />
          </div>
        </div>

        {submitError && (
          <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {submitError}
          </p>
        )}

        <div className="flex items-center justify-center gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
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
    </AppModal>
  );
}
