import { useEffect, useRef, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import {
  getDocumentosByIncapacidad,
  uploadDocumento,
  deleteDocumento,
} from "../services/documentos.api";
import type { DocumentoEmpleado } from "../services/documentos.api";
import type { Incapacidad } from "../services/incapacidades.api";

const DOCS_IMSS: { tipo: string; label: string }[] = [
  { tipo: "imss_incapacidad_temporal",  label: "Incapacidad temporal" },
  { tipo: "imss_hoja_alta",             label: "Hoja de alta" },
  { tipo: "imss_hoja_calificacion_st7", label: "Hoja de calificación ST-7" },
];

function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

interface Props {
  incapacidad: Incapacidad;
  empleadoId: number;
  canEdit: boolean;
  onClose: () => void;
}

export function IncapacidadDocsModal({ incapacidad, empleadoId, canEdit, onClose }: Props) {
  const [docs, setDocs]       = useState<DocumentoEmpleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState("");
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const apiBase  = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    getDocumentosByIncapacidad(incapacidad.id)
      .then(setDocs)
      .catch(() => setError("No se pudieron cargar los documentos"))
      .finally(() => setLoading(false));
  }, [incapacidad.id]);

  const getDoc = (tipo: string) => docs.find(d => d.tipo === tipo);

  const handleUpload = async (tipo: string, file: File) => {
    setBusy(true);
    setError("");
    try {
      await uploadDocumento(empleadoId, tipo, file, { incapacidad_id: incapacidad.id });
      const updated = await getDocumentosByIncapacidad(incapacidad.id);
      setDocs(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir archivo");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (doc: DocumentoEmpleado) => {
    setBusy(true);
    setError("");
    try {
      await deleteDocumento(doc.id);
      setDocs(prev => prev.filter(d => d.id !== doc.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setBusy(false);
    }
  };

  const slots = incapacidad.tipo === "IMSS" ? DOCS_IMSS : [];
  const extraDocs = docs.filter(d => !DOCS_IMSS.some(s => s.tipo === d.tipo));

  return (
    <AppModal
      isOpen
      onClose={onClose}
      title="Documentos de incapacidad"
      maxWidthClassName="max-w-lg"
    >
      {/* Resumen de la incapacidad */}
      <div className="mb-4 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <span className="text-slate-500">Período:</span>
        <span className="font-medium text-slate-700">
          {formatDate(incapacidad.fecha_inicio)} – {formatDate(incapacidad.fecha_fin)}
        </span>
        <span className="ml-2 text-slate-400">·</span>
        <span className="font-semibold text-[#312C85]">{incapacidad.dias} días</span>
        <span className="ml-2 text-slate-400">·</span>
        <span className={[
          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
          incapacidad.estatus === "Aprobada"  ? "bg-green-100 text-green-700"  :
          incapacidad.estatus === "Rechazada" ? "bg-red-100 text-red-700"      :
                                                "bg-amber-100 text-amber-700",
        ].join(" ")}>
          {incapacidad.estatus}
        </span>
      </div>

      {loading ? (
        <p className="py-6 text-center text-sm text-slate-400">Cargando documentos...</p>
      ) : (
        <div className="space-y-2.5">
          {/* Slots IMSS */}
          {slots.map(({ tipo, label }) => {
            const doc = getDoc(tipo);
            return (
              <div key={tipo} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
                <div className="flex min-w-0 flex-col">
                  <span className="text-xs font-medium text-slate-600">{label}</span>
                  {doc ? (
                    <a
                      href={`${apiBase}${doc.archivo_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 truncate text-xs text-[#312C85] hover:underline"
                    >
                      {doc.nombre_archivo}
                    </a>
                  ) : (
                    <span className="mt-0.5 text-xs text-slate-400">Sin archivo</span>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {doc ? (
                    <>
                      <a
                        href={`${apiBase}${doc.archivo_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                      >
                        Ver
                      </a>
                      {canEdit && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleDelete(doc)}
                          className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      )}
                    </>
                  ) : canEdit ? (
                    <>
                      <input
                        ref={el => { fileRefs.current[tipo] = el; }}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) handleUpload(tipo, f);
                          e.target.value = "";
                        }}
                      />
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => fileRefs.current[tipo]?.click()}
                        className="rounded-lg bg-[#312C85] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#4338ca] disabled:opacity-50"
                      >
                        Subir
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}

          {/* Documentos extra (no-IMSS) */}
          {extraDocs.map(doc => (
            <div key={doc.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
              <div className="flex min-w-0 flex-col">
                <span className="text-xs font-medium text-slate-600">{doc.tipo}</span>
                <a
                  href={`${apiBase}${doc.archivo_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 truncate text-xs text-[#312C85] hover:underline"
                >
                  {doc.nombre_archivo}
                </a>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <a
                  href={`${apiBase}${doc.archivo_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                >
                  Ver
                </a>
                {canEdit && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDelete(doc)}
                    className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}

          {slots.length === 0 && docs.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-400">No hay documentos asociados</p>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

      <div className="mt-4 flex justify-end border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
        >
          Cerrar
        </button>
      </div>
    </AppModal>
  );
}
