import { Navigate, Outlet } from 'react-router-dom';
import { canAccessModule, hasAnyRole } from '../../shared/constants/roles';
import { useAuth } from '../../shared/context/AuthContext';
import type { ModuleKey, Role } from '../../shared/types/rbac';

type ProtectedRouteProps = {
  allowedRoles?: Role[];
  module?: ModuleKey;
};

export function ProtectedRoute({ allowedRoles, module }: ProtectedRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasAnyRole(user.roles, allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  if (module && !canAccessModule(user.roles, module)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
