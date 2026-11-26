import { useState, useMemo } from "react";
import { BaseTable } from "@/components/ui/BaseTable";
import agregarIcon from "@/assets/images/Agregar.png";
import verIcon from "@/assets/images/Ver.png";
import type { Empleado } from "../../services/empleados.api";
import type { ResponsivaEmpleado, DatosVehiculo, DatosMateriales, DatosHerramientas } from "../../services/responsivas.api";
import { generarResponsivaVehiculo } from "../../utils/documentos-rh/doc-responsiva-vehiculo";
import { generarResponsivaMateriales } from "../../utils/documentos-rh/doc-responsiva-materiales";
import { generarResponsivaHerramientas } from "../../utils/documentos-rh/doc-responsiva-herramientas";
import { DocPreviewModal } from "../../components/DocPreviewModal";

function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function TipoBadge({ tipo }: { tipo: string }) {
  const styles: Record<string, string> = {
    "Vehículo":      "bg-indigo-100 text-indigo-700",
    "Materiales":    "bg-emerald-100 text-emerald-700",
    "Herramientas":  "bg-amber-100 text-amber-700",
  };
  const labels: Record<string, string> = {
    "Herramientas": "Herramientas Mtto.",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[tipo] ?? "bg-slate-100 text-slate-600"}`}>
      {labels[tipo] ?? tipo}
    </span>
  );
}

function DetallesCell({ r }: { r: ResponsivaEmpleado }) {
  try {
    if (r.tipo === "Vehículo") {
      const d = JSON.parse(r.datos) as DatosVehiculo;
      return (
        <span className="text-sm">
          {d.marca} {d.modelo} {d.anio} — <span className="font-semibold">{d.placas}</span>
        </span>
      );
    }
    if (r.tipo === "Materiales") {
      const d = JSON.parse(r.datos) as DatosMateriales;
      const primera = d.filas?.[0];
      if (!primera) return <span className="text-slate-400">—</span>;
      const extra = d.filas.length > 1 ? ` +${d.filas.length - 1} más` : "";
      return <span className="text-sm">{primera.herramienta}{primera.descripcion ? ` — ${primera.descripcion}` : ""}{extra}</span>;
    }
    if (r.tipo === "Herramientas") {
      const d = JSON.parse(r.datos) as DatosHerramientas;
      const primera = d.filas?.[0];
      if (!primera) return <span className="text-slate-400">—</span>;
      const extra = d.filas.length > 1 ? ` +${d.filas.length - 1} más` : "";
      return <span className="text-sm">{primera.herramienta}{primera.marca_modelo ? ` — ${primera.marca_modelo}` : ""}{extra}</span>;
    }
  } catch { /* fall through */ }
  return <span className="text-slate-400">—</span>;
}

interface Props {
  responsivas: ResponsivaEmpleado[];
  loading: boolean;
  empleado: Empleado;
  canEdit: boolean;
  onAdd: () => void;
  onEdit: (r: ResponsivaEmpleado) => void;
  onDelete: (r: ResponsivaEmpleado) => void;
}

export function ResponsivasTab({ responsivas, loading, empleado, canEdit, onAdd, onEdit, onDelete }: Props) {
  const [preview, setPreview] = useState<{ blob: Blob; filename: string } | null>(null);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroPeriodo, setFiltroPeriodo] = useState("");

  const responsivasFiltradas = useMemo(() => {
    return responsivas.filter((r) => {
      if (filtroTipo && r.tipo !== filtroTipo) return false;
      if (filtroPeriodo && r.fecha.slice(0, 10) !== filtroPeriodo) return false;
      return true;
    });
  }, [responsivas, filtroTipo, filtroPeriodo]);

  const hayFiltros = filtroTipo || filtroPeriodo;
  const selectClass = "rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2 text-sm text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-[#312C85]/30";

  const columns = [
    { header: "Fecha", render: (r: ResponsivaEmpleado) => formatDate(r.fecha) },
    { header: "Tipo",  render: (r: ResponsivaEmpleado) => <TipoBadge tipo={r.tipo} /> },
    { header: "Detalles", render: (r: ResponsivaEmpleado) => <DetallesCell r={r} /> },
  ];

  const handleGenerar = (r: ResponsivaEmpleado) => {
    if (r.tipo === "Vehículo")      void generarResponsivaVehiculo(empleado, r);
    if (r.tipo === "Materiales")    void generarResponsivaMateriales(empleado, r);
    if (r.tipo === "Herramientas")  void generarResponsivaHerramientas(empleado, r);
  };

  const handleVer = async (r: ResponsivaEmpleado) => {
    const nombre = `${empleado.nombre} ${empleado.apellido_paterno}`.trim().replace(/ /g, "_");
    let blob: Blob;
    let filename: string;
    try {
      if (r.tipo === "Vehículo") {
        blob = await generarResponsivaVehiculo(empleado, r, { onlyBlob: true });
        filename = `Responsiva_Vehiculo_${nombre}_${r.fecha.slice(0, 10)}.docx`;
      } else if (r.tipo === "Materiales") {
        blob = await generarResponsivaMateriales(empleado, r, { onlyBlob: true });
        filename = `Responsiva_Materiales_${nombre}_${r.fecha.slice(0, 10)}.docx`;
      } else {
        blob = await generarResponsivaHerramientas(empleado, r, { onlyBlob: true });
        filename = `Herramientas_Mantenimiento_${nombre}_${r.fecha.slice(0, 10)}.docx`;
      }
      setPreview({ blob, filename });
    } catch (e: unknown) {
      alert("Error al previsualizar: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className={selectClass}>
          <option value="">Todos los tipos</option>
          <option value="Vehículo">Vehículo</option>
          <option value="Materiales">Materiales</option>
          <option value="Herramientas">Herramientas</option>
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
            onClick={() => { setFiltroTipo(""); setFiltroPeriodo(""); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--crm-text-muted)]">
          {hayFiltros
            ? `${responsivasFiltradas.length} de ${responsivas.length} responsivas`
            : `${responsivas.length} ${responsivas.length === 1 ? "responsiva registrada" : "responsivas registradas"}`}
        </p>
        {canEdit && (
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e293b]"
          >
            <img src={agregarIcon} alt="" className="h-4 w-4" />
            Registrar responsiva
          </button>
        )}
      </div>

      <BaseTable
        data={responsivasFiltradas}
        columns={columns}
        isLoading={loading}
        emptyMessage={hayFiltros ? "Sin responsivas con esos filtros" : "No hay responsivas registradas"}
        onEdit={canEdit ? onEdit : undefined}
        onDelete={canEdit ? onDelete : undefined}
        canEdit={canEdit}
        canDelete={canEdit}
        customActions={(r) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Ver documento"
              onClick={() => void handleVer(r)}
              className="rounded-md border border-[var(--crm-border-strong)] p-1.5 text-[var(--crm-text)] transition-colors hover:bg-[var(--crm-muted)]"
            >
              <img src={verIcon} alt="Ver" className="h-5 w-5" />
            </button>
            <button
              type="button"
              title="Descargar documento"
              onClick={() => handleGenerar(r)}
              className="rounded-md border border-[var(--crm-border-strong)] p-1.5 text-[var(--crm-text)] transition-colors hover:bg-[var(--crm-muted)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
