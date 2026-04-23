import type { ModuleKey } from "@/shared/auth/interfaces/rbac.interface";
import type { PermissionAction } from "@/shared/auth/permissions/permissions.util";

export type DashboardCardTitle =
  | "Propiedades Disponibles"
  | "Registros visitas"
  | "Registros leads"
  | "Propiedades vendidas"
  | "Blogs"
  | "Usuarios del sistema"
  | "Roles del sistema";

export type DashboardSectionTitle =
  | "Registros Recientes"
  | "Propiedades Recientes"
  | "Usuarios"
  | "Publicaciones";

type DashboardCan = (module: ModuleKey, action?: PermissionAction) => boolean;

function canReadDashboardModule(can: DashboardCan, module: ModuleKey): boolean {
  return can(module, "leer") || can(module, "leer_todos");
}

const DASHBOARD_CARD_MODULES: Record<DashboardCardTitle, ModuleKey> = {
  "Propiedades Disponibles": "propiedades",
  "Registros visitas": "registros",
  "Registros leads": "registros_leads",
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
  "Registros visitas",
  "Registros leads",
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
  return DASHBOARD_CARD_ORDER.filter((title) => {
    if (title === "Propiedades vendidas") {
      return can("dashboard", "ver_propiedades_vendidas");
    }

    return canReadDashboardModule(can, DASHBOARD_CARD_MODULES[title]);
  });
}

export function getVisibleDashboardSections(can: DashboardCan): DashboardSectionTitle[] {
  return DASHBOARD_SECTION_ORDER.filter((title) =>
    canReadDashboardModule(can, DASHBOARD_SECTION_MODULES[title]),
  );
}
