import { useState } from 'react';
import { AppModal } from '@/components/ui/AppModal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import type { LeadRecord } from '@/interfaces/lead.interface';
import { asesorExternoFieldClassName } from './asesorExterno.shared';

type PropertyOption = { id: number; label: string };

type ConfirmParams = {
  tipoObjetivo: 'propiedad' | 'desarrollo';
  objetivoId: number;
  fechaCita: string;
  asesorExterno: boolean;
  asesorExternoNombre?: string;
};

type Props = {
  isOpen: boolean;
  lead: LeadRecord | null;
  propertyOptions: PropertyOption[];
  developmentOptions: PropertyOption[];
  onConfirm: (params: ConfirmParams) => Promise<string | null>;
  onCancel: () => void;
};

export function AgendarCitaModal({ isOpen, lead, propertyOptions, developmentOptions, onConfirm, onCancel }: Props) {
  const [tipoObjetivo, setTipoObjetivo] = useState<'propiedad' | 'desarrollo'>('propiedad');
  const [objetivoId, setObjetivoId] = useState<string>('');
  const [fechaCita, setFechaCita] = useState('');
  const [conAsesorExterno, setConAsesorExterno] = useState<'no' | 'si'>('no');
  const [asesorExternoNombre, setAsesorExternoNombre] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ objetivo?: string; fecha?: string; asesorNombre?: string }>({});

  if (!lead) return null;
  const leadName = `${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim() || 'Sin nombre';

  function handleTipoChange(tipo: 'propiedad' | 'desarrollo') {
    setTipoObjetivo(tipo);
    setObjetivoId('');
    setFieldErrors((prev) => ({ ...prev, objetivo: undefined }));
  }

  function handleCancelClick() {
    setShowCancelConfirm(true);
  }

  function handleCancelConfirmed() {
    setShowCancelConfirm(false);
    setTipoObjetivo('propiedad');
    setObjetivoId('');
    setFechaCita('');
    setConAsesorExterno('no');
    setAsesorExternoNombre('');
    setSubmitError('');
    setFieldErrors({});
    onCancel();
  }

  function handleCancelDismissed() {
    setShowCancelConfirm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: { objetivo?: string; fecha?: string; asesorNombre?: string } = {};
    if (!objetivoId) errors.objetivo = 'Selecciona una opción.';
    if (!fechaCita) errors.fecha = 'La fecha de cita es obligatoria.';
    if (conAsesorExterno === 'si' && !asesorExternoNombre.trim()) {
      errors.asesorNombre = 'Ingresa el nombre del asesor externo.';
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    const error = await onConfirm({
      tipoObjetivo,
      objetivoId: Number(objetivoId),
      fechaCita,
      asesorExterno: conAsesorExterno === 'si',
      asesorExternoNombre: conAsesorExterno === 'si' ? asesorExternoNombre.trim() : undefined,
    });
    setIsSubmitting(false);
    if (error) {
      setSubmitError(error);
      return;
    }
    setTipoObjetivo('propiedad');
    setObjetivoId('');
    setFechaCita('');
    setConAsesorExterno('no');
    setAsesorExternoNombre('');
    setFieldErrors({});
  }

  const currentOptions = tipoObjetivo === 'propiedad' ? propertyOptions : developmentOptions;

  return (
    <AppModal
      isOpen={isOpen}
      onClose={handleCancelClick}
      title="Agendar cita"
      subtitle={`Completa los datos para registrar la visita de ${leadName}.`}
      maxWidthClassName="max-w-lg"
      scrollBody={false}
    >
      {showCancelConfirm ? (
        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 space-y-1.5">
            <p className="font-semibold">¿Estás seguro de cancelar el proceso?</p>
            <p>Más adelante puedes realizarlo nuevamente el proceso del registro.</p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancelDismissed}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Volver al formulario
            </button>
            <button
              type="button"
              onClick={handleCancelConfirmed}
              className="rounded-xl bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              Sí, cancelar
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-slate-600">
            <span className="font-semibold text-red-600">*</span> Campo obligatorio
          </div>

          {/* Lead info read-only */}
          <div className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-muted)] px-4 py-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--crm-text-muted)] mb-2">Cliente</p>
            <p className="font-semibold text-[var(--crm-text-strong)]">{leadName}</p>
            <p className="text-xs text-[var(--crm-text-muted)] mt-0.5">
              Tel: {lead.telefono != null ? String(lead.telefono) : '—'}
            </p>
          </div>

          {/* Tipo objetivo */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--crm-text)]">
              Tipo de objetivo <span className="text-red-500">*</span>
            </label>
            <select
              value={tipoObjetivo}
              onChange={(e) => handleTipoChange(e.target.value as 'propiedad' | 'desarrollo')}
              className={asesorExternoFieldClassName}
            >
              <option value="propiedad">Propiedad</option>
              <option value="desarrollo">Desarrollo</option>
            </select>
          </div>

          {/* Propiedad / Desarrollo */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--crm-text)]">
              {tipoObjetivo === 'propiedad' ? 'Propiedad' : 'Desarrollo'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              options={currentOptions}
              value={objetivoId}
              onChange={(val) => {
                setObjetivoId(String(val));
                setFieldErrors((prev) => ({ ...prev, objetivo: undefined }));
              }}
              placeholder={`Buscar ${tipoObjetivo === 'propiedad' ? 'propiedad' : 'desarrollo'}...`}
              className={asesorExternoFieldClassName}
            />
            {fieldErrors.objetivo && (
              <p className="text-xs text-red-600">{fieldErrors.objetivo}</p>
            )}
          </div>

          {/* Fecha de cita */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--crm-text)]">
              Fecha de cita <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={fechaCita}
              onChange={(e) => {
                setFechaCita(e.target.value);
                setFieldErrors((prev) => ({ ...prev, fecha: undefined }));
              }}
              className={asesorExternoFieldClassName}
            />
            {fieldErrors.fecha && (
              <p className="text-xs text-red-600">{fieldErrors.fecha}</p>
            )}
          </div>

          {/* ¿Con asesor externo? */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--crm-text)]">
              ¿La visita será con un asesor externo (broker)?
            </label>
            <select
              value={conAsesorExterno}
              onChange={(e) => {
                setConAsesorExterno(e.target.value as 'no' | 'si');
                setAsesorExternoNombre('');
                setFieldErrors((prev) => ({ ...prev, asesorNombre: undefined }));
              }}
              className={asesorExternoFieldClassName}
            >
              <option value="no">No</option>
              <option value="si">Sí</option>
            </select>
          </div>

          {conAsesorExterno === 'si' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--crm-text)]">
                Nombre del asesor externo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={asesorExternoNombre}
                onChange={(e) => {
                  setAsesorExternoNombre(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, asesorNombre: undefined }));
                }}
                placeholder="Ej. Carlos López"
                className={asesorExternoFieldClassName}
              />
              {fieldErrors.asesorNombre && (
                <p className="text-xs text-red-600">{fieldErrors.asesorNombre}</p>
              )}
            </div>
          )}

          {submitError && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{submitError}</p>
          )}

          <div className="flex items-center justify-center gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={handleCancelClick}
              className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Registrando...' : 'Confirmar cita'}
            </button>
          </div>
        </form>
      )}
    </AppModal>
  );
}
