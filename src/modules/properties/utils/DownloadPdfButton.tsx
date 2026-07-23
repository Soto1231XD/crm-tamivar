import { useState, useEffect } from "react";
import { usePDF } from "@react-pdf/renderer";
import { PropertyPdfDocument } from "../components/PropertyPdfDocument";
import type { PropertyRecord } from "@/interfaces/property.interface";
import { getPdfCompatibleImage } from "@/shared/utils/imageProcessor";
import { generateMapImage } from "@/shared/utils/mapImageGenerator";
import { getFullImageUrl, formatFullDireccion } from "./formatters";

interface Props {
  property: PropertyRecord;
  className?: string;
  children: (loading: boolean) => React.ReactNode;
}

export const DownloadPdfButton = ({ property, className, children }: Props) => {
  const [isGenerating, setIsGenerating] = useState(false);
  // Se crea una instancia única por cada botón
  const [instance, updateInstance] = usePDF();

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitamos que el clic dispare otros eventos de la fila
    setIsGenerating(true);

    try {
      // Clonamos la propiedad para no mutar el estado original de la tabla/vista
      const propertyForPdf = { ...property };

      // Pre-procesamos las imágenes si existen
      if (propertyForPdf.imagenes && propertyForPdf.imagenes.length > 0) {
        const processedImages = await Promise.all(
          propertyForPdf.imagenes.map(async (img) => {
            const fullUrl = getFullImageUrl(img.url);
            const base64Jpeg = await getPdfCompatibleImage(fullUrl);

            // Retornamos la imagen con la URL cambiada a Base64
            return {
              ...img,
              url: base64Jpeg || img.url,
            };
          }),
        );

        // Filtramos las que devolvieron null
        propertyForPdf.imagenes = processedImages.filter((img) =>
          img.url.startsWith("data:image"),
        );
      }

      // Generamos imagen estática de la zona (sin pin, para no revelar dirección exacta)
      let mapsImageBase64: string | undefined;
      if (property.enlace_direccion) {
        const img = await generateMapImage(
          property.enlace_direccion,
          property.direccion.municipio,
          property.direccion.estado,
          formatFullDireccion(property.direccion),
        );
        if (img) mapsImageBase64 = img;
      }

      // 3. Disparamos la creación del documento con las imágenes en Base64
      updateInstance(
        <PropertyPdfDocument
          property={propertyForPdf}
          mapsImageBase64={mapsImageBase64}
        />,
      );
    } catch (error) {
      console.error("Error al preparar el PDF:", error);
      setIsGenerating(false);
      // Aquí podrías mostrar un toast.error("Error al generar el PDF");
    }
  };

  useEffect(() => {
    // Solo disparamos la descarga si este botón específico inició el proceso
    if (isGenerating && !instance.loading && instance.url) {
      const link = document.createElement("a");
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
      disabled={isGenerating || instance.loading}
      className={className}
    >
      {children(isGenerating || instance.loading)}
    </button>
  );
};