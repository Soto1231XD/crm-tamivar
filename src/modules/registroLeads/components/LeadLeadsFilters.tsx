import desArcIcon from '../../../assets/images/DesArc.png';
import { FilterCard, FilterDateInput, FilterSearchInput, FilterSelect } from '@/components/ui/AppFilters';
import type { Etiqueta } from '@/interfaces/lead.interface';
import { EtiquetaChip } from '@/components/ui/EtiquetaChip';

type LeadLeadsFiltersProps = {
  search: string;
  statusFilter: string;
  sellerFilter: string;
  leadDateFromFilter: string;
  leadDateToFilter: string;
  statusOptions: string[];
  sellerOptions: Array<{ id: number; label: string }>;
  hasResults: boolean;
  hideSellerFilter?: boolean;
  etiquetas?: Etiqueta[];
  etiquetaFilter?: number | null;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSellerChange: (value: string) => void;
  onLeadDateFromChange: (value: string) => void;
  onLeadDateToChange: (value: string) => void;
  onDownload: () => void;
  onEtiquetaChange?: (id: number | null) => void;
  onManageEtiquetas?: () => void;
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
  hideSellerFilter = false,
  etiquetas = [],
  etiquetaFilter = null,
  onSearchChange,
  onStatusChange,
  onSellerChange,
  onLeadDateFromChange,
  onLeadDateToChange,
  onDownload,
  onEtiquetaChange,
  onManageEtiquetas,
}: LeadLeadsFiltersProps) {
  const gridCols = hideSellerFilter
    ? 'lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]'
    : 'lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_auto]';

  return (
    <FilterCard description="Busca por nombre o teléfono, filtra por estatus o vendedor y usa el rango de fechas para ubicar oportunidades más rápido.">
      <div className={`grid gap-3 ${gridCols}`}>
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

        {!hideSellerFilter && (
          <FilterSelect value={sellerFilter} onChange={(event) => onSellerChange(event.target.value)}>
            <option value="">Todos los vendedores</option>
            {sellerOptions.map((option) => (
              <option key={option.id} value={String(option.id)}>
                {option.label}
              </option>
            ))}
          </FilterSelect>
        )}

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

      <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
        <span className="shrink-0 text-xs font-semibold text-slate-500">Etiquetas:</span>
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {etiquetas.length === 0 ? (
            <span className="text-xs text-slate-400">Sin etiquetas</span>
          ) : (
            <>
              {onEtiquetaChange && etiquetas.map((et) => {
                const active = etiquetaFilter === et.id;
                return (
                  <button
                    key={et.id}
                    type="button"
                    onClick={() => onEtiquetaChange(active ? null : et.id)}
                    className={[
                      'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition',
                      active
                        ? 'border-[#312C85] bg-[#312C85]/10 text-[#312C85]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                    ].join(' ')}
                  >
                    <EtiquetaChip etiqueta={et} compact />
                    <span>{et.nombre}</span>
                  </button>
                );
              })}
              {onEtiquetaChange && etiquetaFilter !== null && (
                <button
                  type="button"
                  onClick={() => onEtiquetaChange(null)}
                  className="shrink-0 text-xs text-slate-400 transition hover:text-slate-600"
                >
                  × Limpiar
                </button>
              )}
            </>
          )}
        </div>
        {onManageEtiquetas && (
          <button
            type="button"
            onClick={onManageEtiquetas}
            title="Gestionar etiquetas"
            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-[#312C85]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}
      </div>
    </FilterCard>
  );
}
