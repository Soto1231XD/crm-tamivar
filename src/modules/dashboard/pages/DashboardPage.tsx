import { useEffect, useMemo } from 'react';
import { ROLE_LABELS, getPrimaryRole, getUserDisplayName } from '../../../shared/constants/roles';
import { useAuth } from '../../../shared/context/AuthContext';
import { DashboardSectionCard } from '../components/DashboardSectionCard';
import { DashboardSummaryCards } from '../components/DashboardSummaryCards';
import { DASHBOARD_CARD_TITLES, DASHBOARD_ENABLED_ROLES, DASHBOARD_SECTION_TITLES } from '../dashboard.config';
import { getSectionEmptyMessage, getSectionItemsCount, renderSectionItems } from '../dashboard.utils';
import { useDashboardStore } from '../store/useDashboardStore';

export function DashboardPage() {
  const { user, accessToken } = useAuth();
  const primaryRole = getPrimaryRole(user?.roles ?? []);
  const displayName = getUserDisplayName(user);
  const { summary, isLoading, error, fetchSummary, reset } = useDashboardStore();

  useEffect(() => {
    if (!accessToken || !primaryRole || !DASHBOARD_ENABLED_ROLES.includes(primaryRole)) {
      reset();
      return;
    }

    void fetchSummary(accessToken, primaryRole, user?.id);
  }, [accessToken, fetchSummary, primaryRole, reset, user?.id]);

  const cardValues = useMemo(
    () => ({
      'Propiedades Disponibles': summary.propiedadesDisponibles,
      Registros: summary.registros,
      'Propiedades vendidas': summary.propiedadesVendidas,
      Blogs: summary.blogs,
      'Roles del sistema': summary.rolesSistema,
      'Usuarios del sistema': summary.usuariosSistema,
    }),
    [
      summary.blogs,
      summary.propiedadesDisponibles,
      summary.propiedadesVendidas,
      summary.registros,
      summary.rolesSistema,
      summary.usuariosSistema,
    ],
  );

  const sectionData = useMemo(
    () => ({
      registrosRecientes: primaryRole === 'ASESOR_VENTAS' ? summary.misRegistrosRecientes : summary.registrosRecientes,
      propiedadesRecientes: summary.propiedadesRecientes,
      usuariosRecientes: summary.usuariosRecientes,
      misPublicaciones: summary.misPublicaciones,
    }),
    [
      primaryRole,
      summary.misPublicaciones,
      summary.misRegistrosRecientes,
      summary.propiedadesRecientes,
      summary.registrosRecientes,
      summary.usuariosRecientes,
    ],
  );

  const dashboardCards = primaryRole ? DASHBOARD_CARD_TITLES[primaryRole] ?? [] : [];
  const dashboardSections = primaryRole ? DASHBOARD_SECTION_TITLES[primaryRole] ?? [] : [];
  const canViewDashboard = primaryRole ? DASHBOARD_ENABLED_ROLES.includes(primaryRole) : false;

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-700 bg-welcome-800 p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-white">{`Bienvenido, ${displayName}`}</h2>
        <p className="mt-2 text-sm text-slate-200">{primaryRole ? ROLE_LABELS[primaryRole] : 'Sin rol asignado'}</p>
      </section>

      {canViewDashboard ? (
        <section className="space-y-3">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <DashboardSummaryCards titles={dashboardCards} values={cardValues} isLoading={isLoading} />

          <div className="grid gap-4 lg:grid-cols-2">
            {dashboardSections.map((sectionTitle) => (
              <DashboardSectionCard
                key={sectionTitle}
                title={sectionTitle}
                hasItems={getSectionItemsCount(sectionTitle, sectionData) > 0}
                emptyMessage={getSectionEmptyMessage(sectionTitle)}
              >
                {renderSectionItems(sectionTitle, sectionData)}
              </DashboardSectionCard>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
