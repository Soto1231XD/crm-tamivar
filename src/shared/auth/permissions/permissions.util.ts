import type { AppUser } from "../interfaces/auth.interface";
import type { ModuleKey } from "../interfaces/rbac.interface";

export type PermissionAction =
  | "leer"
  | "crear"
  | "actualizar"
  | "eliminar"
  | "leer_todos"
  | "actualizar_todos"
  | "ver_propiedades_vendidas"
  | "*";
export type RecordsReadScope = "none" | "own" | "all";

/**
 * Valida si un set de permisos permite una acción en un módulo.
 * Soporta comodines: *:*, propiedades:*, propiedades:leer
 */
export const checkPermission = (
  userPermissions: string[],
  module: ModuleKey | "*",
  action: PermissionAction = "*",
): boolean => {
  if (userPermissions.includes("*:*")) return true;
  if (userPermissions.includes(`${module}:*`)) return true;
  return userPermissions.includes(`${module}:${action}`);
};

export const getRecordsReadScope = (
  user: AppUser | null | undefined,
): RecordsReadScope => {
  if (!user) return "none";

  const permissions = user.permisos || [];

  if (
    permissions.includes("*:*") ||
    permissions.includes("registros:*") ||
    permissions.includes("registros:leer_todos")
  ) {
    return "all";
  }

  if (checkPermission(permissions, "registros", "leer")) {
    return "own";
  }

  return "none";
};
