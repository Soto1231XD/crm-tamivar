import { useEffect, useMemo, useState } from "react";
import type { BlogRecord } from "@/interfaces/blog.interface";
import type { UserRecord, UserRoleRecord } from "@/interfaces/user.interface";
import { useAuthStore } from "@/shared/auth/useAuthStore";
import { useHasPermission } from "@/shared/auth/permissions/useHasPermission";
import { canAccessDashboard } from "@/shared/auth/navigation.util";
import { getBlogs } from "../../content/services/content.api";
import { getLeads } from "../../leads/services/leads.api";
import { getProperties } from "../../properties/services/properties.api";
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
  const { can, userPermissions } = useHasPermission();

  const displayName = user
    ? `${user.nombres || ""} ${user.apellido_paterno || ""}`.trim() ||
      user.correo_electronico
    : "Usuario";
  const primaryRoleDisplay = user?.roles?.[0] || "Sin rol asignado";
  const canViewDashboard = canAccessDashboard(userPermissions);
  const dashboardCards = getVisibleDashboardCards(can);
  const dashboardSections = getVisibleDashboardSections(can);

  const canReadProperties = can("propiedades", "leer");
  const canReadRegistros = can("registros", "leer");
  const canReadBlogs = can("blogs", "leer");
  const canReadUsers = can("usuarios", "leer");
  const canReadRoles = can("roles", "leer");

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
      canReadBlogs ? getBlogs() : Promise.resolve([]),
      canReadUsers ? getUsers(accessToken) : Promise.resolve([]),
      canReadRoles ? getSystemRoles(accessToken) : Promise.resolve([]),
    ])
      .then(([properties, leads, blogs, users, roles]) => {
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
                precio: String(property.precio ?? 0),
              }))
          : [];

        const visibleRecentLeads = leads
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

        const recentUsers = Array.isArray(users)
          ? users
              .slice()
              .sort((left, right) => right.id - left.id)
              .slice(0, 5)
              .map((item: UserRecord) => ({
                nombres: item.nombres ?? "Sin nombre",
                apellido_paterno: item.apellido_paterno ?? "",
                correo_electronico: item.correo_electronico ?? "Sin correo",
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
          registros: leads.length,
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
    canReadRoles,
    canReadUsers,
    canViewDashboard,
  ]);

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

function getUserRoles(user: UserRecord): string[] {
  const sourceRoles: UserRoleRecord[] = Array.isArray(user.roles)
    ? user.roles
    : user.rol
      ? [user.rol]
      : [];

  const normalizedRoles = sourceRoles
    .map((role) => {
      if (typeof role === "string") return role.trim();
      if (typeof role?.rol === "string") return role.rol.trim();
      if (role?.rol && typeof role.rol === "object") {
        if (typeof role.rol.rol === "string") return role.rol.rol.trim();
        if (typeof role.rol.nombre === "string") return role.rol.nombre.trim();
      }
      if (typeof role?.nombre === "string") return role.nombre.trim();
      return "";
    })
    .filter(Boolean);

  return Array.from(new Set(normalizedRoles));
}
