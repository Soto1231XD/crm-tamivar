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

type VisitCalendarDay = {
  key: string;
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  records: LeadRecord[];
  statusCounts: Record<string, number>;
};

const MONTH_FORMATTER = new Intl.DateTimeFormat("es-MX", {
  month: "long",
  year: "numeric",
});

const WEEKDAY_LABELS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

const EMPTY_COUNTS = (statuses: readonly string[]) =>
  statuses.reduce<Record<string, number>>((accumulator, status) => {
    accumulator[status] = 0;
    return accumulator;
  }, {});

function normalizeStatus(value?: string | null, fallback = "Sin estado") {
  return (value ?? "").trim() || fallback;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getRecordDateKey(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return toDateKey(date);
}

function getMonthGridDates(monthDate: Date) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

function getVisitStatusTone(status: string, isDark: boolean) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus.includes("cancel")) {
    return isDark
      ? "bg-red-500/15 text-red-200 ring-red-400/30"
      : "bg-red-50 text-red-700 ring-red-200";
  }

  if (normalizedStatus.includes("cerr")) {
    return isDark
      ? "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30"
      : "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (normalizedStatus.includes("agend")) {
    return isDark
      ? "bg-sky-500/15 text-sky-200 ring-sky-400/30"
      : "bg-sky-50 text-sky-700 ring-sky-200";
  }

  return isDark
    ? "bg-violet-500/15 text-violet-200 ring-violet-400/30"
    : "bg-violet-50 text-violet-700 ring-violet-200";
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

function resolveAdvisorId(record: LeadRecord) {
  if (record.vendedor_asignado_id != null) {
    return record.vendedor_asignado_id;
  }

  if (record.creado_por_id != null) {
    return record.creado_por_id;
  }

  if (record.creador?.id != null) {
    return record.creador.id;
  }

  return null;
}

function resolveAdvisorKey(record: LeadRecord) {
  const advisorId = resolveAdvisorId(record);
  return advisorId != null ? `user-${advisorId}` : "unassigned";
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
    if (current) {
      const resolvedName = resolveAdvisorName(record);
      if (
        resolvedName !== "Sin asignar" &&
        (current.name === "Sin asignar" || current.name.startsWith("Asesor #"))
      ) {
        current.name = resolvedName;
      }
      return current;
    }

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

function buildChartItems(counts: Record<string, number>, statuses: readonly string[]) {
  return statuses
    .map((status) => ({ status, value: counts[status] ?? 0 }))
    .filter((item) => item.value > 0);
}

function AdvisorDetailPanel({
  advisor,
  isDark,
}: {
  advisor: AdvisorStats;
  isDark: boolean;
}) {
  const leadChartItems = buildChartItems(advisor.leadStatuses, LEAD_LEADS_STATUS_OPTIONS);
  const visitChartItems = buildChartItems(advisor.visitStatuses, VISIT_STATUS_OPTIONS);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <AdvisorVerticalBarChart
          title="Gráfica de leads"
          description="Distribución actual de registros leads por estado."
          items={leadChartItems}
          emptyMessage="Sin leads registrados para graficar."
          barClassName="bg-brand-600"
          mutedBarClassName={isDark ? "bg-brand-400/15" : "bg-brand-100"}
        />
        <AdvisorVerticalBarChart
          title="Gráfica de visitas"
          description="Distribución actual de registros visitas por estado."
          items={visitChartItems}
          emptyMessage="Sin visitas registradas para graficar."
          barClassName={isDark ? "bg-sky-400" : "bg-sky-500"}
          mutedBarClassName={isDark ? "bg-sky-400/15" : "bg-sky-100"}
        />
      </div>
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

function AdvisorVerticalBarChart({
  title,
  description,
  items,
  emptyMessage,
  barClassName,
  mutedBarClassName,
}: {
  title: string;
  description: string;
  items: Array<{ status: string; value: number }>;
  emptyMessage: string;
  barClassName: string;
  mutedBarClassName: string;
}) {
  const maxValue = items.reduce((currentMax, item) => Math.max(currentMax, item.value), 0);

  return (
    <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--crm-text-muted)]">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--crm-text-muted)]">{description}</p>

      {items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[var(--crm-border)] bg-[var(--crm-muted)] px-4 py-6 text-sm text-[var(--crm-text-muted)]">
          {emptyMessage}
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const height = maxValue > 0 ? Math.max((item.value / maxValue) * 100, 14) : 0;

            return (
              <div
                key={`${title}-${item.status}`}
                className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-muted)] px-3 py-3"
              >
                <div className="flex h-36 items-end justify-center rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-2 pb-3 pt-4">
                  <div
                    className={`flex h-full w-full items-end justify-center rounded-lg ${mutedBarClassName}`}
                  >
                    <div
                      className={`w-full max-w-[56px] rounded-t-xl ${barClassName}`}
                      style={{ height: `${height}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <p className="mt-3 text-center text-xl font-black text-[var(--crm-text)]">
                  {item.value}
                </p>
                <p className="mt-1 text-center text-xs font-semibold leading-5 text-[var(--crm-text-muted)]">
                  {item.status}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function VisitStatusCalendar({
  records,
  monthDate,
  selectedStatus,
  onMonthChange,
  onStatusChange,
  advisors,
  selectedAdvisor,
  onAdvisorChange,
  isDark,
}: {
  records: LeadRecord[];
  monthDate: Date;
  selectedStatus: string;
  onMonthChange: (date: Date) => void;
  onStatusChange: (status: string) => void;
  advisors: { key: string; name: string }[];
  selectedAdvisor: string;
  onAdvisorChange: (key: string) => void;
  isDark: boolean;
}) {
  const calendarDays = useMemo<VisitCalendarDay[]>(() => {
    const monthRecords = new Map<string, LeadRecord[]>();

    records.forEach((record) => {
      const status = normalizeStatus(record.estado);
      if (selectedStatus !== "Todos los estados" && status !== selectedStatus) return;

      const dateKey = getRecordDateKey(record.fecha_cita);
      if (!dateKey) return;

      const currentRecords = monthRecords.get(dateKey) ?? [];
      currentRecords.push(record);
      monthRecords.set(dateKey, currentRecords);
    });

    return getMonthGridDates(monthDate).map((date) => {
      const key = toDateKey(date);
      const dayRecords = monthRecords.get(key) ?? [];
      const statusCounts = dayRecords.reduce<Record<string, number>>((accumulator, record) => {
        const status = normalizeStatus(record.estado);
        accumulator[status] = (accumulator[status] ?? 0) + 1;
        return accumulator;
      }, {});

      return {
        key,
        date,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === monthDate.getMonth(),
        records: dayRecords,
        statusCounts,
      };
    });
  }, [monthDate, records, selectedStatus]);

  const monthVisibleRecords = calendarDays
    .filter((day) => day.isCurrentMonth)
    .flatMap((day) => day.records);
  const monthStatusCounts = monthVisibleRecords.reduce<Record<string, number>>((accumulator, record) => {
    const status = normalizeStatus(record.estado);
    accumulator[status] = (accumulator[status] ?? 0) + 1;
    return accumulator;
  }, {});
  const totalMonthRecords = monthVisibleRecords.length;

  function goToPreviousMonth() {
    onMonthChange(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    onMonthChange(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1));
  }

  function goToCurrentMonth() {
    const today = new Date();
    onMonthChange(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  return (
    <section className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--crm-text-muted)]">
            Calendario de visitas
          </p>
          <h2 className="mt-2 text-2xl font-black capitalize tracking-tight text-[var(--crm-text)]">
            {MONTH_FORMATTER.format(monthDate)}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--crm-text-muted)]">
            Visualiza los registros visitas por fecha de cita y estado. Usa el filtro para revisar un estado especifico.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-muted)] px-3 py-2 text-sm font-semibold text-[var(--crm-text)] transition hover:bg-[var(--crm-surface-soft)]"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={goToCurrentMonth}
            className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2 text-sm font-semibold text-[var(--crm-text)] transition hover:bg-[var(--crm-muted)]"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={goToNextMonth}
            className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-muted)] px-3 py-2 text-sm font-semibold text-[var(--crm-text)] transition hover:bg-[var(--crm-surface-soft)]"
          >
            Siguiente
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4 rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-muted)] p-4">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--crm-text-muted)]">
              Filtrar asesor
            </span>
            <select
              value={selectedAdvisor}
              onChange={(e) => onAdvisorChange(e.target.value)}
              className="mt-3 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2.5 text-sm text-[var(--crm-text)] outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15"
            >
              <option value="">Todos los asesores</option>
              {advisors.map(({ key, name }) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--crm-text-muted)]">
              Filtrar estado
            </span>
            <select
              value={selectedStatus}
              onChange={(event) => onStatusChange(event.target.value)}
              className="mt-3 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2.5 text-sm text-[var(--crm-text)] outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15"
            >
              <option value="Todos los estados">Todos los estados</option>
              {VISIT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--crm-text-muted)]">
              Total del mes
            </p>
            <p className="mt-2 text-3xl font-black text-[var(--crm-text)]">{totalMonthRecords}</p>
          </div>

          <div className="space-y-2">
            {VISIT_STATUS_OPTIONS.map((status) => (
              <div
                key={status}
                className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold ring-1 ${getVisitStatusTone(status, isDark)}`}
              >
                <span>{status}</span>
                <span>{monthStatusCounts[status] ?? 0}</span>
              </div>
            ))}
          </div>
        </aside>

        <div className="min-w-0 overflow-x-auto rounded-2xl border border-[var(--crm-border)]">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-7 border-b border-[var(--crm-border)] bg-[var(--crm-muted)]">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--crm-text-muted)]"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day) => (
                <div
                  key={day.key}
                  className={`min-h-[132px] border-b border-r border-[var(--crm-border)] p-2 ${
                    day.isCurrentMonth ? "bg-[var(--crm-surface)]" : "bg-[var(--crm-muted)] opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-black text-[var(--crm-text)]">{day.dayNumber}</span>
                    {day.records.length > 0 ? (
                      <span className="rounded-full bg-[var(--crm-primary-soft)] px-2 py-0.5 text-[11px] font-black text-[var(--crm-primary)]">
                        {day.records.length}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 space-y-1.5">
                    {Object.entries(day.statusCounts).map(([status, count]) => (
                      <div
                        key={`${day.key}-${status}`}
                        className={`flex items-center justify-between rounded-lg px-2 py-1 text-[11px] font-semibold ring-1 ${getVisitStatusTone(status, isDark)}`}
                      >
                        <span className="truncate">{status}</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
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
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [calendarStatusFilter, setCalendarStatusFilter] = useState("Todos los estados");
  const [calendarAdvisorFilter, setCalendarAdvisorFilter] = useState("");

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

  const calendarAdvisors = useMemo(() => {
    const seen = new Map<string, string>();
    visitRecords.forEach((r) => {
      const key = resolveAdvisorKey(r);
      if (!seen.has(key)) seen.set(key, resolveAdvisorName(r));
    });
    return [...seen.entries()]
      .map(([key, name]) => ({ key, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [visitRecords]);

  const calendarRecords = useMemo(
    () => calendarAdvisorFilter
      ? visitRecords.filter((r) => resolveAdvisorKey(r) === calendarAdvisorFilter)
      : visitRecords,
    [visitRecords, calendarAdvisorFilter],
  );

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
          <button
            type="button"
            onClick={() => setExpandedAdvisorKey(advisor.key)}
            className="min-w-[200px] text-left transition hover:opacity-90"
          >
            <span className="font-semibold text-brand-700 hover:text-brand-800 hover:underline">
              {advisor.name}
            </span>
          </button>
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

          <VisitStatusCalendar
            records={calendarRecords}
            monthDate={calendarMonth}
            selectedStatus={calendarStatusFilter}
            onMonthChange={setCalendarMonth}
            onStatusChange={setCalendarStatusFilter}
            advisors={calendarAdvisors}
            selectedAdvisor={calendarAdvisorFilter}
            onAdvisorChange={setCalendarAdvisorFilter}
            isDark={isDark}
          />

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
                  Asesor con más carga
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
                      <DownloadAdvisorReportButton
                        advisor={advisor}
                        className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {(loading) => (loading ? "Generando..." : "Reporte")}
                      </DownloadAdvisorReportButton>
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
