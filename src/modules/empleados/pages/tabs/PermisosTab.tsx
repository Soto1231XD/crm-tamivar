import { useState, useMemo } from "react";
import { BaseTable } from "@/components/ui/BaseTable";
import agregarIcon from "@/assets/images/Agregar.png";
import type { Empleado } from "../../services/empleados.api";
import type { PermisoEmpleado } from "../../services/permisos.api";
import {
  generarAvisoTardanza,
  generarPermisoEntradaTarde,
  generarConstanciaInasistencia,
  generarPermisoLactancia,
  generarConstanciaFaltaJustificada,
  generarPermisoLlegarTarde,
} from "../../utils/documentos-rh";

function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

interface Props {
  permisos: PermisoEmpleado[];
  loading: boolean;
  empleado: Empleado;
  canEdit: boolean;
  onAdd: () => void;
  onEdit: (p: PermisoEmpleado) => void;
  onDelete: (p: PermisoEmpleado) => void;
}

const TIPOS = ["Personal", "Médico", "Familiar", "Tardanza", "Entrada Tarde", "Inasistencia", "Lactancia", "Falta Justificada", "Permiso para llegar tarde"] as const;

export function PermisosTab({ permisos, loading, empleado, canEdit, onAdd, onEdit, onDelete }: Props) {
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("");
  const [filtroGoce, setFiltroGoce] = useState("");

  const permisosFiltrados = useMemo(() => {
    return permisos.filter((p) => {
      if (filtroTipo    && p.tipo    !== filtroTipo)                                 return false;
      if (filtroEstatus && p.estatus !== filtroEstatus)                               return false;
      if (filtroGoce === "con"  && !p.con_goce)                                       return false;
      if (filtroGoce === "sin"  && p.con_goce)                                        return false;
      return true;
    });
  }, [permisos, filtroTipo, filtroEstatus, filtroGoce]);

  const hayFiltros = filtroTipo || filtroEstatus || filtroGoce;

  const columns = [
    { header: "Fecha", render: (p: PermisoEmpleado) => formatDate(p.fecha) },
    {
      header: "Tipo",
      render: (p: PermisoEmpleado) => (
        <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
          {p.tipo}
        </span>
      ),
    },
    {
      header: "Goce",
      render: (p: PermisoEmpleado) => (
        <span className={[
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
          p.con_goce ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600",
        ].join(" ")}>
          {p.con_goce ? "Con goce" : "Sin goce"}
        </span>
      ),
    },
    {
      header: "Estatus",
      render: (p: PermisoEmpleado) => (
        <span className={[
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
          p.estatus === "Aprobado"  ? "bg-green-100 text-green-700"  :
          p.estatus === "Rechazado" ? "bg-red-100 text-red-700"      :
                                      "bg-amber-100 text-amber-700",
        ].join(" ")}>
          {p.estatus}
        </span>
      ),
    },
    { header: "Descripción", render: (p: PermisoEmpleado) => p.descripcion ?? <span className="text-slate-300">—</span> },
    {
      header: "Documentos",
      render: (p: PermisoEmpleado) => {
        const btnClass = "rounded-lg bg-[#312C85] px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-[#4338ca]";
        if (p.tipo === "Tardanza")
          return <div className="flex justify-center"><button type="button" onClick={() => generarAvisoTardanza(empleado, p)} className={btnClass}>Generar aviso</button></div>;
        if (p.tipo === "Entrada Tarde")
          return <div className="flex justify-center"><button type="button" onClick={() => generarPermisoEntradaTarde(empleado, p)} className={btnClass}>Generar permiso</button></div>;
        if (p.tipo === "Inasistencia")
          return <div className="flex justify-center"><button type="button" onClick={() => generarConstanciaInasistencia(empleado, p)} className={btnClass}>Generar constancia</button></div>;
        if (p.tipo === "Lactancia")
          return <div className="flex justify-center"><button type="button" onClick={() => generarPermisoLactancia(empleado, p)} className={btnClass}>Generar constancia</button></div>;
        if (p.tipo === "Falta Justificada")
          return <div className="flex justify-center"><button type="button" onClick={() => generarConstanciaFaltaJustificada(empleado, p)} className={btnClass}>Generar constancia</button></div>;
        if (p.tipo === "Permiso para llegar tarde")
          return <div className="flex justify-center"><button type="button" onClick={() => generarPermisoLlegarTarde(empleado, p)} className={btnClass}>Generar permiso</button></div>;
        return <span className="text-slate-300">—</span>;
      },
    },
  ];

  const selectClass = "rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2 text-sm text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-[#312C85]/30";

  return (
    <div className="flex flex-col gap-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-[var(--crm-text-muted)]">
          {hayFiltros
            ? `${permisosFiltrados.length} de ${permisos.length} permisos`
            : `${permisos.length} ${permisos.length === 1 ? "permiso registrado" : "permisos registrados"}`}
        </p>
        {canEdit && (
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e293b]"
          >
            <img src={agregarIcon} alt="" className="h-4 w-4" />
            Registrar permiso
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className={selectClass}>
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <select value={filtroEstatus} onChange={(e) => setFiltroEstatus(e.target.value)} className={selectClass}>
          <option value="">Todos los estatus</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Aprobado">Aprobado</option>
          <option value="Rechazado">Rechazado</option>
        </select>

        <select value={filtroGoce} onChange={(e) => setFiltroGoce(e.target.value)} className={selectClass}>
          <option value="">Con y sin goce</option>
          <option value="con">Con goce</option>
          <option value="sin">Sin goce</option>
        </select>

        {hayFiltros && (
          <button
            type="button"
            onClick={() => { setFiltroTipo(""); setFiltroEstatus(""); setFiltroGoce(""); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <BaseTable
        data={permisosFiltrados}
        columns={columns}
        isLoading={loading}
        emptyMessage={hayFiltros ? "Sin permisos con esos filtros" : "No hay permisos registrados"}
        onEdit={canEdit ? onEdit : undefined}
        onDelete={canEdit ? onDelete : undefined}
        canEdit={canEdit}
        canDelete={canEdit}
      />
    </div>
  );
}
