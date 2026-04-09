import type { LeadRecord } from '@/interfaces/lead.interface';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';

type DeleteLeadConfirmModalProps = {
  isOpen: boolean;
  lead: LeadRecord | null;
  onClose: () => void;
  onConfirm: (leadId: number) => Promise<string | null>;
};

export function DeleteLeadConfirmModal({ isOpen, lead, onClose, onConfirm }: DeleteLeadConfirmModalProps) {
  return (
    <DeleteConfirmModal
      isOpen={isOpen}
      entityId={lead?.id ?? null}
      entityLabel={`${lead?.nombres ?? ''} ${lead?.apellidos ?? ''}`}
      fallbackLabel="este cliente"
      descriptionPrefix="Estas por eliminar el registro de"
      onClose={onClose}
      onConfirm={onConfirm}
      title="Eliminar registro"
      subtitle="Esta acción quitara el registro del flujo comercial actual."
    />
  );
}
