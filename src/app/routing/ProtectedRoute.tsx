import { Navigate, Outlet } from "react-router-dom";
import { useHasPermission } from "@/shared/auth/permissions/useHasPermission";
import type { ModuleKey } from "@/shared/auth/interfaces/rbac.interface";

type ProtectedRouteProps = {
  module?: ModuleKey;
};

export function ProtectedRoute({ module }: ProtectedRouteProps) {
  const { can, userPermissions } = useHasPermission()

  // Si no hay permisos, no hay sesión válida
  if (!userPermissions || userPermissions.length === 0) {
    return <Navigate to="/login" replace />;
  }

  // Si la ruta es de un módulo, verificamos permiso de 'leer' o comodín absoluto
  if (module && !can(module, 'leer') && !can(module, '*')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}