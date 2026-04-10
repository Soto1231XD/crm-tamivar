import type { BlogRecord } from '@/interfaces/blog.interface';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';

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
  return (
    <DeleteConfirmModal
      isOpen={isOpen}
      entityId={blog?.id ?? null}
      entityLabel={blog?.titulo?.trim() || ''}
      fallbackLabel="Sin titulo"
      descriptionPrefix="Estas por eliminar el articulo"
      onClose={onClose}
      onConfirm={onConfirm}
      title="Eliminar articulo"
      subtitle="Esta acción quitara el contenido del listado actual."
    />
  );
}
