import { useState, useEffect } from 'react';
import { usePDF } from '@react-pdf/renderer';
import { PropertyPdfDocument } from '../components/PropertyPdfDocument';
import type { PropertyRecord } from '@/interfaces/property.interface';

interface Props {
  property: PropertyRecord;
  className?: string;
  children: (loading: boolean) => React.ReactNode;
}

export const DownloadPdfButton = ({ property, className, children }: Props) => {
  const [isGenerating, setIsGenerating] = useState(false);
  // Se crea una instancia única por cada botón
  const [instance, updateInstance] = usePDF();

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitamos que el clic dispare otros eventos de la fila
    setIsGenerating(true);
    // Disparamos la creación del documento
    updateInstance(<PropertyPdfDocument property={property} />);
  };

  useEffect(() => {
    // Solo disparamos la descarga si este botón específico inició el proceso
    if (isGenerating && !instance.loading && instance.url) {
      const link = document.createElement('a');
      link.href = instance.url;
      link.download = `Ficha_Tecnica_${property.titulo.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiamos el estado para que el botón vuelva a su forma original
      setIsGenerating(false);
    }
  }, [instance.loading, instance.url, isGenerating, property.titulo]);

  return (
    <button 
      type="button"
      onClick={handleDownload} 
      disabled={isGenerating}
      className={className}
    >
      {children(isGenerating)}
    </button>
  );
};