import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import type { DevelopmentImage, DevelopmentRecord } from "@/interfaces/development.interface";
import { getDevelopment } from "../services/developments.api";
import { getFriendlyDevelopmentError } from "../utils/developmentErrors";
import { DevelopmentVisitsList } from "./DevelopmentVisitsList";
import {
  calculateFinalPrice,
  formatCurrency,
  formatDate,
  formatFullDireccion,
  getFullImageUrl,
  getMeaningfulCommercialSchemes,
  getPropertyStatusStyles,
} from "../utils/formatters";
import { getFeatureIcon } from "../utils/featureIcons";
import { DownloadDevelopmentPdfButton } from "../utils/DownloadDevelopmentPdfButton";

function sanitizeFileNamePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function getImageExtension(url: string) {
  try {
    const path = new URL(url, window.location.origin).pathname;
    const match = path.match(/\.([a-zA-Z0-9]+)$/);
    return match?.[1] ?? "jpg";
  } catch {
    const match = url.match(/\.([a-zA-Z0-9]+)$/);
    return match?.[1] ?? "jpg";
  }
}

function formatModelFeatures(model: DevelopmentRecord["modelos"][number]) {
  return Object.entries(model.caracteristicas ?? {})
    .filter(([, value]) => typeof value === "boolean" && value)
    .map(([key]) => key);
}

function flattenDevelopmentImages(development: DevelopmentRecord) {
  const generalImages = (development.imagenes ?? []).map((image, index) => ({
    ...image,
    scope: "general" as const,
    fileKey: `general-${index}`,
  }));

  const modelImages = (development.modelos ?? []).flatMap((model, modelIndex) =>
    (model.imagenes ?? []).map((image, imageIndex) => ({
      ...image,
      scope: "model" as const,
      modelName: model.nombre,
      fileKey: `model-${modelIndex}-${imageIndex}`,
    })),
  );

  return [...generalImages, ...modelImages];
}

export function DevelopmentDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [development, setDevelopment] = useState<DevelopmentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingImages, setIsDownloadingImages] = useState(false);
  const [downloadingModelKey, setDownloadingModelKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "visitas">("info");

  useEffect(() => {
    let isMounted = true;

    async function loadDevelopment() {
      if (!id) {
        setError("No se encontró el desarrollo solicitado.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getDevelopment(Number(id));
        if (isMounted) setDevelopment(data);
      } catch (err) {
        if (isMounted) {
          setError(getFriendlyDevelopmentError(err, "load_detail"));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDevelopment();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const galleryImages = useMemo(() => {
    if (!development) return [];

    return (development.imagenes ?? []).map((image) => ({
      ...image,
      url: getFullImageUrl(image.url),
    }));
  }, [development]);

  const allDownloadableImages = useMemo(() => {
    if (!development) return [];

    return flattenDevelopmentImages(development).map((image) => ({
      ...image,
      url: getFullImageUrl(image.url),
    }));
  }, [development]);

  async function handleDownloadAllImages() {
    if (!development || allDownloadableImages.length === 0 || isDownloadingImages) {
      return;
    }

    setIsDownloadingImages(true);

    try {
      const zip = new JSZip();
      const slugBase =
        development.slug?.trim() || `desarrollo-${development.id ?? "detalle"}`;

      for (const image of allDownloadableImages) {
        const response = await fetch(image.url);
        if (!response.ok) {
          throw new Error("No fue posible descargar una o más imágenes.");
        }

        const blob = await response.blob();
        const extension = getImageExtension(image.url);
        const safeTitle = sanitizeFileNamePart(image.titulo || image.fileKey);
        const prefix =
          image.scope === "model"
            ? sanitizeFileNamePart(image.modelName || "modelo")
            : "general";
        const fileName = `${sanitizeFileNamePart(slugBase)}-${prefix}-${safeTitle}.${extension}`;

        zip.file(fileName, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `${sanitizeFileNamePart(development.slug)}-imagenes.zip`);
    } finally {
      setIsDownloadingImages(false);
    }
  }

  async function handleDownloadGeneralGallery() {
    if (!development || galleryImages.length === 0 || isDownloadingImages) {
      return;
    }

    setIsDownloadingImages(true);

    try {
      const zip = new JSZip();
      const slugBase =
        development.slug?.trim() || `desarrollo-${development.id ?? "detalle"}`;

      for (const [index, image] of galleryImages.entries()) {
        const response = await fetch(image.url);
        if (!response.ok) {
          throw new Error("No fue posible descargar una o más imágenes.");
        }

        const blob = await response.blob();
        const extension = getImageExtension(image.url);
        const safeTitle = sanitizeFileNamePart(image.titulo || `general-${index + 1}`);
        const fileName = `${sanitizeFileNamePart(slugBase)}-general-${safeTitle}.${extension}`;

        zip.file(fileName, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `${sanitizeFileNamePart(slugBase)}-galeria-desarrollo.zip`);
    } finally {
      setIsDownloadingImages(false);
    }
  }

  async function handleDownloadModelGallery(
    model: DevelopmentRecord["modelos"][number],
    modelImages: Array<DevelopmentImage & { url: string }>,
    index: number,
  ) {
    const modelKey = String(model.id ?? index);
    if (!development || modelImages.length === 0 || downloadingModelKey) {
      return;
    }

    setDownloadingModelKey(modelKey);

    try {
      const zip = new JSZip();
      const slugBase =
        development.slug?.trim() || `desarrollo-${development.id ?? "detalle"}`;
      const modelName = sanitizeFileNamePart(model.nombre || `modelo-${index + 1}`);

      for (const [imageIndex, image] of modelImages.entries()) {
        const response = await fetch(image.url);
        if (!response.ok) {
          throw new Error("No fue posible descargar una o más imágenes.");
        }

        const blob = await response.blob();
        const extension = getImageExtension(image.url);
        const safeTitle = sanitizeFileNamePart(
          image.titulo || `${modelName}-${imageIndex + 1}`,
        );
        const fileName = `${sanitizeFileNamePart(slugBase)}-${modelName}-${safeTitle}.${extension}`;

        zip.file(fileName, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `${sanitizeFileNamePart(slugBase)}-${modelName}-imagenes.zip`);
    } finally {
      setDownloadingModelKey(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center">
        <p className="font-medium text-red-500">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-indigo-600 hover:underline"
        >
          Volver atrás
        </button>
      </div>
    );
  }

  if (!development) return null;

  const statusStyle = getPropertyStatusStyles(development.estatus);
  const developmentSchemes = getMeaningfulCommercialSchemes(development);

  return (
    <div className="mx-auto min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-1 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Volver a desarrollos
        </button>

        <DownloadDevelopmentPdfButton
          development={development}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 sm:w-auto"
        >
          {(loading) => (
            <>
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                  <span>Generando ficha...</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Generar ficha técnica
                </>
              )}
            </>
          )}
        </DownloadDevelopmentPdfButton>
      </div>

      <div className="mb-6 flex space-x-8 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("info")}
          className={`relative pb-4 text-sm font-bold transition-colors ${
            activeTab === "info"
              ? "text-indigo-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Informacion del desarrollo
          {activeTab === "info" ? (
            <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-t-full bg-indigo-600" />
          ) : null}
        </button>
        <button
          onClick={() => setActiveTab("visitas")}
          className={`relative pb-4 text-sm font-bold transition-colors ${
            activeTab === "visitas"
              ? "text-indigo-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Historial de visitas
          {activeTab === "visitas" ? (
            <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-t-full bg-indigo-600" />
          ) : null}
        </button>
      </div>

      {activeTab === "visitas" ? (
        <DevelopmentVisitsList developmentId={development.id} />
      ) : (
      <>
      <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-6 sm:px-8">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h1 className="w-full break-words text-2xl font-extrabold uppercase tracking-tight text-slate-900 sm:text-3xl md:w-auto">
              {development.titulo}
            </h1>

            <span
              className="whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wide shadow-sm sm:text-sm"
              style={{
                backgroundColor: statusStyle.backgroundColor,
                color: statusStyle.color,
                borderColor: `${statusStyle.color}40`,
              }}
            >
              {development.estatus}
            </span>
          </div>

          {developmentSchemes.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3">
            {developmentSchemes.map((esquema, idx) => {
              const { finalPrice, originalPrice, hasDiscount, discountPercentage } =
                calculateFinalPrice(esquema.precio, esquema.descuento_cantidad);

              return (
                <div
                  key={`${esquema.tipo_operacion}-${idx}`}
                  className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-3"
                >
                  <span className="min-w-[120px] text-sm font-bold uppercase tracking-widest text-slate-500">
                    {esquema.tipo_operacion}:
                  </span>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <p className="text-3xl font-black text-indigo-700 sm:text-4xl">
                      {formatCurrency(finalPrice)}
                    </p>
                    {hasDiscount ? (
                      <>
                        <span className="text-lg font-semibold text-slate-400 line-through decoration-2 sm:text-xl">
                          {formatCurrency(originalPrice)}
                        </span>
                        <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-black tracking-wider text-green-700">
                          -{discountPercentage}% OFF
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          ) : null}
        </div>

        <div className="space-y-8 p-6 sm:p-8">
          <div className="space-y-8 min-w-0">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 sm:text-sm">
                  Dirección
                </p>
                {development.enlace_direccion ? (
                  <a
                    href={development.enlace_direccion}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-md bg-blue-50 p-2 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700"
                  >
                    Ver en Google Maps
                  </a>
                ) : null}
              </div>
              <p className="flex items-start gap-2 text-base font-medium text-slate-800 sm:text-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mt-0.5 h-5 w-5 shrink-0 text-slate-500 sm:h-6 sm:w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {formatFullDireccion(development.direccion)}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500 sm:text-sm">
                  Tipo
                </p>
                <p className="text-base font-semibold text-slate-900 sm:text-lg">
                  {development.tipo_inmueble}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500 sm:text-sm">
                  Entrega
                </p>
                <p className="text-base font-semibold text-slate-900 sm:text-lg">
                  {development.entrega_inmediata
                    ? "Inmediata"
                    : development.fecha_entrega
                      ? formatDate(development.fecha_entrega)
                      : "Por definir"}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500 sm:text-sm">
                  Modelos
                </p>
                <p className="text-base font-semibold text-slate-900 sm:text-lg">
                  {development.modelos?.length ?? 0}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500 sm:text-sm">
                  Registro
                </p>
                <p className="text-base font-semibold text-slate-900 sm:text-lg">
                  {formatDate(development.creado_en)}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500 sm:text-sm">
                Medidas generales
              </h4>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase text-slate-500 sm:text-xs">
                    Terreno
                  </p>
                  <p className="text-base font-black text-slate-900 sm:text-lg">
                    {development.medidas?.terreno_m2 ?? 0} m²
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase text-slate-500 sm:text-xs">
                    Construcción
                  </p>
                  <p className="text-base font-black text-slate-900 sm:text-lg">
                    {development.medidas?.construccion_m2 ?? 0} m²
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase text-slate-500 sm:text-xs">
                    Pisos
                  </p>
                  <p className="text-base font-black text-slate-900 sm:text-lg">
                    {development.pisos_tiene ?? 0}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase text-slate-500 sm:text-xs">
                    Cuota mant.
                  </p>
                  <p className="text-base font-black text-slate-900 sm:text-lg">
                    {development.cuota_mantenimiento
                      ? formatCurrency(development.cuota_mantenimiento)
                      : "No aplica"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
              <div className="min-w-0 self-start rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 border-b border-slate-200 pb-4 text-lg font-bold text-slate-900">
                  Descripción general
                </h3>
                <p className="whitespace-pre-line text-sm font-medium leading-8 text-slate-700 sm:text-base">
                  {development.descripcion || "Sin descripción proporcionada."}
                </p>
                {development.amenidades ? (
                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <h4 className="mb-2 text-xs font-bold uppercase text-slate-500 sm:text-sm">
                      Amenidades principales
                    </h4>
                    <p className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm font-medium leading-7 text-slate-800 sm:text-base">
                      {development.amenidades}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="min-w-0 self-start rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 border-b border-slate-200 pb-4 text-lg font-bold text-slate-900">
                  Detalles adicionales
                </h3>
                <div className="space-y-6">
                  {development.servicios_instalaciones ? (
                    <div>
                      <h4 className="mb-2 text-xs font-bold uppercase text-slate-500 sm:text-sm">
                        Servicios e instalaciones
                      </h4>
                      <p className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm font-medium leading-7 text-slate-800 sm:text-base">
                        {development.servicios_instalaciones}
                      </p>
                    </div>
                  ) : null}
                  {development.comentarios ? (
                    <div>
                      <h4 className="mb-2 text-xs font-bold uppercase text-slate-500 sm:text-sm">
                        Comentarios internos
                      </h4>
                      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium italic leading-7 text-slate-700 sm:text-base">
                        {development.comentarios}
                      </p>
                    </div>
                  ) : null}
                  {!development.servicios_instalaciones && !development.comentarios ? (
                    <p className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm font-medium italic leading-7 text-slate-500">
                      No hay detalles adicionales registrados.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-4xl flex-col items-center rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="mb-6 w-full text-left text-xs font-bold uppercase tracking-wider text-slate-500">
              Registrado por
            </p>

            <div className="mb-5 h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-slate-200 bg-white shadow-md sm:h-32 sm:w-32">
              {development.creador?.foto_url ? (
                <img
                  src={getFullImageUrl(development.creador.foto_url)}
                  alt={`Foto de ${development.creador.nombres}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 text-3xl font-bold text-slate-400 sm:text-4xl">
                  {development.creador?.nombres?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
            </div>

            <p className="text-lg font-extrabold leading-tight text-slate-900 sm:text-xl">
              {development.creador?.nombres} {development.creador?.apellido_paterno}{" "}
              {development.creador?.apellido_materno}
            </p>
            <p className="mt-2 w-fit break-all rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm sm:text-sm">
              {development.creador?.correo_electronico}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="border-b border-slate-200 pb-4 text-lg font-bold text-slate-900 sm:text-xl">
            Galería del desarrollo
          </h3>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleDownloadGeneralGallery}
              disabled={isDownloadingImages || galleryImages.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDownloadingImages ? "Descargando..." : "Descargar galeria"}
            </button>

            <button
              type="button"
              onClick={handleDownloadAllImages}
              disabled={isDownloadingImages || allDownloadableImages.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDownloadingImages ? "Descargando..." : "Descargar todo"}
            </button>
          </div>
        </div>

        {galleryImages.length > 0 ? (
          <div
            className="relative w-full overflow-hidden rounded-xl bg-slate-100"
            style={{ minHeight: "300px" }}
          >
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              navigation
              pagination={{ clickable: true, dynamicBullets: true }}
              autoplay={{ delay: 4000, disableOnInteraction: false }}
              spaceBetween={16}
              slidesPerView={1}
              breakpoints={{
                640: { slidesPerView: 2, spaceBetween: 20 },
                1024: { slidesPerView: 3, spaceBetween: 24 },
                1280: { slidesPerView: 4, spaceBetween: 24 },
              }}
              className="h-full min-h-[300px] w-full pb-12"
            >
              {galleryImages.map((img, index) => (
                <SwiperSlide key={index}>
                  <div className="group relative h-[250px] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm sm:h-[300px]">
                    <img
                      src={img.url}
                      alt={img.titulo || `Vista del desarrollo ${index + 1}`}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500"
                      loading="lazy"
                    />
                    {img.titulo ? (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 to-transparent px-4 py-3">
                        <p className="text-sm font-semibold text-white">
                          {img.titulo}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        ) : (
          <p className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-center text-sm font-medium italic text-slate-500">
            Este desarrollo aún no tiene imágenes generales.
          </p>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Modelos del desarrollo</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Aquí puedes revisar el detalle comercial, distribución e imágenes de cada
            modelo cargado en el desarrollo.
          </p>
        </div>

        {development.modelos?.length ? (
          development.modelos.map((model, index) => {
            const modelImages: DevelopmentImage[] = (model.imagenes ?? []).map((image) => ({
              ...image,
              url: getFullImageUrl(image.url),
            }));
            const booleanFeatures = formatModelFeatures(model);

            return (
              <section
                key={model.id ?? index}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
              >
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Modelo {index + 1}
                    </p>
                    <h4 className="mt-2 text-2xl font-bold text-slate-900">
                      {model.nombre}
                    </h4>
                    {model.descripcion ? (
                      <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 text-slate-600">
                        {model.descripcion}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Operaciones
                    </p>
                    <p className="text-base font-semibold text-slate-900">
                      {model.esquema_comercial.map((item) => item.tipo_operacion).join(" / ")}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Tipos de pago
                    </p>
                    <p className="text-base font-semibold text-slate-900">
                      {model.tipos_pago?.length ? model.tipos_pago.join(", ") : "No especificados"}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Medidas
                    </p>
                    <p className="text-base font-semibold text-slate-900">
                      Terreno {model.medidas?.terreno_m2 ?? 0} m² / Construcción{" "}
                      {model.medidas?.construccion_m2 ?? 0} m²
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Distribución
                    </p>
                    <p className="text-base font-semibold text-slate-900">
                      {model.caracteristicas?.recamaras ?? 0} rec,{" "}
                      {model.caracteristicas?.banos ?? 0} baños,{" "}
                      {model.caracteristicas?.estacionamiento ?? 0} est.
                    </p>
                  </div>
                </div>

                <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <h5 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500 sm:text-sm">
                    Esquema comercial del modelo
                  </h5>
                  <div className="space-y-4">
                    {model.esquema_comercial.map((scheme, schemeIndex) => {
                      const {
                        finalPrice,
                        originalPrice,
                        hasDiscount,
                        discountPercentage,
                      } = calculateFinalPrice(scheme.precio, scheme.descuento_cantidad);

                      return (
                        <div
                          key={`${scheme.tipo_operacion}-${schemeIndex}`}
                          className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              {scheme.tipo_operacion}
                            </p>
                            <div className="mt-2 flex flex-wrap items-baseline gap-3">
                              <p className="text-2xl font-black text-indigo-700">
                                {formatCurrency(finalPrice)}
                              </p>
                              {hasDiscount ? (
                                <>
                                  <span className="text-base font-semibold text-slate-400 line-through">
                                    {formatCurrency(originalPrice)}
                                  </span>
                                  <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-black tracking-wider text-green-700">
                                    -{discountPercentage}% OFF
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  <div>
                    <h5 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500 sm:text-sm">
                      Características adicionales
                    </h5>
                    {booleanFeatures.length ? (
                      <div className="flex flex-wrap gap-4">
                        {booleanFeatures.map((feature) => (
                          <div
                            key={feature}
                            className="flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-center shadow-sm sm:h-24 sm:w-24"
                          >
                            <div className="mb-1 flex h-8 w-8 items-center justify-center sm:h-10 sm:w-10">
                              {getFeatureIcon(feature)}
                            </div>
                            <span className="px-1 text-[7px] font-extrabold capitalize leading-tight text-slate-700 sm:text-[9px]">
                              {feature.replace(/_/g, " ")}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic text-slate-500">
                        Este modelo no tiene checks adicionales activos.
                      </p>
                    )}
                    {model.comentarios ? (
                      <div className="mt-6">
                        <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 sm:text-sm">
                          Comentarios del modelo
                        </h5>
                        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium italic text-slate-700">
                          {model.comentarios}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 sm:text-sm">
                        Galer?a del modelo
                      </h5>

                      <button
                        type="button"
                        onClick={() => handleDownloadModelGallery(model, modelImages, index)}
                        disabled={modelImages.length === 0 || Boolean(downloadingModelKey)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {downloadingModelKey === String(model.id ?? index)
                          ? "Descargando..."
                          : "Descargar imagenes"}
                      </button>
                    </div>
                    {modelImages.length ? (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {modelImages.map((image, imageIndex) => (
                          <div
                            key={`${model.id ?? index}-img-${imageIndex}`}
                            className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm"
                          >
                            <img
                              src={image.url}
                              alt={image.titulo || `${model.nombre} ${imageIndex + 1}`}
                              className="h-52 w-full object-cover"
                              loading="lazy"
                            />
                            {image.titulo ? (
                              <div className="border-t border-slate-200 px-4 py-3">
                                <p className="text-sm font-semibold text-slate-700">
                                  {image.titulo}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic text-slate-500">
                        Este modelo aún no tiene imágenes cargadas.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            );
          })
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm italic text-slate-500 shadow-sm">
            Este desarrollo todavía no tiene modelos registrados.
          </section>
        )}
      </div>
      </>
      )}
    </div>
  );
}
