import { useEffect, useMemo, useState } from "react";
import { getLeads } from "@/modules/leads/services/leads.api";
import { VISIT_STATUS_OPTIONS } from "@/modules/leads/utils/leads.constants";
import { getLeadLeads } from "@/modules/registroLeads/services/leadLeads.api";
import { LEAD_LEADS_STATUS_OPTIONS } from "@/modules/registroLeads/components/leadLeads.shared";
import type { LeadRecord } from "@/interfaces/lead.interface";
import { useThemeStore } from "@/shared/theme/useThemeStore";
import { BaseTable, type ColumnDef } from "@/components/ui/BaseTable";
import { AppModal } from "@/components/ui/AppModal";
import type { AdvisorStats } from "../types/statistics.types";
import { DownloadAdvisorReportButton } from "../utils/DownloadAdvisorReportButton";

type StatusCount = {
  status: string;
  count: number;
};

const EMPTY_COUNTS = (statuses: readonly string[]) =>
  statuses.reduce<Record<string, number>>((accumulator, status) => {
    accumulator[status] = 0;
    return accumulator;
  }, {});

function normalizeStatus(value?: string | null, fallback = "Sin estado") {
  return (value ?? "").trim() || fallback;
}

function buildStatusSummary(records: LeadRecord[], knownStatuses: readonly string[]) {
  const counts = new Map<string, number>();

  records.forEach((record) => {
    const status = normalizeStatus(record.estado);
    counts.set(status, (counts.get(status) ?? 0) + 1);
  });

  const orderedKnown = knownStatuses
    .map((status) => ({ status, count: counts.get(status) ?? 0 }))
    .filter((item) => item.count > 0);

  const extra = Array.from(counts.entries())
    .filter(([status]) => !knownStatuses.includes(status))
    .sort((left, right) => right[1] - left[1])
    .map(([status, count]) => ({ status, count }));

  return [...orderedKnown, ...extra];
}

function resolveAdvisorKey(record: LeadRecord) {
  if (record.vendedor_asignado_id != null) {
    return `assigned-${record.vendedor_asignado_id}`;
  }

  if (record.creado_por_id != null) {
    return `creator-${record.creado_por_id}`;
  }

  if (record.creador?.id != null) {
    return `creator-${record.creador.id}`;
  }

  return "unassigned";
}

function resolveAdvisorName(record: LeadRecord) {
  const assignedName = [
    record.vendedor_asignado?.nombres,
    record.vendedor_asignado?.apellido_paterno,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (assignedName) {
    return assignedName;
  }

  if (record.vendedor_asignado_id != null) {
    return `Asesor #${record.vendedor_asignado_id}`;
  }

  const creatorName = [
    record.creador?.nombres,
    record.creador?.apellido_paterno,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (creatorName) {
    return creatorName;
  }

  return "Sin asignar";
}

function buildAdvisorStats(leads: LeadRecord[], visits: LeadRecord[]) {
  const advisors = new Map<string, AdvisorStats>();

  const ensureAdvisor = (record: LeadRecord) => {
    const key = resolveAdvisorKey(record);
    const current = advisors.get(key);
    if (current) return current;

    const nextAdvisor: AdvisorStats = {
      id: key,
      key,
      name: resolveAdvisorName(record),
      leadCount: 0,
      visitCount: 0,
      leadStatuses: EMPTY_COUNTS(LEAD_LEADS_STATUS_OPTIONS),
      visitStatuses: EMPTY_COUNTS(VISIT_STATUS_OPTIONS),
    };

    advisors.set(key, nextAdvisor);
    return nextAdvisor;
  };

  leads.forEach((record) => {
    const advisor = ensureAdvisor(record);
    advisor.leadCount += 1;
    const status = normalizeStatus(record.estado);
    advisor.leadStatuses[status] = (advisor.leadStatuses[status] ?? 0) + 1;
  });

  visits.forEach((record) => {
    const advisor = ensureAdvisor(record);
    advisor.visitCount += 1;
    const status = normalizeStatus(record.estado);
    advisor.visitStatuses[status] = (advisor.visitStatuses[status] ?? 0) + 1;
  });

  return Array.from(advisors.values()).sort((left, right) => {
    const totalLeft = left.leadCount + left.visitCount;
    const totalRight = right.leadCount + right.visitCount;
    if (totalRight !== totalLeft) return totalRight - totalLeft;
    return left.name.localeCompare(right.name, "es");
  });
}

function countAssigned(records: LeadRecord[]) {
  return records.filter((record) => record.vendedor_asignado_id != null).length;
}

function countStatus(records: LeadRecord[], targetStatus: string) {
  return records.filter(
    (record) => normalizeStatus(record.estado).toLowerCase() === targetStatus.toLowerCase(),
  ).length;
}

function getDominantStatusLabel(counts: Record<string, number>, emptyLabel: string) {
  const dominant = Object.entries(counts)
    .filter(([, value]) => value > 0)
    .sort((left, right) => right[1] - left[1])[0];

  return dominant ? `${dominant[0]} (${dominant[1]})` : emptyLabel;
}

function AdvisorDetailPanel({
  advisor,
  isDark,
}: {
  advisor: AdvisorStats;
  isDark: boolean;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
        <AdvisorStatusChips
          title="Leads"
          counts={advisor.leadStatuses}
          statuses={LEAD_LEADS_STATUS_OPTIONS}
          toneClass="bg-brand-100 text-brand-700"
        />
      </div>
      <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
        <AdvisorStatusChips
          title="Visitas"
          counts={advisor.visitStatuses}
          statuses={VISIT_STATUS_OPTIONS}
          toneClass={isDark ? "bg-sky-500/12 text-sky-300" : "bg-sky-50 text-sky-700"}
        />
      </div>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--crm-text-muted)]">
        {label}
      </p>
      <p className="mt-3 text-4xl font-black tracking-tight text-[var(--crm-text)]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--crm-text-muted)]">{helper}</p>
    </div>
  );
}

function StatusBreakdown({
  title,
  description,
  items,
  accentClass,
}: {
  title: string;
  description: string;
  items: StatusCount[];
  accentClass: string;
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--crm-text-muted)]">
            Panorama general
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--crm-text)]">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--crm-text-muted)]">{description}</p>
        </div>

        <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-muted)] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--crm-text-muted)]">
            Total visible
          </p>
          <p className="mt-2 text-2xl font-black text-[var(--crm-text)]">{total}</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--crm-border)] bg-[var(--crm-muted)] px-4 py-6 text-sm text-[var(--crm-text-muted)]">
            No hay registros para mostrar en este bloque.
          </div>
        ) : (
          items.map((item) => {
            const percentage = total > 0 ? Math.max((item.count / total) * 100, 4) : 0;

            return (
              <div key={item.status} className="space-y-2">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <div className="font-semibold text-[var(--crm-text)]">{item.status}</div>
                  <div className="text-[var(--crm-text-muted)]">
                    {item.count} registro{item.count === 1 ? "" : "s"}
                  </div>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-[var(--crm-muted)]">
                  <div
                    className={`h-full rounded-full ${accentClass}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function AdvisorStatusChips({
  title,
  counts,
  statuses,
  toneClass,
}: {
  title: string;
  counts: Record<string, number>;
  statuses: readonly string[];
  toneClass: string;
}) {
  const visibleItems = statuses
    .map((status) => ({ status, value: counts[status] ?? 0 }))
    .filter((item) => item.value > 0);

  if (visibleItems.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--crm-border)] bg-[var(--crm-muted)] px-4 py-4 text-sm text-[var(--crm-text-muted)]">
        Sin estados registrados en {title.toLowerCase()}.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--crm-text-muted)]">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {visibleItems.map((item) => (
          <span
            key={`${title}-${item.status}`}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${toneClass}`}
          >
            <span>{item.status}</span>
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-black text-slate-800">
              {item.value}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function StatisticsPage() {
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === "dark";
  const [visitRecords, setVisitRecords] = useState<LeadRecord[]>([]);
  const [leadRecords, setLeadRecords] = useState<LeadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [advisorSearch, setAdvisorSearch] = useState("");
  const [expandedAdvisorKey, setExpandedAdvisorKey] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setError("");

    Promise.all([getLeads(), getLeadLeads()])
      .then(([visits, leads]) => {
        if (!isActive) return;
        setVisitRecords(Array.isArray(visits) ? visits : []);
        setLeadRecords(Array.isArray(leads) ? leads : []);
      })
      .catch((currentError) => {
        if (!isActive) return;
        console.error("No pudimos cargar estadísticas.", currentError);
        setError("No pudimos cargar las estadísticas en este momento.");
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const visitStatusSummary = useMemo(
    () => buildStatusSummary(visitRecords, VISIT_STATUS_OPTIONS),
    [visitRecords],
  );
  const leadStatusSummary = useMemo(
    () => buildStatusSummary(leadRecords, LEAD_LEADS_STATUS_OPTIONS),
    [leadRecords],
  );
  const advisorStats = useMemo(
    () => buildAdvisorStats(leadRecords, visitRecords),
    [leadRecords, visitRecords],
  );
  const filteredAdvisorStats = useMemo(() => {
    const normalizedSearch = advisorSearch.trim().toLowerCase();
    if (!normalizedSearch) {
      return advisorStats;
    }

    return advisorStats.filter((advisor) =>
      advisor.name.toLowerCase().includes(normalizedSearch),
    );
  }, [advisorSearch, advisorStats]);

  const globalMetrics = useMemo(
    () => ({
      totalLeads: leadRecords.length,
      totalVisits: visitRecords.length,
      assignedLeads: countAssigned(leadRecords),
      assignedVisits: countAssigned(visitRecords),
      contactedLeads: countStatus(leadRecords, "Contactado"),
      scheduledVisits: countStatus(visitRecords, "Agendado"),
      advisorsWithLoad: advisorStats.filter(
        (advisor) => advisor.leadCount > 0 || advisor.visitCount > 0,
      ).length,
    }),
    [advisorStats, leadRecords, visitRecords],
  );

  const topAdvisor = advisorStats[0] ?? null;
  const selectedAdvisor =
    filteredAdvisorStats.find((advisor) => advisor.key === expandedAdvisorKey) ?? null;
  const advisorColumns = useMemo<ColumnDef<AdvisorStats>[]>(
    () => [
      {
        header: "Nombre del asesor",
        headerClassName: "min-w-[220px]",
        cellClassName: "min-w-[220px] whitespace-normal align-middle",
        render: (advisor) => (
          <div className="min-w-[200px]">
            <p className="font-medium text-slate-800">{advisor.name}</p>
          </div>
        ),
      },
      {
        header: "Total de leads asignados",
        headerClassName: "min-w-[170px]",
        cellClassName: "min-w-[170px] align-middle text-right",
        render: (advisor) => (
          <span className="font-semibold text-slate-700">
            {advisor.leadCount + advisor.visitCount}
          </span>
        ),
      },
      {
        header: "Registro de leads",
        headerClassName: "min-w-[140px]",
        cellClassName: "min-w-[140px] align-middle text-right",
        render: (advisor) => (
          <span className="font-semibold text-slate-700">{advisor.leadCount}</span>
        ),
      },
      {
        header: "Registros visitas",
        headerClassName: "min-w-[140px]",
        cellClassName: "min-w-[140px] align-middle text-right",
        render: (advisor) => (
          <span className="font-semibold text-slate-700">{advisor.visitCount}</span>
        ),
      },
      {
        header: "Avance principal",
        headerClassName: "min-w-[240px]",
        cellClassName: "min-w-[240px] whitespace-normal align-middle",
        render: (advisor) => {
          const leadStatus = getDominantStatusLabel(advisor.leadStatuses, "Sin leads");
          const visitStatus = getDominantStatusLabel(advisor.visitStatuses, "Sin visitas");

          return (
            <div className="space-y-1.5">
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Lead:</span> {leadStatus}
              </div>
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Visita:</span> {visitStatus}
              </div>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-5 py-5 shadow-sm">
        <div className="max-w-4xl space-y-3">
          <span className="inline-flex w-fit rounded-full border border-[var(--crm-border)] bg-[var(--crm-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--crm-text-muted)]">
            Seguimiento comercial
          </span>

          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-[var(--crm-text)]">
              Estadísticas
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-[var(--crm-text-muted)] sm:text-[15px]">
              Aquí concentramos el comportamiento de los estados en registros
              leads y registros visitas, tanto de forma general como por asesor.
            </p>
          </div>
        </div>
      </section>

      {isLoading ? (
        <section className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-5 py-12 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--crm-border)] border-t-brand-600" />
          <p className="mt-4 text-sm text-[var(--crm-text-muted)]">
            Cargando estadísticas del CRM...
          </p>
        </section>
      ) : error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-6 text-rose-700 shadow-sm">
          <p className="text-sm font-semibold">{error}</p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SummaryMetric
              label="Registros leads"
              value={globalMetrics.totalLeads}
              helper="Total visible en la vista comercial de leads."
            />
            <SummaryMetric
              label="Registros visitas"
              value={globalMetrics.totalVisits}
              helper="Total visible en la vista de visitas y citas."
            />
            <SummaryMetric
              label="Leads asignados"
              value={globalMetrics.assignedLeads}
              helper="Leads que ya tienen asesor asignado."
            />
            <SummaryMetric
              label="Visitas asignadas"
              value={globalMetrics.assignedVisits}
              helper="Registros visita que ya tienen responsable asignado."
            />
            <SummaryMetric
              label="Leads contactados"
              value={globalMetrics.contactedLeads}
              helper="Leads que ya avanzaron al estado Contactado."
            />
            <SummaryMetric
              label="Visitas agendadas"
              value={globalMetrics.scheduledVisits}
              helper="Visitas que se encuentran actualmente en Agendado."
            />
            <SummaryMetric
              label="Asesores con carga"
              value={globalMetrics.advisorsWithLoad}
              helper="Asesores que hoy ya cuentan con leads o visitas asignadas."
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <StatusBreakdown
              title="Estados de registros leads"
              description="Distribución de leads por estado comercial, incluyendo espera, contacto y cierre."
              items={leadStatusSummary}
              accentClass="bg-brand-600"
            />
            <StatusBreakdown
              title="Estados de registros visitas"
              description="Distribución de visitas por estatus operativo, desde agendado hasta cerrado."
              items={visitStatusSummary}
              accentClass={isDark ? "bg-sky-400" : "bg-sky-500"}
            />
          </section>

          <section className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-5 shadow-sm">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--crm-text-muted)]">
                Desglose por asesor
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--crm-text)]">
                Carga y avance por asesor
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--crm-text-muted)]">
                Aquí se ve cuantas oportunidades y visitas tiene cada asesor y
                en que estados se encuentran.
              </p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-muted)] px-4 py-4">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--crm-text-muted)]">
                    Buscar asesor
                  </span>
                  <input
                    type="text"
                    value={advisorSearch}
                    onChange={(event) => setAdvisorSearch(event.target.value)}
                    placeholder="Escribe un nombre o apellido"
                    className="mt-3 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-4 py-3 text-sm text-[var(--crm-text)] outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15"
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-muted)] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--crm-text-muted)]">
                  Asesor con mas carga
                </p>
                <p className="mt-3 text-lg font-black tracking-tight text-[var(--crm-text)]">
                  {topAdvisor?.name ?? "Sin datos"}
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--crm-text-muted)]">
                  {topAdvisor
                    ? `${topAdvisor.leadCount} leads y ${topAdvisor.visitCount} visitas visibles.`
                    : "Todavía no hay suficientes registros para medir carga por asesor."}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {filteredAdvisorStats.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--crm-border)] bg-[var(--crm-muted)] px-4 py-8 text-center text-sm text-[var(--crm-text-muted)]">
                  {advisorStats.length === 0
                    ? "No hay suficientes registros para construir el desglose por asesor."
                    : "No encontramos asesores que coincidan con esa búsqueda."}
                </div>
              ) : (
                <>
                  <BaseTable
                    data={filteredAdvisorStats}
                    columns={advisorColumns}
                    emptyMessage="No se encontraron asesores"
                    tableClassName="w-max min-w-[1220px] text-left"
                    actionsClassName="mx-auto flex w-max items-center justify-center gap-2"
                    customActions={(advisor) => (
                      <>
                        <button
                          type="button"
                          onClick={() => setExpandedAdvisorKey(advisor.key)}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                        >
                          Ver detalles
                        </button>
                        <DownloadAdvisorReportButton
                          advisor={advisor}
                          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {(loading) => (loading ? "Generando..." : "Reporte")}
                        </DownloadAdvisorReportButton>
                      </>
                    )}
                  />

                  <AppModal
                    isOpen={Boolean(selectedAdvisor)}
                    onClose={() => setExpandedAdvisorKey(null)}
                    title="Detalle del asesor"
                    subtitle={
                      selectedAdvisor
                        ? `${selectedAdvisor.name}. Aquí se muestran los estados actuales de sus registros leads y registros visitas.`
                        : undefined
                    }
                    maxWidthClassName="max-w-4xl"
                    bodyClassName="pt-1"
                  >
                    {selectedAdvisor ? (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-muted)] px-4 py-4">
                          <div className="flex flex-wrap gap-3">
                            <div className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--crm-text-muted)]">
                                Total asignado
                              </p>
                              <p className="mt-1 text-xl font-black text-[var(--crm-text)]">
                                {selectedAdvisor.leadCount + selectedAdvisor.visitCount}
                              </p>
                            </div>
                            <div className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--crm-text-muted)]">
                                Leads
                              </p>
                              <p className="mt-1 text-xl font-black text-[var(--crm-text)]">
                                {selectedAdvisor.leadCount}
                              </p>
                            </div>
                            <div className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--crm-text-muted)]">
                                Visitas
                              </p>
                              <p className="mt-1 text-xl font-black text-[var(--crm-text)]">
                                {selectedAdvisor.visitCount}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-4 py-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--crm-text-muted)]">
                                Reporte individual
                              </p>
                              <p className="mt-1 text-sm text-[var(--crm-text-muted)]">
                                Descarga el resumen del asesor con sus gráficas de estados en PDF.
                              </p>
                            </div>

                            <DownloadAdvisorReportButton
                              advisor={selectedAdvisor}
                              className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {(loading) =>
                                loading ? "Generando reporte..." : "Descargar reporte PDF"
                              }
                            </DownloadAdvisorReportButton>
                          </div>
                        </div>

                        <AdvisorDetailPanel advisor={selectedAdvisor} isDark={isDark} />
                      </div>
                    ) : null}
                  </AppModal>
                </>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
