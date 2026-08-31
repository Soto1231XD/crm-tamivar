import desArcIcon from '../../../assets/images/DesArc.png';
import { CollapsibleFilters, FilterDateInput, FilterSearchInput, FilterSelect } from '@/components/ui/AppFilters';
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
  const secondaryActiveCount = [
    !!responsibleSearch,
    statusFilter !== ALL_STATES,
    propertyFilter !== ALL_PROPERTIES,
    !!appointmentDateFromFilter,
    !!appointmentDateToFilter,
  ].filter(Boolean).length;

  return (
    <CollapsibleFilters
      activeCount={secondaryActiveCount}
      searchSlot={
        <FilterSearchInput
          type="text"
          placeholder="Buscar por nombre, teléfono o propiedad"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      }
      downloadSlot={
        <button
          type="button"
          onClick={onDownload}
          disabled={!hasResults}
          className="inline-flex h-10.5 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <img src={desArcIcon} alt="" className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">Descargar</span>
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <FilterSearchInput
          type="text"
          placeholder="Buscar por responsable"
          value={responsibleSearch}
          onChange={(event) => onResponsibleSearchChange(event.target.value)}
        />

        <FilterSelect value={statusFilter} onChange={(event) => onStatusChange(event.target.value)}>
          {statusOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </FilterSelect>

        <FilterSelect value={propertyFilter} onChange={(event) => onPropertyChange(event.target.value)}>
          {propertyFilterOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </FilterSelect>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
      </div>
    </CollapsibleFilters>
  );
}

export { ALL_STATES, ALL_PROPERTIES };
