import desArcIcon from '../../../assets/images/DesArc.png';
import {
  ALL_PRIORITIES,
  ALL_PROPERTIES,
  ALL_STATES,
  LEAD_PRIORITY_OPTIONS,
} from '../utils/leads.constants';

type LeadFiltersProps = {
  search: string;
  statusFilter: string;
  priorityFilter: string;
  propertyFilter: string;
  appointmentDateFilter: string;
  statusOptions: string[];
  propertyFilterOptions: string[];
  hasResults: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onPropertyChange: (value: string) => void;
  onAppointmentDateChange: (value: string) => void;
  onDownload: () => void;
};

export function LeadFilters({
  search,
  statusFilter,
  priorityFilter,
  propertyFilter,
  appointmentDateFilter,
  statusOptions,
  propertyFilterOptions,
  hasResults,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onPropertyChange,
  onAppointmentDateChange,
  onDownload,
}: LeadFiltersProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]">
        <input
          type="text"
          placeholder="Buscar por nombre, email o telefono"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
        />

        <select
          value={statusFilter}
          onChange={(event) => onStatusChange(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(event) => onPriorityChange(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
        >
          {[ALL_PRIORITIES, ...LEAD_PRIORITY_OPTIONS].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          value={propertyFilter}
          onChange={(event) => onPropertyChange(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
        >
          {propertyFilterOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={appointmentDateFilter}
          onChange={(event) => onAppointmentDateChange(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
        />

        <button
          type="button"
          onClick={onDownload}
          disabled={!hasResults}
          className="inline-flex items-center gap-2 rounded-lg bg-[#16A34A] px-4 py-2 text-sm font-semibold text-white shadow-sm"
        >
          <img src={desArcIcon} alt="" className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span>Descargar</span>
        </button>
      </div>
    </section>
  );
}

export { ALL_STATES, ALL_PRIORITIES, ALL_PROPERTIES };
