import { useState, useMemo } from "react";
import agregarIcon from "@/assets/images/Agregar.png";
import editarIcon from "@/assets/images/Editar.png";
import borrarIcon from "@/assets/images/Borrar.png";
import type { Amonestacion } from "../../services/amonestaciones.api";
import type { ActaAdministrativa } from "../../services/actas-administrativas.api";
import type { Empleado } from "../../services/empleados.api";
import {
  generarActaAdministrativa,
  generarActaHechos,
  generarActaDisciplinaria,
  generarPlanMejora,
  generarAmonestacionVerbal,
} from "../../utils/documentos-rh";
import { DocPreviewModal } from "../../components/DocPreviewModal";

type Row =
  | { kind: "amon"; data: Amonestacion }
  | { kind: "acta"; data: ActaAdministrativa };

function rowDate(r: Row) {
  return r.kind === "amon" ? r.data.fecha : r.data.fecha_acta;
}

function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

const ACTA_LABEL: Record<string, string> = {
  voluntaria:    "Voluntaria",
  hechos:        "Acta de Hechos",
  disciplinaria: "Disciplinaria",
  pip:           "Plan de Mejora",
};

function actaBadgeClass(tipo: string) {
  if (tipo === "hechos")        return "bg-amber-50 text-amber-700";
  if (tipo === "disciplinaria") return "bg-red-50 text-red-700";
  if (tipo === "pip")           return "bg-blue-50 text-blue-700";
  return "bg-purple-50 text-purple-700";
}

function amonBadgeClass(tipo: string) {
  if (tipo === "Verbal")  return "bg-amber-100 text-amber-700";
  if (tipo === "Escrita") return "bg-orange-100 text-orange-700";
  return "bg-red-100 text-red-700";
}

function handleDescargar(empleado: Empleado, acta: ActaAdministrativa) {
  let gen: Promise<Blob>;
  if (acta.tipo === "hechos")             gen = generarActaHechos(empleado, acta);
  else if (acta.tipo === "disciplinaria") gen = generarActaDisciplinaria(empleado, acta);
  else if (acta.tipo === "pip")           gen = generarPlanMejora(empleado, acta);
  else                                    gen = generarActaAdministrativa(empleado, acta);
  gen.catch((e) => alert("Error al generar el documento: " + (e?.message ?? e)));
}

interface Props {
  amonestaciones: Amonestacion[];
  loading: boolean;
  canEdit: boolean;
  onAdd: () => void;
  onEdit: (a: Amonestacion) => void;
  onDelete: (a: Amonestacion) => void;
  actas: ActaAdministrativa[];
  loadingActas: boolean;
  empleado: Empleado;
  onAddActa: () => void;
  onEditActa: (a: ActaAdministrativa) => void;
  onDeleteActa: (a: ActaAdministrativa) => void;
}

export function AmonestacionesTab({
  amonestaciones, loading, canEdit, onAdd, onEdit, onDelete,
  actas, loadingActas, empleado, onAddActa, onEditActa, onDeleteActa,
}: Props) {
  const isLoading = loading || loadingActas;
  const [preview, setPreview] = useState<{ blob: Blob; filename: string } | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");

  const handleVerAmon = async (a: Amonestacion) => {
    if (a.tipo !== "Verbal") return;
    try {
      const blob = await generarAmonestacionVerbal(empleado, a, { onlyBlob: true });
      const nombre = `${empleado.nombre} ${empleado.apellido_paterno}`.trim().replace(/ /g, "_");
      setPreview({ blob, filename: `Amonestacion_Verbal_${nombre}_${a.fecha.slice(0, 10)}.docx` });
    } catch (e: unknown) {
      alert("Error al previsualizar: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleVer = async (ac: ActaAdministrativa) => {
    const nombre = `${empleado.nombre} ${empleado.apellido_paterno}`.trim().replace(/ /g, "_");
    let gen: Promise<Blob>;
    if (ac.tipo === "hechos")             gen = generarActaHechos(empleado, ac, { onlyBlob: true });
    else if (ac.tipo === "disciplinaria") gen = generarActaDisciplinaria(empleado, ac, { onlyBlob: true });
    else if (ac.tipo === "pip")           gen = generarPlanMejora(empleado, ac, { onlyBlob: true });
    else                                  gen = generarActaAdministrativa(empleado, ac, { onlyBlob: true });
    try {
      const blob = await gen;
      const tipo = ACTA_LABEL[ac.tipo] ?? ac.tipo;
      setPreview({ blob, filename: `Acta_${tipo}_${nombre}_${ac.fecha_acta.slice(0, 10)}.docx` });
    } catch (e: unknown) {
      alert("Error al previsualizar: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const allRows: Row[] = [
    ...amonestaciones.map((d): Row => ({ kind: "amon", data: d })),
    ...actas.map((d): Row => ({ kind: "acta", data: d })),
  ].sort((a, b) => rowDate(b).localeCompare(rowDate(a)));

  const rows = useMemo(() => {
    return allRows.filter((row) => {
      if (filtroCategoria === "amon" && row.kind !== "amon") return false;
      if (filtroCategoria === "acta" && row.kind !== "acta") return false;
      if (filtroTipo) {
        const tipo = row.kind === "amon" ? row.data.tipo : (ACTA_LABEL[row.data.tipo] ?? row.data.tipo);
        if (tipo !== filtroTipo) return false;
      }
      if (filtroFecha) {
        const fecha = row.kind === "amon" ? row.data.fecha : row.data.fecha_acta;
        if (fecha.slice(0, 10) !== filtroFecha) return false;
      }
      return true;
    });
  }, [allRows, filtroCategoria, filtroTipo, filtroFecha]);

  const hayFiltros = filtroCategoria || filtroTipo || filtroFecha;
  const selectClass = "rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2 text-sm text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-[#312C85]/30";

  return (
    <div className="flex flex-col gap-4">

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={filtroCategoria} onChange={(e) => { setFiltroCategoria(e.target.value); setFiltroTipo(""); }} className={selectClass}>
          <option value="">Todas las categorías</option>
          <option value="amon">Amonestación</option>
          <option value="acta">Acta Adm.</option>
        </select>

        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className={selectClass}>
          <option value="">Todos los tipos</option>
          {filtroCategoria === "acta" ? (
            <>
              <option value="Voluntaria">Voluntaria</option>
              <option value="Acta de Hechos">Acta de Hechos</option>
              <option value="Disciplinaria">Disciplinaria</option>
              <option value="Plan de Mejora">Plan de Mejora</option>
            </>
          ) : filtroCategoria === "amon" ? (
            <>
              <option value="Verbal">Verbal</option>
              <option value="Escrita">Escrita</option>
              <option value="Suspensión">Suspensión</option>
            </>
          ) : (
            <>
              <option value="Verbal">Verbal</option>
              <option value="Escrita">Escrita</option>
              <option value="Suspensión">Suspensión</option>
              <option value="Voluntaria">Voluntaria</option>
              <option value="Acta de Hechos">Acta de Hechos</option>
              <option value="Disciplinaria">Disciplinaria</option>
              <option value="Plan de Mejora">Plan de Mejora</option>
            </>
          )}
        </select>

        <input
          type="date"
          value={filtroFecha}
          onChange={(e) => setFiltroFecha(e.target.value)}
          title="Período"
          className={selectClass}
        />

        {hayFiltros && (
          <button
            type="button"
            onClick={() => { setFiltroCategoria(""); setFiltroTipo(""); setFiltroFecha(""); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
          >
            Limpiar filtros
          </button>
        )}

        <span className="ml-auto text-sm text-[var(--crm-text-muted)]">
          {hayFiltros
            ? `${rows.length} de ${allRows.length} registros`
            : `${allRows.length} ${allRows.length === 1 ? "registro" : "registros"}`}
        </span>
      </div>

      {/* Botones */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {canEdit && (
          <>
            <button
              type="button"
              onClick={onAdd}
              className="flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e293b]"
            >
              <img src={agregarIcon} alt="" className="h-4 w-4" />
              Registrar amonestación
            </button>
            <button
              type="button"
              onClick={onAddActa}
              className="flex items-center gap-2 rounded-xl bg-[#312C85] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2a2570]"
            >
              <img src={agregarIcon} alt="" className="h-4 w-4" />
              Nueva acta
            </button>
          </>
        )}
      </div>

      {/* Tabla unificada */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Fecha</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Categoría</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Tipo</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Detalle</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                  <div className="flex justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#312C85]" />
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                  Sin registros de amonestaciones ni actas
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                if (row.kind === "amon") {
                  const a = row.data;
                  return (
                    <tr key={`amon-${a.id}`} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="px-4 py-3 text-slate-700">{formatDate(a.fecha)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                          Amonestación
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${amonBadgeClass(a.tipo)}`}>
                          {a.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                        {a.descripcion ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {a.tipo === "Verbal" && (
                            <>
                              <button type="button" onClick={() => void handleVerAmon(a)} title="Ver documento"
                                className="rounded-md border border-[var(--crm-border-strong)] p-1.5 text-[var(--crm-text)] transition-colors hover:bg-[var(--crm-muted)]">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button type="button" onClick={() => void generarAmonestacionVerbal(empleado, a)} title="Descargar documento"
                                className="rounded-md border border-[var(--crm-border-strong)] p-1.5 text-[var(--crm-text)] transition-colors hover:bg-[var(--crm-muted)]">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                            </>
                          )}
                          {canEdit && (
                            <>
                              <button type="button" onClick={() => onEdit(a)} title="Editar"
                                className="rounded-md border border-[var(--crm-border-strong)] p-1.5 text-[var(--crm-text)] transition-colors hover:bg-[var(--crm-muted)]">
                                <img src={editarIcon} alt="Editar" className="h-5 w-5" />
                              </button>
                              <button type="button" onClick={() => onDelete(a)} title="Eliminar"
                                className="rounded-md border border-[var(--crm-border-strong)] p-1.5 text-[var(--crm-text)] transition-colors hover:bg-[var(--crm-muted)]">
                                <img src={borrarIcon} alt="Eliminar" className="h-5 w-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }

                // acta
                const ac = row.data;
                const testigoDisplay = (() => {
                  if (ac.tipo === "pip") return "—";
                  if (ac.tipo === "disciplinaria") {
                    try {
                      const arr = JSON.parse(ac.testigo_nombre ?? "[]") as string[];
                      return arr.filter(Boolean).join(" / ") || "—";
                    } catch { return ac.testigo_nombre ?? "—"; }
                  }
                  return ac.testigo_nombre ?? (ac.tipo === "hechos" ? "Jenny Rivera" : "—");
                })();

                return (
                  <tr key={`acta-${ac.id}`} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="px-4 py-3 text-slate-700">{formatDate(ac.fecha_acta)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                        Acta Adm.
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${actaBadgeClass(ac.tipo)}`}>
                        {ACTA_LABEL[ac.tipo] ?? ac.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{testigoDisplay}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => void handleVer(ac)} title="Ver documento"
                          className="rounded-md border border-[var(--crm-border-strong)] p-1.5 text-[var(--crm-text)] transition-colors hover:bg-[var(--crm-muted)]">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button type="button" onClick={() => handleDescargar(empleado, ac)} title="Descargar"
                          className="rounded-md border border-[var(--crm-border-strong)] p-1.5 text-[var(--crm-text)] transition-colors hover:bg-[var(--crm-muted)]">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        {canEdit && (
                          <>
                            <button type="button" onClick={() => onEditActa(ac)} title="Editar"
                              className="rounded-md border border-[var(--crm-border-strong)] p-1.5 text-[var(--crm-text)] transition-colors hover:bg-[var(--crm-muted)]">
                              <img src={editarIcon} alt="Editar" className="h-5 w-5" />
                            </button>
                            <button type="button" onClick={() => onDeleteActa(ac)} title="Eliminar"
                              className="rounded-md border border-[var(--crm-border-strong)] p-1.5 text-[var(--crm-text)] transition-colors hover:bg-[var(--crm-muted)]">
                              <img src={borrarIcon} alt="Eliminar" className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

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
