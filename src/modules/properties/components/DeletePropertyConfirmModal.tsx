import { useState } from 'react';
import type { PropertyRecord } from '@/interfaces/property.interface';
import { AppModal } from '@/components/ui/AppModal';

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
  const selectedProperty = property;

  async function handleConfirm() {
    setSubmitError('');
    setIsSubmitting(true);
    const error = await onConfirm(selectedProperty.id);
    setIsSubmitting(false);

    if (error) {
      setSubmitError(error);
      return;
    }

    onClose();
  }

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar eliminacion"
      maxWidthClassName="max-w-lg"
      scrollBody={false}
    >
      <>
        <p className="text-sm text-slate-700">
          Estas seguro de que quieres eliminar la propiedad{' '}
          <span className="font-semibold text-slate-900">{selectedProperty.titulo || 'Sin titulo'}</span>?
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
            {isSubmitting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </>
    </AppModal>
  );
}
