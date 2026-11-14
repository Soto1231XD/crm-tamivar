import { BaseTable } from "@/components/ui/BaseTable";
import { BadgeSelect } from "@/components/ui/BadgeSelect";
import agregarIcon from "@/assets/images/Agregar.png";
import type { Incapacidad } from "../../services/incapacidades.api";

function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

interface Props {
  incapacidades: Incapacidad[];
  loading: boolean;
  canEdit: boolean;
  updatingEstatusIncId: number | null;
  onAdd: () => void;
  onEdit: (i: Incapacidad) => void;
  onDelete: (i: Incapacidad) => void;
  onViewDocs: (i: Incapacidad) => void;
  onEstatusChange: (incId: number, estatus: string) => void;
}

export function IncapacidadesTab({ incapacidades, loading, canEdit, updatingEstatusIncId, onAdd, onEdit, onDelete, onViewDocs, onEstatusChange }: Props) {
  const columns = [
    { header: "Inicio", render: (i: Incapacidad) => formatDate(i.fecha_inicio) },
    { header: "Fin",    render: (i: Incapacidad) => formatDate(i.fecha_fin) },
    { header: "Días",   render: (i: Incapacidad) => <span className="font-semibold">{i.dias}</span> },
    {
      header: "Tipo",
      render: (i: Incapacidad) => (
        <span className={[
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
          i.tipo === "IMSS" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700",
        ].join(" ")}>
          {i.tipo}
        </span>
      ),
    },
    {
      header: "Estatus",
      render: (i: Incapacidad) => (
        <BadgeSelect
          value={i.estatus}
          options={["Pendiente", "Aprobada", "Rechazada"]}
          onChange={(val) => onEstatusChange(i.id, val)}
          disabled={updatingEstatusIncId === i.id}
          canEdit={canEdit}
          getStyles={(val) => ({
            backgroundColor:
              val === "Aprobada"  ? "#dcfce7" :
              val === "Rechazada" ? "#fee2e2" : "#fef3c7",
            color:
              val === "Aprobada"  ? "#15803d" :
              val === "Rechazada" ? "#b91c1c" : "#b45309",
          })}
        />
      ),
    },
    { header: "Descripción", render: (i: Incapacidad) => i.descripcion ?? <span className="text-slate-300">—</span> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--crm-text-muted)]">
          {incapacidades.length} {incapacidades.length === 1 ? "incapacidad registrada" : "incapacidades registradas"}
        </p>
        {canEdit && (
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e293b]"
          >
            <img src={agregarIcon} alt="" className="h-4 w-4" />
            Registrar incapacidad
          </button>
        )}
      </div>

      <BaseTable
        data={incapacidades}
        columns={columns}
        isLoading={loading}
        emptyMessage="No hay incapacidades registradas"
        onEdit={canEdit ? onEdit : undefined}
        onDelete={canEdit ? onDelete : undefined}
        canEdit={canEdit}
        canDelete={canEdit}
        customActions={(i) => (
          <button
            type="button"
            title="Ver documentos"
            onClick={() => onViewDocs(i)}
            className="rounded-md border border-[var(--crm-border-strong)] p-1.5 text-[var(--crm-text)] transition-colors hover:bg-[var(--crm-muted)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        )}
      />
    </div>
  );
}
