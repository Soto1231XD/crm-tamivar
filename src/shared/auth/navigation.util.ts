import type { ModuleKey } from "./interfaces/rbac.interface";

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: "Dashboard",
  Estadísticas: "Estadísticas",
  propiedades: "Propiedades",
  desarrollos: "Desarrollos",
  material: "Material",
  registros: "Registros visitas",
  registros_leads: "Registros leads",
  solicitudes_leads: "Solicitudes",
  blogs: "Blogs",
  usuarios: "Usuarios",
  roles: "Roles del sistema",
  movimientos: "Movimientos",
  Operaciones: "Operaciones",
  Comisiones: "Comisiones",
  CarteraClientes: "Cartera de Clientes",
  evaluacion: "Evaluación de Asesores",
};

export const MODULE_PATHS: Record<ModuleKey, string> = {
  dashboard: "/dashboard",
  Estadísticas: "/modulos/Estadísticas",
  propiedades: "/modulos/propiedades",
  desarrollos: "/modulos/desarrollos",
  material: "/modulos/material",
  registros: "/modulos/registros-visitas",
  registros_leads: "/modulos/registros-leads",
  solicitudes_leads: "/modulos/solicitudes-leads",
  blogs: "/modulos/blogs",
  usuarios: "/modulos/usuarios",
  roles: "/modulos/roles",
  movimientos: "/modulos/movimientos",
  Operaciones: "/modulos/operaciones",
  Comisiones: "/modulos/operaciones",
  CarteraClientes: "/modulos/cartera-clientes",
  evaluacion: "/modulos/evaluacion",
};

const DASHBOARD_SOURCE_MODULES: ModuleKey[] = [
  "propiedades",
  "desarrollos",
  "registros",
  "registros_leads",
  "solicitudes_leads",
  "blogs",
  "usuarios",
  "roles",
];

const STATISTICS_ALLOWED_ROLES = [
  "super administrador",
  "administrador",
  "coordinador de ventas",
];

function normalizeRole(role: string): string {
  return role
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function hasModuleReadAccess(permissions: string[], module: ModuleKey): boolean {
  if (permissions.includes("*:*")) return true;
  if (permissions.includes(`${module}:*`)) return true;
  return (
    permissions.includes(`${module}:leer`) ||
    permissions.includes(`${module}:leer_todos`)
  );
}

export function canAccessDashboard(permissions: string[]): boolean {
  return DASHBOARD_SOURCE_MODULES.some((module) =>
    hasModuleReadAccess(permissions, module),
  );
}

export function canAccessStatistics(userRoles: string[] = [], permissions: string[] = []): boolean {
  if (hasModuleReadAccess(permissions, "Estad\u00edsticas")) return true;
  return userRoles
    .map(normalizeRole)
    .some((role) => STATISTICS_ALLOWED_ROLES.includes(role));
}

export function getAvailableModules(
  permissions: string[],
  userRoles: string[] = [],
): ModuleKey[] {
  const allModules: ModuleKey[] = [
    "dashboard",
    "Estadísticas",
    "propiedades",
    "desarrollos",
    "material",
    "registros",
    "registros_leads",
    "solicitudes_leads",
    "blogs",
    "usuarios",
    "roles",
    "movimientos",
    "Operaciones",
    "Comisiones",
    "CarteraClientes",
    "evaluacion",
  ];

  if (permissions.includes("*:*")) return allModules;

  return allModules.filter((module) => {
    if (module === "dashboard") return canAccessDashboard(permissions);
    if (module === "Estadísticas") return canAccessStatistics(userRoles, permissions);
    if (module === "material") return true;
    return permissions.some((permission) => permission.startsWith(`${module}:`));
  });
}

export function getDefaultDashboardPath(
  permissions: string[],
  userRoles: string[] = [],
): string {
  const availableModules = getAvailableModules(permissions, userRoles);

  if (canAccessDashboard(permissions)) return "/dashboard";

  const firstAvailable = availableModules.filter((module) => module !== "dashboard")[0];
  return firstAvailable ? MODULE_PATHS[firstAvailable] : "/login";
}
