import { useState, useMemo } from "react";
import { BaseTable } from "@/components/ui/BaseTable";
import { DocPreviewModal } from "../../components/DocPreviewModal";
import { BadgeSelect } from "@/components/ui/BadgeSelect";
import agregarIcon from "@/assets/images/Agregar.png";
import type { Empleado } from "../../services/empleados.api";
import type { Vacacion } from "../../services/vacaciones.api";
import {
  calcularAntigüedad,
  calcularDerechoVacaciones,
  clasificarPeriodoVacacion,
} from "../../services/vacaciones.api";
import { generarSolicitudVacaciones, generarConstanciaAnual } from "../../utils/documentos-rh";

function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

interface Props {
  vacaciones: Vacacion[];
  loading: boolean;
  empleado: Empleado;
  canEdit: boolean;
  updatingEstatusVacId: number | null;
  onAdd: () => void;
  onEdit: (v: Vacacion) => void;
  onDelete: (v: Vacacion) => void;
  onEstatusChange: (vacId: number, estatus: string) => void;
}

export function VacacionesTab({ vacaciones, loading, empleado, canEdit, updatingEstatusVacId, onAdd, onEdit, onDelete, onEstatusChange }: Props) {
  const [preview, setPreview] = useState<{ blob: Blob; filename: string } | null>(null);
  const [filtroEstatus, setFiltroEstatus] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroPeriodo, setFiltroPeriodo] = useState("");

  const handleVer = async (v: Vacacion) => {
    try {
      const esAdelanto = (v.tipo ?? "Solicitud") === "Adelanto";
      const blob = await generarSolicitudVacaciones(empleado, v, vacaciones, esAdelanto, { onlyBlob: true });
      const nombre = `${empleado.nombre} ${empleado.apellido_paterno}`.trim().replace(/ /g, "_");
      const prefix = esAdelanto ? "Adelanto_Vacaciones" : "Solicitud_Vacaciones";
      setPreview({ blob, filename: `${prefix}_${nombre}_${v.fecha_inicio.slice(0, 10)}.docx` });
    } catch (e: unknown) {
      alert("Error al previsualizar: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const vacacionesFiltradas = useMemo(() => {
    return vacaciones.filter((v) => {
      if (filtroEstatus && v.estatus !== filtroEstatus) return false;
      if (filtroTipo && (v.tipo ?? "Solicitud") !== filtroTipo) return false;
      if (filtroPeriodo) {
        const periodo = clasificarPeriodoVacacion(empleado.fecha_ingreso, v.fecha_inicio);
        if (filtroPeriodo === "Anticipada" && periodo !== "Anticipada") return false;
        if (filtroPeriodo === "En periodo" && periodo === "Anticipada") return false;
      }
      return true;
    });
  }, [vacaciones, filtroEstatus, filtroTipo, filtroPeriodo, empleado.fecha_ingreso]);

  const hayFiltros = filtroEstatus || filtroTipo || filtroPeriodo;

  const antiguedad  = calcularAntigüedad(empleado.fecha_ingreso);
  const derecho     = calcularDerechoVacaciones(antiguedad);
  const ocupados    = vacaciones
    .filter((v) => v.estatus === "Aprobada" || v.estatus === "Pendiente")
    .reduce((s, v) => s + v.dias, 0);
  const disponibles = Math.max(0, derecho - ocupados);

  const columns = [
    { header: "Inicio", render: (v: Vacacion) => formatDate(v.fecha_inicio) },
    { header: "Fin",    render: (v: Vacacion) => formatDate(v.fecha_fin) },
    { header: "Días",   render: (v: Vacacion) => <span className="font-semibold">{v.dias}</span> },
    {
      header: "Tipo",
      render: (v: Vacacion) => {
        const periodo = clasificarPeriodoVacacion(empleado.fecha_ingreso, v.fecha_inicio);
        return (
          <div className="flex flex-col items-center gap-1">
            <span className={[
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
              v.tipo === "Adelanto" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700",
            ].join(" ")}>
              {v.tipo ?? "Solicitud"}
            </span>
            <span className={[
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
              periodo === "Anticipada" ? "bg-orange-100 text-orange-700" : "bg-teal-100 text-teal-700",
            ].join(" ")}>
              {periodo === "Anticipada" ? "Anticipada" : "En periodo"}
            </span>
          </div>
        );
      },
    },
    {
      header: "Estatus",
      render: (v: Vacacion) => (
        <div className="flex items-center justify-center gap-1.5">
          <BadgeSelect
            value={v.estatus}
            options={["Pendiente", "Aprobada", "Rechazada"]}
            onChange={(val) => onEstatusChange(v.id, val)}
            disabled={updatingEstatusVacId === v.id}
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
          {v.estatus === "Rechazada" && v.motivo_rechazo && (
            <div className="group relative flex shrink-0 items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 cursor-pointer text-red-400 hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
              </svg>
              <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-52 -translate-x-1/2 scale-95 rounded-xl bg-slate-800 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-all group-hover:scale-100 group-hover:opacity-100">
                <p className="mb-0.5 font-semibold text-slate-300">Motivo de rechazo</p>
                <p className="leading-relaxed">{v.motivo_rechazo}</p>
                <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Prima",
      render: (v: Vacacion) => {
        if (!v.prima_vacacional) return <span className="text-slate-400">—</span>;
        const monto = parseFloat(v.prima_vacacional);
        const tipoPrima = derecho > 0 && v.dias >= derecho ? "Completa" : "Parcial";
        return (
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-semibold text-emerald-700 text-xs">
              {monto.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
            </span>
            <span className={[
              "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
              tipoPrima === "Completa" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
            ].join(" ")}>
              {tipoPrima}
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Antigüedad",           value: `${antiguedad} año${antiguedad !== 1 ? "s" : ""}`, color: "text-slate-700" },
          { label: "Derecho a vacaciones", value: `${derecho} días`,     color: "text-[#312C85]" },
          { label: "Días ocupados",        value: `${ocupados} días`,    color: "text-amber-600" },
          { label: "Días disponibles",     value: `${disponibles} días`, color: disponibles > 0 ? "text-green-600" : "text-red-600" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.label}</p>
            <p className={`mt-1 text-xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filtroEstatus}
          onChange={(e) => setFiltroEstatus(e.target.value)}
          className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2 text-sm text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-[#312C85]/30"
        >
          <option value="">Todos los estatus</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Aprobada">Aprobada</option>
          <option value="Rechazada">Rechazada</option>
        </select>

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2 text-sm text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-[#312C85]/30"
        >
          <option value="">Todos los tipos</option>
          <option value="Solicitud">Solicitud</option>
          <option value="Adelanto">Adelanto</option>
        </select>

        <select
          value={filtroPeriodo}
          onChange={(e) => setFiltroPeriodo(e.target.value)}
          className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2 text-sm text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-[#312C85]/30"
        >
          <option value="">Anticipada y en periodo</option>
          <option value="Anticipada">Anticipada</option>
          <option value="En periodo">En periodo</option>
        </select>

        {hayFiltros && (
          <button
            type="button"
            onClick={() => { setFiltroEstatus(""); setFiltroTipo(""); setFiltroPeriodo(""); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-[var(--crm-text-muted)]">
          {hayFiltros
            ? `${vacacionesFiltradas.length} de ${vacaciones.length} períodos`
            : `${vacaciones.length} ${vacaciones.length === 1 ? "período registrado" : "períodos registrados"}`}
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => generarConstanciaAnual(empleado)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            📄 Constancia Anual
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={onAdd}
              className="flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e293b]"
            >
              <img src={agregarIcon} alt="" className="h-4 w-4" />
              Registrar vacación
            </button>
          )}
        </div>
      </div>

      <BaseTable
        data={vacacionesFiltradas}
        columns={columns}
        isLoading={loading}
        emptyMessage={hayFiltros ? "Sin períodos con esos filtros" : "No hay vacaciones registradas"}
        onEdit={canEdit ? onEdit : undefined}
        onDelete={canEdit ? onDelete : undefined}
        canEdit={canEdit}
        canDelete={canEdit}
        customActions={(v) => {
          const esAdelanto = (v.tipo ?? "Solicitud") === "Adelanto";
          return (
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => void handleVer(v)} title="Ver documento"
                className="rounded-md border border-[var(--crm-border-strong)] p-1.5 text-[var(--crm-text)] transition-colors hover:bg-[var(--crm-muted)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              <button type="button"
                title="Descargar documento"
                onClick={() => void generarSolicitudVacaciones(empleado, v, vacaciones, esAdelanto)}
                className="rounded-md border border-[var(--crm-border-strong)] p-1.5 text-[var(--crm-text)] transition-colors hover:bg-[var(--crm-muted)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </div>
          );
        }}
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
