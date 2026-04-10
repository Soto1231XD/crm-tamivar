import { Navigate, Outlet } from "react-router-dom";
import { canAccessDashboard } from "@/shared/auth/navigation.util";
import { useHasPermission } from "@/shared/auth/permissions/useHasPermission";
import type { ModuleKey } from "@/shared/auth/interfaces/rbac.interface";

type ProtectedRouteProps = {
  module?: ModuleKey;
};

export function ProtectedRoute({ module }: ProtectedRouteProps) {
  const { can, userPermissions } = useHasPermission();

  if (!userPermissions || userPermissions.length === 0) {
    return <Navigate to="/login" replace />;
  }

  if (module === "dashboard" && !canAccessDashboard(userPermissions)) {
    return <Navigate to="/login" replace />;
  }

  if (
    module &&
    module !== "dashboard" &&
    !can(module, "leer") &&
    !can(module, "leer_todos") &&
    !can(module, "*")
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
