import type { ModuleKey } from "@/shared/auth/interfaces/rbac.interface";

export type DashboardCardTitle =
  | "Propiedades Disponibles"
  | "Registros"
  | "Propiedades vendidas"
  | "Blogs"
  | "Usuarios del sistema"
  | "Roles del sistema";

export type DashboardSectionTitle =
  | "Registros Recientes"
  | "Propiedades Recientes"
  | "Usuarios"
  | "Publicaciones";

type DashboardCan = (module: ModuleKey, action?: "leer") => boolean;

const DASHBOARD_CARD_MODULES: Record<DashboardCardTitle, ModuleKey> = {
  "Propiedades Disponibles": "propiedades",
  Registros: "registros",
  "Propiedades vendidas": "propiedades",
  Blogs: "blogs",
  "Usuarios del sistema": "usuarios",
  "Roles del sistema": "roles",
};

const DASHBOARD_SECTION_MODULES: Record<DashboardSectionTitle, ModuleKey> = {
  "Registros Recientes": "registros",
  "Propiedades Recientes": "propiedades",
  Usuarios: "usuarios",
  Publicaciones: "blogs",
};

const DASHBOARD_CARD_ORDER: readonly DashboardCardTitle[] = [
  "Propiedades Disponibles",
  "Registros",
  "Propiedades vendidas",
  "Blogs",
  "Usuarios del sistema",
  "Roles del sistema",
];

const DASHBOARD_SECTION_ORDER: readonly DashboardSectionTitle[] = [
  "Registros Recientes",
  "Propiedades Recientes",
  "Usuarios",
  "Publicaciones",
];

export function getVisibleDashboardCards(can: DashboardCan): DashboardCardTitle[] {
  return DASHBOARD_CARD_ORDER.filter((title) => can(DASHBOARD_CARD_MODULES[title], "leer"));
}

export function getVisibleDashboardSections(can: DashboardCan): DashboardSectionTitle[] {
  return DASHBOARD_SECTION_ORDER.filter((title) => can(DASHBOARD_SECTION_MODULES[title], "leer"));
}
