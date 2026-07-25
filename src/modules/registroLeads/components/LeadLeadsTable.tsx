import { useEffect, useState } from "react";
import { BaseTable, type ColumnDef } from "@/components/ui/BaseTable";
import { BadgeSelect } from "@/components/ui/BadgeSelect";
import type { LeadRecord } from "@/interfaces/lead.interface";
import {
  formatDate,
  formatPhone,
  getChannelStyles,
  getLeadSourceStyles,
  getOperationStyles,
  getPaymentMethodStyles,
  getPriorityStyles,
  getStatusStyles,
} from "../../leads/utils/leads.utils";
import {
  LEAD_LEADS_PRIORITY_OPTIONS,
  LEAD_LEADS_STATUS_OPTIONS,
} from "./leadLeads.shared";
import { formatCurrency } from "@/modules/properties/utils/formatters";

type LeadLeadsTableProps = {
  leads: LeadRecord[];
  isLoading: boolean;
  updatingLeadId: number | null;
  propertyAddressById: Map<number, string>;
  userNameById: Map<number, string>;
  canEditStatus?: boolean;
  canEditPriority?: boolean;
  canEditAssignedSeller?: boolean;
  canEditComments?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  userChoices?: Array<{ id: number; label: string }>;
  onQuickChange: (
    leadId: number,
    field: "estado" | "prioridad" | "comentarios" | "vendedor_asignado_id",
    value: string | number,
  ) => void;
  onEdit: (lead: LeadRecord) => void;
  onDelete: (lead: LeadRecord) => void;
};

export function LeadLeadsTable({
  leads,
  isLoading,
  updatingLeadId,
  propertyAddressById,
  userNameById,
  canEditStatus = false,
  canEditPriority = false,
  canEditAssignedSeller = false,
  canEditComments = false,
  canEdit = true,
  canDelete = true,
  userChoices = [],
  onQuickChange,
  onEdit,
  onDelete,
}: LeadLeadsTableProps) {
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);

  useEffect(() => {
    setCommentDrafts((current) => {
      const visibleIds = new Set(leads.map((l) => l.id));
      return Object.fromEntries(
        Object.entries(current).filter(([id]) => visibleIds.has(Number(id))),
      );
    });
  }, [leads]);

  function openCommentEdit(lead: LeadRecord) {
    setEditingCommentId(lead.id);
    setCommentDrafts((cur) => ({ ...cur, [lead.id]: (lead.comentarios ?? "").trim() }));
  }

  function closeCommentEdit(leadId: number) {
    setEditingCommentId(null);
    setCommentDrafts((cur) => {
      const next = { ...cur };
      delete next[leadId];
      return next;
    });
  }

  const columns: ColumnDef<LeadRecord>[] = [
    {
      header: "Fecha",
      cellClassName: "min-w-[100px]",
      render: (lead) => (
        <span className="text-xs text-slate-600">{formatDate(lead.creado_en)}</span>
      ),
    },
    {
      header: "Estatus",
      cellClassName: "min-w-[130px]",
      render: (lead) => (
        <BadgeSelect
          value={lead.estado || LEAD_LEADS_STATUS_OPTIONS[0]}
          options={LEAD_LEADS_STATUS_OPTIONS}
          onChange={(v) => onQuickChange(lead.id, "estado", v)}
          disabled={updatingLeadId === lead.id}
          canEdit={canEditStatus}
          getStyles={() => getStatusStyles(lead.estado ?? "")}
          omitFirstOption={false}
        />
      ),
    },
    {
      header: "Nombre",
      cellClassName: "min-w-[130px]",
      render: (lead) => (
        <span className="text-xs font-semibold text-slate-900">
          {`${lead.nombres ?? ""} ${lead.apellidos ?? ""}`.trim() || "Sin nombre"}
        </span>
      ),
    },
    {
      header: "Celular",
      cellClassName: "min-w-[105px]",
      render: (lead) => (
        <span className="text-xs text-slate-600">{formatPhone(lead.lada, lead.telefono)}</span>
      ),
    },
    {
      header: "Prioridad",
      cellClassName: "min-w-[120px]",
      render: (lead) => (
        <BadgeSelect
          value={lead.prioridad || LEAD_LEADS_PRIORITY_OPTIONS[1]}
          options={LEAD_LEADS_PRIORITY_OPTIONS}
          onChange={(v) => onQuickChange(lead.id, "prioridad", v)}
          disabled={updatingLeadId === lead.id}
          canEdit={canEditPriority}
          getStyles={() => getPriorityStyles(lead.prioridad ?? "")}
        />
      ),
    },
    {
      header: "Vendedor",
      cellClassName: "min-w-[150px]",
      render: (lead) => {
        if (!canEditAssignedSeller) {
          return (
            <span className="text-xs text-slate-600">
              {lead.vendedor_asignado
                ? `${lead.vendedor_asignado.nombres ?? ""} ${lead.vendedor_asignado.apellido_paterno ?? ""}`.trim()
                : lead.vendedor_asignado_id
                  ? (userNameById.get(lead.vendedor_asignado_id) ?? "Sin asignar")
                  : "Sin asignar"}
            </span>
          );
        }
        return (
          <select
            value={lead.vendedor_asignado_id ?? ""}
            onChange={(e) => onQuickChange(lead.id, "vendedor_asignado_id", Number(e.target.value))}
            disabled={updatingLeadId === lead.id}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-[#312C85] focus:ring-1 focus:ring-[#312C85]/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="" disabled>Seleccionar</option>
            {userChoices.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        );
      },
    },
    {
      header: "Operación",
      cellClassName: "min-w-[100px]",
      render: (lead) => (
        <span
          className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={getOperationStyles(lead.operacion ?? "")}
        >
          {lead.operacion || "Sin operación"}
        </span>
      ),
    },
    {
      header: "Canal",
      cellClassName: "min-w-[100px]",
      render: (lead) => (
        <span
          className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={getChannelStyles(lead.canal ?? "")}
        >
          {lead.canal || "Sin canal"}
        </span>
      ),
    },
    {
      header: "Solicitud",
      cellClassName: "min-w-[160px]",
      render: (lead) => (
        <div
          className="line-clamp-2 max-w-[200px] text-xs leading-5 text-slate-600"
          title={lead.solicitud ?? ""}
        >
          {lead.solicitud || "Sin solicitud"}
        </div>
      ),
    },
    {
      header: "Presupuesto",
      cellClassName: "min-w-[120px]",
      render: (lead) =>
        lead.presupuesto == null || Number.isNaN(Number(lead.presupuesto)) ? (
          <span className="text-xs text-slate-400">—</span>
        ) : (
          <span className="whitespace-nowrap text-xs font-semibold text-[#4F5EF8]">
            {formatCurrency(lead.presupuesto)}
          </span>
        ),
    },
    {
      header: "Zona",
      cellClassName: "min-w-[150px]",
      render: (lead) => {
        const text =
          lead.ubicacion_propiedad?.trim() ||
          (lead.propiedad_id != null ? propertyAddressById.get(lead.propiedad_id) : "") ||
          "Sin ubicación";
        return (
          <div className="line-clamp-2 max-w-[180px] text-xs leading-5 text-slate-600" title={text}>
            {text}
          </div>
        );
      },
    },
    {
      header: "Método de pago",
      cellClassName: "min-w-[160px]",
      render: (lead) => {
        const methods = (lead.metodo_pago ?? "")
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean);
        if (methods.length === 0) return <span className="text-xs text-slate-400">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {methods.map((m) => (
              <span
                key={m}
                className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={getPaymentMethodStyles(m)}
              >
                {m}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      header: "Características",
      cellClassName: "min-w-[150px]",
      render: (lead) => (
        <div
          className="line-clamp-2 max-w-[180px] text-xs leading-5 text-slate-600"
          title={lead.caracteristicas ?? ""}
        >
          {lead.caracteristicas || "Sin características"}
        </div>
      ),
    },
    {
      header: "Comentarios",
      cellClassName: "min-w-[180px]",
      render: (lead) => {
        const saved = (lead.comentarios ?? "").trim();
        const isEditing = editingCommentId === lead.id;

        if (!canEditComments || !isEditing) {
          return (
            <div className="flex max-w-[200px] items-start gap-1">
              <div
                className="line-clamp-2 flex-1 text-xs leading-5 text-slate-600"
                title={saved}
              >
                {saved || <span className="italic text-slate-400">Sin comentarios</span>}
              </div>
              {canEditComments && (
                <button
                  type="button"
                  title="Editar comentario"
                  onClick={() => openCommentEdit(lead)}
                  disabled={updatingLeadId === lead.id}
                  className="shrink-0 rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              )}
            </div>
          );
        }

        const draft = commentDrafts[lead.id] ?? saved;
        const hasChanges = draft !== saved;
        const overLimit = draft.length > 1500;

        return (
          <div className="flex w-[240px] flex-col gap-1.5">
            <textarea
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              value={draft}
              rows={3}
              disabled={updatingLeadId === lead.id}
              onChange={(e) => setCommentDrafts((cur) => ({ ...cur, [lead.id]: e.target.value }))}
              className="w-full resize-none rounded-md border border-slate-300 px-2 py-1 text-xs leading-5 text-slate-700 outline-none transition focus:border-[#312C85] focus:ring-1 focus:ring-[#312C85]/20 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Escribe un comentario..."
            />
            <div className="flex items-center justify-between gap-1">
              <span className={`text-[10px] ${overLimit ? "text-red-600" : "text-slate-400"}`}>
                {draft.length}/1500
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => closeCommentEdit(lead.id)}
                  className="rounded-md px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!hasChanges || overLimit || updatingLeadId === lead.id}
                  onClick={() => {
                    onQuickChange(lead.id, "comentarios", draft);
                    closeCommentEdit(lead.id);
                  }}
                  className="inline-flex items-center rounded-md bg-[#312C85] px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-[#27226f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: "Origen",
      cellClassName: "min-w-[110px]",
      render: (lead) => (
        <span
          className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={getLeadSourceStyles(lead.origen_lead ?? "")}
        >
          {lead.origen_lead || "Sin origen"}
        </span>
      ),
    },
  ];

  return (
    <BaseTable
      data={leads}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="No se encontraron registros leads"
      wrapperClassName="rounded-none border-0 bg-transparent shadow-none [&_td]:px-1.5 [&_td]:py-1.5 [&_th]:px-1.5 [&_th]:py-2"
      tableClassName="w-max min-w-[2090px] text-left"
      actionsClassName="flex items-center gap-1.5"
      onEdit={canEdit ? onEdit : undefined}
      onDelete={canDelete ? onDelete : undefined}
    />
  );
}
