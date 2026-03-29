import { PROPERTY_STATUS_STYLES } from "./property-constants";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function getPropertyStatusStyles(estatus: string): {
  backgroundColor: string;
  color: string;
} {
  const normalizedStatus = estatus.trim().toLowerCase();
  return (
    PROPERTY_STATUS_STYLES[normalizedStatus] ?? {
      backgroundColor: "#E2E8F0",
      color: "#334155",
    }
  );
}

export function formatDireccion(direccion: {
  smz?: number;
  mza?: number;
  lote?: number;
  fraccionamiento?: string;
  calle?: string;
  num_ext?: number;
}): string {
  if (!direccion) return "Sin dirección";

  const bloqueEstructural = [
    direccion.smz != null ? `SMZ ${direccion.smz}` : "",
    direccion.mza != null ? `MZ ${direccion.mza}` : "",
    direccion.lote != null ? `Lote ${direccion.lote}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Unimos el bloque inicial con el resto de la dirección, separando por comas
  const parts = [
    bloqueEstructural,
    direccion.fraccionamiento ? `Fracc. ${direccion.fraccionamiento}` : "",
    direccion.calle ? `Calle ${direccion.calle}` : "",
    direccion.num_ext != null ? `No. Ext ${direccion.num_ext}` : "",
  ]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "Sin dirección";
}

export function formatFullDireccion(direccion?: {
  cp?: number;
  calle?: string;
  municipio?: string;
  fraccionamiento?: string;
  smz?: number;
  mza?: number;
  lote?: number;
  num_ext?: number;
  num_int?: number;
  estado?: string;
  referencias?: string;
}): string {
  if (!direccion) return "Sin dirección";

  const parts = [
    direccion.smz != null ? `SMZ ${direccion.smz}` : "",
    direccion.mza != null ? `MZ ${direccion.mza}` : "",
    direccion.lote != null ? `Lote ${direccion.lote}` : "",
    direccion.calle ? `Calle ${direccion.calle}` : "",
    direccion.fraccionamiento ? `Fracc. ${direccion.fraccionamiento}` : "",
    direccion.num_ext != null ? `No. Ext ${direccion.num_ext}` : "",
    direccion.num_int != null ? `No. Int ${direccion.num_int}` : "",
    direccion.cp != null ? `CP ${direccion.cp}` : "",
    direccion.municipio,
    direccion.estado,
    direccion.referencias,
  ]
    .map((part) =>
      typeof part === "string" ? part.trim() : String(part).trim(),
    )
    .filter((part) => part && part !== "undefined");

  return parts.length > 0 ? parts.join(", ") : "Sin dirección";
}

export function formatCurrency(value: string | number): string {
  const parsedValue = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(parsedValue)) return "$0.00";

  const formattedValue = new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsedValue);

  return `$${formattedValue} MXN`;
}

export function formatOptionalCurrency(value?: string | number): string {
  if (value == null || value === "") return "No aplica";
  return formatCurrency(value);
}

export function formatOptionalNumber(value?: string | number): string {
  if (value == null || value === "") return "No aplica";
  return String(value);
}

// Calcular precio final y porcentaje basado en descuento por cantidad
export const calculateFinalPrice = (
  precio: number,
  descuentoCantidad?: number,
) => {
  if (!descuentoCantidad || descuentoCantidad <= 0) {
    return {
      hasDiscount: false,
      finalPrice: precio,
      originalPrice: precio,
      discountAmount: 0,
      discountPercentage: 0, 
    };
  }

  const finalPrice = precio - descuentoCantidad;

  // Calculamos el porcentaje que representa esa cantidad sobre el precio original
  const rawPercentage = (descuentoCantidad / precio) * 100;
  const discountPercentage = Math.round(rawPercentage * 100) / 100;

  return {
    hasDiscount: true,
    discountAmount: descuentoCantidad, 
    finalPrice: finalPrice > 0 ? finalPrice : 0, 
    originalPrice: precio,
    discountPercentage,
  };
};

// Fecha de registro formateado
export function formatDate(dateString: string | Date | undefined): string {
  if (!dateString) return "Fecha no disponible";

  return new Date(dateString).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Imágenes
export const getFullImageUrl = (url: string) => {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const cleanBaseUrl = API_BASE_URL.replace(/\/$/, "");
  const cleanPath = url.startsWith("/") ? url : `/${url}`;

  return `${cleanBaseUrl}${cleanPath}`;
};

// Limpiar emojis en PDF
export const stripEmojis = (text: string): string => {
  if (!text) return "";
  
  return text
    // Elimina Emojis
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
    // Elimina caracteres especiales que causan ruido visual en PDFs
    .replace(/[^\x00-\x7F\x80-\xFF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]/g, '')
    // Limpia espacios dobles que puedan quedar tras la eliminación
    .replace(/ +(?= )/g, '')
    .trim();
};