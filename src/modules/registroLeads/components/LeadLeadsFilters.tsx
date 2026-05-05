import desArcIcon from '../../../assets/images/DesArc.png';
import { FilterCard, FilterDateInput, FilterSearchInput, FilterSelect } from '@/components/ui/AppFilters';

type LeadLeadsFiltersProps = {
  search: string;
  statusFilter: string;
  sellerFilter: string;
  leadDateFromFilter: string;
  leadDateToFilter: string;
  statusOptions: string[];
  sellerOptions: Array<{ id: number; label: string }>;
  hasResults: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSellerChange: (value: string) => void;
  onLeadDateFromChange: (value: string) => void;
  onLeadDateToChange: (value: string) => void;
  onDownload: () => void;
};

export function LeadLeadsFilters({
  search,
  statusFilter,
  sellerFilter,
  leadDateFromFilter,
  leadDateToFilter,
  statusOptions,
  sellerOptions,
  hasResults,
  onSearchChange,
  onStatusChange,
  onSellerChange,
  onLeadDateFromChange,
  onLeadDateToChange,
  onDownload,
}: LeadLeadsFiltersProps) {
  return (
    <FilterCard description="Busca por nombre o teléfono, filtra por estatus o vendedor y usa el rango de fechas para ubicar oportunidades más rápido.">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_auto]">
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

        <FilterSelect value={sellerFilter} onChange={(event) => onSellerChange(event.target.value)}>
          <option value="">Todos los vendedores</option>
          {sellerOptions.map((option) => (
            <option key={option.id} value={String(option.id)}>
              {option.label}
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
