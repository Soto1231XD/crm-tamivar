import type { ModuleKey } from "../interfaces/rbac.interface";

export type PermissionAction = 'leer' | 'crear' | 'actualizar' | 'eliminar' | '*';

/**
 * Valida si un set de permisos permite una acción en un módulo.
 * Soporta comodines: *:*, propiedades:*, propiedades:leer
 */
export const checkPermission = (
  userPermissions: string[],
  module: ModuleKey | '*',
  action: PermissionAction = '*'
): boolean => {
  // Super Admin absoluto
  if (userPermissions.includes('*:*')) return true;

  // Comodín de módulo completo (ej. propiedades:*)
  if (userPermissions.includes(`${module}:*`)) return true;

  // Permiso específico (ej. propiedades:leer)
  return userPermissions.includes(`${module}:${action}`);
};