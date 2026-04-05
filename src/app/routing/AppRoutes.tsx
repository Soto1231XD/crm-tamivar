import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../layout/AppShell";
import { LoginPage } from "@/app/LoginPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { DashboardPage } from "@/modules/dashboard/pages/DashboardPage";
import { PropertiesPage } from "@/modules/properties/pages/PropertiesPage";
import { CreatePropertyPage } from "@/modules/properties/pages/CreatePropertyPage";
import { EditPropertyPage } from "@/modules/properties/pages/EditPropertyPage";
import { LeadsPage } from "@/modules/leads/pages/LeadsPage";
import { LeadLeadsPage } from "@/modules/registroLeads/pages/LeadLeadsPage";
import { UsersPage } from "@/modules/users/pages/UsersPage";
import { SystemRolesPage } from "@/modules/systemRoles/pages/SystemRolesPage";
import { ContentPage } from "@/modules/content/pages/ContentPage";
import { PropertyDetailView } from "@/modules/properties/components/PropertyDetailView";
import { MovementsPage } from "@/modules/movements/pages/MovementsPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>

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
            <Route path="modulos/propiedades/:id" element={<PropertyDetailView />} />
          </Route>
          <Route element={<ProtectedRoute module="registros" />}>
            <Route
              path="modulos/registros"
              element={<Navigate to="/modulos/registros-visitas" replace />}
            />
            <Route path="modulos/registros-visitas" element={<LeadsPage />} />
          </Route>
          <Route element={<ProtectedRoute module="registros_leads" />}>
            <Route path="modulos/registros-leads" element={<LeadLeadsPage />} />
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
            <Route path="modulos/movimientos" element={<MovementsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
