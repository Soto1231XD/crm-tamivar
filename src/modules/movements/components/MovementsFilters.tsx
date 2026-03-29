import desArcIcon from "../../../assets/images/DesArc.png";
import {
  FilterCard,
  FilterDateInput,
  FilterSearchInput,
} from "@/components/ui/AppFilters";

type MovementsFiltersProps = {
  search: string;
  selectedDate: string;
  hasResults: boolean;
  onSearchChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onDownload: () => void;
};

export function MovementsFilters({
  search,
  selectedDate,
  hasResults,
  onSearchChange,
  onDateChange,
  onDownload,
}: MovementsFiltersProps) {
  return (
    <FilterCard description="Busca por usuario y filtra por una fecha especifica para encontrar movimientos mas rapido.">
      <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)_auto]">
        <FilterSearchInput
          placeholder="Buscar por usuario"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />

        <FilterDateInput
          type="date"
          value={selectedDate}
          onChange={(event) => onDateChange(event.target.value)}
        />

        <button
          type="button"
          onClick={onDownload}
          disabled={!hasResults}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <img
            src={desArcIcon}
            alt=""
            className="h-6 w-6 shrink-0"
            aria-hidden="true"
          />
          <span>Descargar</span>
        </button>
      </div>
    </FilterCard>
  );
}
