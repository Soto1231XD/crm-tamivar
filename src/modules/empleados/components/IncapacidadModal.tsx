import { useEffect, useRef, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { calcularDiasIncapacidad } from "../services/incapacidades.api";
import type { Incapacidad, CreateIncapacidadPayload, UpdateIncapacidadPayload } from "../services/incapacidades.api";
import {
  getDocumentosByIncapacidad,
  uploadDocumento,
  deleteDocumento,
} from "../services/documentos.api";
import type { DocumentoEmpleado } from "../services/documentos.api";

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const LABEL =
  "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";

const DOCS_IMSS: { tipo: string; label: string }[] = [
  { tipo: "imss_incapacidad_temporal",  label: "Incapacidad temporal" },
  { tipo: "imss_hoja_alta",             label: "Hoja de alta" },
  { tipo: "imss_hoja_calificacion_st7", label: "Hoja de calificación ST-7" },
];

interface Props {
  empleadoId: number;
  initial?: Incapacidad | null;
  onSave: (data: CreateIncapacidadPayload | UpdateIncapacidadPayload) => Promise<Incapacidad>;
  onClose: () => void;
}

export function IncapacidadModal({ empleadoId, initial, onSave, onClose }: Props) {
  const isEdit = Boolean(initial);

  // ── Campos del formulario ──────────────────────────────────────────────────
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin]       = useState("");
  const [tipo, setTipo]               = useState<"IMSS" | "Particular">("IMSS");
  const [descripcion, setDescripcion] = useState("");
  const [estatus, setEstatus]         = useState<"Pendiente" | "Aprobada" | "Rechazada">("Pendiente");

  // ── Documentos ────────────────────────────────────────────────────────────
  // Archivos seleccionados (aún no subidos) — solo para creación
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  // Documentos ya guardados en el servidor — solo para edición
  const [savedDocs, setSavedDocs]         = useState<DocumentoEmpleado[]>([]);

  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (initial) {
      setFechaInicio(initial.fecha_inicio.slice(0, 10));
      setFechaFin(initial.fecha_fin.slice(0, 10));
      setTipo(initial.tipo as "IMSS" | "Particular");
      setDescripcion(initial.descripcion ?? "");
      setEstatus(initial.estatus as typeof estatus);
      if (initial.tipo === "IMSS") {
        getDocumentosByIncapacidad(initial.id).then(setSavedDocs).catch(() => {});
      }
    }
  }, [initial]);

  const dias = fechaInicio && fechaFin && fechaFin >= fechaInicio
    ? calcularDiasIncapacidad(fechaInicio, fechaFin)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaInicio || !fechaFin) { setError("Las fechas son obligatorias."); return; }
    if (fechaFin < fechaInicio)    { setError("La fecha fin debe ser igual o posterior a la fecha inicio."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = isEdit
        ? ({ fecha_inicio: fechaInicio, fecha_fin: fechaFin, dias, tipo, descripcion: descripcion || undefined, estatus } as UpdateIncapacidadPayload)
        : ({ empleado_id: empleadoId, fecha_inicio: fechaInicio, fecha_fin: fechaFin, dias, tipo, descripcion: descripcion || undefined, estatus } as CreateIncapacidadPayload);

      const saved = await onSave(payload);

      // Subir archivos seleccionados (en creación) si hay alguno
      if (tipo === "IMSS") {
        const uploads = Object.entries(selectedFiles).filter(([, f]) => f !== null && f !== undefined);
        for (const [tipoDoc, file] of uploads) {
          if (file) await uploadDocumento(empleadoId, tipoDoc, file, { incapacidad_id: saved.id });
        }
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  // Eliminar doc guardado (modo edición)
  const handleDeleteSaved = async (doc: DocumentoEmpleado) => {
    try {
      await deleteDocumento(doc.id);
      setSavedDocs(prev => prev.filter(d => d.id !== doc.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  // Subir doc inmediatamente (modo edición)
  const handleUploadEdit = async (tipoDoc: string, file: File) => {
    if (!initial) return;
    setSaving(true);
    try {
      await uploadDocumento(empleadoId, tipoDoc, file, { incapacidad_id: initial.id });
      const updated = await getDocumentosByIncapacidad(initial.id);
      setSavedDocs(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir archivo");
    } finally {
      setSaving(false);
    }
  };

  const getSaved = (tipoDoc: string) => savedDocs.find(d => d.tipo === tipoDoc);
  const apiBase  = import.meta.env.VITE_API_URL || "http://localhost:3000";

  return (
    <AppModal
      isOpen
      onClose={onClose}
      title={isEdit ? "Editar incapacidad" : "Registrar incapacidad"}
      maxWidthClassName="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Fechas ── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Fecha inicio <span className="text-red-500">*</span></label>
            <input type="date" className={INPUT} value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Fecha fin <span className="text-red-500">*</span></label>
            <input type="date" className={INPUT} value={fechaFin} min={fechaInicio} onChange={e => setFechaFin(e.target.value)} />
          </div>

          <div>
            <label className={LABEL}>Días</label>
            <div className="flex h-[42px] items-center rounded-xl border border-slate-200 bg-slate-100 px-3.5 text-sm font-semibold text-[#312C85]">
              {dias > 0 ? `${dias} día${dias !== 1 ? "s" : ""}` : "—"}
            </div>
          </div>

          <div>
            <label className={LABEL}>Tipo <span className="text-red-500">*</span></label>
            <select className={INPUT} value={tipo} onChange={e => setTipo(e.target.value as typeof tipo)}>
              <option value="IMSS">IMSS</option>
              <option value="Particular">Particular</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className={LABEL}>Estatus</label>
            <select className={INPUT} value={estatus} onChange={e => setEstatus(e.target.value as typeof estatus)}>
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobada">Aprobada</option>
              <option value="Rechazada">Rechazada</option>
            </select>
          </div>
        </div>

        {/* ── Comentarios ── */}
        <div>
          <label className={LABEL}>Comentarios / Diagnóstico</label>
          <textarea
            rows={2}
            className={`${INPUT} resize-none`}
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Diagnóstico o motivo de la incapacidad..."
          />
        </div>

        {/* ── Documentos IMSS (opcionales) ── */}
        {tipo === "IMSS" && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Documentos IMSS <span className="font-normal normal-case tracking-normal text-slate-400">(opcionales)</span>
            </p>
            <div className="space-y-2.5">
              {DOCS_IMSS.map(({ tipo: tipoDoc, label }) => {
                const saved  = getSaved(tipoDoc);
                const selFile = selectedFiles[tipoDoc];

                return (
                  <div key={tipoDoc} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium text-slate-600">{label}</span>

                      {/* Modo edición: doc guardado */}
                      {isEdit && saved ? (
                        <a
                          href={`${apiBase}${saved.archivo_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 truncate text-xs text-[#312C85] hover:underline"
                        >
                          {saved.nombre_archivo}
                        </a>
                      ) : selFile ? (
                        // Archivo seleccionado (aún no subido)
                        <span className="mt-0.5 truncate text-xs text-slate-500">{selFile.name}</span>
                      ) : (
                        <span className="mt-0.5 text-xs text-slate-400">Sin archivo</span>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {/* Modo edición con doc guardado → solo eliminar */}
                      {isEdit && saved ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteSaved(saved)}
                          className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                        >
                          Eliminar
                        </button>
                      ) : isEdit && !saved ? (
                        // Modo edición sin doc → subir de inmediato
                        <>
                          <input
                            ref={el => { fileRefs.current[tipoDoc] = el; }}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) handleUploadEdit(tipoDoc, f);
                              e.target.value = "";
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => fileRefs.current[tipoDoc]?.click()}
                            className="rounded-lg bg-[#312C85] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#4338ca]"
                          >
                            Subir
                          </button>
                        </>
                      ) : selFile ? (
                        // Creación con archivo seleccionado → quitar selección
                        <button
                          type="button"
                          onClick={() => setSelectedFiles(prev => ({ ...prev, [tipoDoc]: null }))}
                          className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-100"
                        >
                          Quitar
                        </button>
                      ) : (
                        // Creación sin archivo → seleccionar
                        <>
                          <input
                            ref={el => { fileRefs.current[tipoDoc] = el; }}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0] ?? null;
                              setSelectedFiles(prev => ({ ...prev, [tipoDoc]: f }));
                              e.target.value = "";
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => fileRefs.current[tipoDoc]?.click()}
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                          >
                            Seleccionar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex justify-center gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={onClose} className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white">
            Cancelar
          </button>
          <button type="submit" disabled={saving || dias === 0} className="rounded-lg bg-[#0F172A] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Registrar"}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
