import { useEffect, useState } from "react";
import { usePDF } from "@react-pdf/renderer";
import type { DevelopmentRecord } from "@/interfaces/development.interface";
import { getPdfCompatibleImage } from "@/shared/utils/imageProcessor";
import { getFullImageUrl } from "./formatters";
import { DevelopmentPdfDocument } from "../components/DevelopmentPdfDocument";

interface Props {
  development: DevelopmentRecord;
  className?: string;
  children: (loading: boolean) => React.ReactNode;
}

export const DownloadDevelopmentPdfButton = ({
  development,
  className,
  children,
}: Props) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [instance, updateInstance] = usePDF();

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGenerating(true);

    try {
      const developmentForPdf: DevelopmentRecord = {
        ...development,
        imagenes: [...(development.imagenes ?? [])],
        modelos: (development.modelos ?? []).map((model) => ({
          ...model,
          imagenes: [...(model.imagenes ?? [])],
        })),
      };

      if (developmentForPdf.imagenes.length > 0) {
        const processedImages = await Promise.all(
          developmentForPdf.imagenes.map(async (img) => {
            const fullUrl = getFullImageUrl(img.url);
            const base64Jpeg = await getPdfCompatibleImage(fullUrl);

            return {
              ...img,
              url: base64Jpeg || img.url,
            };
          }),
        );

        developmentForPdf.imagenes = processedImages.filter((img) =>
          img.url.startsWith("data:image"),
        );
      }

      developmentForPdf.modelos = await Promise.all(
        developmentForPdf.modelos.map(async (model) => {
          if (!model.imagenes?.length) return model;

          const processedImages = await Promise.all(
            model.imagenes.map(async (img) => {
              const fullUrl = getFullImageUrl(img.url);
              const base64Jpeg = await getPdfCompatibleImage(fullUrl);

              return {
                ...img,
                url: base64Jpeg || img.url,
              };
            }),
          );

          return {
            ...model,
            imagenes: processedImages.filter((img) =>
              img.url.startsWith("data:image"),
            ),
          };
        }),
      );

      updateInstance(<DevelopmentPdfDocument development={developmentForPdf} />);
    } catch (error) {
      console.error("Error al preparar la ficha del desarrollo:", error);
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isGenerating && !instance.loading && instance.url) {
      const link = document.createElement("a");
      link.href = instance.url;
      link.download = `Ficha_Tecnica_${development.titulo.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsGenerating(false);
    }
  }, [instance.loading, instance.url, isGenerating, development.titulo]);

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
