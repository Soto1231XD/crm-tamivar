import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePropertiesStore } from "../store/usePropertiesStore";
import { Swiper, SwiperSlide } from "swiper/react";
import { PROPERTY_STATUS_STYLES } from "../utils/property-constants";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import {
  formatFullDireccion,
  formatCurrency,
  calculateFinalPrice,
  formatDate,
  getFullImageUrl
} from "../utils/formatters";
import { getFeatureIcon } from "../utils/featureIcons";
import { DownloadPdfButton } from "../utils/DownloadPdfButton";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

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
        url: getFullImageUrl(img.url),
        }))
      : [{ url: "/placeholder-image.jpg", titulo: "Sin imagen" }];

  return (
    <div className="mx-auto p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
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

          <div className="flex flex-col gap-3 mt-4">
            {currentProperty.esquema_comercial.map((esquema, idx) => {
              const {
                hasDiscount,
                finalPrice,
                originalPrice,
                discountPercentage,
              } = calculateFinalPrice(
                esquema.precio,
                esquema.descuento_cantidad,
              );

              return (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3"
                >
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-sm min-w-[80px]">
                    {esquema.tipo_operacion}:
                  </span>
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <p className="text-3xl sm:text-4xl font-black text-indigo-700">
                      {formatCurrency(finalPrice)}
                    </p>
                    {/* Precio original tachado si hay descuento */}
                    {hasDiscount && (
                      <span className="text-lg sm:text-xl text-slate-400 line-through font-semibold decoration-2">
                        {formatCurrency(originalPrice)}
                      </span>
                    )}
                    {/* Badge de porcentaje de descuento */}
                    {hasDiscount && (
                      <span className="bg-green-100 text-green-700 text-xs font-black px-2 py-1 rounded-md tracking-wider ml-1 sm:ml-2">
                        -{discountPercentage}% OFF
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cuerpo principal de la ficha */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 items-start">
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
                  {currentProperty.esquema_comercial
                    .map((e) => e.tipo_operacion.toLowerCase())
                    .join(" / ")}
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
                  {formatDate(currentProperty.creado_en)}
                </p>
              </div>
            </div>

            {/* Dimensiones */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200">
              <h4 className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                Dimensiones del Inmueble
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 divide-x-0 sm:divide-x divide-slate-200">
                <div className="sm:px-4 first:pl-0">
                  <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">
                    Terreno
                  </p>
                  <p className="text-base sm:text-lg font-black text-slate-900">
                    {currentProperty.medidas.terreno_m2} m²
                  </p>
                </div>
                <div className="sm:px-4">
                  <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">
                    Construcción
                  </p>
                  <p className="text-base sm:text-lg font-black text-slate-900">
                    {currentProperty.medidas.construccion_m2} m²
                  </p>
                </div>
                <div className="sm:px-4">
                  <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">
                    Frente
                  </p>
                  <p className="text-base sm:text-lg font-black text-slate-900">
                    {currentProperty.medidas.frente} m
                  </p>
                </div>
                <div className="sm:px-4">
                  <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">
                    Fondo
                  </p>
                  <p className="text-base sm:text-lg font-black text-slate-900">
                    {currentProperty.medidas.fondo} m
                  </p>
                </div>
              </div>
            </div>

            {/* Etiquetas, Pagos y Gravamen */}
            <div className="space-y-6 pt-6 border-t border-slate-200">
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
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col items-center text-center w-full max-w-sm mx-auto lg:max-w-none sticky top-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6 w-full text-left">
              Registrado por
            </p>
            
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden bg-white border-4 border-slate-200 shadow-md mb-5 shrink-0">
              {currentProperty.creador.foto_url ? (
                <img
                  src={getFullImageUrl(currentProperty.creador.foto_url)}
                  alt={`Foto de ${currentProperty.creador.nombres}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-3xl sm:text-4xl font-bold text-slate-400 bg-slate-100">
                  {currentProperty.creador.nombres[0].toUpperCase()}
                </div>
              )}
            </div>
            
            {/* Datos del Asesor */}
            <p className="font-extrabold text-slate-900 text-lg sm:text-xl leading-tight">
              {currentProperty.creador.nombres}{" "}
              {currentProperty.creador.apellido_paterno}{" "}
              {currentProperty.creador.apellido_materno}
            </p>
            <p className="text-xs sm:text-sm font-medium text-slate-600 mt-2 break-all px-4 py-1.5 bg-white border border-slate-200 rounded-full w-fit mx-auto shadow-sm">
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
            {currentProperty.esquema_comercial.map((esquema, idx) => {
              const {
                hasDiscount,
                finalPrice,
                originalPrice,
                discountAmount,
                discountPercentage,
              } = calculateFinalPrice(
                esquema.precio,
                esquema.descuento_cantidad,
              );

              return (
                <div
                  key={idx}
                  className="border-b border-slate-100 pb-5 last:border-0 last:pb-0"
                >
                  <p className="text-sm font-bold text-indigo-700 uppercase mb-3">
                    Esquema de {esquema.tipo_operacion}
                  </p>

                  <div className="space-y-3 text-sm sm:text-base">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium">
                        Precio de lista
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(originalPrice)}
                      </span>
                    </div>

                    {hasDiscount ? (
                      <>
                        <div className="flex justify-between items-center text-green-600">
                          <span className="font-medium">
                            Descuento ({discountPercentage}%)
                          </span>
                          <span className="font-bold">
                            - {formatCurrency(discountAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl mt-2 border border-slate-100">
                          <span className="text-slate-800 font-bold uppercase text-xs tracking-wider">
                            Precio Final
                          </span>
                          <span className="font-black text-indigo-700 text-lg">
                            {formatCurrency(finalPrice)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 italic">Descuento</span>
                        <span className="text-slate-400 italic font-medium">
                          No aplica descuento
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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

        {/* Características del Inmueble (Diseño Compacto y Circular) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-6 border-b border-slate-200 pb-4">
            Características
          </h3>

          <div className="grid grid-cols-4 gap-2 mb-6">
            <div className="bg-slate-50 p-2 sm:p-3 rounded-lg text-center border border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                Recám.
              </p>
              <p className="text-xl font-black text-slate-900">
                {currentProperty.caracteristicas?.recamaras}
              </p>
            </div>
            <div className="bg-slate-50 p-2 sm:p-3 rounded-lg text-center border border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                Baños
              </p>
              <p className="text-xl font-black text-slate-900">
                {currentProperty.caracteristicas?.banos}
              </p>
            </div>
            <div className="bg-slate-50 p-2 sm:p-3 rounded-lg text-center border border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                Estac.
              </p>
              <p className="text-xl font-black text-slate-900">
                {currentProperty.caracteristicas?.estacionamiento}
              </p>
            </div>
            <div className="bg-slate-50 p-2 sm:p-3 rounded-lg text-center border border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                Pisos
              </p>
              <p className="text-xl font-black text-slate-900">
                {currentProperty.pisos_tiene || 1}
              </p>
            </div>
          </div>

          {/* Booleanos */}
          {currentProperty.caracteristicas && (
            <div className="border-t border-slate-100">
              <h4 className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 text-center sm:text-left">
                El Inmueble Incluye
              </h4>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6">
                {Object.entries(currentProperty.caracteristicas).map(
                  ([key, value]) => {
                    if (typeof value === "boolean" && value) {
                      return (
                        <div
                          key={key}
                          className="flex flex-col items-center justify-center h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 rounded-full bg-white border border-slate-200 shadow-sm text-center hover:bg-slate-50 transition-all p-2"
                        >
                          <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 mb-1">
                            {getFeatureIcon(key)}
                          </div>

                          <span className="text-[7px] sm:text-[9px] font-extrabold text-slate-700 capitalize leading-tight px-1">
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
                slidesPerView: 2,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 24,
              },
              1280: {
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