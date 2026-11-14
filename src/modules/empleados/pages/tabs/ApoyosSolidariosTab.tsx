import { BaseTable } from "@/components/ui/BaseTable";
import { BadgeSelect } from "@/components/ui/BadgeSelect";
import agregarIcon from "@/assets/images/Agregar.png";
import type { Empleado } from "../../services/empleados.api";
import type { ApoSolidario } from "../../services/apoyos-solidarios.api";
import { generarApoSolidario } from "../../utils/documentos-rh";

function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtMXN(val: string) {
  return parseFloat(val).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

interface Props {
  apoyos: ApoSolidario[];
  loading: boolean;
  empleado: Empleado;
  canEdit: boolean;
  updatingEstatusId: number | null;
  onAdd: () => void;
  onEdit: (a: ApoSolidario) => void;
  onDelete: (a: ApoSolidario) => void;
  onEstatusChange: (id: number, estatus: string) => void;
}

export function ApoyosSolidariosTab({
  apoyos, loading, empleado, canEdit, updatingEstatusId,
  onAdd, onEdit, onDelete, onEstatusChange,
}: Props) {

  const totalAutorizado = apoyos
    .filter(a => a.estatus === "Autorizado")
    .reduce((s, a) => s + parseFloat(a.monto), 0);

  const columns = [
    {
      header: "Fecha",
      render: (a: ApoSolidario) => formatDate(a.fecha_incidente),
    },
    {
      header: "Hora",
      render: (a: ApoSolidario) => <span className="text-slate-500">{a.hora_incidente}</span>,
    },
    {
      header: "Descripción",
      cellClassName: "max-w-xs",
      render: (a: ApoSolidario) => (
        <span className="line-clamp-2 text-left text-xs text-slate-600">{a.descripcion}</span>
      ),
    },
    {
      header: "Monto",
      render: (a: ApoSolidario) => (
        <span className="font-semibold text-emerald-700">{fmtMXN(a.monto)}</span>
      ),
    },
    {
      header: "Estatus",
      render: (a: ApoSolidario) => (
        <BadgeSelect
          value={a.estatus}
          options={["Pendiente", "Autorizado", "Cancelado"]}
          onChange={(val) => onEstatusChange(a.id, val)}
          disabled={updatingEstatusId === a.id}
          canEdit={canEdit}
          getStyles={(val) => ({
            backgroundColor:
              val === "Autorizado" ? "#dcfce7" :
              val === "Cancelado"  ? "#fee2e2" : "#fef3c7",
            color:
              val === "Autorizado" ? "#15803d" :
              val === "Cancelado"  ? "#b91c1c" : "#b45309",
          })}
        />
      ),
    },
    {
      header: "Documento",
      render: (a: ApoSolidario) => (
        <button
          type="button"
          onClick={() => generarApoSolidario(empleado, a)}
          className="rounded-lg bg-[#312C85] px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-[#4338ca]"
        >
          Generar
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Total registrados",  value: `${apoyos.length}`,                                              color: "text-slate-700" },
          { label: "Total autorizado",   value: fmtMXN(String(totalAutorizado)),                                 color: "text-emerald-700" },
          { label: "Autorizados",        value: `${apoyos.filter(a => a.estatus === "Autorizado").length}`,       color: "text-green-600" },
        ].map(card => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.label}</p>
            <p className={`mt-1 text-xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--crm-text-muted)]">
          {apoyos.length} {apoyos.length === 1 ? "apoyo registrado" : "apoyos registrados"}
        </p>
        {canEdit && (
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e293b]"
          >
            <img src={agregarIcon} alt="" className="h-4 w-4" />
            Registrar apoyo
          </button>
        )}
      </div>

      <BaseTable
        data={apoyos}
        columns={columns}
        isLoading={loading}
        emptyMessage="No hay apoyos solidarios registrados"
        onEdit={canEdit ? onEdit : undefined}
        onDelete={canEdit ? onDelete : undefined}
        canEdit={canEdit}
        canDelete={canEdit}
      />
    </div>
  );
}
