import desArcIcon from '../../../assets/images/DesArc.png';
import { FilterCard, FilterDateInput, FilterSearchInput, FilterSelect } from '@/components/ui/AppFilters';
import { ALL_PROPERTIES, ALL_STATES } from '../utils/leads.constants';

type LeadFiltersProps = {
  search: string;
  responsibleSearch: string;
  statusFilter: string;
  propertyFilter: string;
  appointmentDateFromFilter: string;
  appointmentDateToFilter: string;
  statusOptions: string[];
  propertyFilterOptions: string[];
  hasResults: boolean;
  onSearchChange: (value: string) => void;
  onResponsibleSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPropertyChange: (value: string) => void;
  onAppointmentDateFromChange: (value: string) => void;
  onAppointmentDateToChange: (value: string) => void;
  onDownload: () => void;
};

export function LeadFilters({
  search,
  responsibleSearch,
  statusFilter,
  propertyFilter,
  appointmentDateFromFilter,
  appointmentDateToFilter,
  statusOptions,
  propertyFilterOptions,
  hasResults,
  onSearchChange,
  onResponsibleSearchChange,
  onStatusChange,
  onPropertyChange,
  onAppointmentDateFromChange,
  onAppointmentDateToChange,
  onDownload,
}: LeadFiltersProps) {
  return (
    <FilterCard description="Busca por cliente o responsable y combina estado, propiedad o desarrollo y fecha de cita sin saturar la vista.">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,0.85fr)_minmax(0,0.95fr)]">
        <FilterSearchInput
          type="text"
          placeholder="Buscar por nombre o teléfono"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />

        <FilterSearchInput
          type="text"
          placeholder="Buscar por responsable"
          value={responsibleSearch}
          onChange={(event) => onResponsibleSearchChange(event.target.value)}
        />

        <FilterSelect value={statusFilter} onChange={(event) => onStatusChange(event.target.value)}>
          {statusOptions.map((option) => (
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
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,0.9fr)_auto]">

        <FilterDateInput
          type="date"
          value={appointmentDateFromFilter}
          onChange={(event) => onAppointmentDateFromChange(event.target.value)}
        />

        <FilterDateInput
          type="date"
          value={appointmentDateToFilter}
          onChange={(event) => onAppointmentDateToChange(event.target.value)}
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

export { ALL_STATES, ALL_PROPERTIES };
