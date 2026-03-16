import descInfIcon from '../../../assets/images/DescInf.png';
import { BaseTable, type ColumnDef } from '@/components/ui/BaseTable';
import type { LeadRecord } from '@/interfaces/lead.interface';
import { type ModulePermissions } from '../../../shared/types/rbac';
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
  leadPermissions: ModulePermissions;
  propertyTitleById: Map<number, string>;
  onQuickChange: (leadId: number, field: 'estado' | 'prioridad', value: string) => void;
  onEdit: (lead: LeadRecord) => void;
  onDelete: (lead: LeadRecord) => void;
  onDownload: (lead: LeadRecord) => void;
};

export function LeadsTable({
  leads,
  isLoading,
  updatingLeadId,
  leadPermissions,
  propertyTitleById,
  onQuickChange,
  onEdit,
  onDelete,
  onDownload,
}: LeadsTableProps) {
  const columns: ColumnDef<LeadRecord>[] = [
    {
      header: 'Cliente',
      render: (lead) => (
        <span className="text-sm font-medium text-slate-800">
          {`${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim() || 'Sin nombre'}
        </span>
      ),
    },
    {
      header: 'Correo electronico',
      render: (lead) => <span className="text-sm text-slate-700">{lead.correo_electronico || 'Sin correo'}</span>,
    },
    {
      header: 'Telefono',
      render: (lead) => <span className="text-sm text-slate-700">{formatPhone(lead.lada, lead.telefono)}</span>,
    },
    {
      header: 'Propiedad',
      render: (lead) => (
        <span className="text-sm text-slate-700">{propertyTitleById.get(lead.propiedad_id) ?? 'Sin titulo'}</span>
      ),
    },
    {
      header: 'Estados',
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
      render: (lead) => <span className="text-sm text-slate-700">{formatCreatorName(lead.creador)}</span>,
    },
    {
      header: 'Fecha de creacion',
      render: (lead) => <span className="text-sm text-slate-700">{formatDate(lead.creado_en)}</span>,
    },
    {
      header: 'Fecha de cita',
      render: (lead) => <span className="text-sm text-slate-700">{formatDateTime(lead.fecha_cita)}</span>,
    },
    {
      header: 'Comentarios',
      render: (lead) => <span className="text-sm text-slate-700">{lead.comentarios || 'Sin comentarios'}</span>,
    },
  ];

  return (
    <BaseTable
      data={leads}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="No se encontraron registros"
      wrapperClassName="rounded-none border-0 bg-transparent shadow-none"
      tableClassName="w-max min-w-[1400px] text-left"
      actionsClassName="flex items-center gap-2"
      onEdit={leadPermissions.edit ? onEdit : undefined}
      onDelete={leadPermissions.delete ? onDelete : undefined}
      customActions={(lead) => (
        <button
          type="button"
          aria-label="Descargar"
          title="Descargar"
          className="rounded-md border border-slate-300 p-1.5 text-slate-700"
          onClick={() => onDownload(lead)}
        >
          <img src={descInfIcon} alt="" className="h-6 w-6" aria-hidden="true" />
        </button>
      )}
    />
  );
}
