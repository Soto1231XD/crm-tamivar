export const STATUS_OPTIONS = [
  "Todos los estados",
  "Disponible",
  "Apartado",
  "Vendido",
  "Baja",
] as const;

export const TYPE_OPTIONS = [
  "Todos los tipos",
  "Casa",
  "Departamento",
  "Desarrollo",
  "Terreno",
  "Local comercial",
  "Edificio comercial",
] as const;

export const OPERATION_OPTIONS = ["Venta", "Renta", "Preventa"] as const;
export const PROPERTY_OPERATION_FILTER_OPTIONS = [
  "Todas las operaciones",
  ...OPERATION_OPTIONS,
] as const;

export const PAYMENT_OPTIONS = [
  "Efectivo",
  "Infonavit",
  "Cofinavit",
  "Crédito bancario",
  "Fovissste",
  "Issfam",
  "Otro",
] as const;
