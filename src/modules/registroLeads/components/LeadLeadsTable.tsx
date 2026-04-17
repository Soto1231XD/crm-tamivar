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
  canQuickEdit?: boolean;
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
  canQuickEdit = true,
  canEdit = true,
  canDelete = true,
  userChoices = [],
  onQuickChange,
  onEdit,
  onDelete,
}: LeadLeadsTableProps) {
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});

  useEffect(() => {
    setCommentDrafts((current) => {
      const nextDrafts = { ...current };

      leads.forEach((lead) => {
        if (!(lead.id in nextDrafts)) {
          nextDrafts[lead.id] = lead.comentarios ?? "";
        }
      });

      return nextDrafts;
    });
  }, [leads]);

  const columns: ColumnDef<LeadRecord>[] = [
    {
      header: "Fecha de lead",
      cellClassName: "min-w-[130px]",
      render: (lead) => (
        <span className="text-sm text-slate-700">
          {formatDate(lead.creado_en)}
        </span>
      ),
    },
    {
      header: "Estatus",
      cellClassName: "min-w-[150px]",
      render: (lead) => {
        const currentValue = lead.estado || LEAD_LEADS_STATUS_OPTIONS[0];
        return (
          <BadgeSelect
            value={currentValue}
            options={LEAD_LEADS_STATUS_OPTIONS}
            onChange={(value) => onQuickChange(lead.id, "estado", value)}
            disabled={updatingLeadId === lead.id}
            canEdit={canQuickEdit}
            getStyles={() => getStatusStyles(lead.estado ?? "")}
            omitFirstOption={false}
          />
        );
      },
    },
    {
      header: "Nombre",
      cellClassName: "min-w-[220px]",
      render: (lead) => (
        <span className="font-semibold text-slate-900">
          {`${lead.nombres ?? ""} ${lead.apellidos ?? ""}`.trim() ||
            "Sin nombre"}
        </span>
      ),
    },
    {
      header: "Celular",
      cellClassName: "min-w-[150px]",
      render: (lead) => (
        <span className="text-sm text-slate-700">
          {formatPhone(lead.lada, lead.telefono)}
        </span>
      ),
    },
    {
      header: "Prioridad",
      cellClassName: "min-w-[150px]",
      render: (lead) => {
        const currentValue = lead.prioridad || LEAD_LEADS_PRIORITY_OPTIONS[1];
        return (
          <BadgeSelect
            value={currentValue}
            options={LEAD_LEADS_PRIORITY_OPTIONS}
            onChange={(value) => onQuickChange(lead.id, "prioridad", value)}
            disabled={updatingLeadId === lead.id}
            canEdit={canQuickEdit}
            getStyles={() => getPriorityStyles(lead.prioridad ?? "")}
          />
        );
      },
    },
    {
      header: "Vendedor asignado",
      cellClassName: "min-w-[180px]",
      render: (lead) => {
        if (!canQuickEdit) {
          return (
            <span className="text-sm text-slate-700">
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
            onChange={(event) =>
              onQuickChange(lead.id, "vendedor_asignado_id", Number(event.target.value))
            }
            disabled={updatingLeadId === lead.id}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#312C85] focus:ring-2 focus:ring-[#312C85]/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="" disabled>
              Seleccionar vendedor
            </option>
            {userChoices.map((choice) => (
              <option key={choice.id} value={choice.id}>
                {choice.label}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      header: "Operación",
      cellClassName: "min-w-[140px]",
      render: (lead) => (
        <span
          className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
          style={getOperationStyles(lead.operacion ?? "")}
        >
          {lead.operacion || "Sin operación"}
        </span>
      ),
    },
    {
      header: "Canal",
      cellClassName: "min-w-[130px]",
      render: (lead) => (
        <span
          className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
          style={getChannelStyles(lead.canal ?? "")}
        >
          {lead.canal || "Sin canal"}
        </span>
      ),
    },
    {
      header: "Solicitud",
      cellClassName: "min-w-[240px] whitespace-normal",
      render: (lead) => (
        <div className="max-w-[260px] break-words text-sm leading-6 text-slate-700">
          {lead.solicitud || "Sin solicitud"}
        </div>
      ),
    },
    {
      header: "Presupuesto",
      cellClassName: "min-w-[150px]",
      render: (lead) =>
        lead.presupuesto == null || Number.isNaN(Number(lead.presupuesto)) ? (
          <span className="text-sm text-slate-700">Sin presupuesto</span>
        ) : (
          <span className="whitespace-nowrap font-semibold text-[#4F5EF8]">
            {formatCurrency(lead.presupuesto)}
          </span>
        ),
    },
    {
      header: "Zona de preferencia",
      cellClassName: "min-w-[240px] whitespace-normal",
      render: (lead) => (
        <div className="max-w-[280px] break-words text-sm leading-6 text-slate-700">
          {lead.ubicacion_propiedad?.trim() ||
            (lead.propiedad_id != null
              ? propertyAddressById.get(lead.propiedad_id)
              : "") ||
            "Sin ubicación"}
        </div>
      ),
    },
    {
      header: "Método de pago",
      cellClassName: "min-w-[220px]",
      render: (lead) => {
        const paymentMethods = (lead.metodo_pago ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

        if (paymentMethods.length === 0) {
          return <span className="text-sm text-slate-700">Sin método</span>;
        }

        return (
          <div className="flex flex-wrap gap-2">
            {paymentMethods.map((method) => (
              <span
                key={method}
                className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                style={getPaymentMethodStyles(method)}
              >
                {method}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      header: "Características",
      cellClassName: "min-w-[240px] whitespace-normal",
      render: (lead) => (
        <div className="max-w-[260px] break-words text-sm leading-6 text-slate-700">
          {lead.caracteristicas || "Sin caracteristicas"}
        </div>
      ),
    },
    {
      header: "Comentarios",
      cellClassName: "min-w-[240px] whitespace-normal",
      render: (lead) => {
        if (!canQuickEdit) {
          return (
            <div className="max-w-[260px] break-words text-sm leading-6 text-slate-700">
              {lead.comentarios || "Sin comentarios"}
            </div>
          );
        }

        const draft = commentDrafts[lead.id] ?? lead.comentarios ?? "";
        const hasChanges = draft.trim() !== (lead.comentarios ?? "").trim();

        return (
          <div className="flex max-w-[260px] flex-col gap-2">
            <textarea
              value={draft}
              rows={3}
              maxLength={500}
              disabled={updatingLeadId === lead.id}
              onChange={(event) =>
                setCommentDrafts((current) => ({
                  ...current,
                  [lead.id]: event.target.value,
                }))
              }
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm leading-5 text-slate-700 outline-none transition focus:border-[#312C85] focus:ring-2 focus:ring-[#312C85]/20 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Agregar comentario"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">
                {draft.length}/500
              </span>
              <button
                type="button"
                disabled={!hasChanges || updatingLeadId === lead.id}
                onClick={() => onQuickChange(lead.id, "comentarios", draft)}
                className="inline-flex items-center rounded-lg bg-[#312C85] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#27226f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        );
      },
    },
    {
      header: "Origen de lead",
      cellClassName: "min-w-[150px]",
      render: (lead) => (
        <span
          className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
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
      wrapperClassName="rounded-none border-0 bg-transparent shadow-none"
      tableClassName="w-max min-w-[2750px] text-left"
      actionsClassName="flex items-center gap-2"
      onEdit={canEdit ? onEdit : undefined}
      onDelete={canDelete ? onDelete : undefined}
    />
  );
}
