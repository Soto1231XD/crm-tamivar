import { useState, useMemo } from "react";
import { BaseTable } from "@/components/ui/BaseTable";
import { BadgeSelect } from "@/components/ui/BadgeSelect";
import agregarIcon from "@/assets/images/Agregar.png";
import type { Empleado } from "../../services/empleados.api";
import type { ApoSolidario } from "../../services/apoyos-solidarios.api";
import { generarApoSolidario } from "../../utils/documentos-rh/doc-apoyo-solidario";
import { DocPreviewModal } from "../../components/DocPreviewModal";

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
  const [preview, setPreview] = useState<{ blob: Blob; filename: string } | null>(null);
  const [filtroEstatus, setFiltroEstatus] = useState("");
  const [filtroPeriodo, setFiltroPeriodo] = useState("");

  const apoyosFiltrados = useMemo(() => {
    return apoyos.filter((a) => {
      if (filtroEstatus && a.estatus !== filtroEstatus) return false;
      if (filtroPeriodo && a.fecha_incidente.slice(0, 10) !== filtroPeriodo) return false;
      return true;
    });
  }, [apoyos, filtroEstatus, filtroPeriodo]);

  const hayFiltros = filtroEstatus || filtroPeriodo;
  const selectClass = "rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2 text-sm text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-[#312C85]/30";

  const handleVer = async (a: ApoSolidario) => {
    try {
      const blob = await generarApoSolidario(empleado, a, { onlyBlob: true });
      const nombre = `${empleado.nombre} ${empleado.apellido_paterno}`.trim().replace(/ /g, "_");
      setPreview({ blob, filename: `Apoyo_Solidario_${nombre}_${a.fecha_incidente.slice(0, 10)}.docx` });
    } catch (e: unknown) {
      alert("Error al previsualizar: " + (e instanceof Error ? e.message : String(e)));
    }
  };

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

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={filtroEstatus} onChange={(e) => setFiltroEstatus(e.target.value)} className={selectClass}>
          <option value="">Todos los estatus</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Autorizado">Autorizado</option>
          <option value="Cancelado">Cancelado</option>
        </select>

        <input
          type="date"
          value={filtroPeriodo}
          onChange={(e) => setFiltroPeriodo(e.target.value)}
          title="Período"
          className={selectClass}
        />

        {hayFiltros && (
          <button
            type="button"
            onClick={() => { setFiltroEstatus(""); setFiltroPeriodo(""); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--crm-text-muted)]">
          {hayFiltros
            ? `${apoyosFiltrados.length} de ${apoyos.length} apoyos`
            : `${apoyos.length} ${apoyos.length === 1 ? "apoyo registrado" : "apoyos registrados"}`}
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
        data={apoyosFiltrados}
        columns={columns}
        isLoading={loading}
        emptyMessage={hayFiltros ? "Sin apoyos con esos filtros" : "No hay apoyos solidarios registrados"}
        onEdit={canEdit ? onEdit : undefined}
        onDelete={canEdit ? onDelete : undefined}
        canEdit={canEdit}
        canDelete={canEdit}
        customActions={(a) => (
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => void handleVer(a)} title="Ver documento"
              className="rounded-md border border-[var(--crm-border-strong)] p-1.5 text-[var(--crm-text)] transition-colors hover:bg-[var(--crm-muted)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button type="button" onClick={() => void generarApoSolidario(empleado, a)} title="Descargar documento"
              className="rounded-md border border-[var(--crm-border-strong)] p-1.5 text-[var(--crm-text)] transition-colors hover:bg-[var(--crm-muted)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>
        )}
      />

      {preview && (
        <DocPreviewModal
          blob={preview.blob}
          filename={preview.filename}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
