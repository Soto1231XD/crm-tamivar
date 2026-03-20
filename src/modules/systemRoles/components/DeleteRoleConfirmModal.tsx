import { useState } from 'react';
import type { SystemRoleRecord } from '@/interfaces/system-role.interface';
import { AppModal } from '@/components/ui/AppModal';

type DeleteRoleConfirmModalProps = {
  isOpen: boolean;
  role: SystemRoleRecord | null;
  onClose: () => void;
  onConfirm: (roleId: number) => Promise<string | null>;
};

export function DeleteRoleConfirmModal({
  isOpen,
  role,
  onClose,
  onConfirm,
}: DeleteRoleConfirmModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (!isOpen || !role) return null;
  const selectedRole = role;

  async function handleConfirm() {
    setSubmitError('');
    setIsSubmitting(true);
    const error = await onConfirm(selectedRole.id);
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
      title="Eliminar rol"
      subtitle="Esta acción quitara el rol del sistema y su configuración actual."
      maxWidthClassName="max-w-lg"
      scrollBody={false}
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm leading-6 text-slate-700">
            Estas por eliminar el rol{' '}
            <span className="font-semibold text-slate-900">{selectedRole.rol}</span>.
            Esta acción no se puede deshacer desde esta vista.
          </p>
        </div>

        {submitError ? <p className="text-sm font-medium text-red-600">{submitError}</p> : null}

        <div className="flex items-center justify-center gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={onClose} className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white">
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
      </div>
    </AppModal>
  );
}
