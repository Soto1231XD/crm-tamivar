import { AppModal } from '@/components/ui/AppModal';
import type { Etiqueta, LeadRecord } from '@/interfaces/lead.interface';
import { EtiquetaSelector } from '@/components/ui/EtiquetaSelector';

type Props = {
  isOpen: boolean;
  lead: LeadRecord | null;
  allEtiquetas: Etiqueta[];
  onToggle: (lead: LeadRecord, etiqueta: Etiqueta, assigned: boolean) => void;
  onClose: () => void;
};

export function EtiquetaAsignacionModal({ isOpen, lead, allEtiquetas, onToggle, onClose }: Props) {
  return (
    <AppModal isOpen={isOpen} onClose={onClose} title="Etiquetas" maxWidthClassName="max-w-sm">
      {lead && (
        <EtiquetaSelector
          lead={lead}
          allEtiquetas={allEtiquetas}
          onToggle={(et, assigned) => onToggle(lead, et, assigned)}
        />
      )}
    </AppModal>
  );
}
