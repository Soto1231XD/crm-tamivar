import { useEffect, useMemo, useState } from 'react';
import agregarIcon from '../../../assets/images/Agregar.png';
import desArcIcon from '../../../assets/images/DesArc.png';
import editarIcon from '../../../assets/images/Editar.png';
import descInfIcon from '../../../assets/images/DescInf.png';
import borrarIcon from '../../../assets/images/Borrar.png';
import {
  createLead,
  deleteLead,
  getLeads,
  updateLead,
  type CreateLeadPayload,
  type LeadRecord,
  type UpdateLeadPayload,
} from '../services/leads.api';
import { CreateLeadModal } from '../components/CreateLeadModal';
import { EditLeadModal } from '../components/EditLeadModal';
import { DeleteLeadConfirmModal } from '../components/DeleteLeadConfirmModal';
import { getProperties, type PropertyRecord } from '../../properties/services/properties.api';
import { useAuth } from '../../../shared/context/AuthContext';
import { getModulePermissions, getPrimaryRole } from '../../../shared/constants/roles';

const STATUS_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  contactado: { backgroundColor: '#DBEAFE', color: '#1480F0' },
  'en seguimiento': { backgroundColor: '#F3E8FF', color: '#C455DB' },
  cancelado: { backgroundColor: '#FEF3C7', color: '#CA5874' },
  'cita agendada': { backgroundColor: '#CD8774', color: '#2F0905' },
  'en espera': { backgroundColor: '#DBFCE7', color: '#4D8236' },
  'en proceso': { backgroundColor: '#C455DB', color: '#F3E8FF' },
  cerrado: { backgroundColor: '#C3B28A', color: '#050505' },
};

const PRIORITY_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  urgente: { backgroundColor: '#FEF3C7', color: '#CA5874' },
  normal: { backgroundColor: '#DBFCE7', color: '#4D8236' },
  'bajo interes': { backgroundColor: '#8E8E93', color: '#000000' },
};

const ALL_STATES = 'Todos los estados';
const ALL_PRIORITIES = 'Todas las prioridades';
const ALL_PROPERTIES = 'Todas las propiedades';
const LEAD_STATUS_OPTIONS = [
  'Contactado',
  'En seguimiento',
  'Cancelado',
  'Cita agendada',
  'En espera',
  'En proceso',
  'Cerrado',
] as const;
const LEAD_PRIORITY_OPTIONS = ['Urgente', 'Normal', 'Bajo Interes'] as const;

export function LeadsPage() {
  const { user, accessToken } = useAuth();
  const primaryRole = getPrimaryRole(user?.roles ?? []);
  const leadPermissions = getModulePermissions(user?.roles ?? [], 'leads');
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL_STATES);
  const [priorityFilter, setPriorityFilter] = useState(ALL_PRIORITIES);
  const [propertyFilter, setPropertyFilter] = useState(ALL_PROPERTIES);
  const [updatingLeadId, setUpdatingLeadId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadRecord | null>(null);
  const [deletingLead, setDeletingLead] = useState<LeadRecord | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    getLeads()
      .then((data) => {
        if (!active) return;
        setLeads(data);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    getProperties().then((data) => {
      if (!active) return;
      setProperties(data);
    });

    return () => {
      active = false;
    };
  }, []);

  const statusOptions = useMemo(() => {
    const values = new Set<string>();
    leads.forEach((lead) => {
      const value = (lead.estado ?? '').trim();
      if (value) values.add(value);
    });
    return [ALL_STATES, ...Array.from(values)];
  }, [leads]);

  const propertyTitleById = useMemo(
    () =>
      new Map(
        properties.map((property) => [property.id, property.titulo?.trim() || 'Sin titulo'] as const),
      ),
    [properties],
  );

  const propertyFilterOptions = useMemo(
    () => [ALL_PROPERTIES, ...Array.from(new Set(properties.map((property) => property.titulo?.trim() || 'Sin titulo')))],
    [properties],
  );

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    const visibleLeads =
      primaryRole === 'ASESOR_VENTAS' && user?.id
        ? leads.filter((lead) => lead.creador?.id === user.id)
        : leads;

    return visibleLeads.filter((lead) => {
      const fullName = `${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim().toLowerCase();
      const email = (lead.correo_electronico ?? '').toLowerCase();
      const phone = formatPhone(lead.lada, lead.telefono).toLowerCase();
      const priority = normalizePriority(lead.prioridad ?? '');
      const propertyTitle = propertyTitleById.get(lead.propiedad_id) ?? 'Sin titulo';

      const matchesSearch =
        query.length === 0 || fullName.includes(query) || email.includes(query) || phone.includes(query);
      const matchesStatus = statusFilter === ALL_STATES || (lead.estado ?? '').trim() === statusFilter;
      const matchesPriority =
        priorityFilter === ALL_PRIORITIES || priority === normalizePriority(priorityFilter);
      const matchesProperty = propertyFilter === ALL_PROPERTIES || propertyTitle === propertyFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesProperty;
    });
  }, [leads, search, statusFilter, priorityFilter, propertyFilter, propertyTitleById, primaryRole, user?.id]);

  const propertyChoices = useMemo(
    () =>
      properties.map((property) => ({
        id: property.id,
        label: property.titulo?.trim() || 'Sin titulo',
      })),
    [properties],
  );

  function openCreateModal() {
    setIsCreateModalOpen(true);
  }

  function closeCreateModal() {
    setIsCreateModalOpen(false);
  }

  function openEditModal(lead: LeadRecord) {
    setEditingLead(lead);
  }

  function closeEditModal() {
    setEditingLead(null);
  }

  function openDeleteModal(lead: LeadRecord) {
    setDeletingLead(lead);
  }

  function closeDeleteModal() {
    setDeletingLead(null);
  }

  async function handleCreateLead(payload: Omit<CreateLeadPayload, 'creado_por_id'>): Promise<string | null> {
    if (!user?.id) {
      return 'No hay una sesion valida para asociar el creador.';
    }

    try {
      const createdPayload: CreateLeadPayload = {
        ...payload,
        creado_por_id: user.id,
      };
      const createdLead = await createLead(createdPayload, accessToken);

      const selectedProperty = properties.find((property) => property.id === payload.propiedad_id);
      const leadForList: LeadRecord = {
        ...createdLead,
        creador:
          createdLead.creador ?? {
            id: user.id,
            nombres: user.nombres ?? undefined,
            apellido_paterno: user.apellidoPaterno ?? undefined,
          },
        propiedad:
          createdLead.propiedad ??
          (selectedProperty
            ? {
                direccion: selectedProperty.direccion,
              }
            : undefined),
      };

      setLeads((prev) => [leadForList, ...prev]);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No fue posible crear el registro.';
    }
  }

  async function handleEditLead(leadId: number, payload: UpdateLeadPayload): Promise<string | null> {
    try {
      const updatedLead = await updateLead(leadId, payload, accessToken);
      const selectedProperty = properties.find(
        (property) => property.id === (payload.propiedad_id ?? updatedLead.propiedad_id),
      );

      const leadForList: LeadRecord = {
        ...updatedLead,
        propiedad:
          updatedLead.propiedad ??
          (selectedProperty
            ? {
                direccion: selectedProperty.direccion,
              }
            : undefined),
      };

      setLeads((prev) => prev.map((lead) => (lead.id === leadId ? { ...lead, ...leadForList } : lead)));
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No fue posible actualizar el registro.';
    }
  }

  async function handleDeleteLead(leadId: number): Promise<string | null> {
    try {
      await deleteLead(leadId, accessToken);
      setLeads((prev) => prev.filter((lead) => lead.id !== leadId));
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No fue posible eliminar el registro.';
    }
  }

  function handleDownloadLead(lead: LeadRecord) {
    downloadLeadAsExcel(lead, propertyTitleById.get(lead.propiedad_id) ?? 'Sin titulo');
  }

  function handleDownloadFilteredLeads() {
    downloadLeadsAsExcel(
      filteredLeads,
      filteredLeads.map((lead) => propertyTitleById.get(lead.propiedad_id) ?? 'Sin titulo'),
    );
  }

  async function handleQuickLeadChange(
    leadId: number,
    field: 'estado' | 'prioridad',
    value: string,
  ) {
    const targetLead = leads.find((lead) => lead.id === leadId);
    if (!targetLead || targetLead[field] === value) return;

    const previousValue = targetLead[field];
    setUpdatingLeadId(leadId);
    setLeads((prev) => prev.map((lead) => (lead.id === leadId ? { ...lead, [field]: value } : lead)));

    try {
      await updateLead(leadId, { [field]: value }, accessToken);
    } catch {
      setLeads((prev) =>
        prev.map((lead) => (lead.id === leadId ? { ...lead, [field]: previousValue } : lead)),
      );
    } finally {
      setUpdatingLeadId(null);
    }
  }

  return (
    <div className="min-w-0 space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Registros</h2>
          <p className="mt-1 text-sm text-slate-600">Gestiona todos los registros</p>
        </div>
        <button
          type="button"
          disabled={!leadPermissions.create}
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-[#312C85] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          <img src={agregarIcon} alt="" className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span>Nuevo registro</span>
        </button>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <input
            type="text"
            placeholder="Buscar por nombre, email o telefono"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
          >
            {[ALL_PRIORITIES, ...LEAD_PRIORITY_OPTIONS].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={propertyFilter}
            onChange={(event) => setPropertyFilter(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
          >
            {propertyFilterOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleDownloadFilteredLeads}
            disabled={filteredLeads.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-[#16A34A] px-4 py-2 text-sm font-semibold text-white shadow-sm"
          >
            <img src={desArcIcon} alt="" className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span>Descargar</span>
          </button>
        </div>
      </section>

      <section className="min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Comentarios</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-6 text-center text-sm text-slate-600">
                    Cargando registros...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-6 text-center text-sm text-slate-600">
                    No se encontraron registros
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
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
                        onChange={(event) => handleQuickLeadChange(lead.id, 'estado', event.target.value)}
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
                        onChange={(event) => handleQuickLeadChange(lead.id, 'prioridad', event.target.value)}
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
                    <td className="px-4 py-3 text-sm text-slate-700">{lead.comentarios || 'Sin comentarios'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {leadPermissions.edit ? (
                          <button
                            type="button"
                            aria-label="Editar"
                            title="Editar"
                            className="rounded-md border border-slate-300 p-1.5 text-slate-700"
                            onClick={() => openEditModal(lead)}
                          >
                            <img src={editarIcon} alt="" className="h-6 w-6" aria-hidden="true" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          aria-label="Descargar"
                          title="Descargar"
                          className="rounded-md border border-slate-300 p-1.5 text-slate-700"
                          onClick={() => handleDownloadLead(lead)}
                        >
                          <img src={descInfIcon} alt="" className="h-6 w-6" aria-hidden="true" />
                        </button>
                        {leadPermissions.delete ? (
                          <button
                            type="button"
                            aria-label="Eliminar"
                            title="Eliminar"
                            className="rounded-md border border-slate-300 p-1.5 text-slate-700"
                            onClick={() => openDeleteModal(lead)}
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
      </section>

      {leadPermissions.create ? (
        <CreateLeadModal
          isOpen={isCreateModalOpen}
          onClose={closeCreateModal}
          onCreate={handleCreateLead}
          propertyOptions={propertyChoices}
        />
      ) : null}
      {leadPermissions.edit ? (
        <EditLeadModal
          isOpen={Boolean(editingLead)}
          lead={editingLead}
          onClose={closeEditModal}
          onEdit={handleEditLead}
          propertyOptions={propertyChoices}
        />
      ) : null}
      {leadPermissions.delete ? (
        <DeleteLeadConfirmModal
          isOpen={Boolean(deletingLead)}
          lead={deletingLead}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteLead}
        />
      ) : null}
    </div>
  );
}

function getStatusStyles(estado: string): { backgroundColor: string; color: string } {
  const normalizedEstado = estado.trim().toLowerCase();
  return STATUS_STYLES[normalizedEstado] ?? { backgroundColor: '#E2E8F0', color: '#334155' };
}

function getPriorityStyles(prioridad: string): { backgroundColor: string; color: string } {
  const normalizedPrioridad = normalizePriority(prioridad);
  return PRIORITY_STYLES[normalizedPrioridad] ?? { backgroundColor: '#E2E8F0', color: '#334155' };
}

function normalizePriority(prioridad: string): string {
  return prioridad
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function formatPhone(lada?: string | null, telefono?: string | number): string {
  const parts = [lada ?? '', telefono != null ? String(telefono) : ''].map((part) => part.trim()).filter(Boolean);
  return parts.length ? parts.join(' ') : 'Sin telefono';
}

function formatDate(value?: string): string {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function formatCreatorName(
  creador?: { nombres?: string | null; apellido_paterno?: string | null } | null,
): string {
  const parts = [creador?.nombres, creador?.apellido_paterno]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Sin asignar';
}

function downloadLeadAsExcel(lead: LeadRecord, propertyTitle: string) {
  const rows = [
    ['Campo', 'Valor'],
    ['ID', String(lead.id ?? '')],
    ['Cliente', `${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim() || 'Sin nombre'],
    ['Correo electronico', lead.correo_electronico?.trim() || 'Sin correo'],
    ['Telefono', formatPhone(lead.lada, lead.telefono)],
    ['Propiedad', propertyTitle],
    ['Estado', lead.estado?.trim() || 'Sin estado'],
    ['Prioridad', lead.prioridad?.trim() || 'Sin prioridad'],
    ['Creado por', formatCreatorName(lead.creador)],
    ['Fecha de creacion', formatDate(lead.creado_en)],
    ['Comentarios', lead.comentarios?.trim() || 'Sin comentarios'],
  ];

  const tableRows = rows
    .map(
      ([label, value], index) => `
        <tr>
          <td style="${index === 0 ? HEADER_CELL_STYLE : LABEL_CELL_STYLE}">${escapeHtml(label)}</td>
          <td style="${index === 0 ? HEADER_CELL_STYLE : VALUE_CELL_STYLE}">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join('');

  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8" />
        <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Registro</x:Name>
                  <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
        <![endif]-->
      </head>
      <body>
        <table border="1" cellspacing="0" cellpadding="0">
          ${tableRows}
        </table>
      </body>
    </html>`;

  const blob = new Blob([`\ufeff${excelContent}`], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFileName(`${lead.nombres ?? ''}-${lead.apellidos ?? ''}` || `registro-${lead.id}`)}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadLeadsAsExcel(leads: LeadRecord[], propertyTitles: string[]) {
  const rows = [
    [
      'ID',
      'Cliente',
      'Correo electronico',
      'Telefono',
      'Propiedad',
      'Estado',
      'Prioridad',
      'Creado por',
      'Fecha de creacion',
      'Comentarios',
    ],
    ...leads.map((lead, index) => [
      String(lead.id ?? ''),
      `${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim() || 'Sin nombre',
      lead.correo_electronico?.trim() || 'Sin correo',
      formatPhone(lead.lada, lead.telefono),
      propertyTitles[index] ?? 'Sin titulo',
      lead.estado?.trim() || 'Sin estado',
      lead.prioridad?.trim() || 'Sin prioridad',
      formatCreatorName(lead.creador),
      formatDate(lead.creado_en),
      lead.comentarios?.trim() || 'Sin comentarios',
    ]),
  ];

  const tableRows = rows
    .map(
      (columns, rowIndex) => `
        <tr>
          ${columns
            .map(
              (column) =>
                `<td style="${rowIndex === 0 ? HEADER_CELL_STYLE : VALUE_CELL_STYLE}">${escapeHtml(column)}</td>`,
            )
            .join('')}
        </tr>`,
    )
    .join('');

  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8" />
        <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Registros</x:Name>
                  <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
        <![endif]-->
      </head>
      <body>
        <table border="1" cellspacing="0" cellpadding="0">
          ${tableRows}
        </table>
      </body>
    </html>`;

  const blob = new Blob([`\ufeff${excelContent}`], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'registros-filtrados.xls';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const HEADER_CELL_STYLE =
  'background:#E2E8F0;font-weight:700;color:#0F172A;padding:8px 12px;border:1px solid #CBD5E1;';
const LABEL_CELL_STYLE =
  'background:#F8FAFC;font-weight:600;color:#334155;padding:8px 12px;border:1px solid #CBD5E1;';
const VALUE_CELL_STYLE = 'color:#0F172A;padding:8px 12px;border:1px solid #CBD5E1;';

function sanitizeFileName(value: string): string {
  return value
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
