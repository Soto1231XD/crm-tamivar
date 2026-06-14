import type { PropertyRecord } from "@/interfaces/property.interface";
import { formatCurrency, getFullImageUrl } from "./formatters";

export type MercadoLibreIssue = {
  field: string;
  message: string;
  severity: "error" | "warning";
};

export type MercadoLibrePayloadPreview = {
  title: string;
  category_hint: string;
  listing_type_hint: string;
  transaction_type_hint: string;
  currency_id: "MXN";
  price: number | null;
  description: string;
  condition: "not_specified";
  available_quantity: 1;
  tags: string[];
  pictures: Array<{ source: string }>;
  seller_contact: {
    email: string;
    full_name: string;
  };
  location: {
    address_line: string;
    city_name: string;
    state_name: string;
    zip_code: string | null;
  };
  attributes: Array<{
    id: string;
    value_name: string;
  }>;
};

export type MercadoLibrePreview = {
  ready: boolean;
  issues: MercadoLibreIssue[];
  blockingIssues: MercadoLibreIssue[];
  recommendations: MercadoLibreIssue[];
  payload: MercadoLibrePayloadPreview;
  summary: {
    operationLabel: string;
    priceLabel: string;
    imageCount: number;
    categoryLabel: string;
    statusLabel: string;
  };
};

type NormalizedCategoryConfig = {
  code: string;
  label: string;
};

const CATEGORY_HINTS: Record<string, NormalizedCategoryConfig> = {
  casa: { code: "MLM1473", label: "Casa" },
  departamento: { code: "MLM1518", label: "Departamento" },
  terreno: { code: "MLM1517", label: "Terreno" },
  local: { code: "MLM1515", label: "Local comercial" },
  "local comercial": { code: "MLM1515", label: "Local comercial" },
  oficina: { code: "MLM1516", label: "Oficina" },
  bodega: { code: "MLM1514", label: "Bodega" },
  edificio: { code: "MLM1512", label: "Edificio" },
  "edificio comercial": { code: "MLM1512", label: "Edificio comercial" },
};

const TRANSACTION_HINTS: Record<string, string> = {
  venta: "sale",
  renta: "rent",
  preventa: "sale",
};

const PUBLISHABLE_STATUSES = new Set(["disponible"]);
const MIN_DESCRIPTION_LENGTH = 120;
const MIN_IMAGES_TO_PUBLISH = 5;
const IDEAL_IMAGES = 10;

function normalizeText(value: string | undefined | null) {
  return (value ?? "").trim();
}

function normalizeKey(value: string | undefined | null) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}…`;
}

function getPrimaryCommercialScheme(property: PropertyRecord) {
  if (!Array.isArray(property.esquema_comercial) || property.esquema_comercial.length === 0) {
    return null;
  }

  const orderedOperations = ["venta", "renta", "preventa"];

  for (const operation of orderedOperations) {
    const match = property.esquema_comercial.find(
      (scheme) => normalizeKey(scheme.tipo_operacion) === operation,
    );
    if (match) return match;
  }

  return property.esquema_comercial[0];
}

function buildTitle(property: PropertyRecord, operationLabel: string) {
  const explicitTitle = normalizeText(property.titulo);
  if (explicitTitle.length >= 20) {
    return truncateText(explicitTitle, 60);
  }

  const pieces = [
    normalizeText(property.tipo_inmueble),
    operationLabel ? `en ${operationLabel.toLowerCase()}` : "",
    normalizeText(property.direccion.municipio),
  ].filter(Boolean);

  const fallbackTitle = pieces.join(" ");
  return truncateText(fallbackTitle || explicitTitle || "Propiedad publicada", 60);
}

function buildDescription(property: PropertyRecord) {
  const sections: string[] = [];
  const rawDescription = normalizeText(property.descripcion);

  if (rawDescription) {
    sections.push(rawDescription);
  }

  if (property.amenidades) {
    sections.push(`Amenidades: ${normalizeText(property.amenidades)}`);
  }

  if (property.servicios_instalaciones) {
    sections.push(`Servicios e instalaciones: ${normalizeText(property.servicios_instalaciones)}`);
  }

  return sections.join("\n\n").trim();
}

function buildAttributes(property: PropertyRecord) {
  const attributes: MercadoLibrePayloadPreview["attributes"] = [];

  if (property.tipo_inmueble) {
    attributes.push({
      id: "PROPERTY_TYPE",
      value_name: property.tipo_inmueble,
    });
  }

  if (property.medidas?.terreno_m2 != null) {
    attributes.push({
      id: "LOT_AREA",
      value_name: `${property.medidas.terreno_m2} m2`,
    });
  }

  if (property.medidas?.construccion_m2 != null) {
    attributes.push({
      id: "COVERED_AREA",
      value_name: `${property.medidas.construccion_m2} m2`,
    });
  }

  if (property.caracteristicas?.recamaras != null) {
    attributes.push({
      id: "BEDROOMS",
      value_name: String(property.caracteristicas.recamaras),
    });
  }

  if (property.caracteristicas?.banos != null) {
    attributes.push({
      id: "FULL_BATHROOMS",
      value_name: String(property.caracteristicas.banos),
    });
  }

  if (property.caracteristicas?.estacionamiento != null) {
    attributes.push({
      id: "PARKING_LOTS",
      value_name: String(property.caracteristicas.estacionamiento),
    });
  }

  if (property.pisos_tiene != null) {
    attributes.push({
      id: "FLOORS",
      value_name: String(property.pisos_tiene),
    });
  }

  if (property.cuota_mantenimiento != null) {
    attributes.push({
      id: "MAINTENANCE_FEE",
      value_name: `${property.cuota_mantenimiento} MXN`,
    });
  }

  if (property.exclusiva) {
    attributes.push({
      id: "EXCLUSIVE",
      value_name: "Si",
    });
  }

  if (property.tiene_gravamen) {
    attributes.push({
      id: "LIEN_STATUS",
      value_name: "Con gravamen",
    });
  }

  if (Array.isArray(property.tipos_pago) && property.tipos_pago.length > 0) {
    attributes.push({
      id: "PAYMENT_METHODS",
      value_name: property.tipos_pago.join(", "),
    });
  }

  return attributes;
}

function buildTags(property: PropertyRecord) {
  const tags = new Set<string>();

  if (property.exclusiva) {
    tags.add("exclusive");
  }

  if (normalizeKey(property.estatus) === "disponible") {
    tags.add("active_listing");
  }

  if (Array.isArray(property.etiquetas)) {
    property.etiquetas
      .map((tag) => normalizeKey(tag))
      .filter(Boolean)
      .forEach((tag) => tags.add(tag));
  }

  return Array.from(tags);
}

function buildCategoryInfo(property: PropertyRecord) {
  const categoryKey = normalizeKey(property.tipo_inmueble);
  return CATEGORY_HINTS[categoryKey] ?? null;
}

function buildLocationAddress(property: PropertyRecord) {
  return [
    property.direccion.calle,
    property.direccion.num_ext,
    property.direccion.num_int ? `Int. ${property.direccion.num_int}` : null,
    property.direccion.fraccionamiento,
  ]
    .filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
    .join(" ");
}

function buildImages(property: PropertyRecord) {
  return (property.imagenes ?? [])
    .map((image) => ({
      source: normalizeText(getFullImageUrl(image.url)),
      principal: image.principal,
    }))
    .filter((image) => image.source);
}

export function buildMercadoLibrePreview(property: PropertyRecord): MercadoLibrePreview {
  const issues: MercadoLibreIssue[] = [];
  const primaryScheme = getPrimaryCommercialScheme(property);
  const operationKey = normalizeKey(primaryScheme?.tipo_operacion);
  const operationLabel = primaryScheme?.tipo_operacion ?? "Sin operación";
  const title = buildTitle(property, operationLabel);
  const description = buildDescription(property);
  const categoryInfo = buildCategoryInfo(property);
  const listingStatus = normalizeKey(property.estatus);
  const images = buildImages(property);

  if (!PUBLISHABLE_STATUSES.has(listingStatus)) {
    issues.push({
      field: "Estatus",
      message: "Solo conviene publicar en Mercado Libre propiedades con estatus Disponible.",
      severity: "error",
    });
  }

  if (!title || title.length < 15) {
    issues.push({
      field: "Titulo",
      message: "La propiedad necesita un titulo comercial mas claro.",
      severity: "error",
    });
  }

  if (!description || description.length < MIN_DESCRIPTION_LENGTH) {
    issues.push({
      field: "Descripción",
      message: "Conviene una descripción mas completa para competir mejor en Mercado Libre.",
      severity: "warning",
    });
  }

  if (!primaryScheme?.precio || primaryScheme.precio <= 0) {
    issues.push({
      field: "Precio",
      message: "No encontramos un precio base valido para publicar.",
      severity: "error",
    });
  }

  if (!categoryInfo) {
    issues.push({
      field: "Tipo de inmueble",
      message: "Este tipo de inmueble necesita mapeo manual de categoría antes de publicar.",
      severity: "error",
    });
  }

  if (!TRANSACTION_HINTS[operationKey]) {
    issues.push({
      field: "Operación",
      message: "La operación actual necesita una equivalencia para Mercado Libre.",
      severity: "error",
    });
  } else if (operationKey === "preventa") {
    issues.push({
      field: "Operación",
      message: "Preventa se enviaría como venta; conviene revisar la estrategia comercial antes de publicar.",
      severity: "warning",
    });
  }

  if (images.length < MIN_IMAGES_TO_PUBLISH) {
    issues.push({
      field: "Imágenes",
      message: "Se recomiendan al menos 5 imágenes reales para publicar en Mercado Libre.",
      severity: "error",
    });
  } else if (images.length < IDEAL_IMAGES) {
    issues.push({
      field: "Imágenes",
      message: "La publicación ya es viable, pero con 10 imágenes o mas suele rendir mejor.",
      severity: "warning",
    });
  }

  if (!normalizeText(property.direccion.calle) || !normalizeText(property.direccion.municipio)) {
    issues.push({
      field: "Dirección",
      message: "Faltan datos de ubicación para una publicación clara.",
      severity: "error",
    });
  }

  if (!property.creador?.correo_electronico) {
    issues.push({
      field: "Contacto",
      message: "Falta el correo del asesor para el contacto base de la publicación.",
      severity: "warning",
    });
  }

  if (property.tiene_gravamen) {
    issues.push({
      field: "Estado legal",
      message: "La propiedad tiene gravamen; conviene revisar si la publicación debe salir asi.",
      severity: "warning",
    });
  }

  const payload: MercadoLibrePayloadPreview = {
    title,
    category_hint: categoryInfo?.code ?? "PENDIENTE_MAPEO",
    listing_type_hint: "gold_special",
    transaction_type_hint: TRANSACTION_HINTS[operationKey] ?? "manual_review",
    currency_id: "MXN",
    price: primaryScheme?.precio ?? null,
    description,
    condition: "not_specified",
    available_quantity: 1,
    tags: buildTags(property),
    pictures: images
      .sort((left, right) => Number(right.principal) - Number(left.principal))
      .map(({ source }) => ({ source })),
    seller_contact: {
      email: property.creador?.correo_electronico ?? "",
      full_name: [
        property.creador?.nombres,
        property.creador?.apellido_paterno,
        property.creador?.apellido_materno,
      ]
        .filter(Boolean)
        .join(" "),
    },
    location: {
      address_line: buildLocationAddress(property),
      city_name: property.direccion.municipio,
      state_name: property.direccion.estado,
      zip_code: property.direccion.cp != null ? String(property.direccion.cp) : null,
    },
    attributes: buildAttributes(property),
  };

  const blockingIssues = issues.filter((issue) => issue.severity === "error");
  const recommendations = issues.filter((issue) => issue.severity === "warning");

  return {
    ready: blockingIssues.length === 0,
    issues,
    blockingIssues,
    recommendations,
    payload,
    summary: {
      operationLabel,
      priceLabel: primaryScheme?.precio ? formatCurrency(primaryScheme.precio) : "Sin precio base",
      imageCount: images.length,
      categoryLabel: categoryInfo?.label ?? payload.category_hint,
      statusLabel: property.estatus,
    },
  };
}
