import { PROPERTY_STATUS_STYLES } from "./property-constants";

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
    direccion.fraccionamiento,
    direccion.calle,
    direccion.num_ext != null ? `Ext. ${direccion.num_ext}` : "",
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
    direccion.calle,
    direccion.num_ext != null ? `Ext. ${direccion.num_ext}` : "",
    direccion.num_int != null ? `Int. ${direccion.num_int}` : "",
    direccion.fraccionamiento,
    direccion.municipio,
    direccion.estado,
    direccion.cp != null ? `CP ${direccion.cp}` : "",
    direccion.smz != null ? `SMZ ${direccion.smz}` : "",
    direccion.mza != null ? `MZA ${direccion.mza}` : "",
    direccion.lote != null ? `Lote ${direccion.lote}` : "",
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

export function formatConditionalPrice(conditionalPrice?: {
  descripcion?: string;
  monto?: number;
}): string {
  if (conditionalPrice?.monto == null) return "No aplica";
  const amount = formatCurrency(conditionalPrice.monto);
  const description = conditionalPrice.descripcion?.trim();
  return description ? `${amount} - ${description}` : amount;
}

export function formatOptionalCurrency(value?: string | number): string {
  if (value == null || value === "") return "No aplica";
  return formatCurrency(value);
}

export function formatOptionalNumber(value?: string | number): string {
  if (value == null || value === "") return "No aplica";
  return String(value);
}