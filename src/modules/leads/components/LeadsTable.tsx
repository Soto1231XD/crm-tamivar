import { BaseTable, type ColumnDef } from '@/components/ui/BaseTable';
import type { LeadRecord } from '@/interfaces/lead.interface';
import { useHasPermission } from '@/shared/auth/permissions/useHasPermission';
import descInfIcon from '../../../assets/images/DescInf.png';
import { DownloadLeadPdfButton } from './DownloadLeadPdfButton';
import { LEAD_PRIORITY_OPTIONS, LEAD_STATUS_OPTIONS } from '../utils/leads.constants';
import {
  formatCreatorName,
  formatDate,
  formatDateTime,
  formatPhone,
  getPriorityStyles,
  getStatusStyles,
} from '../utils/leads.utils';

type LeadsTableProps = {
  leads: LeadRecord[];
  isLoading: boolean;
  updatingLeadId: number | null;
  propertyTitleById: Map<number, string>;
  onQuickChange: (leadId: number, field: 'estado' | 'prioridad', value: string) => void;
  onEdit: (lead: LeadRecord) => void;
  onDelete: (lead: LeadRecord) => void;
};

export function LeadsTable({
  leads,
  isLoading,
  updatingLeadId,
  propertyTitleById,
  onQuickChange,
  onEdit,
  onDelete,
}: LeadsTableProps) {
  const { can } = useHasPermission();

  const canEdit = can('registros', 'actualizar');
  const canDelete = can('registros', 'eliminar');

  const columns: ColumnDef<LeadRecord>[] = [
    {
      header: 'Cliente',
      cellClassName: 'min-w-[220px]',
      render: (lead) => (
        <div>
          <p className="font-semibold text-slate-900">
            {`${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim() || 'Sin nombre'}
          </p>
          <p className="mt-1 text-xs text-slate-500">{lead.correo_electronico || 'Sin correo'}</p>
        </div>
      ),
    },
    {
      header: 'Correo electronico',
      cellClassName: 'min-w-[220px]',
      render: (lead) => <span className="text-sm text-slate-700">{lead.correo_electronico || 'Sin correo'}</span>,
    },
    {
      header: 'Telefono',
      cellClassName: 'min-w-[150px]',
      render: (lead) => <span className="text-sm text-slate-700">{formatPhone(lead.lada, lead.telefono)}</span>,
    },
    {
      header: 'Propiedad',
      cellClassName: 'min-w-[220px] whitespace-normal',
      render: (lead) => (
        <div className="max-w-[220px] break-words text-sm leading-6 text-slate-700">
          {lead.propiedad_id != null ? propertyTitleById.get(lead.propiedad_id) ?? 'Sin titulo' : 'Sin propiedad'}
        </div>
      ),
    },
    {
      header: 'Estado',
      cellClassName: 'min-w-[150px]',
      render: (lead) => (
        <select
          value={lead.estado || LEAD_STATUS_OPTIONS[0]}
          onChange={(event) => onQuickChange(lead.id, 'estado', event.target.value)}
          disabled={updatingLeadId === lead.id}
          className="min-w-32 rounded-full border-0 px-3 py-1 text-xs font-semibold outline-none ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
          style={getStatusStyles(lead.estado ?? '')}
        >
          {LEAD_STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: 'Prioridad',
      cellClassName: 'min-w-[150px]',
      render: (lead) => (
        <select
          value={lead.prioridad || LEAD_PRIORITY_OPTIONS[1]}
          onChange={(event) => onQuickChange(lead.id, 'prioridad', event.target.value)}
          disabled={updatingLeadId === lead.id}
          className="min-w-32 rounded-full border-0 px-3 py-1 text-xs font-semibold outline-none ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
          style={getPriorityStyles(lead.prioridad ?? '')}
        >
          {LEAD_PRIORITY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: 'Creado por',
      cellClassName: 'min-w-[180px]',
      render: (lead) => <span className="text-sm text-slate-700">{formatCreatorName(lead.creador)}</span>,
    },
    {
      header: 'Fecha de creacion',
      cellClassName: 'min-w-[150px]',
      render: (lead) => <span className="text-sm text-slate-700">{formatDate(lead.creado_en)}</span>,
    },
    {
      header: 'Fecha de cita',
      cellClassName: 'min-w-[180px]',
      render: (lead) => <span className="text-sm text-slate-700">{formatDateTime(lead.fecha_cita)}</span>,
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
  ];

  return (
    <BaseTable
      data={leads}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="No se encontraron registros"
      wrapperClassName="rounded-none border-0 bg-transparent shadow-none"
      tableClassName="w-max min-w-[1520px] text-left"
      actionsClassName="flex items-center gap-2"
      onEdit={canEdit ? onEdit : undefined}
      onDelete={canDelete ? onDelete : undefined}
      customActions={(lead) => (
        <DownloadLeadPdfButton
          lead={lead}
          propertyTitle={lead.propiedad_id != null ? propertyTitleById.get(lead.propiedad_id) ?? 'Sin titulo' : 'Sin propiedad'}
          className="rounded-md border border-slate-300 p-1.5 text-slate-700 transition-colors hover:bg-slate-50"
        >
          {(loading) =>
            loading ? (
              <div className="h-6 w-6 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
            ) : (
              <img src={descInfIcon} alt="" className="h-6 w-6" aria-hidden="true" />
            )
          }
        </DownloadLeadPdfButton>
      )}
    />
  );
}
