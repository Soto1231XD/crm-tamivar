import { useEffect, useState } from "react";
import { usePDF } from "@react-pdf/renderer";
import { AdvisorReportPdfDocument } from "../components/AdvisorReportPdfDocument";
import type { AdvisorStats } from "../types/statistics.types";

type DownloadAdvisorReportButtonProps = {
  advisor: AdvisorStats;
  className?: string;
  children: (loading: boolean) => React.ReactNode;
};

export function DownloadAdvisorReportButton({
  advisor,
  className,
  children,
}: DownloadAdvisorReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [instance, updateInstance] = usePDF();

  const handleDownload = () => {
    setIsGenerating(true);
    updateInstance(<AdvisorReportPdfDocument advisor={advisor} />);
  };

  useEffect(() => {
    if (isGenerating && !instance.loading && instance.url) {
      const link = document.createElement("a");
      link.href = instance.url;
      link.download = `Reporte_Asesor_${advisor.name.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsGenerating(false);
    }
  }, [advisor.name, instance.loading, instance.url, isGenerating]);

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
}
