import { useState } from "react";
import { BaseTable } from "@/components/ui/BaseTable";
import type { ColumnDef } from "@/components/ui/BaseTable";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import agregarIcon from "@/assets/images/Agregar.png";
import type { Empleado } from "../../services/empleados.api";
import type { NominaEmpleado } from "../../services/nominas.api";
import type { AdelantoEmpleado, CreateAdelantoPayload, UpdateAdelantoPayload } from "../../services/adelantos.api";
import { generarReciboNomina, generarSolicitudAdelanto } from "../../utils/documentos-rh";
import { AdelantoNominaModal } from "../../components/AdelantoNominaModal";

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
  const rows: NominaRow[] = [
    ...nominas.map((n): NominaRow => ({ id: `pago-${n.id}`, kind: "pago", data: n })),
    ...adelantos.map((a): NominaRow => ({ id: `adelanto-${a.id}`, kind: "adelanto", data: a })),
  ].sort((a, b) => {
    const dA = a.kind === "pago" ? a.data.fecha_pago : a.data.fecha_solicitud;
    const dB = b.kind === "pago" ? b.data.fecha_pago : b.data.fecha_solicitud;
    return dB.localeCompare(dA);
  });

  const columns: ColumnDef<NominaRow>[] = [
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
      header: "Fecha",
      render: (row) =>
        row.kind === "pago"
          ? formatDate(row.data.fecha_pago)
          : formatDate(row.data.fecha_solicitud),
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
    {
      header: "Documento",
      render: (row) =>
        row.kind === "pago" ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => generarReciboNomina(empleado, row.data)}
              className="rounded-lg bg-[#312C85] px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-[#4338ca]"
            >
              Generar recibo
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() =>
                generarSolicitudAdelanto(empleado, {
                  monto: parseFloat(row.data.monto),
                  formaDescuento: row.data.forma_descuento as "proxima" | "parcialidades" | "otro",
                  parcialidades: row.data.parcialidades ?? undefined,
                  otro: row.data.otro_descripcion ?? undefined,
                }).catch(() => {})
              }
              className="rounded-lg bg-slate-700 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-slate-900"
            >
              Descargar
            </button>
          </div>
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
          emptyMessage="No hay movimientos de nómina registrados"
          onEdit={canEdit ? handleEditRow : undefined}
          onDelete={canEdit ? handleDeleteRow : undefined}
          canEdit={canEdit}
          canDelete={canEdit}
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
    </div>
  );
}
