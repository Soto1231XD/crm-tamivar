import desArcIcon from '../../../assets/images/DesArc.png';
import { FilterCard, FilterDateInput, FilterSearchInput, FilterSelect } from '@/components/ui/AppFilters';

type LeadRequestsFiltersProps = {
  search: string;
  statusFilter: string;
  leadDateFromFilter: string;
  leadDateToFilter: string;
  statusOptions: string[];
  hasResults: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onLeadDateFromChange: (value: string) => void;
  onLeadDateToChange: (value: string) => void;
  onDownload: () => void;
};

export function LeadRequestsFilters({
  search,
  statusFilter,
  leadDateFromFilter,
  leadDateToFilter,
  statusOptions,
  hasResults,
  onSearchChange,
  onStatusChange,
  onLeadDateFromChange,
  onLeadDateToChange,
  onDownload,
}: LeadRequestsFiltersProps) {
  return (
    <FilterCard description="Busca por nombre o teléfono, filtra por estado y define un rango de fecha de alta para encontrar solicitudes más rápido.">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.9fr)_minmax(0,0.95fr)_minmax(0,0.95fr)_auto]">
        <FilterSearchInput
          type="text"
          placeholder="Buscar por nombre o teléfono"
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

        <FilterDateInput
          type="date"
          value={leadDateFromFilter}
          onChange={(event) => onLeadDateFromChange(event.target.value)}
        />

        <FilterDateInput
          type="date"
          value={leadDateToFilter}
          onChange={(event) => onLeadDateToChange(event.target.value)}
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
