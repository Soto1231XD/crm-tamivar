import { useState, useRef } from "react";
import toast from "react-hot-toast";
import {
  createPublicacion,
  validarPublicacion,
  deletePublicacion,
  type Publicacion,
} from "../services/evaluacion.api";
import { fullName, fmtDate, API_URL, META_PUBLICACIONES } from "../utils/evaluacion.helpers";

export function PublicacionesTab({
  publicaciones,
  onCreated,
  onDeleted,
  onValidated,
  currentUserId,
  canSeeAll,
  mes,
  anio,
}: {
  publicaciones: Publicacion[];
  onCreated: (p: Publicacion) => void;
  onDeleted: (id: number) => void;
  onValidated: (p: Publicacion) => void;
  currentUserId: number;
  canSeeAll: boolean;
  mes: number;
  anio: number;
}) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [urlPublicacion, setUrlPublicacion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [busqueda, setBusqueda] = useState("");

  const hoy = new Date();
  const propias = canSeeAll ? [] : publicaciones;
  const publicacionesMes = propias.filter((p) => {
    const d = new Date(p.creado_en);
    return d.getMonth() + 1 === mes && d.getFullYear() === anio;
  });
  const yaSubiHoy = propias.some((p) => {
    const d = new Date(p.creado_en);
    return d.toDateString() === hoy.toDateString();
  });

  const publicacionesFiltradas = canSeeAll && busqueda.trim()
    ? publicaciones.filter((p) =>
        fullName(p.usuario).toLowerCase().includes(busqueda.trim().toLowerCase())
      )
    : publicaciones;

  const handleUpload = async () => {
    if (!titulo || !file) {
      toast.error("Título y archivo son requeridos.");
      return;
    }
    setSaving(true);
    try {
      const created = await createPublicacion(titulo, descripcion, file, urlPublicacion || undefined);
      onCreated(created);
      setTitulo("");
      setDescripcion("");
      setUrlPublicacion("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Publicación subida.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al subir publicación.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePublicacion(id);
      onDeleted(id);
      toast.success("Publicación eliminada.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al eliminar.");
    }
  };

  const handleValidar = async (id: number, estado: 'aceptado' | 'rechazado') => {
    try {
      const updated = await validarPublicacion(id, estado);
      onValidated(updated);
      toast.success(estado === 'aceptado' ? "Publicación aceptada." : "Publicación rechazada.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al validar.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[var(--crm-text)]">Subir evidencia de publicación</p>
          {!canSeeAll && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--crm-text-soft)]">Este mes:</span>
              <span className={`text-sm font-bold ${
                publicacionesMes.length >= META_PUBLICACIONES ? "text-green-600" :
                publicacionesMes.length >= Math.floor(META_PUBLICACIONES * 0.6) ? "text-amber-500" :
                "text-[var(--crm-text)]"
              }`}>
                {publicacionesMes.length}/{META_PUBLICACIONES}
              </span>
            </div>
          )}
        </div>
        {!canSeeAll && yaSubiHoy && (
          <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm text-amber-700 font-medium">
            Ya subiste tu publicación de hoy. Vuelve mañana.
          </div>
        )}
        <div className={`space-y-3 ${!canSeeAll && yaSubiHoy ? "opacity-50 pointer-events-none" : ""}`}>
          <input
            placeholder="Título de la publicación *"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full rounded-xl border border-[var(--crm-border-strong)] bg-[var(--crm-surface-soft)] px-3 py-2.5 text-sm text-[var(--crm-text)] outline-none focus:border-[var(--crm-primary)] focus:ring-2 focus:ring-[var(--crm-primary-soft)]"
          />
          <input
            placeholder="Descripción (opcional)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full rounded-xl border border-[var(--crm-border-strong)] bg-[var(--crm-surface-soft)] px-3 py-2.5 text-sm text-[var(--crm-text)] outline-none focus:border-[var(--crm-primary)] focus:ring-2 focus:ring-[var(--crm-primary-soft)]"
          />
          <input
            placeholder="URL de la publicación (ej. https://facebook.com/...)"
            value={urlPublicacion}
            onChange={(e) => setUrlPublicacion(e.target.value)}
            className="w-full rounded-xl border border-[var(--crm-border-strong)] bg-[var(--crm-surface-soft)] px-3 py-2.5 text-sm text-[var(--crm-text)] outline-none focus:border-[var(--crm-primary)] focus:ring-2 focus:ring-[var(--crm-primary-soft)]"
          />
          <div
            className="flex items-center gap-3 rounded-xl border border-dashed border-[var(--crm-border-strong)] bg-[var(--crm-surface-soft)] px-3 py-2.5 cursor-pointer hover:border-[var(--crm-primary)] transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <span className="rounded-lg bg-[var(--crm-primary-soft)] px-3 py-1 text-xs font-medium text-[var(--crm-primary)] whitespace-nowrap">
              Elegir imagen
            </span>
            <span className="text-sm text-[var(--crm-text-soft)] truncate">
              {file ? file.name : "Sin archivo seleccionado"}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </div>
          <button
            type="button"
            onClick={handleUpload}
            disabled={saving}
            className="rounded-xl bg-[var(--crm-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-80 disabled:opacity-50"
          >
            {saving ? "Subiendo..." : "Subir"}
          </button>
        </div>
      </div>

      {canSeeAll && (
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--crm-text-soft)]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
              <circle cx="11" cy="11" r="6.25" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Buscar por asesor..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-xl border border-[var(--crm-border-strong)] bg-[var(--crm-surface-soft)] pl-10 pr-3 py-2.5 text-sm text-[var(--crm-text)] outline-none transition placeholder:text-[var(--crm-text-soft)] focus:border-[var(--crm-primary)] focus:bg-[var(--crm-surface)] focus:ring-2 focus:ring-[var(--crm-primary-soft)]"
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {publicacionesFiltradas.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-[var(--crm-text-soft)]">
            {canSeeAll && busqueda.trim() ? `Sin publicaciones de "${busqueda}".` : "Sin publicaciones."}
          </p>
        )}
        {publicacionesFiltradas.map((p) => (
          <div key={p.id} className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] shadow-sm overflow-hidden">
            {p.url_publicacion ? (
              <a href={p.url_publicacion} target="_blank" rel="noopener noreferrer" className="block relative group">
                <img
                  src={`${API_URL}/${p.archivo_url}`}
                  alt={p.titulo}
                  className="h-40 w-full object-cover transition-opacity group-hover:opacity-80"
                />
                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white">Ver publicación ↗</span>
                </span>
              </a>
            ) : (
              <img
                src={`${API_URL}/${p.archivo_url}`}
                alt={p.titulo}
                className="h-40 w-full object-cover"
              />
            )}
            <div className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm text-[var(--crm-text)]">{p.titulo}</p>
                <span className={`shrink-0 text-xs font-semibold rounded-full px-2 py-0.5 ${
                  p.estado_validacion === 'aceptado'  ? 'bg-green-100 text-green-700' :
                  p.estado_validacion === 'rechazado' ? 'bg-red-100 text-red-600'    :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {p.estado_validacion === 'aceptado' ? 'Aceptado' : p.estado_validacion === 'rechazado' ? 'Rechazado' : 'Pendiente'}
                </span>
              </div>
              {p.descripcion && (
                <p className="text-xs text-[var(--crm-text-soft)] line-clamp-2">{p.descripcion}</p>
              )}
              {p.url_publicacion && (
                <a
                  href={p.url_publicacion}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[var(--crm-primary)] hover:underline truncate max-w-full"
                >
                  Ver publicación →
                </a>
              )}
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-xs text-[var(--crm-text-soft)]">
                  {canSeeAll ? fullName(p.usuario) + " · " : ""}{fmtDate(p.creado_en)}
                </span>
                <div className="flex items-center gap-2">
                  {canSeeAll && p.estado_validacion !== 'aceptado' && (
                    <button
                      type="button"
                      onClick={() => handleValidar(p.id, 'aceptado')}
                      className="text-xs font-medium text-green-600 hover:text-green-800"
                    >
                      Aceptar
                    </button>
                  )}
                  {canSeeAll && p.estado_validacion !== 'rechazado' && (
                    <button
                      type="button"
                      onClick={() => handleValidar(p.id, 'rechazado')}
                      className="text-xs font-medium text-red-400 hover:text-red-600"
                    >
                      Rechazar
                    </button>
                  )}
                  {(canSeeAll || p.usuario.id === currentUserId) && (
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="text-xs text-[var(--crm-text-soft)] hover:text-red-500"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
