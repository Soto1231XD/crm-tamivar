import borrarIcon from '../../../assets/images/Borrar.png';
import descInfIcon from '../../../assets/images/DescInf.png';
import editarIcon from '../../../assets/images/Editar.png';
import { type ModulePermissions } from '../../../shared/types/rbac';
import type { LeadRecord } from '../services/leads.api';
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
  return (
    <div className="w-full min-w-0 overflow-x-auto">
      <table className="w-max min-w-[1400px] text-left">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Cliente</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Correo electronico
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Telefono</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Propiedad</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Estados</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Prioridad</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Creado por</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Fecha de creacion
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Fecha de cita
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Comentarios</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={11} className="px-4 py-6 text-center text-sm text-slate-600">
                Cargando registros...
              </td>
            </tr>
          ) : leads.length === 0 ? (
            <tr>
              <td colSpan={11} className="px-4 py-6 text-center text-sm text-slate-600">
                No se encontraron registros
              </td>
            </tr>
          ) : (
            leads.map((lead) => (
              <tr key={lead.id} className="border-b border-slate-100">
                <td className="px-4 py-3 text-sm font-medium text-slate-800">
                  {`${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim() || 'Sin nombre'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">{lead.correo_electronico || 'Sin correo'}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{formatPhone(lead.lada, lead.telefono)}</td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {propertyTitleById.get(lead.propiedad_id) ?? 'Sin titulo'}
                </td>
                <td className="px-4 py-3">
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
                </td>
                <td className="px-4 py-3">
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
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">{formatCreatorName(lead.creador)}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{formatDate(lead.creado_en)}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{formatDateTime(lead.fecha_cita)}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{lead.comentarios || 'Sin comentarios'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {leadPermissions.edit ? (
                      <button
                        type="button"
                        aria-label="Editar"
                        title="Editar"
                        className="rounded-md border border-slate-300 p-1.5 text-slate-700"
                        onClick={() => onEdit(lead)}
                      >
                        <img src={editarIcon} alt="" className="h-6 w-6" aria-hidden="true" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      aria-label="Descargar"
                      title="Descargar"
                      className="rounded-md border border-slate-300 p-1.5 text-slate-700"
                      onClick={() => onDownload(lead)}
                    >
                      <img src={descInfIcon} alt="" className="h-6 w-6" aria-hidden="true" />
                    </button>
                    {leadPermissions.delete ? (
                      <button
                        type="button"
                        aria-label="Eliminar"
                        title="Eliminar"
                        className="rounded-md border border-slate-300 p-1.5 text-slate-700"
                        onClick={() => onDelete(lead)}
                      >
                        <img src={borrarIcon} alt="" className="h-6 w-6" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
