import { BaseTable, type ColumnDef } from '@/components/ui/BaseTable';
import type { LeadRequestRecord } from '@/interfaces/lead-request.interface';
import { formatCurrency } from '@/modules/properties/utils/formatters';
import { getPaymentMethodStyles, getStatusStyles } from '@/shared/ui/statusStyles';
import {
  formatLeadRequestDate,
  formatLeadRequestPhone,
  getLeadRequestMediumStyles,
} from '../utils/leadRequests.utils';

type LeadRequestsTableProps = {
  leadRequests: LeadRequestRecord[];
  isLoading: boolean;
  sellerNameById: Map<number, string>;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit: (leadRequest: LeadRequestRecord) => void;
  onDelete: (leadRequest: LeadRequestRecord) => void;
};

export function LeadRequestsTable({
  leadRequests,
  isLoading,
  sellerNameById,
  canEdit = true,
  canDelete = true,
  onEdit,
  onDelete,
}: LeadRequestsTableProps) {
  const columns: ColumnDef<LeadRequestRecord>[] = [
    {
      header: 'Estado',
      cellClassName: 'min-w-[130px]',
      render: (leadRequest) => (
        <span
          className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
          style={getStatusStyles(leadRequest.estado ?? '')}
        >
          {leadRequest.estado || 'Sin estado'}
        </span>
      ),
    },
    {
      header: 'Fecha de alta',
      cellClassName: 'min-w-[135px]',
      render: (leadRequest) => <span className="text-sm text-slate-700">{formatLeadRequestDate(leadRequest.fecha_alta)}</span>,
    },
    {
      header: 'Vendedor',
      cellClassName: 'min-w-[200px]',
      render: (leadRequest) => (
        <span className="text-sm text-slate-700">
          {leadRequest.vendedor
            ? `${leadRequest.vendedor.nombres ?? ''} ${leadRequest.vendedor.apellido_paterno ?? ''}`.trim() || 'Sin vendedor'
            : leadRequest.vendedor_id
              ? sellerNameById.get(leadRequest.vendedor_id) ?? 'Sin vendedor'
              : 'Sin vendedor'}
        </span>
      ),
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
      cellClassName: 'min-w-[180px] whitespace-normal',
      render: (leadRequest) => (
        <div className="max-w-[220px] break-words text-sm leading-6 text-slate-700">
          {leadRequest.solicitud || 'Sin solicitud'}
        </div>
      ),
    },
    {
      header: 'Tipo de inmueble',
      cellClassName: 'min-w-[170px]',
      render: (leadRequest) => <span className="text-sm text-slate-700">{leadRequest.tipo_inmueble || 'Sin tipo'}</span>,
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
      cellClassName: 'min-w-[200px]',
      render: (leadRequest) =>
        leadRequest.metodo_pago ? (
          <span
            className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
            style={getPaymentMethodStyles(leadRequest.metodo_pago)}
          >
            {leadRequest.metodo_pago}
          </span>
        ) : (
          <span className="text-sm text-slate-700">Sin metodo</span>
        ),
    },
    {
      header: 'Ubicación',
      cellClassName: 'min-w-[220px] whitespace-normal',
      render: (leadRequest) => (
        <div className="max-w-[240px] break-words text-sm leading-6 text-slate-700">
          {leadRequest.ubicacion || 'Sin ubicacion'}
        </div>
      ),
    },
    {
      header: 'N. habitaciones',
      cellClassName: 'min-w-[130px]',
      render: (leadRequest) => <span className="text-sm text-slate-700">{leadRequest.numero_habitaciones || 'Sin dato'}</span>,
    },
    {
      header: 'Características',
      cellClassName: 'min-w-[240px] whitespace-normal',
      render: (leadRequest) => (
        <div className="max-w-[260px] break-words text-sm leading-6 text-slate-700">
          {leadRequest.caracteristicas || 'Sin caracteristicas'}
        </div>
      ),
    },
    {
      header: 'Seguimiento',
      cellClassName: 'min-w-[240px] whitespace-normal',
      render: (leadRequest) => (
        <div className="max-w-[260px] break-words text-sm leading-6 text-slate-700">
          {leadRequest.seguimiento || 'Sin seguimiento'}
        </div>
      ),
    },
    {
      header: 'Opciones enviadas',
      cellClassName: 'min-w-[240px] whitespace-normal',
      render: (leadRequest) => (
        <div className="max-w-[260px] break-words text-sm leading-6 text-slate-700">
          {leadRequest.opciones_enviadas || 'Sin opciones enviadas'}
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
      cellClassName: 'min-w-[240px] whitespace-normal',
      render: (leadRequest) => (
        <div className="max-w-[260px] break-words text-sm leading-6 text-slate-700">
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
      tableClassName="w-max min-w-[2860px] text-left"
      actionsClassName="flex items-center gap-2"
      onEdit={canEdit ? onEdit : undefined}
      onDelete={canDelete ? onDelete : undefined}
    />
  );
}
