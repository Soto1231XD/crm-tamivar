import { useRef, useState } from "react";
import { useAuthStore } from "@/shared/auth/useAuthStore";

function IconCheck({ size = 18 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
    </svg>
  );
}

function IconSpinner({ size = 18 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="animate-spin">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364-6.364-2.121 2.121M8.757 15.243l-2.121 2.121M18.364 18.364l-2.121-2.121M8.757 8.757 6.636 6.636" />
    </svg>
  );
}

function IconUpload({ size = 18 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function IconX({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const inputClass =
  "w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";

function isUploadedTour(url: string) {
  return url.includes("/uploads/tours/") && url.endsWith(".html");
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function TourUploadField({ value, onChange, className }: Props) {
  const [mode, setMode] = useState<"url" | "file">(
    isUploadedTour(value) ? "file" : "url",
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function switchToUrl() {
    setMode("url");
    if (isUploadedTour(value)) onChange("");
  }

  function switchToFile() {
    setMode("file");
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const token = useAuthStore.getState().token;
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/tours/upload-html`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token ?? ""}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { message?: string })?.message ?? "Error al subir el archivo",
        );
      }

      const data: { url: string } = await res.json();
      onChange(`${API_URL}/${data.url}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setUploadError(msg);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
        Recorrido Virtual 360°
      </span>

      <div className="mb-1 flex overflow-hidden rounded-xl border border-slate-200 w-fit text-[11px] font-bold uppercase tracking-wider">
        <button
          type="button"
          onClick={switchToUrl}
          className={`px-4 py-2 transition-colors ${
            mode === "url"
              ? "bg-[#312C85] text-white"
              : "bg-white text-slate-500 hover:bg-slate-50"
          }`}
        >
          Enlace URL
        </button>
        <button
          type="button"
          onClick={switchToFile}
          className={`px-4 py-2 transition-colors ${
            mode === "file"
              ? "bg-[#312C85] text-white"
              : "bg-white text-slate-500 hover:bg-slate-50"
          }`}
        >
          Subir HTML
        </button>
      </div>

      {mode === "url" ? (
        <input
          type="text"
          value={isUploadedTour(value) ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://virto360.com/share/..."
          className={inputClass}
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          {isUploadedTour(value) ? (
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <span className="shrink-0 text-green-600"><IconCheck size={18} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-green-700">
                  Archivo subido correctamente
                </p>
                <p className="truncate text-xs text-green-600">
                  {value.split("/").pop()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChange("")}
                className="text-green-400 transition-colors hover:text-green-700"
                title="Quitar archivo"
              >
                <IconX size={16} />
              </button>
            </div>
          ) : (
            <>
              <input
                ref={fileRef}
                type="file"
                accept=".html"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500 transition-all hover:border-[#312C85] hover:bg-slate-100 hover:text-[#312C85] disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <IconSpinner size={18} />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <IconUpload size={18} />
                    Seleccionar archivo .html
                  </>
                )}
              </button>
            </>
          )}
          {uploadError && (
            <p className="text-xs text-red-500">{uploadError}</p>
          )}
        </div>
      )}
    </div>
  );
}
