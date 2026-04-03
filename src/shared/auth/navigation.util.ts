import type { ModuleKey } from "./interfaces/rbac.interface";

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: "Dashboard",
  propiedades: "Propiedades",
  registros: "Registros visitas",
  registros_leads: "Registros leads",
  blogs: "Blogs",
  usuarios: "Usuarios",
  roles: "Roles del sistema",
  movimientos: "Movimientos",
};

export const MODULE_PATHS: Record<ModuleKey, string> = {
  dashboard: "/dashboard",
  propiedades: "/modulos/propiedades",
  registros: "/modulos/registros-visitas",
  registros_leads: "/modulos/registros-leads",
  blogs: "/modulos/blogs",
  usuarios: "/modulos/usuarios",
  roles: "/modulos/roles",
  movimientos: "/modulos/movimientos",
};

const DASHBOARD_SOURCE_MODULES: ModuleKey[] = [
  "propiedades",
  "registros",
  "registros_leads",
  "blogs",
  "usuarios",
  "roles",
];

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

export function getAvailableModules(permissions: string[]): ModuleKey[] {
  const allModules: ModuleKey[] = [
    "dashboard",
    "propiedades",
    "registros",
    "registros_leads",
    "blogs",
    "usuarios",
    "roles",
    "movimientos",
  ];

  if (permissions.includes("*:*")) return allModules;

  return allModules.filter((module) => {
    if (module === "dashboard") return canAccessDashboard(permissions);
    return permissions.some((permission) => permission.startsWith(`${module}:`));
  });
}

export function getDefaultDashboardPath(permissions: string[]): string {
  const availableModules = getAvailableModules(permissions);

  if (canAccessDashboard(permissions)) return "/dashboard";

  const firstAvailable = availableModules.filter((module) => module !== "dashboard")[0];
  return firstAvailable ? MODULE_PATHS[firstAvailable] : "/login";
}
