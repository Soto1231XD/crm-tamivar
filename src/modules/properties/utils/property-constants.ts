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

export const PROPERTY_STATUS_STYLES: Record<
  string,
  { backgroundColor: string; color: string }
> = {
  disponible: { backgroundColor: "#DCFCE7", color: "#166534" },
  apartado: { backgroundColor: "#FEF9C3", color: "#A16207" },
  vendido: { backgroundColor: "#F3F4F6", color: "#374151" },
  baja: { backgroundColor: "#FEE2E2", color: "#991B1B" },
};

export const OPERATION_OPTIONS = ["Venta", "Renta", "Preventa"] as const;

export const PAYMENT_OPTIONS = [
  "Efectivo",
  "Infonavit",
  "Cofinavit",
  "Crédito bancario",
  "Fovissste",
  "Issfam",
  "Otro",
] as const;
