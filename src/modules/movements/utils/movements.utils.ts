import type {
  MovementChangedField,
  MovementRecord,
} from "@/interfaces/movement.interface";
import { downloadTableAsExcel } from "@/components/ui/excelExport";

const MODULE_LABELS: Record<string, string> = {
  auth: "Autenticacion",
  users: "Usuarios",
  roles: "Roles",
  properties: "Propiedades",
  registros: "Registros",
  "registros-leads": "Registros leads",
  blogs: "Blogs",
  dashboard: "Dashboard",
  movimientos: "Movimientos",
};

const TEXT_REPLACEMENTS: Array<[string, string]> = [
  ["CreÃ³", "Creo"],
  ["CreaciÃ³n", "Creacion"],
  ["EditÃ³", "Edito"],
  ["EdiciÃ³n", "Edicion"],
  ["ActualizÃ³", "Actualizo"],
  ["ActualizaciÃ³n", "Actualizacion"],
  ["EliminÃ³", "Elimino"],
  ["EliminaciÃ³n", "Eliminacion"],
  ["RealizÃ³", "Realizo"],
  ["BitÃ¡cora", "Bitacora"],
  ["AquÃ­", "Aqui"],
  ["DespuÃ©s", "Despues"],
  ["ocurriÃ³", "ocurrio"],
];

const FIELD_LABELS: Record<string, string> = {
  valor: "Valor",
  id: "Id",
  lada: "Lada",
  titulo: "Titulo",
  slug: "Slug",
  carpeta_id: "Carpeta",
  tipo_inmueble: "Tipo de inmueble",
  esquema_comercial: "Condiciones comerciales",
  descripcion: "Descripcion",
  tipos_pago: "Tipos de pago",
  estatus: "Estatus",
  etiquetas: "Etiquetas",
  tiene_gravamen: "Tiene gravamen",
  cuota_mantenimiento: "Cuota de mantenimiento",
  comentarios: "Comentarios",
  pisos_tiene: "Pisos",
  servicios_instalaciones: "Servicios e instalaciones",
  amenidades: "Amenidades",
  medidas: "Medidas",
  direccion: "Direccion",
  caracteristicas: "Caracteristicas",
  imagenes: "Imagenes",
  nombres: "Nombres",
  apellidos: "Apellidos",
  telefono: "Telefono",
  correo_electronico: "Correo electronico",
  estado: "Estado",
  prioridad: "Prioridad",
  fecha_cita: "Fecha de cita",
  vendedor_asignado_id: "Vendedor asignado",
  operacion: "Operacion",
  canal: "Canal",
  solicitud: "Solicitud",
  presupuesto: "Presupuesto",
  ubicacion_propiedad: "Zona de preferencia",
  metodo_pago: "Metodo de pago",
  origen_lead: "Origen del lead",
  asesor_externo: "Asesor externo",
  asesor_externo_nombre: "Nombre del asesor externo",
  rol: "Rol",
  permisos: "Permisos",
  activo: "Activo",
  precio: "Precio",
  tipo_operacion: "Tipo de operacion",
  descuento_cantidad: "Descuento",
  cp: "Codigo postal",
  fraccionamiento: "Fraccionamiento",
  smz: "Supermanzana",
  mza: "Manzana",
  lote: "Lote",
  calle: "Calle",
  num_ext: "Numero exterior",
  num_int: "Numero interior",
  municipio: "Municipio",
  referencias: "Referencias",
  terreno_m2: "Terreno (m2)",
  construccion_m2: "Construccion (m2)",
  frente: "Frente",
  fondo: "Fondo",
  banos: "Banos",
  recamaras: "Recamaras",
  estacionamiento: "Estacionamiento",
  sala: "Sala",
  comedor: "Comedor",
  cocina: "Cocina",
  area_servicio: "Area de servicio",
  patio: "Patio",
  jardin: "Jardin",
  alberca: "Alberca",
  terraza: "Terraza",
  amueblado: "Amueblado",
  bodega: "Bodega",
  aire_acondicionado: "Aire acondicionado",
  boiler: "Boiler",
};

const ROOT_WRAPPER_SEGMENTS = new Set(["valor"]);
const HIDDEN_DIFF_FIELDS = new Set([
  "actualizadoEn",
  "actualizado_en",
  "id",
  "creado_en",
  "creado_por_id",
  "propiedad_id",
]);

const SUMMARY_OBJECT_FIELDS = new Set([
  "creador",
  "usuario",
  "propiedad",
  "vendedor_asignado",
]);

const CURRENCY_FIELDS = new Set([
  "precio",
  "presupuesto",
  "cuota_mantenimiento",
  "descuento_cantidad",
]);

type SnapshotEntry = {
  key: string;
  label: string;
  value: string;
};

function isMeaningfulValue(value: unknown): boolean {
  if (value == null) return false;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized !== "" && normalized !== "sin valor";
  }

  return true;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function areValuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function getPathSegments(path: string): string[] {
  return path.split(".").filter(Boolean);
}

function getLastPathSegment(path: string): string {
  const segments = getPathSegments(path);
  return segments[segments.length - 1] ?? path;
}

function shouldHideFieldPath(path: string): boolean {
  const segments = getPathSegments(path).filter(
    (segment) => !ROOT_WRAPPER_SEGMENTS.has(segment),
  );

  if (segments.length === 0) return false;

  const lastSegment = segments[segments.length - 1];
  if (HIDDEN_DIFF_FIELDS.has(lastSegment)) {
    return true;
  }

  const normalizedPath = segments.join(".");
  return (
    normalizedPath.startsWith("creador.") ||
    normalizedPath.startsWith("usuario.")
  );
}

function shouldKeepObjectAsSingleField(path: string): boolean {
  const lastSegment = getLastPathSegment(path);
  return SUMMARY_OBJECT_FIELDS.has(lastSegment);
}

function isDateString(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;
  const parsed = Date.parse(normalized);
  return !Number.isNaN(parsed) && /[tT]/.test(normalized);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPersonSummary(value: Record<string, unknown>): string {
  const nombreCompleto = [
    value.nombres,
    value.apellido_paterno,
    value.apellido_materno,
  ]
    .filter((segment) => typeof segment === "string" && segment.trim())
    .join(" ")
    .trim();

  const lineas: string[] = [];
  if (nombreCompleto) {
    lineas.push(`Nombre: ${normalizeMovementText(nombreCompleto)}`);
  }

  if (typeof value.correo_electronico === "string" && value.correo_electronico.trim()) {
    lineas.push(`Correo electrónico: ${value.correo_electronico.trim()}`);
  }

  if (typeof value.telefono === "string" && value.telefono.trim()) {
    lineas.push(`Teléfono: ${value.telefono.trim()}`);
  }

  return lineas.join("\n") || "Sin valor";
}

function formatPropertySummary(value: Record<string, unknown>): string {
  const lineas: string[] = [];
  const esquemaComercial = Array.isArray(value.esquema_comercial)
    ? value.esquema_comercial
    : [];
  const direccion = isPlainObject(value.direccion) ? value.direccion : null;

  const direccionResumen = [
    direccion?.calle,
    direccion?.fraccionamiento,
    direccion?.municipio,
  ]
    .filter((segment) => typeof segment === "string" && segment.trim())
    .map((segment) => normalizeMovementText(String(segment).trim()))
    .join(", ");

  if (typeof value.titulo === "string" && value.titulo.trim()) {
    lineas.push(`Titulo: ${normalizeMovementText(value.titulo.trim())}`);
  }

  if (direccionResumen) {
    lineas.push(`Ubicacion: ${direccionResumen}`);
  }

  if (typeof value.tipo_inmueble === "string" && value.tipo_inmueble.trim()) {
    lineas.push(
      `Tipo de inmueble: ${normalizeMovementText(value.tipo_inmueble.trim())}`,
    );
  }

  if (esquemaComercial.length > 0) {
    esquemaComercial.forEach((item, index) => {
      if (!isPlainObject(item)) return;
      const titulo =
        esquemaComercial.length > 1
          ? `Condicion comercial ${index + 1}:`
          : "Condiciones comerciales:";
      lineas.push(titulo);

      if (typeof item.tipo_operacion === "string" && item.tipo_operacion.trim()) {
        lineas.push(
          `  Tipo de operacion: ${normalizeMovementText(item.tipo_operacion.trim())}`,
        );
      }

      if (typeof item.precio === "number") {
        lineas.push(`  Precio: ${formatCurrency(item.precio)}`);
      }
    });
  }

  return lineas.join("\n") || "Sin valor";
}

function formatCommercialConditions(value: unknown): string | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const blocks = value
    .filter((item): item is Record<string, unknown> => isPlainObject(item))
    .map((item, index, items) => {
      const lines: string[] = [];

      if (typeof item.tipo_operacion === "string" && item.tipo_operacion.trim()) {
        lines.push(`Operación: ${normalizeMovementText(item.tipo_operacion.trim())}`);
      }

      if (typeof item.precio === "number") {
        lines.push(`Precio: ${formatCurrency(item.precio)}`);
      }

      if (typeof item.descuento_cantidad === "number" && item.descuento_cantidad > 0) {
        lines.push(`Descuento: ${formatCurrency(item.descuento_cantidad)}`);
      }

      if (items.length > 1) {
        return [`Condición ${index + 1}`, ...lines].join("\n");
      }

      return lines.join("\n");
    })
    .filter(Boolean);

  return blocks.join("\n\n") || null;
}

function formatSummaryObject(
  value: Record<string, unknown>,
  fieldPath: string,
): string | null {
  const lastSegment = getLastPathSegment(fieldPath);

  if (lastSegment === "creador" || lastSegment === "usuario" || lastSegment === "vendedor_asignado") {
    return formatPersonSummary(value);
  }

  if (lastSegment === "propiedad") {
    return formatPropertySummary(value);
  }

  return null;
}

function buildChangedFieldsFromSnapshots(
  beforeValue: unknown,
  afterValue: unknown,
  currentPath = "",
): MovementChangedField[] {
  if (shouldKeepObjectAsSingleField(currentPath)) {
    if (!areValuesEqual(beforeValue, afterValue)) {
      return [
        {
          campo: currentPath || "valor",
          antes: beforeValue ?? null,
          despues: afterValue ?? null,
        },
      ];
    }

    return [];
  }

  if (!isPlainObject(beforeValue) && isPlainObject(afterValue)) {
    return Object.keys(afterValue).flatMap((key) =>
      buildChangedFieldsFromSnapshots(
        undefined,
        afterValue[key],
        currentPath ? `${currentPath}.${key}` : key,
      ),
    );
  }

  if (isPlainObject(beforeValue) && !isPlainObject(afterValue)) {
    return Object.keys(beforeValue).flatMap((key) =>
      buildChangedFieldsFromSnapshots(
        beforeValue[key],
        undefined,
        currentPath ? `${currentPath}.${key}` : key,
      ),
    );
  }

  if (isPlainObject(beforeValue) && isPlainObject(afterValue)) {
    const keys = Array.from(
      new Set([...Object.keys(beforeValue), ...Object.keys(afterValue)]),
    );

    return keys.flatMap((key) =>
      buildChangedFieldsFromSnapshots(
        beforeValue[key],
        afterValue[key],
        currentPath ? `${currentPath}.${key}` : key,
      ),
    );
  }

  if (!areValuesEqual(beforeValue, afterValue)) {
    return [
      {
        campo: currentPath || "valor",
        antes: beforeValue ?? null,
        despues: afterValue ?? null,
      },
    ];
  }

  return [];
}

export function normalizeMovementText(value?: string | null): string {
  if (!value) return "";

  return TEXT_REPLACEMENTS.reduce(
    (normalized, [search, replace]) => normalized.replaceAll(search, replace),
    value,
  );
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getMethodBadgeClass(method: string): string {
  const normalized = method.toUpperCase();

  if (normalized === "GET") return "bg-sky-100 text-sky-700";
  if (normalized === "POST") return "bg-emerald-100 text-emerald-700";
  if (normalized === "PATCH") return "bg-amber-100 text-amber-700";
  if (normalized === "DELETE") return "bg-rose-100 text-rose-700";

  return "bg-slate-100 text-slate-700";
}

export function getStatusBadgeClass(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 300) {
    return "bg-emerald-100 text-emerald-700";
  }
  if (statusCode >= 400 && statusCode < 500) {
    return "bg-amber-100 text-amber-700";
  }
  if (statusCode >= 500) {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-slate-100 text-slate-700";
}

export function getStatusLabel(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 300) {
    return "Exitoso";
  }

  if (statusCode === 400) {
    return "Solicitud invalida";
  }

  if (statusCode === 401) {
    return "No autorizado";
  }

  if (statusCode === 403) {
    return "Sin permisos";
  }

  if (statusCode === 404) {
    return "No encontrado";
  }

  if (statusCode === 409) {
    return "Conflicto";
  }

  if (statusCode === 422) {
    return "Datos invalidos";
  }

  if (statusCode >= 400 && statusCode < 500) {
    return "Error del usuario";
  }

  if (statusCode >= 500) {
    return "Error del sistema";
  }

  return "Sin clasificar";
}

export function getModuleLabel(module?: string | null): string {
  if (!module) return "Sin modulo";
  return MODULE_LABELS[module] ?? module;
}

export function getActionLabel(action?: string | null): string {
  if (!action) return "Acción";

  const normalized = action.trim().toLowerCase();
  if (normalized === "crear") return "Creación";
  if (normalized === "editar") return "Edición";
  if (normalized === "actualizar") return "Actualización";
  if (normalized === "eliminar") return "Eliminación";

  return normalizeMovementText(action);
}

export function getMethodLabel(method: string): string {
  const normalized = method.toUpperCase();
  if (normalized === "POST") return "Creación";
  if (normalized === "PATCH") return "Edición";
  if (normalized === "PUT") return "Actualización";
  if (normalized === "DELETE") return "Eliminación";
  if (normalized === "GET") return "Consulta";
  return method;
}

export function getChangedFields(movement: MovementRecord): MovementChangedField[] {
  if (Array.isArray(movement.campos_modificados)) {
    const fromBackend = movement.campos_modificados.filter(
      (field): field is MovementChangedField =>
        Boolean(field) &&
        typeof field === "object" &&
        typeof field.campo === "string" &&
        !shouldHideFieldPath(field.campo),
    );

      if (fromBackend.length > 0) {
        return fromBackend;
      }
    }
  
  const fromSnapshots = buildChangedFieldsFromSnapshots(
    movement.detalle_antes ?? null,
    movement.detalle_despues ?? null,
  ).filter((field) => !shouldHideFieldPath(field.campo));

  if (fromSnapshots.length > 0) {
    return fromSnapshots;
  }

  return buildFallbackChangedFieldsFromSnapshots(movement).filter(
    (field) => !shouldHideFieldPath(field.campo),
  );
}

export function getMovementDetailText(movement: MovementRecord): string {
  const changedCount = getChangedFields(movement).length;

  if (changedCount > 0) {
    return `Se registraron ${changedCount} cambio${changedCount === 1 ? "" : "s"} en este movimiento.`;
  }

  if (movement.usuario?.nombres) {
    return `${movement.usuario.nombres} realizo un movimiento en ${getModuleLabel(
      movement.modulo,
    ).toLowerCase()}.`;
  }

  return "Movimiento ejecutado por el sistema.";
}

function formatFieldPathSegment(segment: string): string {
  const cleaned = segment.replaceAll("_", " ").trim();
  const mapped = FIELD_LABELS[segment] ?? cleaned;
  return mapped.charAt(0).toUpperCase() + mapped.slice(1);
}

function formatObjectEntries(
  value: Record<string, unknown>,
  parentPath = "",
): string {
  const entries = Object.entries(value).filter(
    ([, entryValue]) =>
      entryValue !== null &&
      entryValue !== undefined &&
      !(typeof entryValue === "string" && entryValue.trim() === ""),
  );

  if (entries.length === 0) {
    return "Sin valor";
  }

  return entries
    .map(([key, entryValue]) => {
      const nextPath = parentPath ? `${parentPath}.${key}` : key;
      return `${formatChangedFieldLabel(nextPath)}: ${formatMovementValue(
        entryValue,
        nextPath,
      )}`;
    })
    .join("\n");
}

export function formatChangedFieldLabel(path: string): string {
  const label = path
    .split(".")
    .filter((segment) => Boolean(segment) && !ROOT_WRAPPER_SEGMENTS.has(segment))
    .map((segment) => formatFieldPathSegment(segment))
    .join(" / ");

  return label || "Valor";
}

export function formatMovementValue(
  value: unknown,
  fieldPath = "",
): string {
  if (value == null) {
    return "Sin valor";
  }

  if (typeof value === "boolean") {
    return value ? "Si" : "No";
  }

  if (typeof value === "number") {
    if (CURRENCY_FIELDS.has(getLastPathSegment(fieldPath))) {
      return formatCurrency(value);
    }

    return value.toLocaleString("es-MX");
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "Sin valor";
    if (isDateString(trimmed)) {
      return formatDate(trimmed);
    }

    return normalizeMovementText(trimmed);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "Sin valor";
    }

    if (getLastPathSegment(fieldPath) === "esquema_comercial") {
      const formattedConditions = formatCommercialConditions(value);
      if (formattedConditions) {
        return formattedConditions;
      }
    }

    if (value.every((item) => isPlainObject(item))) {
      return value
        .map((item, index) =>
          `Registro ${index + 1}\n${formatObjectEntries(
            item as Record<string, unknown>,
            fieldPath,
          )}`,
        )
        .join("\n\n");
    }

    return value.map((item) => formatMovementValue(item, fieldPath)).join(", ");
  }

  if (isPlainObject(value)) {
    const summary = formatSummaryObject(value, fieldPath);
    if (summary) {
      return summary;
    }

    return formatObjectEntries(value, fieldPath);
  }

  try {
    return normalizeMovementText(String(value));
  } catch {
    return String(value);
  }
}

function formatSnapshotEntries(
  snapshot: Record<string, unknown>,
  parentPath = "",
): SnapshotEntry[] {
  return Object.entries(snapshot).flatMap(([key, value]) => {
    const nextPath = parentPath ? `${parentPath}.${key}` : key;

    if (ROOT_WRAPPER_SEGMENTS.has(key) && isPlainObject(value)) {
      return formatSnapshotEntries(value, parentPath);
    }

    if (
      value === null ||
      value === undefined ||
      value === "" ||
      shouldHideFieldPath(nextPath)
    ) {
      return [];
    }

    return [
      {
        key: nextPath,
        label: formatChangedFieldLabel(nextPath),
        value: formatMovementValue(value, nextPath),
      },
    ];
    });
}

function buildFallbackChangedFieldsFromSnapshots(
  movement: MovementRecord,
): MovementChangedField[] {
  const beforeEntries =
    movement.detalle_antes && typeof movement.detalle_antes === "object"
      ? formatSnapshotEntries(movement.detalle_antes)
      : [];
  const afterEntries =
    movement.detalle_despues && typeof movement.detalle_despues === "object"
      ? formatSnapshotEntries(movement.detalle_despues)
      : [];

  if (beforeEntries.length === 0 && afterEntries.length === 0) {
    return [];
  }

  const beforeMap = new Map(beforeEntries.map((entry) => [entry.key, entry.value]));
  const afterMap = new Map(afterEntries.map((entry) => [entry.key, entry.value]));
  const keys = Array.from(new Set([...beforeMap.keys(), ...afterMap.keys()]));

  const fallbackFields: MovementChangedField[] = [];

  keys.forEach((key) => {
      const beforeValue = beforeMap.get(key);
      const afterValue = afterMap.get(key);

      if (beforeValue === afterValue) {
        return;
      }

      if (!isMeaningfulValue(beforeValue) && !isMeaningfulValue(afterValue)) {
        return;
      }

      fallbackFields.push({
        campo: key,
        antes: beforeValue ?? "No habia un dato registrado",
        despues: afterValue ?? "Se elimino este dato",
      });
    });

  return fallbackFields;
}

export function getMovementSummaryItems(movement: MovementRecord) {
  return [
    { label: "Usuario", value: movement.usuario?.nombres ?? "Sistema" },
    {
      label: "Correo",
      value: movement.usuario?.correo_electronico ?? "Sin correo asociado",
    },
    { label: "Fecha", value: formatDate(movement.creado_en) },
    { label: "Tipo", value: getMethodLabel(movement.metodo) },
    { label: "Modulo", value: getModuleLabel(movement.modulo) },
    { label: "Acción", value: getActionLabel(movement.accion) },
  ];
}

export function getMovementSnapshotSections(movement: MovementRecord) {
  const before =
    movement.detalle_antes && typeof movement.detalle_antes === "object"
      ? formatSnapshotEntries(movement.detalle_antes)
      : [];
  const after =
    movement.detalle_despues && typeof movement.detalle_despues === "object"
      ? formatSnapshotEntries(movement.detalle_despues)
      : [];

  return { before, after };
}

export function downloadMovementsAsExcel(movements: MovementRecord[]) {
  const headers = [
    "Fecha",
    "Usuario",
    "Correo",
    "Tipo",
    "Modulo",
    "Movimiento",
    "Detalle",
    "Ruta",
    "Status",
  ];

  const rows = movements.map((movement) => [
      formatDate(movement.creado_en),
      movement.usuario?.nombres ?? "Sistema",
      movement.usuario?.correo_electronico ?? "Sin correo asociado",
      getMethodLabel(movement.metodo),
      getModuleLabel(movement.modulo),
      normalizeMovementText(movement.descripcion) || "Accion realizada",
      getMovementDetailText(movement),
      movement.ruta ?? "",
      `${getStatusLabel(movement.statusCode ?? 0)} (${movement.statusCode ?? ""})`,
    ]);

  downloadTableAsExcel({
    title: "Movimientos exportados",
    sheetName: "Movimientos",
    fileName: "movimientos-filtrados.xlsx",
    headers,
    rows,
  });
}
