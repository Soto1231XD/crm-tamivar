import { useState } from 'react';
import cerrarIcon from '../../../assets/images/Cerrar.png';
import type { PropertyRecord } from '@/interfaces/property.interface';

type DeletePropertyConfirmModalProps = {
  isOpen: boolean;
  property: PropertyRecord | null;
  onClose: () => void;
  onConfirm: (propertyId: number) => Promise<string | null>;
};

export function DeletePropertyConfirmModal({
  isOpen,
  property,
  onClose,
  onConfirm,
}: DeletePropertyConfirmModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (!isOpen || !property) return null;

  async function handleConfirm() {
    if (!property) return;

    setSubmitError('');
    setIsSubmitting(true);
    const error = await onConfirm(property.id);
    setIsSubmitting(false);

    if (error) {
      setSubmitError(error);
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Confirmar desactivación</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            title="Cerrar"
            className="rounded-md p-1 hover:bg-slate-100"
          >
            <img src={cerrarIcon} alt="" className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <p className="text-sm text-slate-700">
          ¿Estás seguro de que quieres desactivar la propiedad{' '}
          <span className="font-semibold text-slate-900">{property.titulo || 'Sin título'}</span>?
        </p>

        {submitError ? <p className="mt-3 text-sm font-medium text-red-600">{submitError}</p> : null}

        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Desactivando...' : 'Desactivar'}
          </button>
        </div>
      </div>
    </div>
  );
}
