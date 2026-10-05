import { useState, useMemo, Fragment } from 'react';
import editarIcon from '@/assets/images/Editar.png';
import borrarIcon from '@/assets/images/Borrar.png';
import { BaseTable, type ColumnDef } from '@/components/ui/BaseTable';
import { BadgeSelect } from '@/components/ui/BadgeSelect';
import type { LeadRecord } from '@/interfaces/lead.interface';
import { getStatusStyles } from '@/shared/ui/statusStyles';
import { ASESOR_EXTERNO_STATUS_OPTIONS } from './asesorExterno.shared';
import { CreateRecomendacionModal } from '@/modules/recomendaciones/components/CreateRecomendacionModal';

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
  showCreator: boolean;
  canRecomend: boolean;
  onQuickStatusChange: (leadId: number, value: string) => void;
  onEdit: (lead: LeadRecord) => void;
  onDelete: (lead: LeadRecord) => void;
  onAgendarCita?: (lead: LeadRecord) => void;
};

type LeadGroup = {
  asesorId: number | null;
  asesorNombre: string;
  leads: LeadRecord[];
};

type RecomModal = { asesorId: number; nombre: string; leads: LeadRecord[] };

function buildColumns(
  updatingLeadId: number | null,
  canEdit: boolean,
  onQuickStatusChange: (leadId: number, value: string) => void,
): ColumnDef<LeadRecord>[] {
  return [
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
}

function GroupedTable({
  groups,
  columns,
  canEdit,
  canDelete,
  canRecomend,
  onEdit,
  onDelete,
  isLoading,
}: {
  groups: LeadGroup[];
  columns: ColumnDef<LeadRecord>[];
  canEdit: boolean;
  canDelete: boolean;
  canRecomend: boolean;
  onEdit: (lead: LeadRecord) => void;
  onDelete: (lead: LeadRecord) => void;
  isLoading: boolean;
}) {
  const [recomModal, setRecomModal] = useState<RecomModal | null>(null);
  const hasActions = canEdit || canDelete;
  const colSpan = columns.length + (hasActions ? 1 : 0);

  return (
    <div className="overflow-x-auto overscroll-x-contain">
      <table className="w-max min-w-full text-left">
        <thead className="border-b border-[var(--crm-border)] bg-[var(--crm-muted)]">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                className={`whitespace-nowrap px-1.5 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--crm-text-muted)] ${col.headerClassName ?? ''}`}
              >
                {col.header}
              </th>
            ))}
            {hasActions && (
              <th className="whitespace-nowrap px-1.5 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--crm-text-muted)]">
                Acciones
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={colSpan} className="px-4 py-6 text-center text-sm text-[var(--crm-text-muted)]">
                Cargando información...
              </td>
            </tr>
          ) : groups.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="px-4 py-6 text-center text-sm text-[var(--crm-text-muted)]">
                No se encontraron leads externos
              </td>
            </tr>
          ) : (
            groups.map((group) => (
              <Fragment key={`group-${group.asesorId ?? 'none'}`}>
                {/* Fila encabezado de grupo */}
                <tr>
                  <td
                    colSpan={colSpan}
                    className="border-b border-t border-[var(--crm-border)] bg-[var(--crm-muted)] px-4 py-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-4 w-1 rounded-full bg-[var(--crm-primary)]" />
                      <span className="text-xs font-semibold text-[var(--crm-text)]">
                        {group.asesorNombre}
                      </span>
                      <span className="rounded-full bg-[var(--crm-primary)] px-2 py-0.5 text-[10px] font-semibold text-white">
                        {group.leads.length}
                      </span>
                      {canRecomend && group.asesorId !== null && (
                        <button
                          type="button"
                          onClick={() =>
                            setRecomModal({
                              asesorId: group.asesorId!,
                              nombre: group.asesorNombre,
                              leads: group.leads,
                            })
                          }
                          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-[#312C85]/30 bg-[#312C85]/8 px-2.5 py-1 text-[11px] font-semibold text-[#312C85] transition hover:bg-[#312C85]/15"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m-6 4h10M3 5a2 2 0 012-2h14a2 2 0 012 2v11a2 2 0 01-2 2H7l-4 4V5z" />
                          </svg>
                          Dar recomendación
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Filas de leads del grupo */}
                {group.leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-[var(--crm-border)] transition-colors hover:bg-[var(--crm-muted)]"
                  >
                    {columns.map((col, colIndex) => (
                      <td
                        key={colIndex}
                        className={`px-1.5 py-1.5 text-sm text-[var(--crm-text)] align-middle ${col.cellClassName ?? ''}`}
                      >
                        {col.render ? col.render(lead) : null}
                      </td>
                    ))}

                    {hasActions && (
                      <td className="whitespace-nowrap px-1.5 py-1.5">
                        <div className="flex items-center gap-1.5">
                          {canEdit && (
                            <button
                              type="button"
                              title="Editar"
                              className="rounded-md border border-[var(--crm-border-strong)] p-1.5 text-[var(--crm-text)] transition-colors hover:bg-[var(--crm-muted)]"
                              onClick={() => onEdit(lead)}
                            >
                              <img src={editarIcon} alt="Editar" className="h-5 w-5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              title="Eliminar"
                              className="rounded-md border border-[var(--crm-border-strong)] p-1.5 text-[var(--crm-text)] transition-colors hover:bg-[var(--crm-muted)]"
                              onClick={() => onDelete(lead)}
                            >
                              <img src={borrarIcon} alt="Eliminar" className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </Fragment>
            ))
          )}
        </tbody>
      </table>

      {recomModal && (
        <CreateRecomendacionModal
          isOpen={true}
          paraId={recomModal.asesorId}
          paraNombre={recomModal.nombre}
          leads={recomModal.leads}
          onClose={() => setRecomModal(null)}
        />
      )}
    </div>
  );
}

export function AsesorExternoTable({
  leads,
  isLoading,
  updatingLeadId,
  canEdit,
  canDelete,
  showCreator,
  canRecomend,
  onQuickStatusChange,
  onEdit,
  onDelete,
  onAgendarCita,
}: Props) {
  const columns = useMemo(
    () => buildColumns(updatingLeadId, canEdit, onQuickStatusChange),
    [updatingLeadId, canEdit, onQuickStatusChange],
  );

  const groups = useMemo<LeadGroup[]>(() => {
    if (!showCreator) return [];
    const map = new Map<number | null, LeadGroup>();
    for (const lead of leads) {
      const key = lead.creado_por?.id ?? null;
      if (!map.has(key)) {
        const cp = lead.creado_por;
        const nombre = cp
          ? `${cp.nombres ?? ''} ${cp.apellido_paterno ?? ''}`.trim() || 'Sin nombre'
          : 'Sin asesor';
        map.set(key, { asesorId: key, asesorNombre: nombre, leads: [] });
      }
      map.get(key)!.leads.push(lead);
    }
    return Array.from(map.values());
  }, [leads, showCreator]);

  if (showCreator) {
    return (
      <GroupedTable
        groups={groups}
        columns={columns}
        canEdit={canEdit}
        canDelete={canDelete}
        canRecomend={canRecomend}
        onEdit={onEdit}
        onDelete={onDelete}
        isLoading={isLoading}
      />
    );
  }

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
