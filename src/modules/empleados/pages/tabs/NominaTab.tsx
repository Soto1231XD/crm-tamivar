import { useState, useMemo } from "react";
import { BaseTable } from "@/components/ui/BaseTable";
import type { ColumnDef } from "@/components/ui/BaseTable";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import agregarIcon from "@/assets/images/Agregar.png";
import type { Empleado } from "../../services/empleados.api";
import type { NominaEmpleado } from "../../services/nominas.api";
import type { AdelantoEmpleado, CreateAdelantoPayload, UpdateAdelantoPayload } from "../../services/adelantos.api";
import { generarReciboNomina, generarSolicitudAdelanto } from "../../utils/documentos-rh/doc-nominas";
import { AdelantoNominaModal } from "../../components/AdelantoNominaModal";
import { DocPreviewModal } from "../../components/DocPreviewModal";

type NominaRow =
  | { id: string; kind: "pago"; data: NominaEmpleado }
  | { id: string; kind: "adelanto"; data: AdelantoEmpleado };

function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtMXN(val: string | number) {
  return (typeof val === "string" ? parseFloat(val) : val)
    .toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function formaLabel(a: AdelantoEmpleado) {
  if (a.forma_descuento === "proxima")       return "Próxima nómina";
  if (a.forma_descuento === "parcialidades") return `${a.parcialidades ?? "?"} parcialidades`;
  return a.otro_descripcion ?? "Otro";
}

interface Props {
  nominas: NominaEmpleado[];
  loadingNominas: boolean;
  adelantos: AdelantoEmpleado[];
  loadingAdelantos: boolean;
  empleado: Empleado;
  canEdit: boolean;
  onAdd: () => void;
  onEdit: (n: NominaEmpleado) => void;
  onDelete: (n: NominaEmpleado) => void;
  onSaveAdelanto: (data: CreateAdelantoPayload) => Promise<void>;
  onUpdateAdelanto: (id: number, data: UpdateAdelantoPayload) => Promise<void>;
  onDeleteAdelanto: (id: number) => Promise<string | null>;
}

export function NominaTab({
  nominas, loadingNominas, adelantos, loadingAdelantos,
  empleado, canEdit, onAdd, onEdit, onDelete, onSaveAdelanto, onUpdateAdelanto, onDeleteAdelanto,
}: Props) {
  const totalPagado = nominas.reduce((s, n) => s + parseFloat(n.total_pagado), 0);
  const [adelantoModal, setAdelantoModal] = useState<{ open: boolean; item: AdelantoEmpleado | null }>({ open: false, item: null });
  const [deleteAdelantoModal, setDeleteAdelantoModal] = useState<{ open: boolean; item: AdelantoEmpleado | null }>({ open: false, item: null });
  const [preview, setPreview] = useState<{ blob: Blob; filename: string } | null>(null);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("");

  const handleVer = async (row: NominaRow) => {
    try {
      let blob: Blob;
      let filename: string;
      const nombre = `${empleado.nombre} ${empleado.apellido_paterno}`.trim().replace(/ /g, "_");
      if (row.kind === "pago") {
        blob = await generarReciboNomina(empleado, row.data, { onlyBlob: true });
        filename = `Nomina_${nombre}_${row.data.fecha_pago.slice(0, 10)}.docx`;
      } else {
        blob = await generarSolicitudAdelanto(empleado, {
          monto: parseFloat(row.data.monto),
          formaDescuento: row.data.forma_descuento as "proxima" | "parcialidades" | "otro",
          parcialidades: row.data.parcialidades ?? undefined,
          otro: row.data.otro_descripcion ?? undefined,
        }, { onlyBlob: true });
        filename = `Adelanto_Nomina_${nombre}_${row.data.fecha_solicitud.slice(0, 10)}.docx`;
      }
      setPreview({ blob, filename });
    } catch (e: unknown) {
      alert("Error al previsualizar: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleSaveAdelanto = async (data: CreateAdelantoPayload) => {
    await onSaveAdelanto(data);
    generarSolicitudAdelanto(empleado, {
      monto: data.monto,
      formaDescuento: data.forma_descuento as "proxima" | "parcialidades" | "otro",
      parcialidades: data.parcialidades,
      otro: data.otro_descripcion,
    }).catch(() => {});
  };

  // Unificar y ordenar por fecha desc
  const allRows: NominaRow[] = [
    ...nominas.map((n): NominaRow => ({ id: `pago-${n.id}`, kind: "pago", data: n })),
    ...adelantos.map((a): NominaRow => ({ id: `adelanto-${a.id}`, kind: "adelanto", data: a })),
  ].sort((a, b) => {
    const dA = a.kind === "pago" ? a.data.fecha_pago : a.data.fecha_solicitud;
    const dB = b.kind === "pago" ? b.data.fecha_pago : b.data.fecha_solicitud;
    return dB.localeCompare(dA);
  });

  const rows = useMemo(() => {
    return allRows.filter((row) => {
      if (filtroTipo === "pago"     && row.kind !== "pago")     return false;
      if (filtroTipo === "adelanto" && row.kind !== "adelanto") return false;
      if (filtroFecha) {
        const fecha = row.kind === "pago" ? row.data.fecha_pago : row.data.fecha_solicitud;
        if (fecha.slice(0, 10) !== filtroFecha) return false;
      }
      if (filtroEstatus && row.kind === "adelanto") {
        if (row.data.estatus !== filtroEstatus) return false;
      }
      return true;
    });
  }, [allRows, filtroTipo, filtroFecha, filtroEstatus]);

  const hayFiltros = filtroTipo || filtroFecha || filtroEstatus;
  const selectClass = "rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2 text-sm text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-[#312C85]/30";

  const columns: ColumnDef<NominaRow>[] = [
    {
      header: "Fecha",
      render: (row) =>
        row.kind === "pago"
          ? formatDate(row.data.fecha_pago)
          : formatDate(row.data.fecha_solicitud),
    },
    {
      header: "Tipo",
      render: (row) =>
        row.kind === "pago" ? (
          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            Pago
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
            Adelanto
          </span>
        ),
    },
    {
      header: "Monto",
      render: (row) =>
        row.kind === "pago" ? (
          <span className="font-bold text-emerald-700">{fmtMXN(row.data.total_pagado)}</span>
        ) : (
          <span className="font-bold text-amber-700">{fmtMXN(row.data.monto)}</span>
        ),
    },
    {
      header: "Detalle",
      render: (row) =>
        row.kind === "pago" ? (
          <span className="text-xs text-slate-500">
            {formatDate(row.data.periodo_inicio)} – {formatDate(row.data.periodo_fin)}
            {row.data.folio && (
              <span className="ml-2 font-mono text-slate-400">{row.data.folio}</span>
            )}
          </span>
        ) : (
          <span className="text-xs text-slate-500">
            {formaLabel(row.data)}{" · "}
            <span
              className={[
                "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
                row.data.estatus === "Aprobado"
                  ? "bg-green-100 text-green-700"
                  : row.data.estatus === "Rechazado"
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700",
              ].join(" ")}
            >
              {row.data.estatus}
            </span>
          </span>
        ),
    },
  ];

  const handleEditRow = (row: NominaRow) => {
    if (row.kind === "pago") onEdit(row.data);
    else setAdelantoModal({ open: true, item: row.data });
  };

  const handleDeleteRow = (row: NominaRow) => {
    if (row.kind === "pago") onDelete(row.data);
    else setDeleteAdelantoModal({ open: true, item: row.data });
  };

  const isLoading = loadingNominas || loadingAdelantos;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Resumen ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pagos registrados</p>
          <p className="mt-1 text-xl font-bold text-slate-700">{nominas.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total acumulado</p>
          <p className="mt-1 text-xl font-bold text-emerald-600">
            {totalPagado.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:col-auto col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Último pago</p>
          <p className="mt-1 text-xl font-bold text-slate-700">
            {nominas.length > 0 ? formatDate(nominas[0].fecha_pago) : "—"}
          </p>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className={selectClass}>
          <option value="">Todos los tipos</option>
          <option value="pago">Pago</option>
          <option value="adelanto">Adelanto</option>
        </select>

        <input
          type="date"
          value={filtroFecha}
          onChange={(e) => setFiltroFecha(e.target.value)}
          title="Período"
          placeholder="Período"
          className={selectClass}
        />

        {filtroTipo !== "pago" && (
          <select value={filtroEstatus} onChange={(e) => setFiltroEstatus(e.target.value)} className={selectClass}>
            <option value="">Todos los estatus</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Aprobado">Aprobado</option>
            <option value="Rechazado">Rechazado</option>
          </select>
        )}

        {hayFiltros && (
          <button
            type="button"
            onClick={() => { setFiltroTipo(""); setFiltroFecha(""); setFiltroEstatus(""); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
          >
            Limpiar filtros
          </button>
        )}

        {hayFiltros && (
          <span className="ml-auto text-sm text-[var(--crm-text-muted)]">
            {rows.length} de {allRows.length} movimientos
          </span>
        )}
      </div>

      {/* ── Tabla unificada ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-[var(--crm-text)]">Movimientos de nómina</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAdelantoModal({ open: true, item: null })}
              className="rounded-xl border border-[#312C85] px-4 py-2 text-sm font-semibold text-[#312C85] transition hover:bg-[#312C85]/5"
            >
              Solicitud de adelanto
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={onAdd}
                className="flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e293b]"
              >
                <img src={agregarIcon} alt="" className="h-4 w-4" />
                Registrar pago
              </button>
            )}
          </div>
        </div>
        <BaseTable
          data={rows}
          columns={columns}
          isLoading={isLoading}
          emptyMessage={hayFiltros ? "Sin movimientos con esos filtros" : "No hay movimientos de nómina registrados"}
          onEdit={canEdit ? handleEditRow : undefined}
          onDelete={canEdit ? handleDeleteRow : undefined}
          canEdit={canEdit}
          canDelete={canEdit}
          customActions={(row) => (
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => void handleVer(row)} title="Ver documento"
                className="rounded-md border border-[var(--crm-border-strong)] p-1.5 text-[var(--crm-text)] transition-colors hover:bg-[var(--crm-muted)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              <button type="button"
                title="Descargar documento"
                onClick={() => {
                  if (row.kind === "pago") {
                    void generarReciboNomina(empleado, row.data);
                  } else {
                    void generarSolicitudAdelanto(empleado, {
                      monto: parseFloat(row.data.monto),
                      formaDescuento: row.data.forma_descuento as "proxima" | "parcialidades" | "otro",
                      parcialidades: row.data.parcialidades ?? undefined,
                      otro: row.data.otro_descripcion ?? undefined,
                    });
                  }
                }}
                className="rounded-md border border-[var(--crm-border-strong)] p-1.5 text-[var(--crm-text)] transition-colors hover:bg-[var(--crm-muted)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </div>
          )}
        />
      </div>

      {/* Modales */}
      {adelantoModal.open && (
        <AdelantoNominaModal
          empleadoId={empleado.id}
          item={adelantoModal.item ?? undefined}
          onSave={handleSaveAdelanto}
          onUpdate={onUpdateAdelanto}
          onClose={() => setAdelantoModal({ open: false, item: null })}
        />
      )}
      {deleteAdelantoModal.open && deleteAdelantoModal.item && (
        <DeleteConfirmModal
          isOpen
          title="Eliminar adelanto"
          subtitle="Esta acción no se puede deshacer."
          entityId={deleteAdelantoModal.item.id}
          entityLabel={`Adelanto de ${fmtMXN(deleteAdelantoModal.item.monto)}`}
          descriptionPrefix="Estás a punto de eliminar el"
          fallbackLabel="este adelanto"
          onConfirm={onDeleteAdelanto}
          onClose={() => setDeleteAdelantoModal({ open: false, item: null })}
        />
      )}

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
