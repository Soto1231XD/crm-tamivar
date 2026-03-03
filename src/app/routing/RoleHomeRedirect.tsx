import { Navigate } from 'react-router-dom';
import { getDefaultDashboardPath } from '../../shared/constants/roles';
import { useAuth } from '../../shared/context/AuthContext';

export function RoleHomeRedirect() {
  const { user } = useAuth();
  const targetPath = getDefaultDashboardPath(user?.roles ?? []);

  return <Navigate to={targetPath} replace />;
}

