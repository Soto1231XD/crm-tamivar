import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { BlogImageRecord } from "@/interfaces/blog.interface";
import { getFullImageUrl } from "@/shared/utils/imageUrl";
import { useHasPermission } from "@/shared/auth/permissions/useHasPermission";
import { useContentStore } from "../store/useContentStore";

const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function ContentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = useHasPermission();
  const canEdit = can("blogs", "actualizar");
  const { currentBlog, isLoading, fetchBlog, clearCurrentBlog } = useContentStore();

  useEffect(() => {
    if (id) void fetchBlog(Number(id));
    return () => { clearCurrentBlog(); };
  }, [id, fetchBlog, clearCurrentBlog]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#312C85]" />
      </div>
    );
  }

  if (!currentBlog) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-16 text-center text-sm text-slate-600">
        <p className="font-semibold text-slate-700">No encontrado</p>
        <p className="mt-1">No se pudo cargar el contenido solicitado.</p>
        <button
          type="button"
          onClick={() => navigate("/modulos/blogs")}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#312C85] px-4 py-2 text-sm font-semibold text-white"
        >
          Regresar
        </button>
      </div>
    );
  }

  // Asesores sin permiso de editar no pueden ver capacitaciones en borrador
  if (currentBlog.tipo === "Capacitación" && !currentBlog.publicado && !canEdit) {
    navigate("/modulos/blogs", { replace: true });
    return null;
  }

  const images: BlogImageRecord[] = Array.isArray(currentBlog.imagenes) ? currentBlog.imagenes : [];
  const heroImage = images.find((img) => img.principal) ?? images[0] ?? null;
  const isCapacitacion = currentBlog.tipo === "Capacitación";
  const autorNombre = currentBlog.autor
    ? [currentBlog.autor.nombres, currentBlog.autor.apellido_paterno, currentBlog.autor.apellido_materno]
        .filter(Boolean)
        .join(" ")
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      {/* Boton regresar */}
      <button
        type="button"
        onClick={() => navigate("/modulos/blogs")}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Regresar al listado
      </button>

      {/* Encabezado */}
      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {heroImage && (
          <img
            src={getFullImageUrl(heroImage.url)}
            alt={currentBlog.titulo}
            className="h-64 w-full object-cover"
          />
        )}
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                isCapacitacion
                  ? "bg-amber-100 text-amber-700"
                  : "bg-indigo-100 text-indigo-700"
              }`}
            >
              {currentBlog.tipo ?? "Blog"}
            </span>
            {isCapacitacion && (
              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                Contenido interno
              </span>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-black leading-tight tracking-tight text-slate-900">
            {currentBlog.titulo}
          </h1>
          <p className="mt-2 text-base font-semibold text-[#4338CA]">
            {currentBlog.subtitulo}
          </p>

          {currentBlog.resumen && (
            <p className="mt-3 text-sm leading-6 text-slate-600">{currentBlog.resumen}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
            {autorNombre && (
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {autorNombre}
              </span>
            )}
            {currentBlog.fechaPublico && (
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(currentBlog.fechaPublico).toLocaleDateString("es-MX", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
          </div>

          {Array.isArray(currentBlog.etiquetas) && currentBlog.etiquetas.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {currentBlog.etiquetas.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Archivo adjunto (Capacitacion) */}
      {isCapacitacion && currentBlog.archivo_url && (
        <ArchivoViewer archivoUrl={currentBlog.archivo_url} apiUrl={VITE_API_URL} />
      )}

      {/* Contenido */}
      {currentBlog.contenido && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Contenido
          </h2>
          <div className="space-y-4 text-sm leading-7 text-slate-700">
            {renderContent(currentBlog.contenido, images)}
          </div>
        </div>
      )}

      {/* Galeria de imagenes restantes */}
      {images.length > 1 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Galeria
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {images.slice(1).map((img, idx) => (
              <img
                key={idx}
                src={getFullImageUrl(img.url)}
                alt={img.titulo || `Imagen ${idx + 2}`}
                className="h-48 w-full rounded-xl object-cover"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ArchivoViewer({ archivoUrl, apiUrl }: { archivoUrl: string; apiUrl: string }) {
  const fileUrl = `${apiUrl}/${archivoUrl}`;
  const fileName = archivoUrl.split("/").pop() ?? "Archivo adjunto";
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const isPdf = ext === "pdf";

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!isPdf) return;
    let objectUrl: string | null = null;

    fetch(fileUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar el archivo");
        return res.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => setLoadError(true));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileUrl, isPdf]);

  const downloadLink = (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      download
      className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
    >
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Descargar
    </a>
  );

  if (isPdf) {
    return (
      <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-amber-100 bg-amber-50 px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">Material de apoyo</p>
              <p className="truncate text-xs text-slate-500">{fileName}</p>
            </div>
          </div>
          {downloadLink}
        </div>

        {loadError ? (
          <div className="flex h-32 items-center justify-center text-sm text-slate-500">
            No se pudo cargar la vista previa. Usa el botón de descarga.
          </div>
        ) : blobUrl ? (
          <iframe
            src={`${blobUrl}#toolbar=1&navpanes=0`}
            title={fileName}
            className="h-[620px] w-full"
          />
        ) : (
          <div className="flex h-32 items-center justify-center gap-2 text-sm text-slate-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-amber-500" />
            Cargando vista previa...
          </div>
        )}
      </div>
    );
  }

  // PPTX u otro formato — solo descarga
  const typeLabel: Record<string, string> = {
    pptx: "Presentación PowerPoint",
    ppt: "Presentación PowerPoint",
    docx: "Documento Word",
    doc: "Documento Word",
  };

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-amber-100 bg-amber-50 p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">
          {typeLabel[ext] ?? "Material de apoyo"}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500">{fileName}</p>
        <p className="mt-1 text-xs text-slate-400">
          Vista previa no disponible para este formato. Descargalo para verlo.
        </p>
      </div>
      {downloadLink}
    </div>
  );
}

function renderContent(content: string, images: BlogImageRecord[]) {
  const parts = content.split(/(\[imagen:\d+\])/g);

  return parts.map((part, idx) => {
    const match = part.match(/^\[imagen:(\d+)\]$/);
    if (match) {
      const imageIndex = parseInt(match[1], 10) - 1;
      const image = images[imageIndex];
      if (!image) return null;
      return (
        <img
          key={idx}
          src={getFullImageUrl(image.url)}
          alt={image.titulo || `Imagen ${imageIndex + 1}`}
          className="my-2 w-full rounded-xl object-cover"
        />
      );
    }
    if (!part.trim()) return null;
    return (
      <p key={idx} className="whitespace-pre-wrap">
        {part}
      </p>
    );
  });
}
