import { useState } from 'react';
import type { BlogRecord } from '@/interfaces/blog.interface';
import { AppModal } from '@/components/ui/AppModal';

type DeleteContentConfirmModalProps = {
  isOpen: boolean;
  blog: BlogRecord | null;
  onClose: () => void;
  onConfirm: (blogId: number) => Promise<string | null>;
};

export function DeleteContentConfirmModal({
  isOpen,
  blog,
  onClose,
  onConfirm,
}: DeleteContentConfirmModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (!isOpen || !blog) return null;
  const selectedBlog = blog;

  async function handleConfirm() {
    setSubmitError('');
    setIsSubmitting(true);
    const error = await onConfirm(selectedBlog.id);
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
      title="Eliminar articulo"
      subtitle="Esta accion quitara el contenido del listado actual."
      maxWidthClassName="max-w-lg"
      scrollBody={false}
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm leading-6 text-slate-700">
            Estas por eliminar el articulo{' '}
            <span className="font-semibold text-slate-900">
              {selectedBlog.titulo?.trim() || 'Sin titulo'}
            </span>
            . Esta accion no se puede deshacer desde esta vista.
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
