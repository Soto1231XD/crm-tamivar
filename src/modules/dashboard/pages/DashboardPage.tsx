import { useEffect, useMemo, useState } from "react";
import type { BlogRecord } from "@/interfaces/blog.interface";
import type { UserRecord } from "@/interfaces/user.interface";
import { useAuthStore } from "@/shared/auth/useAuthStore";
import {
  extractUserRoles,
  getHighestPriorityRoleLabel,
} from "@/shared/auth/role.utils";
import { useHasPermission } from "@/shared/auth/permissions/useHasPermission";
import { canAccessDashboard } from "@/shared/auth/navigation.util";
import { useThemeStore } from "@/shared/theme/useThemeStore";
import { getBlogs } from "../../content/services/content.api";
import { getLeads } from "../../leads/services/leads.api";
import { getProperties } from "../../properties/services/properties.api";
import { getPrimaryPropertyPrice } from "../../properties/utils/formatters";
import { getLeadLeads } from "../../registroLeads/services/leadLeads.api";
import { getSystemRoles } from "../../systemRoles/services/systemRoles.api";
import { getUsers } from "../../users/services/users.api";
import { DashboardSectionCard } from "../components/DashboardSectionCard";
import { DashboardSummaryCards } from "../components/DashboardSummaryCards";
import {
  getVisibleDashboardCards,
  getVisibleDashboardSections,
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

type DashboardSummaryState = {
  propiedadesDisponibles: number;
  propiedadesVendidas: number;
  registros: number;
  registrosLeads: number;
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
  registrosLeads: 0,
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
  const theme = useThemeStore((state) => state.theme);
  const { can, userPermissions } = useHasPermission();
  const isDark = theme === "dark";

  const displayName = user
    ? `${user.nombres || ""} ${user.apellido_paterno || ""}`.trim() ||
      user.correo_electronico
    : "Usuario";
  const primaryRoleDisplay = user
    ? getHighestPriorityRoleLabel(user)
    : "Sin rol asignado";
  const canViewDashboard = canAccessDashboard(userPermissions);
  const dashboardCards = getVisibleDashboardCards(can);
  const dashboardSections = getVisibleDashboardSections(can);

  const canReadProperties =
    can("propiedades", "leer") || can("propiedades", "leer_todos");
  const canReadRegistros =
    can("registros", "leer") || can("registros", "leer_todos");
  const canReadRegistrosLeads =
    can("registros_leads", "leer") || can("registros_leads", "leer_todos");
  const canReadBlogs = can("blogs", "leer") || can("blogs", "leer_todos");
  const canReadUsers =
    can("usuarios", "leer") || can("usuarios", "leer_todos");
  const canReadRoles = can("roles", "leer") || can("roles", "leer_todos");

  const [summary, setSummary] = useState<DashboardSummaryState>(INITIAL_SUMMARY);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  useEffect(() => {
    if (!accessToken || !canViewDashboard) {
      return;
    }

    let isActive = true;
    setIsLoadingSummary(true);
    setSummaryError("");

    Promise.all([
      canReadProperties ? getProperties() : Promise.resolve([]),
      canReadRegistros ? getLeads() : Promise.resolve([]),
      canReadRegistrosLeads ? getLeadLeads() : Promise.resolve([]),
      canReadBlogs ? getBlogs() : Promise.resolve([]),
      canReadUsers ? getUsers(accessToken) : Promise.resolve([]),
      canReadRoles ? getSystemRoles(accessToken) : Promise.resolve([]),
    ])
      .then(([properties, leads, leadLeads, blogs, users, roles]) => {
        if (!isActive) return;

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

        const propiedadesRecientes = Array.isArray(properties)
          ? properties
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
              .map((property) => ({
                tipo_inmueble: property.tipo_inmueble,
                direccion: {
                  calle: property.direccion?.calle ?? "",
                  municipio: property.direccion?.municipio ?? "",
                  fraccionamiento: property.direccion?.fraccionamiento ?? "",
                },
                estatus: property.estatus,
                precio: String(getPrimaryPropertyPrice(property)),
                imagenes: Array.isArray(property.imagenes) ? property.imagenes : [],
              }))
          : [];

        const activeLeadLeads = Array.isArray(leadLeads)
          ? leadLeads.filter(
              (lead) => (lead.estado ?? "").trim().toLowerCase() !== "cancelado",
            )
          : [];

        const visibleRecentLeads = Array.isArray(leads)
          ? leads
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
                estado: lead.estado ?? "Sin estado",
              }))
          : [];

        const activeVisitRecords = Array.isArray(leads)
          ? leads.filter(
              (lead) => (lead.estado ?? "").trim().toLowerCase() !== "cancelado",
            )
          : [];

        const recentUsers = Array.isArray(users)
          ? users
              .slice()
              .sort((left, right) => right.id - left.id)
              .slice(0, 5)
              .map((item: UserRecord) => ({
                nombres: item.nombres ?? "Sin nombre",
                apellido_paterno: item.apellido_paterno ?? "",
                correo_electronico: item.correo_electronico ?? "Sin correo",
                foto_url: item.foto_url ?? null,
                rol: typeof item.rol === "string" ? item.rol : undefined,
                roles: getUserRoles(item),
              }))
          : [];

        const recentPublications = Array.isArray(blogs)
          ? blogs
              .slice()
              .sort((left: BlogRecord, right: BlogRecord) => {
                const leftDate = left.creadoEn
                  ? new Date(left.creadoEn).getTime()
                  : 0;
                const rightDate = right.creadoEn
                  ? new Date(right.creadoEn).getTime()
                  : 0;
                return rightDate - leftDate;
              })
              .slice(0, 5)
              .map((blog: BlogRecord) => ({
                titulo: blog.titulo,
                fecha_creacion: blog.creadoEn,
                fechaPublico: blog.fechaPublico ?? null,
                publicado: Boolean(blog.publicado),
                imagenes: blog.imagenes ?? [],
              }))
          : [];

        setSummary({
          propiedadesDisponibles: propiedadesDisponiblesActivas,
          propiedadesVendidas,
          registros: activeVisitRecords.length,
          registrosLeads: activeLeadLeads.length,
          blogs: Array.isArray(blogs) ? blogs.length : 0,
          rolesSistema: Array.isArray(roles) ? roles.length : 0,
          usuariosSistema: Array.isArray(users) ? users.length : 0,
          registrosRecientes: visibleRecentLeads,
          misRegistrosRecientes: [],
          propiedadesRecientes,
          usuariosRecientes: recentUsers,
          misPublicaciones: recentPublications,
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
  }, [
    accessToken,
    canReadBlogs,
    canReadProperties,
    canReadRegistros,
    canReadRegistrosLeads,
    canReadRoles,
    canReadUsers,
    canViewDashboard,
  ]);

  const cardValues = useMemo(
    () => ({
      "Propiedades Disponibles": summary.propiedadesDisponibles,
      "Registros visitas": summary.registros,
      "Registros leads": summary.registrosLeads,
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
      summary.registrosLeads,
      summary.rolesSistema,
      summary.usuariosSistema,
    ],
  );

  const sectionData = useMemo(
    () => ({
      registrosRecientes: summary.registrosRecientes,
      propiedadesRecientes: summary.propiedadesRecientes,
      usuariosRecientes: summary.usuariosRecientes,
      misPublicaciones: summary.misPublicaciones,
    }),
    [
      summary.misPublicaciones,
      summary.propiedadesRecientes,
      summary.registrosRecientes,
      summary.usuariosRecientes,
    ],
  );

  return (
    <div className="space-y-6">
      <section
        className={[
          "relative overflow-hidden rounded-[2rem] px-6 py-7 sm:px-8",
          isDark
            ? "border border-slate-700/80 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_34%),linear-gradient(135deg,#0f172a_0%,#111827_58%,#172554_100%)] shadow-[0_24px_60px_rgba(2,6,23,0.38)]"
            : "border border-slate-300/80 bg-[#E6ECF5] shadow-sm",
        ].join(" ")}
      >
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p
              className={[
                "text-xs font-semibold uppercase tracking-[0.28em]",
                isDark ? "text-sky-100/70" : "text-slate-500",
              ].join(" ")}
            >
              Panel principal
            </p>
            <h2
              className={[
                "mt-3 text-2xl font-black tracking-tight sm:text-[2rem]",
                isDark ? "text-white" : "text-slate-950",
              ].join(" ")}
            >
              {`Bienvenido, ${displayName}`}
            </h2>
            <p
              className={[
                "mt-3 max-w-xl text-sm leading-6",
                isDark ? "text-slate-300" : "text-slate-600",
              ].join(" ")}
            >
              Consulta el estado general del CRM, revisa actividad reciente y da
              seguimiento a la operación desde un solo lugar.
            </p>
          </div>

          <div
            className={[
              "inline-flex w-fit flex-col rounded-2xl px-4 py-3 backdrop-blur-sm",
              isDark
                ? "border border-slate-600/80 bg-slate-950/35 shadow-[0_18px_40px_rgba(2,6,23,0.28)]"
                : "border border-slate-200 bg-white/85 shadow-sm",
            ].join(" ")}
          >
            <span
              className={[
                "text-[11px] font-semibold uppercase tracking-[0.18em]",
                isDark ? "text-sky-100/70" : "text-slate-500",
              ].join(" ")}
            >
              Perfil actual
            </span>
            <span
              className={[
                "mt-2 text-sm font-semibold",
                isDark ? "text-white" : "text-slate-900",
              ].join(" ")}
            >
              {primaryRoleDisplay}
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

          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="min-w-0">
              <p
                className={[
                  "text-xs font-semibold uppercase tracking-[0.18em]",
                  isDark ? "text-slate-400" : "text-slate-500",
                ].join(" ")}
              >
                Seguimiento
              </p>
              <h3
                className={[
                  "mt-2 text-lg font-bold tracking-tight",
                  isDark ? "text-white" : "text-slate-950",
                ].join(" ")}
              >
                Actividad reciente
              </h3>
              <p
                className={[
                  "mt-1 text-sm",
                  isDark ? "text-slate-300" : "text-slate-600",
                ].join(" ")}
              >
                Resumen visual de los movimientos más recientes del CRM.
              </p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {dashboardSections.map((sectionTitle) => (
              <DashboardSectionCard
                key={sectionTitle}
                title={sectionTitle}
                hasItems={getSectionItemsCount(sectionTitle, sectionData) > 0}
                emptyMessage={getSectionEmptyMessage(sectionTitle)}
              >
                {renderSectionItems(sectionTitle, sectionData, isDark)}
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

function getUserRoles(user: UserRecord): string[] {
  return extractUserRoles(user);
}
