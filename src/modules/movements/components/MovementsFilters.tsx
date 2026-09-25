import desArcIcon from "../../../assets/images/DesArc.png";
import {
  FilterCard,
  FilterDateInput,
  FilterSearchInput,
  FilterSelect,
} from "@/components/ui/AppFilters";

const MODULE_OPTIONS = [
  { value: "", label: "Todos los módulos" },
  { value: "auth", label: "Autenticación" },
  { value: "users", label: "Usuarios" },
  { value: "roles", label: "Roles" },
  { value: "properties", label: "Propiedades" },
  { value: "developments", label: "Desarrollos" },
  { value: "registros", label: "Registros" },
  { value: "registros-leads", label: "Registros leads" },
  { value: "blogs", label: "Blogs" },
  { value: "movimientos", label: "Movimientos" },
];

type MovementsFiltersProps = {
  search: string;
  selectedDate: string;
  selectedModule: string;
  hasResults: boolean;
  onSearchChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onModuleChange: (value: string) => void;
  onDownload: () => void;
};

export function MovementsFilters({
  search,
  selectedDate,
  selectedModule,
  hasResults,
  onSearchChange,
  onDateChange,
  onModuleChange,
  onDownload,
}: MovementsFiltersProps) {
  return (
    <FilterCard description="Busca por usuario, filtra por módulo o por fecha para encontrar movimientos más rápido.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(180px,1fr)_minmax(180px,1fr)_auto]">
        <FilterSearchInput
          placeholder="Buscar por usuario"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />

        <FilterSelect
          value={selectedModule}
          onChange={(event) => onModuleChange(event.target.value)}
        >
          {MODULE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </FilterSelect>

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
