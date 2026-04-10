import type { SystemRoleRecord } from '@/interfaces/system-role.interface';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';

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
  return (
    <DeleteConfirmModal
      isOpen={isOpen}
      entityId={role?.id ?? null}
      entityLabel={role?.rol ?? ''}
      fallbackLabel="este rol"
      descriptionPrefix="Estas por eliminar el rol"
      onClose={onClose}
      onConfirm={onConfirm}
      title="Eliminar rol"
      subtitle="Esta acción quitara el rol del sistema y su configuración actual."
    />
  );
}
