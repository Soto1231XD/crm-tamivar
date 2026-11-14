import { BaseTable } from "@/components/ui/BaseTable";
import agregarIcon from "@/assets/images/Agregar.png";
import type { Amonestacion } from "../../services/amonestaciones.api";

function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

interface Props {
  amonestaciones: Amonestacion[];
  loading: boolean;
  canEdit: boolean;
  onAdd: () => void;
  onEdit: (a: Amonestacion) => void;
  onDelete: (a: Amonestacion) => void;
}

export function AmonestacionesTab({ amonestaciones, loading, canEdit, onAdd, onEdit, onDelete }: Props) {
  const columns = [
    { header: "Fecha", render: (a: Amonestacion) => formatDate(a.fecha) },
    {
      header: "Tipo",
      render: (a: Amonestacion) => (
        <span className={[
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
          a.tipo === "Verbal"  ? "bg-amber-100 text-amber-700"   :
          a.tipo === "Escrita" ? "bg-orange-100 text-orange-700" :
                                  "bg-red-100 text-red-700",
        ].join(" ")}>
          {a.tipo}
        </span>
      ),
    },
    { header: "Descripción", render: (a: Amonestacion) => a.descripcion ?? <span className="text-slate-300">—</span> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--crm-text-muted)]">
          {amonestaciones.length} {amonestaciones.length === 1 ? "amonestación registrada" : "amonestaciones registradas"}
        </p>
        {canEdit && (
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e293b]"
          >
            <img src={agregarIcon} alt="" className="h-4 w-4" />
            Registrar amonestación
          </button>
        )}
      </div>

      <BaseTable
        data={amonestaciones}
        columns={columns}
        isLoading={loading}
        emptyMessage="No hay amonestaciones registradas"
        onEdit={canEdit ? onEdit : undefined}
        onDelete={canEdit ? onDelete : undefined}
        canEdit={canEdit}
        canDelete={canEdit}
      />
    </div>
  );
}
