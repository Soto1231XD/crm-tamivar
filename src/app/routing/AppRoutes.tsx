import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../layout/AppShell';
import { DashboardPage } from '../../modules/dashboard/pages/DashboardPage';
import { PropertiesPage } from '../../modules/properties/pages/PropertiesPage';
import { LeadsPage } from '../../modules/leads/pages/LeadsPage';
import { UsersPage } from '../../modules/users/pages/UsersPage';
import { HrPage } from '../../modules/hr/pages/HrPage';
import { LoginPage } from '../../modules/auth/pages/LoginPage';
import { ProtectedRoute } from './ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AppShell />}>
        <Route element={<ProtectedRoute module="dashboard" />}>
          <Route path="/" element={<DashboardPage />} />
        </Route>

        <Route element={<ProtectedRoute module="properties" />}>
          <Route path="/propiedades" element={<PropertiesPage />} />
        </Route>

        <Route element={<ProtectedRoute module="leads" />}>
          <Route path="/registros" element={<LeadsPage />} />
        </Route>

        <Route element={<ProtectedRoute module="users" />}>
          <Route path="/usuarios" element={<UsersPage />} />
        </Route>

        <Route element={<ProtectedRoute module="hr" />}>
          <Route path="/rh" element={<HrPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

