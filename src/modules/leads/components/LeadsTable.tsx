import { BaseTable, type ColumnDef } from '@/components/ui/BaseTable';
import type { LeadRecord } from '@/interfaces/lead.interface';
import descInfIcon from '../../../assets/images/DescInf.png';
import { DownloadLeadPdfButton } from './DownloadLeadPdfButton';
import { VISIT_STATUS_OPTIONS } from '../utils/leads.constants';
import {
  formatAsesorExterno,
  formatCreatorName,
  formatDate,
  formatDateTime,
  formatPhoneLastFour,
  getStatusStyles,
} from '../utils/leads.utils';

type LeadsTableProps = {
  leads: LeadRecord[];
  isLoading: boolean;
  updatingLeadId: number | null;
  propertyTitleById: Map<number, string>;
  hideResponsibleColumn?: boolean;
  showFolioColumn?: boolean;
  canQuickEdit?: boolean;
  canQuickEditItem?: (lead: LeadRecord) => boolean;
  canEditItem?: (lead: LeadRecord) => boolean;
  canDeleteItem?: (lead: LeadRecord) => boolean;
  onQuickChange: (leadId: number, field: 'estado', value: string) => void;
  onEdit: (lead: LeadRecord) => void;
  onDelete: (lead: LeadRecord) => void;
};

export function LeadsTable({
  leads,
  isLoading,
  updatingLeadId,
  propertyTitleById,
  hideResponsibleColumn = false,
  showFolioColumn = false,
  canQuickEdit = true,
  canQuickEditItem,
  canEditItem,
  canDeleteItem,
  onQuickChange,
  onEdit,
  onDelete,
}: LeadsTableProps) {
  const columns: ColumnDef<LeadRecord>[] = [
    {
      header: 'Cliente',
      cellClassName: 'min-w-[220px]',
      render: (lead) => (
        <div>
          <p className="font-semibold text-slate-900">
            {`${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim() || 'Sin nombre'}
          </p>
        </div>
      ),
    },
    {
      header: 'Telefono',
      cellClassName: 'min-w-[150px]',
      render: (lead) => <span className="text-sm text-slate-700">{formatPhoneLastFour(lead.telefono)}</span>,
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
        canQuickEdit && (canQuickEditItem == null || canQuickEditItem(lead)) ? (
          <select
            value={lead.estado || VISIT_STATUS_OPTIONS[0]}
            onChange={(event) => onQuickChange(lead.id, 'estado', event.target.value)}
            disabled={updatingLeadId === lead.id}
            className="min-w-32 rounded-full border-0 px-3 py-1 text-xs font-semibold outline-none ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
            style={getStatusStyles(lead.estado ?? '')}
          >
            {VISIT_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <span
            className="inline-flex min-w-32 justify-center rounded-full px-3 py-1 text-xs font-semibold"
            style={getStatusStyles(lead.estado ?? '')}
          >
            {lead.estado || VISIT_STATUS_OPTIONS[0]}
          </span>
        )
      ),
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
      header: 'Asesor externo',
      cellClassName: 'min-w-[220px]',
      render: (lead) => (
        <span className="text-sm text-slate-700">
          {formatAsesorExterno(lead.asesor_externo, lead.asesor_externo_nombre)}
        </span>
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
  ];

  if (!hideResponsibleColumn) {
    columns.splice(4, 0, {
      header: 'Responsable',
      cellClassName: 'min-w-[180px]',
      render: (lead) => <span className="text-sm text-slate-700">{formatCreatorName(lead.creador)}</span>,
    });
  }

  if (showFolioColumn) {
    columns.splice(hideResponsibleColumn ? 6 : 7, 0, {
      header: 'Folio',
      cellClassName: 'min-w-[220px]',
      render: (lead) => (
        <span className="text-sm font-semibold text-slate-700">
          {lead.folio?.trim() || 'Sin folio'}
        </span>
      ),
    });
  }

  return (
    <BaseTable
      data={leads}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="No se encontraron registros"
      wrapperClassName="rounded-none border-0 bg-transparent shadow-none"
      tableClassName="w-max min-w-[1320px] text-left"
      actionsClassName="flex items-center gap-2"
      onEdit={onEdit}
      onDelete={onDelete}
      canEditItem={canEditItem}
      canDeleteItem={canDeleteItem}
      customActions={(lead) => (
        <DownloadLeadPdfButton
          lead={lead}
          propertyTitle={lead.propiedad_id != null ? propertyTitleById.get(lead.propiedad_id) ?? 'Sin titulo' : 'Sin propiedad'}
          className="rounded-md border border-slate-300 p-1.5 text-slate-700 transition-colors hover:bg-slate-50"
        >
          {(loading) =>
            loading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
            ) : (
              <img src={descInfIcon} alt="" className="h-6 w-6" aria-hidden="true" />
            )
          }
        </DownloadLeadPdfButton>
      )}
    />
  );
}
