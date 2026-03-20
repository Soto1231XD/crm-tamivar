import desArcIcon from '../../../assets/images/DesArc.png';
import { FilterCard, FilterDateInput, FilterSearchInput, FilterSelect } from '@/components/ui/AppFilters';
import { ALL_PRIORITIES, ALL_PROPERTIES, ALL_STATES, LEAD_PRIORITY_OPTIONS } from '../utils/leads.constants';

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
    <FilterCard description="Busca por cliente, estado, prioridad, propiedad o fecha de cita para ubicar registros mas rapido.">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_auto]">
        <FilterSearchInput
          type="text"
          placeholder="Buscar por nombre, email o telefono"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />

        <FilterSelect value={statusFilter} onChange={(event) => onStatusChange(event.target.value)}>
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect value={priorityFilter} onChange={(event) => onPriorityChange(event.target.value)}>
          {[ALL_PRIORITIES, ...LEAD_PRIORITY_OPTIONS].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect value={propertyFilter} onChange={(event) => onPropertyChange(event.target.value)}>
          {propertyFilterOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </FilterSelect>

        <FilterDateInput
          type="date"
          value={appointmentDateFilter}
          onChange={(event) => onAppointmentDateChange(event.target.value)}
        />

        <button
          type="button"
          onClick={onDownload}
          disabled={!hasResults}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <img src={desArcIcon} alt="" className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span>Descargar</span>
        </button>
      </div>
    </FilterCard>
  );
}

export { ALL_STATES, ALL_PRIORITIES, ALL_PROPERTIES };
