import type { AppUser } from "../interfaces/auth.interface";
import type { ModuleKey } from "../interfaces/rbac.interface";

export type PermissionAction = "leer" | "crear" | "actualizar" | "eliminar" | "*";
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
    permissions.includes("registros:leer:all") ||
    permissions.includes("registros:all")
  ) {
    return "all";
  }

  if (
    permissions.includes("registros:leer:own") ||
    permissions.includes("registros:own")
  ) {
    return "own";
  }

  if (checkPermission(permissions, "registros", "leer")) {
    // Fallback temporal mientras backend no exponga own/all en permisos.
    if (user.roles?.includes("Asesor de Ventas")) {
      return "own";
    }

    return "all";
  }

  return "none";
};
