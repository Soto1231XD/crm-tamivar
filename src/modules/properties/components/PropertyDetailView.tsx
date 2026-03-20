import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePropertiesStore } from "../store/usePropertiesStore";
import { Swiper, SwiperSlide } from "swiper/react";
import { PROPERTY_STATUS_STYLES } from "../utils/property-constants";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { formatFullDireccion, formatCurrency } from "../utils/formatters";
import { getFeatureIcon } from "../utils/featureIcons";
import { DownloadPdfButton } from "../utils/DownloadPdfButton";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const PropertyDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentProperty,
    fetchProperty,
    clearCurrentProperty,
    isLoading,
    error,
  } = usePropertiesStore();

  useEffect(() => {
    if (id) {
      fetchProperty(Number(id));
    }
    return () => clearCurrentProperty();
  }, [id, fetchProperty, clearCurrentProperty]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center">
        <p className="text-red-500 font-medium">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-indigo-600 hover:underline"
        >
          Volver atrás
        </button>
      </div>
    );
  }

  if (!currentProperty) return null;

  const statusStyle =
    PROPERTY_STATUS_STYLES[currentProperty.estatus.toLowerCase()] ||
    PROPERTY_STATUS_STYLES["disponible"];

  const imagenesFormateadas =
    currentProperty.imagenes && currentProperty.imagenes.length > 0
      ? currentProperty.imagenes.map((img) => ({
          ...img,
          url: img.url.startsWith("http")
            ? img.url
            : `${API_URL}/${img.url.replace(/^\//, "")}`,
        }))
      : [{ url: "/placeholder-image.jpg", titulo: "Sin imagen" }];

  return (
    <div className="mx-auto p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
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
          Volver a propiedades
        </button>

        {/* Botón Generar Ficha Técnica */}
        {currentProperty && (
          <DownloadPdfButton
            property={currentProperty}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {(loading) => (
              <>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generando Ficha...</span>
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
                    Generar Ficha Técnica
                  </>
                )}
              </>
            )}
          </DownloadPdfButton>
        )}
      </div>

      {/* BLOQUE PRINCIPAL (LA FICHA) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        {/* Cabecera de la ficha (Título, Estatus y PRECIO) */}
        <div className="px-6 py-6 sm:px-8 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 uppercase tracking-tight break-words w-full md:w-auto">
              {currentProperty.titulo}
            </h1>
            <span
              className="px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wide border shadow-sm whitespace-nowrap"
              style={{
                backgroundColor: statusStyle.backgroundColor,
                color: statusStyle.color,
                borderColor: `${statusStyle.color}40`,
              }}
            >
              {currentProperty.estatus}
            </span>
          </div>
          {/* Precio con label */}
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
            <span className="text-slate-500 font-bold uppercase tracking-wide text-sm">
              Precio:
            </span>
            <p className="text-3xl sm:text-4xl font-black text-indigo-700">
              {formatCurrency(currentProperty.precio)}
            </p>
          </div>
        </div>

        {/* Cuerpo principal de la ficha */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
          {/* Info Core (Izquierda y Centro) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Dirección */}
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                Dirección
              </p>
              <p className="text-base sm:text-lg text-slate-800 font-medium flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 sm:h-6 sm:w-6 text-slate-500 shrink-0 mt-0.5"
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
                {formatFullDireccion(currentProperty.direccion)}
              </p>
            </div>

            {/* Fila de Datos Clave */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Operación
                </p>
                <p className="text-base sm:text-lg font-semibold text-slate-900 capitalize">
                  {currentProperty.tipo_operacion}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Inmueble
                </p>
                <p className="text-base sm:text-lg font-semibold text-slate-900 capitalize">
                  {currentProperty.tipo_inmueble}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Registro
                </p>
                <p className="text-base sm:text-lg font-semibold text-slate-900">
                  {new Date(currentProperty.creado_en).toLocaleDateString(
                    "es-MX",
                    { year: "numeric", month: "short", day: "numeric" },
                  )}
                </p>
              </div>
            </div>

            {/* Etiquetas, Pagos y Gravamen */}
            <div className="space-y-6 pt-6 border-t border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Tipos de pago */}
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Tipos de Pago
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentProperty.tipos_pago.map((pago, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-100 text-slate-800 px-3 sm:px-4 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-semibold border border-slate-300"
                      >
                        {pago}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Etiquetas Adicionales */}
                {currentProperty.etiquetas &&
                  currentProperty.etiquetas.length > 0 && (
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Etiquetas
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {currentProperty.etiquetas.map((etiqueta, idx) => (
                          <span
                            key={idx}
                            className="bg-blue-50 text-blue-800 px-3 sm:px-4 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-semibold border border-blue-200"
                          >
                            {etiqueta}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* Gravamen */}
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Estado Legal
                </p>
                {currentProperty.tiene_gravamen ? (
                  <span className="inline-flex items-center gap-2 bg-red-50 text-red-800 px-4 py-2 rounded-md text-xs sm:text-sm font-bold border border-red-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    Tiene Gravamen
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 bg-green-50 text-green-800 px-4 py-2 rounded-md text-xs sm:text-sm font-bold border border-green-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Libre de Gravamen
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Asesor (Derecha) */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col items-center text-center justify-center h-full w-full max-w-sm mx-auto lg:max-w-none">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 w-full text-left">
              Registrado por
            </p>
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden bg-white border-4 border-slate-200 shadow-md mb-4 shrink-0">
              {currentProperty.creador.foto_url ? (
                <img
                  src={currentProperty.creador.foto_url}
                  alt="Asesor"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-3xl sm:text-4xl font-bold text-slate-400 bg-slate-100">
                  {currentProperty.creador.nombres[0]}
                </div>
              )}
            </div>
            <p className="font-extrabold text-slate-900 text-lg sm:text-xl">
              {currentProperty.creador.nombres}{" "}
              {currentProperty.creador.apellido_paterno}
            </p>
            <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1 break-all">
              {currentProperty.creador.correo_electronico}
            </p>
          </div>
        </div>
      </div>

      {/* DATOS TÉCNICOS Y FINANCIEROS ADICIONALES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Finanzas Adicionales */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-6 border-b border-slate-200 pb-4">
            Detalles Financieros
          </h3>
          <div className="space-y-4">
            {currentProperty.precio_condicionado && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 gap-2">
                <span className="text-slate-600 font-medium">
                  Precio Condicionado
                </span>
                <div className="sm:text-right w-full sm:w-auto bg-slate-50 p-3 sm:bg-transparent sm:p-0 rounded-lg">
                  <span className="font-bold text-slate-900 text-base sm:text-lg block">
                    {formatCurrency(currentProperty.precio_condicionado.monto)}
                  </span>
                  {currentProperty.precio_condicionado.descripcion && (
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      {currentProperty.precio_condicionado.descripcion}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 sm:py-2 border-t border-slate-100 gap-2">
              <span className="text-slate-600 font-medium">
                Cuota de Mantenimiento
              </span>
              <span className="font-bold text-slate-900 text-base sm:text-lg">
                {currentProperty.cuota_mantenimiento
                  ? formatCurrency(currentProperty.cuota_mantenimiento)
                  : "No especificada"}
              </span>
            </div>
          </div>
        </div>

        {/* Medidas */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-6 border-b border-slate-200 pb-4">
            Dimensiones
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 sm:border-none sm:bg-transparent sm:p-0">
              <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase">
                Terreno
              </p>
              <p className="text-lg sm:text-xl font-bold text-slate-900">
                {currentProperty.medidas.terreno_m2} m²
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 sm:border-none sm:bg-transparent sm:p-0">
              <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase">
                Construcción
              </p>
              <p className="text-lg sm:text-xl font-bold text-slate-900">
                {currentProperty.medidas.construccion_m2} m²
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 sm:border-none sm:bg-transparent sm:p-0">
              <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase">
                Frente
              </p>
              <p className="text-lg sm:text-xl font-bold text-slate-900">
                {currentProperty.medidas.frente} m
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 sm:border-none sm:bg-transparent sm:p-0">
              <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase">
                Fondo
              </p>
              <p className="text-lg sm:text-xl font-bold text-slate-900">
                {currentProperty.medidas.fondo} m
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CARACTERÍSTICAS (Contadores y Booleanos con Iconos) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-8">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-6 sm:mb-8 border-b border-slate-200 pb-4">
          Características del Inmueble
        </h3>

        {/* Contadores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10">
          <div className="bg-slate-50 p-4 sm:p-6 rounded-xl text-center border border-slate-200 shadow-sm flex flex-col justify-center">
            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-1 sm:mb-2">
              Recámaras
            </p>
            <p className="text-2xl sm:text-4xl font-black text-slate-900">
              {currentProperty.caracteristicas.recamaras}
            </p>
          </div>
          <div className="bg-slate-50 p-4 sm:p-6 rounded-xl text-center border border-slate-200 shadow-sm flex flex-col justify-center">
            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-1 sm:mb-2">
              Baños
            </p>
            <p className="text-2xl sm:text-4xl font-black text-slate-900">
              {currentProperty.caracteristicas.banos}
            </p>
          </div>
          <div className="bg-slate-50 p-4 sm:p-6 rounded-xl text-center border border-slate-200 shadow-sm flex flex-col justify-center">
            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-1 sm:mb-2">
              Estacionamiento
            </p>
            <p className="text-2xl sm:text-4xl font-black text-slate-900">
              {currentProperty.caracteristicas.estacionamiento}
            </p>
          </div>
          <div className="bg-slate-50 p-4 sm:p-6 rounded-xl text-center border border-slate-200 shadow-sm flex flex-col justify-center">
            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-1 sm:mb-2">
              Niveles / Pisos
            </p>
            <p className="text-2xl sm:text-4xl font-black text-slate-900">
              {currentProperty.pisos_tiene || 1}
            </p>
          </div>
        </div>

        {/* Booleanos*/}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {Object.entries(currentProperty.caracteristicas).map(
            ([key, value]) => {
              if (typeof value === "boolean" && value) {
                return (
                  <div
                    key={key}
                    className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm text-center hover:bg-slate-50 transition-colors"
                  >
                    {getFeatureIcon(key)}
                    <span className="text-xs sm:text-sm font-bold text-slate-700 capitalize mt-2 break-words w-full">
                      {key.replace(/_/g, " ")}
                    </span>
                  </div>
                );
              }
              return null;
            },
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Descripción + Amenidades de texto */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 h-full">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-6 border-b border-slate-200 pb-4">
            Descripción General
          </h3>
          <p className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed whitespace-pre-line mb-8">
            {currentProperty.descripcion || "Sin descripción proporcionada."}
          </p>

          {currentProperty.amenidades && (
            <div className="pt-6 border-t border-slate-100">
              <h4 className="text-xs sm:text-sm font-bold text-slate-500 uppercase mb-2">
                Amenidades de la Zona/Complejo
              </h4>
              <p className="text-sm sm:text-base text-slate-800 font-medium bg-slate-50 p-4 rounded-lg border border-slate-100">
                {currentProperty.amenidades}
              </p>
            </div>
          )}
        </div>

        {/* Otros Detalles (Servicios y Comentarios) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 h-full">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-6 border-b border-slate-200 pb-4">
            Detalles Adicionales
          </h3>
          <div className="space-y-6">
            {currentProperty.servicios_instalaciones && (
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-500 uppercase mb-2">
                  Servicios e Instalaciones
                </h4>
                <p className="text-sm sm:text-base text-slate-800 font-medium bg-slate-50 p-4 rounded-lg border border-slate-100">
                  {currentProperty.servicios_instalaciones}
                </p>
              </div>
            )}
            {currentProperty.comentarios && (
              <div className="pt-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-500 uppercase mb-2">
                  Comentarios Internos
                </h4>
                <p className="text-sm sm:text-base text-slate-700 font-medium italic bg-amber-50 p-4 rounded-lg border border-amber-200">
                  {currentProperty.comentarios}
                </p>
              </div>
            )}
            {!currentProperty.servicios_instalaciones &&
              !currentProperty.comentarios && (
                <p className="text-sm text-slate-500 font-medium italic bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                  No hay detalles adicionales registrados.
                </p>
              )}
          </div>
        </div>
      </div>

      {/* GALERÍA DE IMÁGENES */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-6 sm:mb-8 border-b border-slate-200 pb-4">
          Galería Fotográfica
        </h3>

        <div
          className="relative w-full overflow-hidden bg-slate-100 rounded-xl"
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
              640: {
                // sm
                slidesPerView: 2,
                spaceBetween: 20,
              },
              1024: {
                // lg
                slidesPerView: 3,
                spaceBetween: 24,
              },
              1280: {
                // xl
                slidesPerView: 4,
                spaceBetween: 24,
              },
            }}
            className="w-full h-full min-h-[300px] pb-12"
          >
            {imagenesFormateadas.map((img, index) => (
              <SwiperSlide key={index}>
                <div className="relative w-full h-[250px] sm:h-[300px] rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-100 group">
                  <img
                    src={img.url}
                    alt={img.titulo || `Vista de la propiedad ${index + 1}`}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
};