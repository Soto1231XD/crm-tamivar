import desArcIcon from '../../../assets/images/DesArc.png';
import { FilterCard, FilterDateInput, FilterSearchInput, FilterSelect } from '@/components/ui/AppFilters';
import { ALL_STATES } from '@/modules/leads/utils/leads.constants';

const OPERATION_TYPE_OPTIONS = [
  { value: ALL_STATES, label: 'Tipo de operación' },
  { value: 'Compra', label: 'Compra' },
  { value: 'Renta', label: 'Renta' },
] as const;

type LeadRequestsFiltersProps = {
  search: string;
  statusFilter: string;
  leadDateFromFilter: string;
  leadDateToFilter: string;
  budgetMinFilter: string;
  budgetMaxFilter: string;
  operationTypeFilter: string;
  statusOptions: string[];
  hasResults: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onLeadDateFromChange: (value: string) => void;
  onLeadDateToChange: (value: string) => void;
  onBudgetMinChange: (value: string) => void;
  onBudgetMaxChange: (value: string) => void;
  onOperationTypeChange: (value: string) => void;
  onDownload: () => void;
};

export function LeadRequestsFilters({
  search,
  statusFilter,
  leadDateFromFilter,
  leadDateToFilter,
  budgetMinFilter,
  budgetMaxFilter,
  operationTypeFilter,
  statusOptions,
  hasResults,
  onSearchChange,
  onStatusChange,
  onLeadDateFromChange,
  onLeadDateToChange,
  onBudgetMinChange,
  onBudgetMaxChange,
  onOperationTypeChange,
  onDownload,
}: LeadRequestsFiltersProps) {
  return (
    <FilterCard description="Busca por nombre o teléfono, filtra por estado, tipo de operación, rango de presupuesto y fecha de alta.">
      <div className="flex flex-col gap-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
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

          <FilterSelect value={operationTypeFilter} onChange={(event) => onOperationTypeChange(event.target.value)}>
            {OPERATION_TYPE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </FilterSelect>

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

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSearchInput
            type="number"
            placeholder="Presupuesto mínimo"
            value={budgetMinFilter}
            min={0}
            onChange={(event) => onBudgetMinChange(event.target.value)}
          />

          <FilterSearchInput
            type="number"
            placeholder="Presupuesto máximo"
            value={budgetMaxFilter}
            min={0}
            onChange={(event) => onBudgetMaxChange(event.target.value)}
          />

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
        </div>
      </div>
    </FilterCard>
  );
}
