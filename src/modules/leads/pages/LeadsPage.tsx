import { useMemo, useEffect, useState } from 'react';
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

const STATUS_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  contactado: { backgroundColor: '#DBEAFE', color: '#1480F0' },
  'en seguimiento': { backgroundColor: '#F3E8FF', color: '#C455DB' },
  cancelado: { backgroundColor: '#FEF3C7', color: '#CA5874' },
  'cita agendada': { backgroundColor: '#CD8774', color: '#2F0905' },
  'en espera': { backgroundColor: '#DBFCE7', color: '#4D8236' },
  'en proceso': { backgroundColor: '#C455DB', color: '#F3E8FF' },
  cerrado: { backgroundColor: '#C3B28A', color: '#050505' },
};

const ALL_STATES = 'Todos los estados';
const ALL_PROPERTIES = 'Propiedad';

export function LeadsPage() {
  const { user, accessToken } = useAuth();
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL_STATES);
  const [propertyFilter, setPropertyFilter] = useState(ALL_PROPERTIES);
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

  const propertyOptions = useMemo(() => {
    const values = new Set<string>();
    leads.forEach((lead) => {
      const value = formatPropertyAddress(lead.propiedad).trim();
      if (value && value !== 'Sin ubicacion') values.add(value);
    });
    return [ALL_PROPERTIES, ...Array.from(values)];
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const fullName = `${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim().toLowerCase();
      const email = (lead.correo_electronico ?? '').toLowerCase();
      const phone = formatPhone(lead.lada, lead.telefono).toLowerCase();
      const address = formatPropertyAddress(lead.propiedad);

      const matchesSearch =
        query.length === 0 || fullName.includes(query) || email.includes(query) || phone.includes(query);
      const matchesStatus = statusFilter === ALL_STATES || (lead.estado ?? '').trim() === statusFilter;
      const matchesProperty = propertyFilter === ALL_PROPERTIES || address === propertyFilter;

      return matchesSearch && matchesStatus && matchesProperty;
    });
  }, [leads, search, statusFilter, propertyFilter]);

  const propertyChoices = useMemo(
    () =>
      properties.map((property) => ({
        id: property.id,
        label: formatPropertyAddress({ direccion: property.direccion }),
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
      const selectedProperty = properties.find((property) => property.id === (payload.propiedad_id ?? updatedLead.propiedad_id));

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

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Registros</h2>
          <p className="mt-1 text-sm text-slate-600">Gestiona todos los registros</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-[#312C85] px-4 py-2 text-sm font-semibold text-white shadow-sm"
        >
          <img src={agregarIcon} alt="" className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span>Nuevo registro</span>
        </button>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_auto]">
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
            value={propertyFilter}
            onChange={(event) => setPropertyFilter(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
          >
            {propertyOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-[#16A34A] px-4 py-2 text-sm font-semibold text-white shadow-sm"
          >
            <img src={desArcIcon} alt="" className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span>Descargar</span>
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="w-full overflow-x-auto">
          <table className="min-w-full w-max text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Cliente</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Correo electronico
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Telefono</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Propiedad</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Estados</th>
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
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-600">
                    Cargando registros...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-600">
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
                    <td className="px-4 py-3 text-sm text-slate-700">{formatPropertyAddress(lead.propiedad)}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
                        style={getStatusStyles(lead.estado ?? '')}
                      >
                        {lead.estado || 'Sin estado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{formatDate(lead.creado_en)}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{lead.comentarios || 'Sin comentarios'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="Editar"
                          title="Editar"
                          className="rounded-md border border-slate-300 p-1.5 text-slate-700"
                          onClick={() => openEditModal(lead)}
                        >
                          <img src={editarIcon} alt="" className="h-6 w-6" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label="Descargar"
                          title="Descargar"
                          className="rounded-md border border-slate-300 p-1.5 text-slate-700"
                        >
                          <img src={descInfIcon} alt="" className="h-6 w-6" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label="Eliminar"
                          title="Eliminar"
                          className="rounded-md border border-slate-300 p-1.5 text-slate-700"
                          onClick={() => openDeleteModal(lead)}
                        >
                          <img src={borrarIcon} alt="" className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onCreate={handleCreateLead}
        propertyOptions={propertyChoices}
      />
      <EditLeadModal
        isOpen={Boolean(editingLead)}
        lead={editingLead}
        onClose={closeEditModal}
        onEdit={handleEditLead}
        propertyOptions={propertyChoices}
      />
      <DeleteLeadConfirmModal
        isOpen={Boolean(deletingLead)}
        lead={deletingLead}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteLead}
      />
    </div>
  );
}

function getStatusStyles(estado: string): { backgroundColor: string; color: string } {
  const normalizedEstado = estado.trim().toLowerCase();
  return STATUS_STYLES[normalizedEstado] ?? { backgroundColor: '#E2E8F0', color: '#334155' };
}

function formatPhone(lada?: string | null, telefono?: string | number): string {
  const parts = [lada ?? '', telefono != null ? String(telefono) : ''].map((part) => part.trim()).filter(Boolean);
  return parts.length ? parts.join(' ') : 'Sin telefono';
}

function formatPropertyAddress(propiedad?: { direccion?: { calle?: string; municipio?: string; fraccionamiento?: string } } | null): string {
  const direccion = propiedad?.direccion ?? {};
  const parts = [direccion.calle, direccion.municipio, direccion.fraccionamiento]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Sin ubicacion';
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
