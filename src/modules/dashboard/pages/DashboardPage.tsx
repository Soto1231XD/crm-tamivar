import { useEffect, useMemo, useState } from "react";
import { getLeads } from "../../leads/services/leads.api";
import { getProperties } from "../../properties/services/properties.api";
import { getSystemRoles } from "../../systemRoles/services/systemRoles.api";
import { DashboardSectionCard } from "../components/DashboardSectionCard";
import { DashboardSummaryCards } from "../components/DashboardSummaryCards";
import {
  DASHBOARD_CARD_TITLES,
  DASHBOARD_ENABLED_ROLES,
  DASHBOARD_SECTION_TITLES,
  type AppRole,
} from "../dashboard.config";
import {
  type RecentLeadItem,
  type RecentPropertyItem,
  type RecentPublicationItem,
  type RecentUserItem,
  getSectionEmptyMessage,
  getSectionItemsCount,
  renderSectionItems,
} from "../dashboard.utils";
import {
  getDashboardSummary,
  getRecentPropertiesFallback,
} from "../services/dashboard.api";
import { useAuthStore } from "@/shared/auth/useAuthStore";

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
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.token);

  const primaryRole = user?.roles?.[0] as AppRole | undefined;

  const displayName = user
    ? `${user.nombres || ""} ${user.apellido_paterno || ""}`.trim() ||
      user.correo_electronico
    : "Usuario";

  const [summary, setSummary] =
    useState<DashboardSummaryState>(INITIAL_SUMMARY);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  useEffect(() => {
    if (
      !accessToken ||
      !primaryRole ||
      !DASHBOARD_ENABLED_ROLES.includes(primaryRole)
    ) {
      return;
    }

    let isActive = true;
    setIsLoadingSummary(true);
    setSummaryError("");

    Promise.all([
      getDashboardSummary(accessToken),
      getProperties(),
      getSystemRoles(accessToken),
      getLeads(),
    ])
      .then(async ([data, properties, roles, leads]) => {
        if (!isActive) return;

        const propiedadesRecientes = Array.isArray(data.propiedades_recientes)
          ? data.propiedades_recientes
          : [];
        const propiedadesDisponiblesActivas = Array.isArray(properties)
          ? properties.filter(
              (property) =>
                normalizePropertyStatus(property.estatus) === "disponible",
            ).length
          : 0;
        const propiedadesVendidas = Array.isArray(properties)
          ? properties.filter(
              (property) =>
                normalizePropertyStatus(property.estatus) === "vendido",
            ).length
          : 0;

        const propiedadesRecientesFinal =
          propiedadesRecientes.length > 0
            ? propiedadesRecientes
            : await getRecentPropertiesFallback();

        if (!isActive) return;

        const ownLeads =
          primaryRole === "Asesor de Ventas" && user?.id
            ? leads.filter((lead) => lead.creador?.id === user.id)
            : [];

        const ownRecentLeads = ownLeads
          .slice()
          .sort((left, right) => {
            const leftDate = left.creado_en
              ? new Date(left.creado_en).getTime()
              : 0;
            const rightDate = right.creado_en
              ? new Date(right.creado_en).getTime()
              : 0;
            return rightDate - leftDate;
          })
          .slice(0, 5)
          .map((lead) => ({
            nombre: lead.nombres,
            apellido: lead.apellidos,
            correo: lead.correo_electronico ?? "Sin correo",
            estado: lead.estado ?? "Sin estado",
          }));

        setSummary({
          propiedadesDisponibles: propiedadesDisponiblesActivas,
          propiedadesVendidas,
          registros:
            primaryRole === "Asesor de Ventas"
              ? ownLeads.length
              : data.registros,
          blogs: Array.isArray(data.mis_publicaciones)
            ? data.mis_publicaciones.length
            : 0,
          rolesSistema: Array.isArray(roles) ? roles.length : 0,
          usuariosSistema: data.usuarios_sistema,
          registrosRecientes: Array.isArray(data.registros_recientes)
            ? data.registros_recientes
            : [],
          misRegistrosRecientes: ownRecentLeads,
          propiedadesRecientes: propiedadesRecientesFinal,
          usuariosRecientes: Array.isArray(data.usuarios_recientes)
            ? data.usuarios_recientes
            : [],
          misPublicaciones: Array.isArray(data.mis_publicaciones)
            ? data.mis_publicaciones
            : [],
        });
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        setSummaryError(
          error instanceof Error
            ? error.message
            : "No fue posible cargar estadísticas.",
        );
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
      "Propiedades Disponibles": summary.propiedadesDisponibles,
      Registros: summary.registros,
      "Propiedades vendidas": summary.propiedadesVendidas,
      Blogs: summary.blogs,
      "Roles del sistema": summary.rolesSistema,
      "Usuarios del sistema": summary.usuariosSistema,
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
      registrosRecientes:
        primaryRole === "Asesor de Ventas"
          ? summary.misRegistrosRecientes
          : summary.registrosRecientes,
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

  const dashboardCards = primaryRole
    ? (DASHBOARD_CARD_TITLES[primaryRole] ?? [])
    : [];
  const dashboardSections = primaryRole
    ? (DASHBOARD_SECTION_TITLES[primaryRole] ?? [])
    : [];
  const canViewDashboard = primaryRole
    ? DASHBOARD_ENABLED_ROLES.includes(primaryRole)
    : false;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-300/80 bg-[#E6ECF5] px-6 py-7 shadow-sm sm:px-8">
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              Panel principal
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-[2rem]">
              {`Bienvenido, ${displayName}`}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Consulta el estado general del CRM, revisa actividad reciente y da seguimiento
              a la operación desde un solo lugar.
            </p>
          </div>

          <div className="inline-flex w-fit flex-col rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 shadow-sm backdrop-blur-sm">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Perfil actual
            </span>
            <span className="mt-2 text-sm font-semibold text-slate-900">
              {primaryRole || "Sin rol asignado"}
            </span>
          </div>
        </div>
      </section>

      {canViewDashboard ? (
        <section className="space-y-5">
          {summaryError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {summaryError}
            </div>
          ) : null}

          <DashboardSummaryCards
            titles={dashboardCards}
            values={cardValues}
            isLoading={isLoadingSummary}
          />

          <div className="flex items-center justify-between gap-3 px-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Seguimiento
              </p>
              <h3 className="mt-2 text-lg font-bold tracking-tight text-slate-950">
                Actividad reciente
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Resumen visual de los movimientos más recientes del CRM.
              </p>
            </div>
          </div>

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

function normalizePropertyStatus(status?: string | null): string {
  return typeof status === "string" ? status.trim().toLowerCase() : "";
}
