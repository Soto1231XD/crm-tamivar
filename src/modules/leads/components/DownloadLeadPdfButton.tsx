import { useEffect, useState } from 'react';
import { usePDF } from '@react-pdf/renderer';
import type { LeadRecord } from '@/interfaces/lead.interface';
import { LeadPdfDocument } from './LeadPdfDocument';

type DownloadLeadPdfButtonProps = {
  lead: LeadRecord;
  propertyTitle: string;
  className?: string;
  children: (loading: boolean) => React.ReactNode;
};

export function DownloadLeadPdfButton({
  lead,
  propertyTitle,
  className,
  children,
}: DownloadLeadPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [instance, updateInstance] = usePDF();

  const handleDownload = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsGenerating(true);
    updateInstance(<LeadPdfDocument lead={lead} propertyTitle={propertyTitle} />);
  };

  useEffect(() => {
    if (isGenerating && !instance.loading && instance.url) {
      const link = document.createElement('a');
      const fullName = `${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim() || `registro-${lead.id}`;
      link.href = instance.url;
      link.download = `Registro_${fullName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsGenerating(false);
    }
  }, [instance.loading, instance.url, isGenerating, lead.apellidos, lead.id, lead.nombres]);

  return (
    <button type="button" onClick={handleDownload} disabled={isGenerating} className={className}>
      {children(isGenerating)}
    </button>
  );
}
