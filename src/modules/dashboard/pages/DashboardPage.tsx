import { useEffect, useMemo, useState } from 'react';
import { ROLE_LABELS, getPrimaryRole, getUserDisplayName } from '../../../shared/constants/roles';
import { useAuth } from '../../../shared/context/AuthContext';
import { getLeads } from '../../leads/services/leads.api';
import { getProperties } from '../../properties/services/properties.api';
import { getSystemRoles } from '../../systemRoles/services/systemRoles.api';
import { DashboardSectionCard } from '../components/DashboardSectionCard';
import { DashboardSummaryCards } from '../components/DashboardSummaryCards';
import { DASHBOARD_CARD_TITLES, DASHBOARD_ENABLED_ROLES, DASHBOARD_SECTION_TITLES } from '../dashboard.config';
import {
  type RecentLeadItem,
  type RecentPropertyItem,
  type RecentPublicationItem,
  type RecentUserItem,
  getSectionEmptyMessage,
  getSectionItemsCount,
  renderSectionItems,
} from '../dashboard.utils';
import { getDashboardSummary, getRecentPropertiesFallback } from '../services/dashboard.api';

type DashboardSummaryState = {
  propiedadesDisponibles: number;
  propiedadesVendidas: number;
  registros: number;
  blogs: number;
  rolesSistema: number;
  usuariosSistema: number;
  registrosRecientes: RecentLeadItem[];
  misRegistrosRecientes: RecentLeadItem[];
  propiedadesRecientes: RecentPropertyItem[];
  usuariosRecientes: RecentUserItem[];
  misPublicaciones: RecentPublicationItem[];
};

const INITIAL_SUMMARY: DashboardSummaryState = {
  propiedadesDisponibles: 0,
  propiedadesVendidas: 0,
  registros: 0,
  blogs: 0,
  rolesSistema: 0,
  usuariosSistema: 0,
  registrosRecientes: [],
  misRegistrosRecientes: [],
  propiedadesRecientes: [],
  usuariosRecientes: [],
  misPublicaciones: [],
};

export function DashboardPage() {
  const { user, accessToken } = useAuth();
  const primaryRole = getPrimaryRole(user?.roles ?? []);
  const displayName = getUserDisplayName(user);
  const [summary, setSummary] = useState<DashboardSummaryState>(INITIAL_SUMMARY);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  useEffect(() => {
    if (!accessToken || !primaryRole || !DASHBOARD_ENABLED_ROLES.includes(primaryRole)) {
      return;
    }

    let isActive = true;
    setIsLoadingSummary(true);
    setSummaryError('');

    Promise.all([getDashboardSummary(accessToken), getProperties(), getSystemRoles(accessToken), getLeads()])
      .then(async ([data, properties, roles, leads]) => {
        if (!isActive) return;

        const propiedadesRecientes = Array.isArray(data.propiedades_recientes) ? data.propiedades_recientes : [];
        const propiedadesDisponiblesActivas = Array.isArray(properties)
          ? properties.filter((property) => property.activo === true).length
          : 0;
        const propiedadesVendidas = Array.isArray(properties)
          ? properties.filter(
              (property) =>
                property.activo === true &&
                typeof property.estatus === 'string' &&
                property.estatus.trim().toLowerCase() === 'vendido',
            ).length
          : 0;

        const propiedadesRecientesFinal =
          propiedadesRecientes.length > 0 ? propiedadesRecientes : await getRecentPropertiesFallback();

        if (!isActive) return;

        const ownLeads =
          primaryRole === 'ASESOR_VENTAS' && user?.id
            ? leads.filter((lead) => lead.creador?.id === user.id)
            : [];

        const ownRecentLeads = ownLeads
          .slice()
          .sort((left, right) => {
            const leftDate = left.creado_en ? new Date(left.creado_en).getTime() : 0;
            const rightDate = right.creado_en ? new Date(right.creado_en).getTime() : 0;
            return rightDate - leftDate;
          })
          .slice(0, 5)
          .map((lead) => ({
            nombre: lead.nombres,
            apellido: lead.apellidos,
            correo: lead.correo_electronico ?? 'Sin correo',
            estado: lead.estado ?? 'Sin estado',
          }));

        setSummary({
          propiedadesDisponibles: propiedadesDisponiblesActivas,
          propiedadesVendidas,
          registros: primaryRole === 'ASESOR_VENTAS' ? ownLeads.length : data.registros,
          blogs: Array.isArray(data.mis_publicaciones) ? data.mis_publicaciones.length : 0,
          rolesSistema: Array.isArray(roles) ? roles.length : 0,
          usuariosSistema: data.usuarios_sistema,
          registrosRecientes: Array.isArray(data.registros_recientes) ? data.registros_recientes : [],
          misRegistrosRecientes: ownRecentLeads,
          propiedadesRecientes: propiedadesRecientesFinal,
          usuariosRecientes: Array.isArray(data.usuarios_recientes) ? data.usuarios_recientes : [],
          misPublicaciones: Array.isArray(data.mis_publicaciones) ? data.mis_publicaciones : [],
        });
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        setSummaryError(error instanceof Error ? error.message : 'No fue posible cargar estadísticas.');
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoadingSummary(false);
      });

    return () => {
      isActive = false;
    };
  }, [accessToken, primaryRole, user?.id]);

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
          {summaryError ? <p className="text-sm text-red-600">{summaryError}</p> : null}
          <DashboardSummaryCards titles={dashboardCards} values={cardValues} isLoading={isLoadingSummary} />

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
