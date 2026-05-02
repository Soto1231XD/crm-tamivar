import type {
  CommercialScheme,
  DevelopmentRecord,
} from "@/interfaces/development.interface";
export { getFullImageUrl } from "@/shared/utils/imageUrl";
import { getPropertyStatusStyles as getSharedPropertyStatusStyles } from "@/shared/ui/statusStyles";

export function getPropertyStatusStyles(estatus: string): {
  backgroundColor: string;
  color: string;
} {
  return getSharedPropertyStatusStyles(estatus);
}

function hasMeaningfulLocationValue(
  value: string | number | undefined | null,
): boolean {
  if (value == null) return false;
  if (typeof value === "number") return value > 0;

  const normalized = value.trim();
  if (!normalized) return false;

  const parsed = Number(normalized);
  if (!Number.isNaN(parsed)) return parsed > 0;

  return true;
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
    hasMeaningfulLocationValue(direccion.smz) ? `SMZ ${direccion.smz}` : "",
    hasMeaningfulLocationValue(direccion.mza) ? `MZ ${direccion.mza}` : "",
    hasMeaningfulLocationValue(direccion.lote) ? `Lote ${direccion.lote}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const parts = [
    bloqueEstructural,
    direccion.fraccionamiento?.trim() || "",
    direccion.calle ? `Calle ${direccion.calle}` : "",
    hasMeaningfulLocationValue(direccion.num_ext)
      ? `No. Ext ${direccion.num_ext}`
      : "",
  ]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "Sin dirección";
}

export function formatPublicDireccion(direccion?: {
  smz?: number;
  cp?: number;
  municipio?: string;
  estado?: string;
}): string {
  if (!direccion) return "Ubicación no especificada";

  const parts = [
    hasMeaningfulLocationValue(direccion.smz) ? `SMZ ${direccion.smz}` : "",
    direccion.municipio,
    direccion.estado,
    hasMeaningfulLocationValue(direccion.cp) ? `CP ${direccion.cp}` : "",
  ]
    .map((part) =>
      typeof part === "string"
        ? part.trim()
        : part != null
          ? String(part).trim()
          : "",
    )
    .filter((part) => part && part !== "undefined");

  return parts.length > 0 ? parts.join(", ") : "Ubicación no especificada";
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
    hasMeaningfulLocationValue(direccion.smz) ? `SMZ ${direccion.smz}` : "",
    hasMeaningfulLocationValue(direccion.mza) ? `MZ ${direccion.mza}` : "",
    hasMeaningfulLocationValue(direccion.lote) ? `Lote ${direccion.lote}` : "",
    direccion.calle ? `Calle ${direccion.calle}` : "",
    direccion.fraccionamiento?.trim() || "",
    hasMeaningfulLocationValue(direccion.num_ext)
      ? `No. Ext ${direccion.num_ext}`
      : "",
    hasMeaningfulLocationValue(direccion.num_int)
      ? `No. Int ${direccion.num_int}`
      : "",
    hasMeaningfulLocationValue(direccion.cp) ? `CP ${direccion.cp}` : "",
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
  if (Number.isNaN(parsedValue)) return "$0 MXN";

  const formattedValue = new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

export function formatDate(dateString: string | Date | undefined): string {
  if (!dateString) return "Fecha no disponible";

  return new Date(dateString).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const stripEmojis = (text: string): string => {
  if (!text) return "";

  return text
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      "",
    )
    .replace(
      /[^\x00-\x7F\x80-\xFF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]/g,
      "",
    )
    .replace(/ +(?= )/g, "")
    .trim();
};

export function getCommercialSchemes(
  development?: Pick<DevelopmentRecord, "esquema_comercial"> | null,
): CommercialScheme[] {
  if (!development || !Array.isArray(development.esquema_comercial)) return [];
  return development.esquema_comercial;
}

export function getPrimaryCommercialScheme(
  development?: Pick<DevelopmentRecord, "esquema_comercial"> | null,
): CommercialScheme | null {
  const schemes = getCommercialSchemes(development);
  return schemes[0] ?? null;
}

export function getPropertyOperationLabel(
  development?: Pick<DevelopmentRecord, "esquema_comercial"> | null,
): string {
  const schemes = getCommercialSchemes(development);
  if (schemes.length === 0) return "Sin operación";
  return schemes.map((scheme) => scheme.tipo_operacion).join(" / ");
}

export function getPrimaryPropertyPrice(
  development?: Pick<DevelopmentRecord, "esquema_comercial"> | null,
): number {
  return getPrimaryCommercialScheme(development)?.precio ?? 0;
}
