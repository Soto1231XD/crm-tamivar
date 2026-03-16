import { useAuthStore } from "../useAuthStore";
import { checkPermission, type PermissionAction } from "./permissions.util";
import type { ModuleKey } from "../interfaces/rbac.interface";

export const useHasPermission = () => {
  const user = useAuthStore((state) => state.user);
  const userPermissions = user?.permisos || [];

  /**
   * can('properties', 'actualizar')
   */
  const can = (module: ModuleKey, action: PermissionAction = 'leer'): boolean => {
    // Si no hay usuario, no hay permisos
    if (!user) return false;
    
    return checkPermission(userPermissions, module, action);
  };

  // Atajo para saber si es Super Admin (por rol o por comodín)
  const isSuperAdmin = user?.roles.includes('Super Administrador') || userPermissions.includes('*:*');

  return { 
    can, 
    isSuperAdmin, 
    userPermissions 
  };
};