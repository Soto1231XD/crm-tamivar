import { BaseTable, type ColumnDef } from '@/components/ui/BaseTable';
import type { LeadRecord } from '@/interfaces/lead.interface';
import { useHasPermission } from '@/shared/auth/permissions/useHasPermission';
import {
  formatDate,
  formatPhone,
  getChannelStyles,
  getLeadSourceStyles,
  getOperationStyles,
  getPaymentMethodStyles,
  getPriorityStyles,
  getStatusStyles,
} from '../utils/leads.utils';
import { LEAD_LEADS_PRIORITY_OPTIONS, LEAD_LEADS_STATUS_OPTIONS } from './leadLeads.shared';
import { formatCurrency } from '@/modules/properties/utils/formatters';

type LeadLeadsTableProps = {
  leads: LeadRecord[];
  isLoading: boolean;
  updatingLeadId: number | null;
  propertyAddressById: Map<number, string>;
  userNameById: Map<number, string>;
  onQuickChange: (leadId: number, field: 'estado' | 'prioridad', value: string) => void;
  onEdit: (lead: LeadRecord) => void;
  onDelete: (lead: LeadRecord) => void;
};

function QuickBadgeSelect({
  value,
  options,
  disabled,
  style,
  onChange,
}: {
  value: string;
  options: readonly string[];
  disabled: boolean;
  style: { backgroundColor: string; color: string };
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative inline-flex">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="min-w-32 appearance-none rounded-full border border-transparent px-3 py-1 pr-8 text-xs font-semibold shadow-none outline-none disabled:cursor-not-allowed disabled:opacity-70"
        style={style}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span
        className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] font-bold"
        style={{ color: style.color }}
      >
        ▼
      </span>
    </div>
  );
}

export function LeadLeadsTable({
  leads,
  isLoading,
  updatingLeadId,
  propertyAddressById,
  userNameById,
  onQuickChange,
  onEdit,
  onDelete,
}: LeadLeadsTableProps) {
  const { can } = useHasPermission();

  const canEdit = can('registros_leads', 'actualizar');
  const canDelete = can('registros_leads', 'eliminar');

  const columns: ColumnDef<LeadRecord>[] = [
    {
      header: 'Fecha de lead',
      cellClassName: 'min-w-[130px]',
      render: (lead) => <span className="text-sm text-slate-700">{formatDate(lead.creado_en)}</span>,
    },
    {
      header: 'Estatus',
      cellClassName: 'min-w-[150px]',
      render: (lead) => {
        const currentValue = lead.estado || LEAD_LEADS_STATUS_OPTIONS[0];
        return (
          <QuickBadgeSelect
            value={currentValue}
            options={LEAD_LEADS_STATUS_OPTIONS}
            disabled={updatingLeadId === lead.id}
            style={getStatusStyles(lead.estado ?? '')}
            onChange={(value) => onQuickChange(lead.id, 'estado', value)}
          />
        );
      },
    },
    {
      header: 'Nombre',
      cellClassName: 'min-w-[220px]',
      render: (lead) => (
        <span className="font-semibold text-slate-900">
          {`${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim() || 'Sin nombre'}
        </span>
      ),
    },
    {
      header: 'Prioridad',
      cellClassName: 'min-w-[150px]',
      render: (lead) => {
        const currentValue = lead.prioridad || LEAD_LEADS_PRIORITY_OPTIONS[1];
        return (
          <QuickBadgeSelect
            value={currentValue}
            options={LEAD_LEADS_PRIORITY_OPTIONS}
            disabled={updatingLeadId === lead.id}
            style={getPriorityStyles(lead.prioridad ?? '')}
            onChange={(value) => onQuickChange(lead.id, 'prioridad', value)}
          />
        );
      },
    },
    {
      header: 'Vendedor asignado',
      cellClassName: 'min-w-[180px]',
      render: (lead) => (
        <span className="text-sm text-slate-700">
          {lead.vendedor_asignado
            ? `${lead.vendedor_asignado.nombres ?? ''} ${lead.vendedor_asignado.apellido_paterno ?? ''}`.trim()
            : lead.vendedor_asignado_id
              ? userNameById.get(lead.vendedor_asignado_id) ?? 'Sin asignar'
              : 'Sin asignar'}
        </span>
      ),
    },
    {
      header: 'Celular',
      cellClassName: 'min-w-[150px]',
      render: (lead) => <span className="text-sm text-slate-700">{formatPhone(lead.lada, lead.telefono)}</span>,
    },
    {
      header: 'Operación',
      cellClassName: 'min-w-[140px]',
      render: (lead) => (
        <span
          className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
          style={getOperationStyles(lead.operacion ?? '')}
        >
          {lead.operacion || 'Sin operación'}
        </span>
      ),
    },
    {
      header: 'Canal',
      cellClassName: 'min-w-[130px]',
      render: (lead) => (
        <span
          className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
          style={getChannelStyles(lead.canal ?? '')}
        >
          {lead.canal || 'Sin canal'}
        </span>
      ),
    },
    {
      header: 'Solicitud',
      cellClassName: 'min-w-[240px] whitespace-normal',
      render: (lead) => (
        <div className="max-w-[260px] break-words text-sm leading-6 text-slate-700">{lead.solicitud || 'Sin solicitud'}</div>
      ),
    },
    {
      header: 'Presupuesto',
      cellClassName: 'min-w-[150px]',
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
      header: 'Zona de preferencia',
      cellClassName: 'min-w-[240px] whitespace-normal',
      render: (lead) => (
        <div className="max-w-[280px] break-words text-sm leading-6 text-slate-700">
          {lead.ubicacion_propiedad?.trim()
            || (lead.propiedad_id != null ? propertyAddressById.get(lead.propiedad_id) : '')
            || 'Sin ubicación'}
        </div>
      ),
    },
    {
      header: 'Método de pago',
      cellClassName: 'min-w-[220px]',
      render: (lead) => {
        const paymentMethods = (lead.metodo_pago ?? '')
          .split(',')
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
      header: 'Características',
      cellClassName: 'min-w-[240px] whitespace-normal',
      render: (lead) => (
        <div className="max-w-[260px] break-words text-sm leading-6 text-slate-700">
          {lead.caracteristicas || 'Sin caracteristicas'}
        </div>
      ),
    },
    {
      header: 'Comentarios',
      cellClassName: 'min-w-[240px] whitespace-normal',
      render: (lead) => (
        <div className="max-w-[260px] break-words text-sm leading-6 text-slate-700">
          {lead.comentarios || 'Sin comentarios'}
        </div>
      ),
    },
    {
      header: 'Origen de lead',
      cellClassName: 'min-w-[150px]',
      render: (lead) => (
        <span
          className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
          style={getLeadSourceStyles(lead.origen_lead ?? '')}
        >
          {lead.origen_lead || 'Sin origen'}
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
