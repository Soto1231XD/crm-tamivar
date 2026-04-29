import type { LeadRequestRecord } from '@/interfaces/lead-request.interface';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';

type DeleteLeadRequestConfirmModalProps = {
  isOpen: boolean;
  leadRequest: LeadRequestRecord | null;
  onClose: () => void;
  onConfirm: (leadRequestId: number) => Promise<string | null>;
};

export function DeleteLeadRequestConfirmModal({
  isOpen,
  leadRequest,
  onClose,
  onConfirm,
}: DeleteLeadRequestConfirmModalProps) {
  return (
    <DeleteConfirmModal
      isOpen={isOpen}
      entityId={leadRequest?.id ?? null}
      entityLabel={leadRequest?.nombre ?? ''}
      fallbackLabel="esta solicitud"
      descriptionPrefix="Estas por eliminar la solicitud de"
      onClose={onClose}
      onConfirm={onConfirm}
      title="Eliminar solicitud"
      subtitle="Esta acción quitara la solicitud del flujo comercial actual."
    />
  );
}
