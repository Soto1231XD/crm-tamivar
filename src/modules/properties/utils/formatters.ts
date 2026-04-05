import type { EsquemaComercial, PropertyRecord } from "@/interfaces/property.interface";
export { getFullImageUrl } from "@/shared/utils/imageUrl";
import { getPropertyStatusStyles as getSharedPropertyStatusStyles } from "@/shared/ui/statusStyles";

export function getPropertyStatusStyles(estatus: string): {
  backgroundColor: string;
  color: string;
} {
  return getSharedPropertyStatusStyles(estatus);
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

export function getCommercialSchemes(
  property?: Pick<PropertyRecord, "esquema_comercial"> | null,
): EsquemaComercial[] {
  if (!property || !Array.isArray(property.esquema_comercial)) return [];
  return property.esquema_comercial;
}

export function getPrimaryCommercialScheme(
  property?: Pick<PropertyRecord, "esquema_comercial"> | null,
): EsquemaComercial | null {
  const schemes = getCommercialSchemes(property);
  return schemes[0] ?? null;
}

export function getPropertyOperationLabel(
  property?: Pick<PropertyRecord, "esquema_comercial"> | null,
): string {
  const schemes = getCommercialSchemes(property);
  if (schemes.length === 0) return "Sin operación";
  return schemes.map((scheme) => scheme.tipo_operacion).join(" / ");
}

export function getPrimaryPropertyPrice(
  property?: Pick<PropertyRecord, "esquema_comercial"> | null,
): number {
  return getPrimaryCommercialScheme(property)?.precio ?? 0;
}
