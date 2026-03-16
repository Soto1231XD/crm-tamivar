import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../layout/AppShell";
import { LoginPage } from "@/app/LoginPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleHomeRedirect } from "./RoleHomeRedirect";
import { DashboardPage } from "@/modules/dashboard/pages/DashboardPage";
import { ModulePage } from "@/modules/dashboard/pages/ModulePage";
import { PropertiesPage } from "@/modules/properties/pages/PropertiesPage";
import { CreatePropertyPage } from "@/modules/properties/pages/CreatePropertyPage";
import { EditPropertyPage } from "@/modules/properties/pages/EditPropertyPage";
import { LeadsPage } from "@/modules/leads/pages/LeadsPage";
import { UsersPage } from "@/modules/users/pages/UsersPage";
import { SystemRolesPage } from "@/modules/systemRoles/pages/SystemRolesPage";
import { ContentPage } from "@/modules/content/pages/ContentPage";

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

          <Route element={<ProtectedRoute module="propiedades" />}>
            <Route path="modulos/propiedades" element={<PropertiesPage />} />
            <Route
              path="modulos/propiedades/nuevo"
              element={<CreatePropertyPage />}
            />
            <Route
              path="modulos/propiedades/:propertyId/editar"
              element={<EditPropertyPage />}
            />
          </Route>
          <Route element={<ProtectedRoute module="registros" />}>
            <Route path="modulos/registros" element={<LeadsPage />} />
          </Route>
          <Route element={<ProtectedRoute module="usuarios" />}>
            <Route path="modulos/usuarios" element={<UsersPage />} />
          </Route>
          <Route element={<ProtectedRoute module="blogs" />}>
            <Route path="modulos/blogs" element={<ContentPage />} />
          </Route>
          <Route element={<ProtectedRoute module="roles" />}>
            <Route path="modulos/roles" element={<SystemRolesPage />} />
          </Route>
          <Route element={<ProtectedRoute module="movimientos" />}>
            <Route path="modulos/movimientos" element={<ModulePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
