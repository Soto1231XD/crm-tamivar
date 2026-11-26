import { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";
import verIcon from "@/assets/images/Ver.png";

interface Props {
  blob: Blob;
  filename: string;
  onClose: () => void;
}

export function DocPreviewModal({ blob, filename, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!containerRef.current) return;
    setLoading(true);
    setError("");
    renderAsync(blob, containerRef.current, undefined, {
      ignoreWidth: false,
      breakPages: true,
      ignoreLastRenderedPageBreak: true,
      trimXmlDeclaration: true,
      useBase64URL: true,
    })
      .then(() => setLoading(false))
      .catch(() => {
        setError("No se pudo previsualizar el documento.");
        setLoading(false);
      });
  }, [blob]);

  const handleDescargar = () => {
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <img src={verIcon} alt="" className="h-5 w-5 shrink-0" />
            <span className="font-semibold text-slate-800 truncate">{filename}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDescargar}
              className="flex items-center gap-1.5 rounded-xl bg-[#312C85] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2a2570]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-4">
          {loading && (
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#312C85]" />
                <p className="text-sm text-slate-500">Generando previsualización...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="flex h-64 items-center justify-center">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}
          <div
            ref={containerRef}
            className={loading || error ? "hidden" : ""}
            style={{ background: "white" }}
          />
        </div>
      </div>
    </div>
  );
}
