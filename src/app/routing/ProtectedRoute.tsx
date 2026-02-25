import { Navigate, Outlet } from 'react-router-dom';
import { canAccessModule } from '../../shared/constants/roles';
import { useAuth } from '../../shared/context/AuthContext';
import type { ModuleKey } from '../../shared/types/rbac';

type ProtectedRouteProps = {
  module: ModuleKey;
};

export function ProtectedRoute({ module }: ProtectedRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessModule(user.roles, module)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
