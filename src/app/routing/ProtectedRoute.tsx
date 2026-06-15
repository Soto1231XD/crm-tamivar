import { Navigate, Outlet } from "react-router-dom";
import { canAccessDashboard, canAccessStatistics } from "@/shared/auth/navigation.util";
import { useAuthStore } from "@/shared/auth/useAuthStore";
import { useHasPermission } from "@/shared/auth/permissions/useHasPermission";
import type { ModuleKey } from "@/shared/auth/interfaces/rbac.interface";
import { isTokenExpired } from "@/shared/auth/token.utils";

type ProtectedRouteProps = {
  module?: ModuleKey;
};

export function ProtectedRoute({ module }: ProtectedRouteProps) {
  const token = useAuthStore((state) => state.token);
  const userRoles = useAuthStore((state) => state.user?.roles ?? []);
  const { can, userPermissions } = useHasPermission();

  if (
    !token ||
    isTokenExpired(token) ||
    !userPermissions ||
    userPermissions.length === 0
  ) {
    return <Navigate to="/login" replace />;
  }

  if (module === "dashboard" && !canAccessDashboard(userPermissions)) {
    return <Navigate to="/login" replace />;
  }

  if (module === "Estadísticas" && !canAccessStatistics(userRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (
    module &&
    module !== "dashboard" &&
    module !== "Estadísticas" &&
    !can(module, "leer") &&
    !can(module, "leer_todos") &&
    !can(module, "*")
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
