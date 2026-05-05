import { useEffect, useMemo, useState } from 'react';
import { BaseTable, type ColumnDef } from '@/components/ui/BaseTable';
import { BadgeSelect } from '@/components/ui/BadgeSelect';
import type { LeadRequestRecord, UpdateLeadRequestPayload } from '@/interfaces/lead-request.interface';
import { formatCurrency } from '@/modules/properties/utils/formatters';
import { getStatusStyles } from '@/shared/ui/statusStyles';
import { LEAD_REQUEST_STATUS_OPTIONS } from './leadRequests.shared';
import {
  formatLeadRequestDate,
  formatLeadRequestPhone,
  getLeadRequestMediumStyles,
} from '../utils/leadRequests.utils';

type LeadRequestsTableProps = {
  leadRequests: LeadRequestRecord[];
  isLoading: boolean;
  updatingLeadRequestId: number | null;
  sellerChoices: Array<{ id: number; label: string }>;
  canEdit?: boolean;
  canDelete?: boolean;
  onQuickUpdate: (leadRequestId: number, payload: UpdateLeadRequestPayload) => Promise<void>;
  onEdit: (leadRequest: LeadRequestRecord) => void;
  onDelete: (leadRequest: LeadRequestRecord) => void;
};

type DraftMap = Record<number, string>;

export function LeadRequestsTable({
  leadRequests,
  isLoading,
  updatingLeadRequestId,
  sellerChoices,
  canEdit = true,
  canDelete = true,
  onQuickUpdate,
  onEdit,
  onDelete,
}: LeadRequestsTableProps) {
  const [comentarioFinalDrafts, setComentarioFinalDrafts] = useState<DraftMap>({});

  useEffect(() => {
    setComentarioFinalDrafts((current) => {
      const next = { ...current };
      leadRequests.forEach((leadRequest) => {
        if (!(leadRequest.id in next)) next[leadRequest.id] = leadRequest.comentario_final ?? '';
      });
      return next;
    });
  }, [leadRequests]);

  const sellerLabelById = useMemo(
    () => new Map(sellerChoices.map((seller) => [seller.id, seller.label])),
    [sellerChoices],
  );

  const columns: ColumnDef<LeadRequestRecord>[] = [
    {
      header: 'Estado',
      cellClassName: 'min-w-[150px]',
      render: (leadRequest) => {
        const currentValue = leadRequest.estado || LEAD_REQUEST_STATUS_OPTIONS[0];
        return (
          <BadgeSelect
            value={currentValue}
            options={LEAD_REQUEST_STATUS_OPTIONS}
            onChange={(value) => void onQuickUpdate(leadRequest.id, { estado: value })}
            disabled={updatingLeadRequestId === leadRequest.id}
            canEdit={canEdit}
            getStyles={() => getStatusStyles(leadRequest.estado ?? '')}
            className="w-[150px]"
            omitFirstOption={false}
          />
        );
      },
    },
    {
      header: 'Fecha de alta',
      cellClassName: 'min-w-[135px]',
      render: (leadRequest) => (
        <span className="text-sm text-slate-700">{formatLeadRequestDate(leadRequest.fecha_alta)}</span>
      ),
    },
    {
      header: 'Vendedor',
      cellClassName: 'min-w-[210px]',
      render: (leadRequest) => {
        if (!canEdit) {
          return (
            <span className="text-sm text-slate-700">
              {leadRequest.vendedor
                ? [
                    leadRequest.vendedor.nombres,
                    leadRequest.vendedor.apellido_paterno,
                    leadRequest.vendedor.apellido_materno,
                  ]
                    .filter(Boolean)
                    .join(' ')
                    .trim()
                : sellerLabelById.get(leadRequest.vendedor_id ?? -1) ?? 'Sin vendedor'}
            </span>
          );
        }

        return (
          <select
            value={leadRequest.vendedor_id ?? ''}
            onChange={(event) =>
              void onQuickUpdate(leadRequest.id, { vendedor_id: Number(event.target.value) })
            }
            disabled={updatingLeadRequestId === leadRequest.id}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#312C85] focus:ring-2 focus:ring-[#312C85]/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="" disabled>
              Seleccionar vendedor
            </option>
            {sellerChoices.map((choice) => (
              <option key={choice.id} value={choice.id}>
                {choice.label}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      header: 'Nombre',
      cellClassName: 'min-w-[220px]',
      render: (leadRequest) => (
        <span className="font-semibold text-slate-900">{leadRequest.nombre || 'Sin nombre'}</span>
      ),
    },
    {
      header: 'Teléfono',
      cellClassName: 'min-w-[140px]',
      render: (leadRequest) => (
        <span className="text-sm text-slate-700">{formatLeadRequestPhone(leadRequest.telefono)}</span>
      ),
    },
    {
      header: 'Solicitud',
      cellClassName: 'min-w-[240px] whitespace-normal',
      render: (leadRequest) => (
        <div className="max-w-[260px] break-words text-sm leading-6 text-slate-700">
          {leadRequest.solicitud || 'Sin solicitud'}
        </div>
      ),
    },
    {
      header: 'Tipo de inmueble',
      cellClassName: 'min-w-[260px] whitespace-normal',
      render: (leadRequest) => (
        <div className="max-w-[280px] break-words text-sm leading-6 text-slate-700">
          {leadRequest.tipo_inmueble || 'Sin tipo de inmueble'}
        </div>
      ),
    },
    {
      header: 'Presupuesto',
      cellClassName: 'min-w-[150px]',
      render: (leadRequest) =>
        leadRequest.presupuesto == null || Number.isNaN(Number(leadRequest.presupuesto)) ? (
          <span className="text-sm text-slate-700">Sin presupuesto</span>
        ) : (
          <span className="whitespace-nowrap font-semibold text-[#4F5EF8]">
            {formatCurrency(leadRequest.presupuesto)}
          </span>
        ),
    },
    {
      header: 'Método de pago',
      cellClassName: 'min-w-[280px] whitespace-normal',
      render: (leadRequest) => (
        <div className="max-w-[280px] break-words text-sm leading-6 text-slate-700">
          {leadRequest.metodo_pago || 'Sin método de pago'}
        </div>
      ),
    },
    {
      header: 'Ubicación',
      cellClassName: 'min-w-[260px] whitespace-normal',
      render: (leadRequest) => (
        <div className="max-w-[280px] break-words text-sm leading-6 text-slate-700">
          {leadRequest.ubicacion || 'Sin ubicación'}
        </div>
      ),
    },
    {
      header: 'N. habitaciones',
      cellClassName: 'min-w-[170px]',
      render: (leadRequest) => (
        <span className="text-sm text-slate-700">
          {leadRequest.numero_habitaciones || 'Sin dato'}
        </span>
      ),
    },
    {
      header: 'Características',
      cellClassName: 'min-w-[260px] whitespace-normal',
      render: (leadRequest) => (
        <div className="max-w-[280px] break-words text-sm leading-6 text-slate-700">
          {leadRequest.caracteristicas || 'Sin características'}
        </div>
      ),
    },
    {
      header: 'Medio',
      cellClassName: 'min-w-[140px]',
      render: (leadRequest) =>
        leadRequest.medio ? (
          <span
            className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
            style={getLeadRequestMediumStyles(leadRequest.medio)}
          >
            {leadRequest.medio}
          </span>
        ) : (
          <span className="text-sm text-slate-700">Sin medio</span>
        ),
    },
    {
      header: 'Comentario final',
      cellClassName: 'min-w-[260px] whitespace-normal',
      render: (leadRequest) => {
        const draft = comentarioFinalDrafts[leadRequest.id] ?? leadRequest.comentario_final ?? '';
        const hasChanges = draft.trim() !== (leadRequest.comentario_final ?? '').trim();

        if (!canEdit) {
          return (
            <div className="max-w-[280px] break-words text-sm leading-6 text-slate-700">
              {leadRequest.comentario_final || 'Sin comentario final'}
            </div>
          );
        }

        return (
          <div className="flex max-w-[280px] flex-col gap-2">
            <textarea
              value={draft}
              rows={3}
              maxLength={1500}
              disabled={updatingLeadRequestId === leadRequest.id}
              onChange={(event) =>
                setComentarioFinalDrafts((current) => ({
                  ...current,
                  [leadRequest.id]: event.target.value,
                }))
              }
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm leading-5 text-slate-700 outline-none transition focus:border-[#312C85] focus:ring-2 focus:ring-[#312C85]/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">{draft.length}/1500</span>
              <button
                type="button"
                disabled={!hasChanges || updatingLeadRequestId === leadRequest.id}
                onClick={() =>
                  void onQuickUpdate(leadRequest.id, {
                    comentario_final: draft.trim() || undefined,
                  })
                }
                className="inline-flex items-center rounded-lg bg-[#312C85] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#27226f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <BaseTable
      data={leadRequests}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="No se encontraron solicitudes de leads"
      wrapperClassName="rounded-none border-0 bg-transparent shadow-none"
      tableClassName="w-max min-w-[2600px] text-left"
      actionsClassName="flex items-center gap-2"
      onEdit={canEdit ? onEdit : undefined}
      onDelete={canDelete ? onDelete : undefined}
    />
  );
}
