import type { ModuleKey } from "./interfaces/rbac.interface";

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: "Dashboard",
  propiedades: "Propiedades",
  registros: "Registros",
  blogs: "Blogs",
  usuarios: "Usuarios",
  roles: "Roles del sistema",
  movimientos: "Movimientos",
};

const DASHBOARD_SOURCE_MODULES: ModuleKey[] = [
  "propiedades",
  "registros",
  "blogs",
  "usuarios",
  "roles",
];

function hasModuleReadAccess(permissions: string[], module: ModuleKey): boolean {
  if (permissions.includes("*:*")) return true;
  if (permissions.includes(`${module}:*`)) return true;
  return permissions.includes(`${module}:leer`);
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
  return firstAvailable ? `/modulos/${firstAvailable}` : "/login";
}
