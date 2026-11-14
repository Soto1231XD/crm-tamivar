import { useState, useMemo } from "react";
import { BaseTable } from "@/components/ui/BaseTable";
import agregarIcon from "@/assets/images/Agregar.png";
import type { Falta } from "../../services/faltas.api";

function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

interface Props {
  faltas: Falta[];
  loading: boolean;
  canEdit: boolean;
  onAdd: () => void;
  onEdit: (f: Falta) => void;
  onDelete: (f: Falta) => void;
}

export function FaltasTab({ faltas, loading, canEdit, onAdd, onEdit, onDelete }: Props) {
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");

  const faltasFiltradas = useMemo(() => {
    return faltas.filter((f) => {
      if (filtroTipo  && f.tipo !== filtroTipo)           return false;
      if (filtroFecha && f.fecha.slice(0, 10) !== filtroFecha) return false;
      return true;
    });
  }, [faltas, filtroTipo, filtroFecha]);

  const hayFiltros = filtroTipo || filtroFecha;

  const columns = [
    { header: "Fecha", render: (f: Falta) => formatDate(f.fecha) },
    {
      header: "Tipo",
      render: (f: Falta) => (
        <span className={[
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
          f.tipo === "Justificada" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700",
        ].join(" ")}>
          {f.tipo}
        </span>
      ),
    },
    { header: "Descripción", render: (f: Falta) => f.descripcion ?? <span className="text-slate-300">—</span> },
  ];

  const selectClass = "rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2 text-sm text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-[#312C85]/30";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-[var(--crm-text-muted)]">
          {hayFiltros
            ? `${faltasFiltradas.length} de ${faltas.length} faltas`
            : `${faltas.length} ${faltas.length === 1 ? "falta registrada" : "faltas registradas"}`}
        </p>
        {canEdit && (
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e293b]"
          >
            <img src={agregarIcon} alt="" className="h-4 w-4" />
            Registrar falta
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className={selectClass}>
          <option value="">Todos los tipos</option>
          <option value="Justificada">Justificada</option>
          <option value="Injustificada">Injustificada</option>
        </select>

        <input
          type="date"
          value={filtroFecha}
          onChange={(e) => setFiltroFecha(e.target.value)}
          className={selectClass}
        />

        {hayFiltros && (
          <button
            type="button"
            onClick={() => { setFiltroTipo(""); setFiltroFecha(""); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <BaseTable
        data={faltasFiltradas}
        columns={columns}
        isLoading={loading}
        emptyMessage={hayFiltros ? "Sin faltas con esos filtros" : "No hay faltas registradas"}
        onEdit={canEdit ? onEdit : undefined}
        onDelete={canEdit ? onDelete : undefined}
        canEdit={canEdit}
        canDelete={canEdit}
      />
    </div>
  );
}
