import { useState, useMemo } from "react";
import { BaseTable } from "@/components/ui/BaseTable";
import agregarIcon from "@/assets/images/Agregar.png";
import type { Empleado } from "../../services/empleados.api";
import type { PermisoEmpleado } from "../../services/permisos.api";
import { generarAvisoTardanza, generarPermisoEntradaTarde, generarPermisoLlegarTarde } from "../../utils/documentos-rh/doc-tardanzas";
import { generarConstanciaInasistencia, generarPermisoLactancia, generarConstanciaFaltaJustificada } from "../../utils/documentos-rh/doc-permisos-faltas";
import { generarPermisoSalidaAnticipada } from "../../utils/documentos-rh/doc-permiso-salida";
import { DocPreviewModal } from "../../components/DocPreviewModal";

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

const TIPOS = ["Personal", "Médico", "Familiar", "Tardanza", "Entrada Tarde", "Inasistencia", "Lactancia", "Falta Justificada", "Permiso para llegar tarde", "Salida Anticipada"] as const;

export function PermisosTab({ permisos, loading, empleado, canEdit, onAdd, onEdit, onDelete }: Props) {
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("");
  const [filtroGoce, setFiltroGoce] = useState("");
  const [preview, setPreview] = useState<{ blob: Blob; filename: string } | null>(null);

  const handleVer = async (p: PermisoEmpleado) => {
    const nombre = `${empleado.nombre} ${empleado.apellido_paterno}`.trim().replace(/ /g, "_");
    let gen: Promise<Blob> | null = null;
    let filename = "documento.docx";
    if (p.tipo === "Tardanza") {
      gen = generarAvisoTardanza(empleado, p, { onlyBlob: true });
      filename = `Aviso_Tardanza_${nombre}_${p.fecha.slice(0, 10)}.docx`;
    } else if (p.tipo === "Entrada Tarde") {
      gen = generarPermisoEntradaTarde(empleado, p, { onlyBlob: true });
      filename = `Permiso_Entrada_Tarde_${nombre}_${p.fecha.slice(0, 10)}.docx`;
    } else if (p.tipo === "Inasistencia") {
      gen = generarConstanciaInasistencia(empleado, p, { onlyBlob: true });
      filename = `Constancia_Inasistencia_${nombre}_${p.fecha.slice(0, 10)}.docx`;
    } else if (p.tipo === "Lactancia") {
      gen = generarPermisoLactancia(empleado, p, { onlyBlob: true });
      filename = `Permiso_Lactancia_${nombre}_${p.fecha.slice(0, 10)}.docx`;
    } else if (p.tipo === "Falta Justificada") {
      gen = generarConstanciaFaltaJustificada(empleado, p, { onlyBlob: true });
      filename = `Falta_Justificada_${nombre}_${p.fecha.slice(0, 10)}.docx`;
    } else if (p.tipo === "Permiso para llegar tarde") {
      gen = generarPermisoLlegarTarde(empleado, p, { onlyBlob: true });
      filename = `Permiso_Llegar_Tarde_${nombre}_${p.fecha.slice(0, 10)}.docx`;
    } else if (p.tipo === "Salida Anticipada") {
      gen = generarPermisoSalidaAnticipada(empleado, p, { onlyBlob: true });
      filename = `Permiso_Salida_Anticipada_${nombre}_${p.fecha.slice(0, 10)}.docx`;
    }
    if (!gen) return;
    try {
      setPreview({ blob: await gen, filename });
    } catch (e: unknown) {
      alert("Error al previsualizar: " + (e instanceof Error ? e.message : String(e)));
    }
  };

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
        customActions={(p) => {
          const hasDoc = ["Tardanza","Entrada Tarde","Inasistencia","Lactancia","Falta Justificada","Permiso para llegar tarde","Salida Anticipada"].includes(p.tipo);
          if (!hasDoc) return null;
          const handleDownload = () => {
            if (p.tipo === "Tardanza")                      void generarAvisoTardanza(empleado, p);
            else if (p.tipo === "Entrada Tarde")            void generarPermisoEntradaTarde(empleado, p);
            else if (p.tipo === "Inasistencia")             void generarConstanciaInasistencia(empleado, p);
            else if (p.tipo === "Lactancia")                void generarPermisoLactancia(empleado, p);
            else if (p.tipo === "Falta Justificada")        void generarConstanciaFaltaJustificada(empleado, p);
            else if (p.tipo === "Permiso para llegar tarde") void generarPermisoLlegarTarde(empleado, p);
            else if (p.tipo === "Salida Anticipada")        void generarPermisoSalidaAnticipada(empleado, p);
          };
          return (
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => void handleVer(p)} title="Ver documento"
                className="rounded-md border border-[var(--crm-border-strong)] p-1.5 text-[var(--crm-text)] transition-colors hover:bg-[var(--crm-muted)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              <button type="button" onClick={handleDownload} title="Descargar documento"
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
