import { useEffect, useMemo, useState } from 'react';
import { BaseTable, type ColumnDef } from '@/components/ui/BaseTable';
import { BadgeSelect } from '@/components/ui/BadgeSelect';
import type { LeadRequestRecord, UpdateLeadRequestPayload } from '@/interfaces/lead-request.interface';
import { formatCurrency } from '@/modules/properties/utils/formatters';
import { getPaymentMethodStyles, getStatusStyles } from '@/shared/ui/statusStyles';
import {
  LEAD_REQUEST_PAYMENT_METHOD_OPTIONS,
  LEAD_REQUEST_PROPERTY_TYPE_OPTIONS,
  LEAD_REQUEST_STATUS_OPTIONS,
  parseLeadRequestPaymentMethods,
  parseLeadRequestPropertyTypes,
} from './leadRequests.shared';
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

function MultiSelectQuickEditor({
  id,
  title,
  options,
  currentValues,
  disabled,
  onSave,
}: {
  id: number;
  title: string;
  options: readonly string[];
  currentValues: string[];
  disabled: boolean;
  onSave: (values: string[]) => void;
}) {
  const [draft, setDraft] = useState<string[]>(currentValues);

  useEffect(() => {
    setDraft(currentValues);
  }, [currentValues]);

  const currentKey = currentValues.join('|');
  const draftKey = draft.join('|');
  const hasChanges = currentKey !== draftKey;

  return (
    <details className="group w-full min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm text-slate-700">
        <div className="flex flex-wrap gap-2">
          {currentValues.length > 0 ? (
            currentValues.map((value) => (
              <span
                key={`${id}-${value}`}
                className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={title === 'Método de pago' ? getPaymentMethodStyles(value) : { backgroundColor: '#EEF2FF', color: '#312C85' }}
              >
                {value}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-500">Sin selección</span>
          )}
        </div>
        <span className="text-xs font-semibold text-slate-400 transition group-open:rotate-180">⌄</span>
      </summary>

      <div className="mt-3 space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((option) => {
            const checked = draft.includes(option);
            return (
              <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() =>
                    setDraft((current) =>
                      checked ? current.filter((item) => item !== option) : [...current, option],
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300 text-[#312C85] focus:ring-[#312C85]"
                />
                <span>{option}</span>
              </label>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={!hasChanges || disabled}
            onClick={() => onSave(draft)}
            className="inline-flex items-center rounded-lg bg-[#312C85] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#27226f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Guardar
          </button>
        </div>
      </div>
    </details>
  );
}

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
  const [solicitudDrafts, setSolicitudDrafts] = useState<DraftMap>({});
  const [ubicacionDrafts, setUbicacionDrafts] = useState<DraftMap>({});
  const [habitacionesDrafts, setHabitacionesDrafts] = useState<DraftMap>({});
  const [caracteristicasDrafts, setCaracteristicasDrafts] = useState<DraftMap>({});

  useEffect(() => {
    setSolicitudDrafts((current) => {
      const next = { ...current };
      leadRequests.forEach((leadRequest) => {
        if (!(leadRequest.id in next)) next[leadRequest.id] = leadRequest.solicitud ?? '';
      });
      return next;
    });

    setUbicacionDrafts((current) => {
      const next = { ...current };
      leadRequests.forEach((leadRequest) => {
        if (!(leadRequest.id in next)) next[leadRequest.id] = leadRequest.ubicacion ?? '';
      });
      return next;
    });

    setHabitacionesDrafts((current) => {
      const next = { ...current };
      leadRequests.forEach((leadRequest) => {
        if (!(leadRequest.id in next)) next[leadRequest.id] = leadRequest.numero_habitaciones ?? '';
      });
      return next;
    });

    setCaracteristicasDrafts((current) => {
      const next = { ...current };
      leadRequests.forEach((leadRequest) => {
        if (!(leadRequest.id in next)) next[leadRequest.id] = leadRequest.caracteristicas ?? '';
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
      render: (leadRequest) => <span className="text-sm text-slate-700">{formatLeadRequestDate(leadRequest.fecha_alta)}</span>,
    },
    {
      header: 'Vendedor',
      cellClassName: 'min-w-[210px]',
      render: (leadRequest) => {
        if (!canEdit) {
          return <span className="text-sm text-slate-700">{leadRequest.vendedor ? [leadRequest.vendedor.nombres, leadRequest.vendedor.apellido_paterno, leadRequest.vendedor.apellido_materno].filter(Boolean).join(' ').trim() : sellerLabelById.get(leadRequest.vendedor_id ?? -1) ?? 'Sin vendedor'}</span>;
        }

        return (
          <select
            value={leadRequest.vendedor_id ?? ''}
            onChange={(event) => void onQuickUpdate(leadRequest.id, { vendedor_id: Number(event.target.value) })}
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
      render: (leadRequest) => <span className="font-semibold text-slate-900">{leadRequest.nombre || 'Sin nombre'}</span>,
    },
    {
      header: 'Teléfono',
      cellClassName: 'min-w-[140px]',
      render: (leadRequest) => <span className="text-sm text-slate-700">{formatLeadRequestPhone(leadRequest.telefono)}</span>,
    },
    {
      header: 'Solicitud',
      cellClassName: 'min-w-[240px] whitespace-normal',
      render: (leadRequest) => {
        const draft = solicitudDrafts[leadRequest.id] ?? leadRequest.solicitud ?? '';
        const hasChanges = draft.trim() !== (leadRequest.solicitud ?? '').trim();

        if (!canEdit) {
          return <div className="max-w-[260px] break-words text-sm leading-6 text-slate-700">{leadRequest.solicitud || 'Sin solicitud'}</div>;
        }

        return (
          <div className="flex max-w-[260px] flex-col gap-2">
            <textarea
              value={draft}
              rows={3}
              maxLength={1000}
              disabled={updatingLeadRequestId === leadRequest.id}
              onChange={(event) => setSolicitudDrafts((current) => ({ ...current, [leadRequest.id]: event.target.value }))}
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm leading-5 text-slate-700 outline-none transition focus:border-[#312C85] focus:ring-2 focus:ring-[#312C85]/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">{draft.length}/1000</span>
              <button
                type="button"
                disabled={!hasChanges || updatingLeadRequestId === leadRequest.id}
                onClick={() => void onQuickUpdate(leadRequest.id, { solicitud: draft.trim() || undefined })}
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
      header: 'Tipo de inmueble',
      cellClassName: 'min-w-[260px]',
      render: (leadRequest) => (
        <MultiSelectQuickEditor
          id={leadRequest.id}
          title="Tipo de inmueble"
          options={LEAD_REQUEST_PROPERTY_TYPE_OPTIONS}
          currentValues={parseLeadRequestPropertyTypes(leadRequest.tipo_inmueble)}
          disabled={!canEdit || updatingLeadRequestId === leadRequest.id}
          onSave={(values) => void onQuickUpdate(leadRequest.id, { tipo_inmueble: values.length > 0 ? values.join(', ') : undefined })}
        />
      ),
    },
    {
      header: 'Presupuesto',
      cellClassName: 'min-w-[150px]',
      render: (leadRequest) =>
        leadRequest.presupuesto == null || Number.isNaN(Number(leadRequest.presupuesto)) ? (
          <span className="text-sm text-slate-700">Sin presupuesto</span>
        ) : (
          <span className="whitespace-nowrap font-semibold text-[#4F5EF8]">{formatCurrency(leadRequest.presupuesto)}</span>
        ),
    },
    {
      header: 'Método de pago',
      cellClassName: 'min-w-[280px]',
      render: (leadRequest) => (
        <MultiSelectQuickEditor
          id={leadRequest.id}
          title="Método de pago"
          options={LEAD_REQUEST_PAYMENT_METHOD_OPTIONS}
          currentValues={parseLeadRequestPaymentMethods(leadRequest.metodo_pago)}
          disabled={!canEdit || updatingLeadRequestId === leadRequest.id}
          onSave={(values) => void onQuickUpdate(leadRequest.id, { metodo_pago: values.length > 0 ? values.join(', ') : undefined })}
        />
      ),
    },
    {
      header: 'Ubicación',
      cellClassName: 'min-w-[260px] whitespace-normal',
      render: (leadRequest) => {
        const draft = ubicacionDrafts[leadRequest.id] ?? leadRequest.ubicacion ?? '';
        const hasChanges = draft.trim() !== (leadRequest.ubicacion ?? '').trim();

        if (!canEdit) {
          return <div className="max-w-[280px] break-words text-sm leading-6 text-slate-700">{leadRequest.ubicacion || 'Sin ubicación'}</div>;
        }

        return (
          <div className="flex max-w-[280px] flex-col gap-2">
            <textarea
              value={draft}
              rows={3}
              maxLength={1000}
              disabled={updatingLeadRequestId === leadRequest.id}
              onChange={(event) => setUbicacionDrafts((current) => ({ ...current, [leadRequest.id]: event.target.value }))}
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm leading-5 text-slate-700 outline-none transition focus:border-[#312C85] focus:ring-2 focus:ring-[#312C85]/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">{draft.length}/1000</span>
              <button
                type="button"
                disabled={!hasChanges || updatingLeadRequestId === leadRequest.id}
                onClick={() => void onQuickUpdate(leadRequest.id, { ubicacion: draft.trim() || undefined })}
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
      header: 'N. habitaciones',
      cellClassName: 'min-w-[170px]',
      render: (leadRequest) => {
        const draft = habitacionesDrafts[leadRequest.id] ?? leadRequest.numero_habitaciones ?? '';
        const hasChanges = draft.trim() !== (leadRequest.numero_habitaciones ?? '').trim();

        if (!canEdit) {
          return <span className="text-sm text-slate-700">{leadRequest.numero_habitaciones || 'Sin dato'}</span>;
        }

        return (
          <div className="flex min-w-[150px] flex-col gap-2">
            <input
              value={draft}
              maxLength={120}
              disabled={updatingLeadRequestId === leadRequest.id}
              onChange={(event) => setHabitacionesDrafts((current) => ({ ...current, [leadRequest.id]: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#312C85] focus:ring-2 focus:ring-[#312C85]/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              disabled={!hasChanges || updatingLeadRequestId === leadRequest.id}
              onClick={() => void onQuickUpdate(leadRequest.id, { numero_habitaciones: draft.trim() || undefined })}
              className="inline-flex items-center justify-center rounded-lg bg-[#312C85] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#27226f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        );
      },
    },
    {
      header: 'Características',
      cellClassName: 'min-w-[260px] whitespace-normal',
      render: (leadRequest) => {
        const draft = caracteristicasDrafts[leadRequest.id] ?? leadRequest.caracteristicas ?? '';
        const hasChanges = draft.trim() !== (leadRequest.caracteristicas ?? '').trim();

        if (!canEdit) {
          return <div className="max-w-[280px] break-words text-sm leading-6 text-slate-700">{leadRequest.caracteristicas || 'Sin características'}</div>;
        }

        return (
          <div className="flex max-w-[280px] flex-col gap-2">
            <textarea
              value={draft}
              rows={3}
              maxLength={1500}
              disabled={updatingLeadRequestId === leadRequest.id}
              onChange={(event) => setCaracteristicasDrafts((current) => ({ ...current, [leadRequest.id]: event.target.value }))}
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm leading-5 text-slate-700 outline-none transition focus:border-[#312C85] focus:ring-2 focus:ring-[#312C85]/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">{draft.length}/1500</span>
              <button
                type="button"
                disabled={!hasChanges || updatingLeadRequestId === leadRequest.id}
                onClick={() => void onQuickUpdate(leadRequest.id, { caracteristicas: draft.trim() || undefined })}
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
      render: (leadRequest) => (
        <div className="max-w-[280px] break-words text-sm leading-6 text-slate-700">
          {leadRequest.comentario_final || 'Sin comentario final'}
        </div>
      ),
    },
  ];

  return (
    <BaseTable
      data={leadRequests}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="No se encontraron solicitudes de leads"
      wrapperClassName="rounded-none border-0 bg-transparent shadow-none"
      tableClassName="w-max min-w-[3100px] text-left"
      actionsClassName="flex items-center gap-2"
      onEdit={canEdit ? onEdit : undefined}
      onDelete={canDelete ? onDelete : undefined}
    />
  );
}
