import { useState } from 'react';
import { BaseTable, type ColumnDef } from '@/components/ui/BaseTable';
import { BadgeSelect } from '@/components/ui/BadgeSelect';
import type { LeadRecord } from '@/interfaces/lead.interface';
import { getStatusStyles } from '@/shared/ui/statusStyles';
import { ASESOR_EXTERNO_STATUS_OPTIONS } from './asesorExterno.shared';

function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="group relative max-w-[200px]">
      <div
        className={`text-xs leading-5 text-slate-600 ${expanded ? '' : 'line-clamp-2'} cursor-pointer md:cursor-default`}
        onClick={() => setExpanded((v) => !v)}
      >
        {text}
      </div>
      {/* Tooltip solo en desktop (hover) */}
      <div className="pointer-events-none invisible absolute bottom-full left-0 z-50 mb-1.5 w-64 rounded-xl bg-slate-900 px-3 py-2.5 text-xs leading-5 text-white opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 max-md:hidden">
        {text}
        <span className="absolute left-4 top-full h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-slate-900" />
      </div>
    </div>
  );
}

type Props = {
  leads: LeadRecord[];
  isLoading: boolean;
  updatingLeadId: number | null;
  canEdit: boolean;
  canDelete: boolean;
  onQuickStatusChange: (leadId: number, value: string) => void;
  onEdit: (lead: LeadRecord) => void;
  onDelete: (lead: LeadRecord) => void;
};

export function AsesorExternoTable({
  leads,
  isLoading,
  updatingLeadId,
  canEdit,
  canDelete,
  onQuickStatusChange,
  onEdit,
  onDelete,
}: Props) {
  const columns: ColumnDef<LeadRecord>[] = [
    {
      header: 'Fecha',
      cellClassName: 'min-w-[100px]',
      render: (lead) => (
        <span className="text-xs text-slate-600">
          {lead.creado_en
            ? new Date(lead.creado_en).toLocaleDateString('es-MX', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '—'}
        </span>
      ),
    },
    {
      header: 'Estatus',
      cellClassName: 'min-w-[140px]',
      render: (lead) => (
        <BadgeSelect
          value={lead.estado || ASESOR_EXTERNO_STATUS_OPTIONS[0]}
          options={ASESOR_EXTERNO_STATUS_OPTIONS}
          onChange={(v) => onQuickStatusChange(lead.id, v)}
          disabled={updatingLeadId === lead.id}
          canEdit={canEdit}
          getStyles={() => getStatusStyles(lead.estado ?? '')}
          omitFirstOption={false}
        />
      ),
    },
    {
      header: 'Nombre',
      cellClassName: 'min-w-[140px]',
      render: (lead) => (
        <span className="text-xs font-semibold text-slate-900">
          {`${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim() || 'Sin nombre'}
        </span>
      ),
    },
    {
      header: 'Celular',
      cellClassName: 'min-w-[90px]',
      render: (lead) => (
        <span className="font-mono text-xs text-slate-600">
          {lead.telefono != null ? String(lead.telefono) : '—'}
        </span>
      ),
    },
    {
      header: 'Operación',
      cellClassName: 'min-w-[100px]',
      render: (lead) => (
        <span className="text-xs text-slate-600">{lead.operacion ?? '—'}</span>
      ),
    },
    {
      header: 'Zona',
      cellClassName: 'min-w-[150px]',
      render: (lead) => (
        <div
          className="line-clamp-2 max-w-[180px] text-xs leading-5 text-slate-600"
          title={lead.ubicacion_propiedad ?? ''}
        >
          {lead.ubicacion_propiedad || '—'}
        </div>
      ),
    },
    {
      header: 'Solicitud',
      cellClassName: 'min-w-[160px]',
      render: (lead) =>
        lead.solicitud ? (
          <ExpandableText text={lead.solicitud} />
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      header: 'Comentarios',
      cellClassName: 'min-w-[160px]',
      render: (lead) =>
        lead.comentarios ? (
          <ExpandableText text={lead.comentarios} />
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
  ];

  return (
    <BaseTable
      data={leads}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="No se encontraron leads externos"
      wrapperClassName="rounded-none border-0 bg-transparent shadow-none [&_td]:px-1.5 [&_td]:py-1.5 [&_th]:px-1.5 [&_th]:py-2"
      tableClassName="w-max min-w-full text-left"
      actionsClassName="flex items-center gap-1.5"
      onEdit={canEdit ? onEdit : undefined}
      onDelete={canDelete ? onDelete : undefined}
    />
  );
}
