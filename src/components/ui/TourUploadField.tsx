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
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function switchToUrl() {
    setMode("url");
    if (isUploadedTour(value)) onChange("");
  }

  function switchToFile() {
    setMode("file");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setUploadError(null);

    const token = useAuthStore.getState().token;
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data: { url: string } = JSON.parse(xhr.responseText);
          onChange(`${API_URL}/${data.url}`);
        } catch {
          setUploadError("Respuesta inválida del servidor.");
        }
      } else {
        let msg = "Error al subir el archivo";
        try {
          const err = JSON.parse(xhr.responseText) as { message?: string };
          if (err.message) msg = err.message;
        } catch { /* ignore */ }
        setUploadError(msg);
      }
      setUploading(false);
      setProgress(0);
      if (fileRef.current) fileRef.current.value = "";
    };

    xhr.onerror = () => {
      setUploadError("Error de red al subir el archivo.");
      setUploading(false);
      setProgress(0);
      if (fileRef.current) fileRef.current.value = "";
    };

    xhr.open("POST", `${API_URL}/tours/upload-html`);
    xhr.setRequestHeader("Authorization", `Bearer ${token ?? ""}`);
    xhr.send(formData);
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
              {uploading ? (
                <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>Subiendo archivo...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[#312C85] transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500 transition-all hover:border-[#312C85] hover:bg-slate-100 hover:text-[#312C85]"
                >
                  <IconUpload size={18} />
                  Seleccionar archivo .html
                </button>
              )}
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
