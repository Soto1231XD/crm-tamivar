import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../layout/AppShell";
import { LoginPage } from "@/app/LoginPage";
import { ProtectedRoute } from "./ProtectedRoute";

const DashboardPage = lazy(() =>
  import("@/modules/dashboard/pages/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const PropertiesPage = lazy(() =>
  import("@/modules/properties/pages/PropertiesPage").then((m) => ({ default: m.PropertiesPage }))
);
const CreatePropertyPage = lazy(() =>
  import("@/modules/properties/pages/CreatePropertyPage").then((m) => ({ default: m.CreatePropertyPage }))
);
const EditPropertyPage = lazy(() =>
  import("@/modules/properties/pages/EditPropertyPage").then((m) => ({ default: m.EditPropertyPage }))
);
const PropertyDetailView = lazy(() =>
  import("@/modules/properties/components/PropertyDetailView").then((m) => ({ default: m.PropertyDetailView }))
);
const LeadsPage = lazy(() =>
  import("@/modules/leads/pages/LeadsPage").then((m) => ({ default: m.LeadsPage }))
);
const LeadLeadsPage = lazy(() =>
  import("@/modules/registroLeads/pages/LeadLeadsPage").then((m) => ({ default: m.LeadLeadsPage }))
);
const LeadRequestsPage = lazy(() =>
  import("@/modules/leadRequests/pages/LeadRequestsPage").then((m) => ({ default: m.LeadRequestsPage }))
);
const DevelopmentsPage = lazy(() =>
  import("@/modules/developments/pages/DevelopmentsPage").then((m) => ({ default: m.DevelopmentsPage }))
);
const CreateDevelopmentPage = lazy(() =>
  import("@/modules/developments/pages/CreateDevelopmentPage").then((m) => ({ default: m.CreateDevelopmentPage }))
);
const EditDevelopmentPage = lazy(() =>
  import("@/modules/developments/pages/EditDevelopmentPage").then((m) => ({ default: m.EditDevelopmentPage }))
);
const DevelopmentDetailView = lazy(() =>
  import("@/modules/developments/components/DevelopmentDetailView").then((m) => ({ default: m.DevelopmentDetailView }))
);
const UsersPage = lazy(() =>
  import("@/modules/users/pages/UsersPage").then((m) => ({ default: m.UsersPage }))
);
const SystemRolesPage = lazy(() =>
  import("@/modules/systemRoles/pages/SystemRolesPage").then((m) => ({ default: m.SystemRolesPage }))
);
const ContentPage = lazy(() =>
  import("@/modules/content/pages/ContentPage").then((m) => ({ default: m.ContentPage }))
);
const MaterialPage = lazy(() =>
  import("@/modules/material/pages/MaterialPage").then((m) => ({ default: m.MaterialPage }))
);
const StatisticsPage = lazy(() =>
  import("@/modules/statistics/pages/StatisticsPage").then((m) => ({ default: m.StatisticsPage }))
);
const MovementsPage = lazy(() =>
  import("@/modules/movements/pages/MovementsPage").then((m) => ({ default: m.MovementsPage }))
);

export function AppRoutes() {
  return (
    <Suspense fallback={null}>
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>

          <Route element={<ProtectedRoute module="dashboard" />}>
            <Route path="dashboard" element={<DashboardPage />} />
          </Route>

          <Route element={<ProtectedRoute module="Estadísticas" />}>
            <Route path="modulos/Estadísticas" element={<StatisticsPage />} />
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
          <Route element={<ProtectedRoute module="desarrollos" />}>
            <Route path="modulos/desarrollos" element={<DevelopmentsPage />} />
            <Route
              path="modulos/desarrollos/nuevo"
              element={<CreateDevelopmentPage />}
            />
            <Route
              path="modulos/desarrollos/:id/editar"
              element={<EditDevelopmentPage />}
            />
            <Route
              path="modulos/desarrollos/:id"
              element={<DevelopmentDetailView />}
            />
          </Route>
          <Route path="modulos/material" element={<MaterialPage />} />
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
          <Route element={<ProtectedRoute module="solicitudes_leads" />}>
            <Route path="modulos/solicitudes-leads" element={<LeadRequestsPage />} />
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
    </Suspense>
  );
}
