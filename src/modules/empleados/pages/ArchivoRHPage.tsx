import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getArchivoAnios, getArchivoResumen } from "../services/rh-archivo.api";
import type { ArchivoResumen, EmpleadoResumenItem } from "../services/rh-archivo.api";
import {
  getRhAreas, createRhArea, updateRhArea, deleteRhArea,
  getRhDocumentos, uploadRhDocumento, deleteRhDocumento, downloadRhDocumento,
  mimeToExt,
} from "../services/rh-docs.api";
import type { RhArea, RhDocumento } from "../services/rh-docs.api";

/* ─────────── Registros por año ─────────── */

const REGISTRO_CATS: {
  key: keyof ArchivoResumen;
  label: string;
  color: string;
  tab: string;
}[] = [
  { key: "actas",          label: "Actas Administrativas", color: "#7C3AED", tab: "amonestaciones" },
  { key: "amonestaciones", label: "Amonestaciones",         color: "#EF4444", tab: "amonestaciones" },
  { key: "nominas",        label: "Nómina",                 color: "#10B981", tab: "nomina" },
  { key: "incapacidades",  label: "Incapacidades",          color: "#3B82F6", tab: "incapacidades" },
  { key: "apoyos",         label: "Apoyos Solidarios",      color: "#F59E0B", tab: "apoyos" },
  { key: "vacaciones",     label: "Vacaciones",             color: "#14B8A6", tab: "vacaciones" },
  { key: "faltas",         label: "Faltas",                 color: "#F43F5E", tab: "faltas" },
];

const TIPO_LABELS: Record<string, string> = {
  voluntaria: "Acta Voluntaria", hechos: "Acta de Hechos",
  disciplinaria: "Acta Disciplinaria", pip: "Plan de Mejora",
  Verbal: "Verbal", Escrita: "Escrita", "Suspensión": "Suspensión",
  IMSS: "IMSS", Particular: "Particular",
  Pago: "Pago de nómina", Adelanto: "Adelanto", Solicitud: "Solicitud",
};

/* ─────────── View state machine ─────────── */

type ViewLevel =
  | { type: "root" }
  | { type: "year"; year: number }
  | { type: "reg-category"; year: number; catKey: keyof ArchivoResumen; catLabel: string; tab: string }
  | { type: "docs-area"; area: RhArea };

/* ─────────── Shared icons / components ─────────── */

function FolderIcon({ color }: { color: string }) {
  return (
    <svg width="80" height="66" viewBox="0 0 80 66" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="16" width="80" height="50" rx="6" fill={color} />
      <path d="M0 16 L0 10 Q0 6 4 6 L28 6 Q32 6 34 10 L40 16 Z" fill={color} opacity="0.75" />
      <rect x="0" y="20" width="80" height="46" rx="6" fill="white" opacity="0.13" />
      <rect x="6" y="26" width="68" height="34" rx="4" fill="white" opacity="0.07" />
    </svg>
  );
}

function FolderCard({
  label, sublabel, color, onClick, onEdit, onDelete,
}: {
  label: string; sublabel?: string; color: string;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="group relative flex flex-col items-center gap-2 rounded-2xl px-3 py-4 transition-all duration-150 hover:bg-slate-100 select-none w-28">
      {(onEdit || onDelete) && (
        <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
          {onEdit && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-[#312C85] transition-colors" title="Editar">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-red-500 transition-colors" title="Eliminar">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      )}
      <button type="button" onClick={onClick} className="flex flex-col items-center gap-2 w-full active:scale-95 transition-transform">
        <div className="transition-transform duration-150 group-hover:-translate-y-1 drop-shadow-sm group-hover:drop-shadow-md">
          <FolderIcon color={color} />
        </div>
        <span className="text-center text-[12px] font-semibold text-slate-700 leading-snug break-words w-full">
          {label}
        </span>
        {sublabel && <span className="text-[11px] text-slate-400">{sublabel}</span>}
      </button>
    </div>
  );
}

function Breadcrumb({ parts }: { parts: { label: string; onClick?: () => void }[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm flex-wrap">
      {parts.map((part, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-slate-300">/</span>}
          {part.onClick
            ? <button type="button" onClick={part.onClick} className="font-medium text-slate-500 hover:text-[#312C85] transition-colors">{part.label}</button>
            : <span className="font-bold text-slate-800">{part.label}</span>
          }
        </span>
      ))}
    </nav>
  );
}

/* ─────────── Area modal ─────────── */

const PRESET_COLORS = [
  "#312C85", "#7C3AED", "#2563EB", "#0D9488",
  "#059669", "#D97706", "#EA580C", "#DC2626", "#BE185D",
  "#64748B",
];

function AreaModal({
  initial, onSave, onClose,
}: {
  initial?: RhArea;
  onSave: (nombre: string, color: string) => Promise<void>;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [color, setColor]   = useState(initial?.color ?? "#312C85");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError("El nombre es requerido"); return; }
    setSaving(true);
    try {
      await onSave(nombre.trim(), color);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-base font-bold text-slate-800 mb-4">
          {initial ? "Editar área" : "Nueva área"}
        </h2>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del área</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#312C85] focus:outline-none"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Ventas, Administración…"
              maxLength={80}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Color de carpeta</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full border-2 transition-all ${color === c ? "border-slate-800 scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                className="h-7 w-7 cursor-pointer rounded-full border-2 border-slate-200" title="Color personalizado" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <FolderIcon color={color} />
              <span className="text-xs text-slate-500">Vista previa</span>
            </div>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 transition-colors">Cancelar</button>
            <button type="submit" disabled={saving}
              className="rounded-xl bg-[#312C85] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4038a0] disabled:opacity-60 transition-colors">
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────── Upload modal ─────────── */

const ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp";

function UploadModal({
  areaId, onUploaded, onClose,
}: {
  areaId: number;
  onUploaded: (doc: RhDocumento) => void;
  onClose: () => void;
}) {
  const [file, setFile]     = useState<File | null>(null);
  const [nombre, setNombre] = useState("");
  const [desc, setDesc]     = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError]   = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    if (!nombre) setNombre(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError("Selecciona un archivo"); return; }
    if (!nombre.trim()) { setError("El nombre es requerido"); return; }
    setUploading(true);
    try {
      const doc = await uploadRhDocumento(areaId, file, nombre.trim(), desc.trim() || undefined);
      onUploaded(doc);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Error al subir el archivo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-base font-bold text-slate-800 mb-4">Subir documento</h2>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            className="cursor-pointer rounded-xl border-2 border-dashed border-slate-200 p-6 text-center hover:border-[#312C85] transition-colors"
          >
            <input ref={inputRef} type="file" accept={ACCEPT} className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            {file
              ? <p className="text-sm font-medium text-slate-700">{file.name}</p>
              : <>
                  <p className="text-sm text-slate-500">Arrastra un archivo o <span className="text-[#312C85] font-medium">haz clic para seleccionar</span></p>
                  <p className="text-xs text-slate-400 mt-1">PDF, Word, imágenes · máx. 25 MB</p>
                </>
            }
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del documento</label>
            <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#312C85] focus:outline-none"
              value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={200} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción <span className="font-normal text-slate-400">(opcional)</span></label>
            <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#312C85] focus:outline-none"
              value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={500} />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 transition-colors">Cancelar</button>
            <button type="submit" disabled={uploading}
              className="rounded-xl bg-[#312C85] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4038a0] disabled:opacity-60 transition-colors">
              {uploading ? "Subiendo…" : "Subir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────── Docs area view ─────────── */

function DocRow({ doc, onDelete }: { doc: RhDocumento; onDelete: () => void }) {
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [confirmDel, setConfirmDel]   = useState(false);

  const ext = mimeToExt(doc.mime_type);
  const extColor: Record<string, string> = {
    PDF: "bg-red-50 text-red-600 border-red-200",
    Word: "bg-blue-50 text-blue-600 border-blue-200",
    Imagen: "bg-emerald-50 text-emerald-600 border-emerald-200",
    Archivo: "bg-slate-50 text-slate-600 border-slate-200",
  };

  const handleDownload = async () => {
    setDownloading(true);
    try { await downloadRhDocumento(doc); } finally { setDownloading(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteRhDocumento(doc.id); onDelete(); } catch { setDeleting(false); }
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 hover:border-slate-200 transition-colors">
      <span className={`shrink-0 rounded-lg border px-2 py-0.5 text-[11px] font-bold ${extColor[ext] ?? extColor.Archivo}`}>
        {ext}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{doc.nombre}</p>
        {doc.descripcion && <p className="text-xs text-slate-400 truncate">{doc.descripcion}</p>}
        <p className="text-[11px] text-slate-400 mt-0.5">
          {new Date(doc.creado_en).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
        </p>
      </div>
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={downloading}
        className="shrink-0 flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:border-[#312C85] hover:text-[#312C85] transition-colors disabled:opacity-50"
      >
        {downloading
          ? <span className="h-3.5 w-3.5 animate-spin rounded-full border border-slate-300 border-t-[#312C85]" />
          : <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
        }
        Descargar
      </button>
      {confirmDel
        ? <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-red-500">¿Eliminar?</span>
            <button type="button" onClick={() => void handleDelete()} disabled={deleting}
              className="rounded-lg bg-red-50 border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50">
              {deleting ? "…" : "Sí"}
            </button>
            <button type="button" onClick={() => setConfirmDel(false)}
              className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 transition-colors">No</button>
          </div>
        : <button type="button" onClick={() => setConfirmDel(true)}
            className="shrink-0 rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:border-red-200 hover:text-red-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
      }
    </div>
  );
}

/* ─────────── Employee card (registros) ─────────── */

function EmployeeCard({ item, tab, onNavigate }: {
  item: EmpleadoResumenItem; tab: string;
  onNavigate: (id: number, tab: string) => void;
}) {
  const initials = `${item.nombre[0] ?? ""}${item.apellido_paterno[0] ?? ""}`.toUpperCase();
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white px-4 py-3 hover:border-slate-200 transition-colors">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#312C85]/10 text-sm font-bold text-[#312C85]">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{item.nombre} {item.apellido_paterno}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {item.detalle.map((d) => (
            <span key={d.tipo} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-800">{d.count}</span>
              {TIPO_LABELS[d.tipo] ?? d.tipo}
            </span>
          ))}
        </div>
      </div>
      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
        {item.total} {item.total === 1 ? "registro" : "registros"}
      </span>
      <button type="button" onClick={() => onNavigate(item.empleado_id, tab)}
        className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 transition hover:border-[#312C85] hover:text-[#312C85]">
        Ver expediente →
      </button>
    </div>
  );
}

/* ─────────── Main page ─────────── */

export function ArchivoRHPage() {
  const navigate = useNavigate();

  // Registros por año
  const [años, setAños]           = useState<number[]>([]);
  const [loadingRoot, setLoadingRoot] = useState(true);
  const [loadingYear, setLoadingYear] = useState(false);
  const [yearCache, setYearCache] = useState<Record<number, ArchivoResumen>>({});

  // Docs y manuales
  const [areas, setAreas]         = useState<RhArea[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);

  // View navigation
  const [view, setView] = useState<ViewLevel>({ type: "root" });

  // Docs area state
  const [docs, setDocs]           = useState<RhDocumento[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Modals
  const [areaModal, setAreaModal] = useState<{ open: boolean; editing?: RhArea }>({ open: false });
  const [uploadModal, setUploadModal] = useState(false);

  /* ── Load initial data ── */
  useEffect(() => {
    getArchivoAnios()
      .then(setAños)
      .catch(() => {})
      .finally(() => setLoadingRoot(false));
    getRhAreas()
      .then(setAreas)
      .catch(() => {})
      .finally(() => setLoadingAreas(false));
  }, []);

  /* ── Load docs when entering a docs-area view ── */
  useEffect(() => {
    if (view.type !== "docs-area") return;
    setLoadingDocs(true);
    getRhDocumentos(view.area.id)
      .then(setDocs)
      .catch(() => setDocs([]))
      .finally(() => setLoadingDocs(false));
  }, [view]);

  /* ── Year navigation ── */
  const handleSelectYear = async (year: number) => {
    setView({ type: "year", year });
    if (!yearCache[year]) {
      setLoadingYear(true);
      try {
        const data = await getArchivoResumen(year);
        setYearCache((c) => ({ ...c, [year]: data }));
      } finally {
        setLoadingYear(false);
      }
    }
  };

  const handleNavigateEmployee = (empleadoId: number, tab: string) => {
    navigate(`/modulos/rh/empleados/${empleadoId}?tab=${tab}`);
  };

  const goBack = () => {
    if (view.type === "reg-category") setView({ type: "year", year: view.year });
    else if (view.type === "year") setView({ type: "root" });
    else if (view.type === "docs-area") setView({ type: "root" });
  };

  /* ── Area CRUD ── */
  const handleSaveArea = async (nombre: string, color: string) => {
    if (areaModal.editing) {
      const updated = await updateRhArea(areaModal.editing.id, { nombre, color });
      setAreas((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } else {
      const created = await createRhArea({ nombre, color });
      setAreas((prev) => [...prev, created].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    }
  };

  const handleDeleteArea = async (area: RhArea) => {
    if (!confirm(`¿Eliminar el área "${area.nombre}" y todos sus documentos?`)) return;
    await deleteRhArea(area.id);
    setAreas((prev) => prev.filter((a) => a.id !== area.id));
  };

  /* ── Breadcrumb ── */
  const breadcrumbParts = (() => {
    const parts: { label: string; onClick?: () => void }[] = [
      { label: "Archivo RH", onClick: view.type !== "root" ? () => setView({ type: "root" }) : undefined },
    ];
    if (view.type === "year" || view.type === "reg-category") {
      parts.push({
        label: String(view.year),
        onClick: view.type === "reg-category" ? () => setView({ type: "year", year: view.year }) : undefined,
      });
    }
    if (view.type === "reg-category") parts.push({ label: view.catLabel });
    if (view.type === "docs-area")    parts.push({ label: view.area.nombre });
    return parts;
  })();

  /* ── Render ── */
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-start gap-3">
        {view.type !== "root" && (
          <button type="button" onClick={goBack}
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-[#312C85] hover:text-[#312C85] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="flex-1">
          <Breadcrumb parts={breadcrumbParts} />
          {view.type === "root" && (
            <p className="mt-1 text-sm text-slate-500">Registros y documentos de RH organizados por categoría.</p>
          )}
        </div>
        {view.type === "docs-area" && (
          <button type="button" onClick={() => setUploadModal(true)}
            className="flex items-center gap-2 rounded-xl bg-[#312C85] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4038a0] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Subir archivo
          </button>
        )}
      </div>

      {/* ══ ROOT ══ */}
      {view.type === "root" && (
        <div className="space-y-5">

          {/* Documentos y Manuales */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-700">Documentos y Manuales</h2>
                <p className="text-xs text-slate-400 mt-0.5">Manuales, diagramas y documentos por área</p>
              </div>
              <button type="button" onClick={() => setAreaModal({ open: true })}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-[#312C85] hover:text-[#312C85] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Nueva área
              </button>
            </div>
            {loadingAreas && (
              <div className="flex justify-center py-8">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#312C85]" />
              </div>
            )}
            {!loadingAreas && areas.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">
                Sin áreas. Crea la primera con "+ Nueva área".
              </p>
            )}
            {!loadingAreas && areas.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {areas.map((area) => (
                  <FolderCard
                    key={area.id}
                    label={area.nombre}
                    sublabel={area._count ? `${area._count.documentos} doc${area._count.documentos !== 1 ? "s" : ""}` : undefined}
                    color={area.color}
                    onClick={() => setView({ type: "docs-area", area })}
                    onEdit={() => setAreaModal({ open: true, editing: area })}
                    onDelete={() => void handleDeleteArea(area)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-slate-200" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registros por año</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Años */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <div className="mb-3">
              <h2 className="text-sm font-bold text-slate-700">Historial de colaboradores</h2>
              <p className="text-xs text-slate-400 mt-0.5">Actas, nómina, faltas y más — por año</p>
            </div>
            {loadingRoot && (
              <div className="flex justify-center py-8">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#312C85]" />
              </div>
            )}
            {!loadingRoot && años.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">Sin registros aún.</p>
            )}
            {!loadingRoot && años.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {años.map((year) => (
                  <FolderCard key={year} label={String(year)} color="#F59E0B"
                    onClick={() => void handleSelectYear(year)} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ YEAR ══ */}
      {view.type === "year" && (
        <>
          {loadingYear && (
            <div className="flex justify-center py-20">
              <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#312C85]" />
            </div>
          )}
          {!loadingYear && yearCache[view.year] && (() => {
            const data = yearCache[view.year];
            const withData = REGISTRO_CATS.filter((c) => (data[c.key] as EmpleadoResumenItem[]).length > 0);
            if (withData.length === 0) {
              return (
                <div className="rounded-2xl border border-slate-100 bg-white px-8 py-12 text-center">
                  <p className="text-sm text-slate-400">Sin registros para {view.year}.</p>
                </div>
              );
            }
            return (
              <div className="rounded-2xl border border-slate-100 bg-white p-6">
                <div className="flex flex-wrap gap-1">
                  {withData.map((cat) => {
                    const items = data[cat.key] as EmpleadoResumenItem[];
                    return (
                      <FolderCard key={cat.key} label={cat.label} color={cat.color}
                        sublabel={`${items.length} colaborador${items.length !== 1 ? "es" : ""}`}
                        onClick={() => setView({ type: "reg-category", year: view.year, catKey: cat.key, catLabel: cat.label, tab: cat.tab })} />
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* ══ REG-CATEGORY (employees) ══ */}
      {view.type === "reg-category" && (() => {
        const data = yearCache[view.year];
        if (!data) return null;
        const items = data[view.catKey] as EmpleadoResumenItem[];
        if (items.length === 0) {
          return (
            <div className="rounded-2xl border border-slate-100 bg-white px-8 py-12 text-center">
              <p className="text-sm text-slate-400">Sin registros en esta categoría.</p>
            </div>
          );
        }
        return (
          <div className="space-y-2">
            {items.map((item) => (
              <EmployeeCard key={item.empleado_id} item={item} tab={view.tab} onNavigate={handleNavigateEmployee} />
            ))}
          </div>
        );
      })()}

      {/* ══ DOCS-AREA ══ */}
      {view.type === "docs-area" && (
        <>
          {loadingDocs && (
            <div className="flex justify-center py-20">
              <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#312C85]" />
            </div>
          )}
          {!loadingDocs && docs.length === 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white px-8 py-16 text-center">
              <p className="text-slate-400 text-sm mb-3">No hay documentos en esta área.</p>
              <button type="button" onClick={() => setUploadModal(true)}
                className="rounded-xl bg-[#312C85] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4038a0] transition-colors">
                Subir el primero
              </button>
            </div>
          )}
          {!loadingDocs && docs.length > 0 && (
            <div className="space-y-2">
              {docs.map((doc) => (
                <DocRow key={doc.id} doc={doc} onDelete={() => setDocs((prev) => prev.filter((d) => d.id !== doc.id))} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ══ Modals ══ */}
      {areaModal.open && (
        <AreaModal
          initial={areaModal.editing}
          onSave={handleSaveArea}
          onClose={() => setAreaModal({ open: false })}
        />
      )}
      {uploadModal && view.type === "docs-area" && (
        <UploadModal
          areaId={view.area.id}
          onUploaded={(doc) => setDocs((prev) => [doc, ...prev])}
          onClose={() => setUploadModal(false)}
        />
      )}
    </div>
  );
}
