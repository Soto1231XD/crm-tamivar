import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../layout/AppShell';
import { LoginPage } from '../../modules/auth/pages/LoginPage';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleHomeRedirect } from './RoleHomeRedirect';
import { DashboardPage } from '../../modules/dashboard/pages/DashboardPage';
import { ModulePage } from '../../modules/dashboard/pages/ModulePage';
import { PropertiesPage } from '../../modules/properties/pages/PropertiesPage';
import { CreatePropertyPage } from '../../modules/properties/pages/CreatePropertyPage';
import { EditPropertyPage } from '../../modules/properties/pages/EditPropertyPage';
import { LeadsPage } from '../../modules/leads/pages/LeadsPage';
import { UsersPage } from '../../modules/users/pages/UsersPage';
import { SystemRolesPage } from '../../modules/systemRoles/pages/SystemRolesPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<RoleHomeRedirect />} />

          <Route element={<ProtectedRoute module="dashboard" />}>
            <Route path="dashboard" element={<DashboardPage />} />
          </Route>

          <Route element={<ProtectedRoute module="properties" />}>
            <Route path="modulos/properties" element={<PropertiesPage />} />
            <Route path="modulos/properties/new" element={<CreatePropertyPage />} />
            <Route path="modulos/properties/:propertyId/edit" element={<EditPropertyPage />} />
          </Route>
          <Route element={<ProtectedRoute module="leads" />}>
            <Route path="modulos/leads" element={<LeadsPage />} />
          </Route>
          <Route element={<ProtectedRoute module="users" />}>
            <Route path="modulos/users" element={<UsersPage />} />
          </Route>
          <Route element={<ProtectedRoute module="content" />}>
            <Route path="modulos/content" element={<ModulePage />} />
          </Route>
          <Route element={<ProtectedRoute module="system_roles" />}>
            <Route path="modulos/system_roles" element={<SystemRolesPage />} />
          </Route>
          <Route element={<ProtectedRoute module="system_logs" />}>
            <Route path="modulos/system_logs" element={<ModulePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
