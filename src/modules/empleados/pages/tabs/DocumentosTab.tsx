import { useState } from "react";
import type { Empleado } from "../../services/empleados.api";
import { TIPOS_DOCUMENTO, TIPOS_DOCUMENTO_EXCLUIDOS_BECARIO, type DocumentoEmpleado } from "../../services/documentos.api";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const TIPOS_MULTI = ["Exámenes médicos", "Pruebas psicométricas"] as const;

interface Props {
  documentos: DocumentoEmpleado[];
  loading: boolean;
  empleado: Empleado;
  canEdit: boolean;
  uploadingTipo: string | null;
  deletingDocId: number | null;
  onUpload: (tipo: string, file: File, descripcion?: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

function DocItem({ doc, canEdit, deletingDocId, onDelete }: {
  doc: DocumentoEmpleado;
  canEdit: boolean;
  deletingDocId: number | null;
  onDelete: (id: number) => Promise<void>;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5">
      <svg className="h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-slate-700">
          {doc.descripcion ?? doc.nombre_archivo}
        </p>
      </div>
      <a
        href={`${API_BASE}${doc.archivo_url}`}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-xs font-semibold text-[#312C85] hover:underline"
      >
        Ver
      </a>
      {canEdit && (
        <button
          type="button"
          disabled={deletingDocId === doc.id}
          onClick={() => onDelete(doc.id)}
          className="shrink-0 text-xs font-semibold text-red-500 hover:underline disabled:opacity-50"
        >
          {deletingDocId === doc.id ? "..." : "✕"}
        </button>
      )}
    </div>
  );
}

function SubirArchivoModal({ tipo, onClose, onUpload, uploading }: {
  tipo: "Exámenes médicos" | "Pruebas psicométricas";
  onClose: () => void;
  onUpload: (tipo: string, file: File, descripcion: string) => Promise<void>;
  uploading: boolean;
}) {
  const isExamen = tipo === "Exámenes médicos";
  const [nombre, setNombre] = useState("");
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-base font-semibold text-[var(--crm-text)]">
          {isExamen ? "Agregar examen médico" : "Agregar prueba psicométrica"}
        </h2>
        <p className="mb-4 text-sm text-[var(--crm-text-muted)]">
          {isExamen ? "Indica el tipo de examen y sube el archivo." : "Indica el nombre de la prueba y sube el archivo."}
        </p>

        <label className="mb-1 block text-xs font-medium text-[var(--crm-text-muted)]">
          {isExamen ? "Tipo de examen" : "Nombre de la prueba"} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder={isExamen ? "Ej. General, Toxicológico, Audiometría…" : "Ej. DISC, 16PF, Wonderlic…"}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="mb-4 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2 text-sm text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-[#312C85]/30"
        />

        <label className="mb-1 block text-xs font-medium text-[var(--crm-text-muted)]">
          Archivo <span className="text-red-500">*</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2.5 text-sm text-[var(--crm-text-muted)] hover:bg-slate-100">
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="truncate">{file ? file.name : "Seleccionar archivo…"}</span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); e.target.value = ""; }}
          />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-[var(--crm-text-muted)] hover:bg-[var(--crm-hover)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!nombre.trim() || !file || uploading}
            onClick={async () => {
              if (!file) return;
              onClose();
              await onUpload(tipo, file, nombre.trim());
            }}
            className="rounded-xl bg-[#312C85] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4338ca] disabled:opacity-50"
          >
            Subir
          </button>
        </div>
      </div>
    </div>
  );
}

export function DocumentosTab({ documentos, loading, empleado, canEdit, uploadingTipo, deletingDocId, onUpload, onDelete }: Props) {
  const [modalTipo, setModalTipo] = useState<"Exámenes médicos" | "Pruebas psicométricas" | null>(null);

  const tiposActivos = empleado.tipo === "Becario"
    ? TIPOS_DOCUMENTO.filter((t) => !TIPOS_DOCUMENTO_EXCLUIDOS_BECARIO.includes(t))
    : [...TIPOS_DOCUMENTO];

  const tiposConDoc = new Set(tiposActivos.filter((t) => documentos.some((d) => d.tipo === t)));
  const entregados  = tiposConDoc.size;
  const total       = tiposActivos.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--crm-text-muted)]">
          {entregados} de {total} tipos de documento entregados
        </p>
        <span className={[
          "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
          entregados === total ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
        ].join(" ")}>
          {entregados === total ? "Expediente completo" : `Faltan ${total - entregados} tipos`}
        </span>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#312C85]" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Tipos normales (1 archivo) */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tiposActivos.filter((t) => !(TIPOS_MULTI as readonly string[]).includes(t)).map((tipo) => {
              const doc = documentos.find((d) => d.tipo === tipo);
              const isUploading = uploadingTipo === tipo;
              return (
                <div key={tipo} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-700 leading-tight">{tipo}</p>
                    <span className={[
                      "shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                      doc ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500",
                    ].join(" ")}>
                      {doc ? "Subido" : "Pendiente"}
                    </span>
                  </div>
                  {doc && <p className="truncate text-xs text-slate-400">{doc.nombre_archivo}</p>}
                  <div className="mt-auto flex gap-2 pt-1">
                    {doc ? (
                      <>
                        <a
                          href={`${API_BASE}${doc.archivo_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-center text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                        >
                          Ver
                        </a>
                        {canEdit && (
                          <button
                            type="button"
                            disabled={deletingDocId === doc.id}
                            onClick={() => onDelete(doc.id)}
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            {deletingDocId === doc.id ? "..." : "Eliminar"}
                          </button>
                        )}
                      </>
                    ) : canEdit ? (
                      <label className={[
                        "flex-1 cursor-pointer rounded-lg py-1.5 text-center text-xs font-semibold text-white transition",
                        isUploading ? "bg-[#312C85]/60 cursor-not-allowed" : "bg-[#312C85] hover:bg-[#4338ca]",
                      ].join(" ")}>
                        {isUploading ? "Subiendo..." : "Subir archivo"}
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          className="hidden"
                          disabled={isUploading}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) onUpload(tipo, f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    ) : (
                      <span className="flex-1 py-1.5 text-center text-xs text-slate-400">Sin permiso</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tipos multi (varios archivos) */}
          <div className="grid gap-3 sm:grid-cols-2">
            {(TIPOS_MULTI as readonly string[]).map((tipo) => {
              const isPsic = tipo === "Pruebas psicométricas";
              const docs = documentos.filter((d) => d.tipo === tipo);
              const isUploading = uploadingTipo === tipo;
              return (
                <div key={tipo} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-700 leading-tight">{tipo}</p>
                    <span className={[
                      "shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                      docs.length > 0 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500",
                    ].join(" ")}>
                      {docs.length} archivo{docs.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {docs.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      {docs.map((d) => (
                        <DocItem key={d.id} doc={d} canEdit={canEdit} deletingDocId={deletingDocId} onDelete={onDelete} />
                      ))}
                    </div>
                  )}
                  {canEdit && (
                    <div className="mt-auto pt-1">
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => setModalTipo(isPsic ? "Pruebas psicométricas" : "Exámenes médicos")}
                        className={[
                          "w-full rounded-lg py-1.5 text-center text-xs font-semibold text-white transition",
                          isUploading ? "bg-[#312C85]/60 cursor-not-allowed" : "bg-[#312C85] hover:bg-[#4338ca]",
                        ].join(" ")}
                      >
                        {isUploading ? "Subiendo..." : isPsic ? "Agregar prueba" : "Agregar examen"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {modalTipo && (
        <SubirArchivoModal
          tipo={modalTipo}
          onClose={() => setModalTipo(null)}
          onUpload={onUpload}
          uploading={uploadingTipo === modalTipo}
        />
      )}
    </div>
  );
}
