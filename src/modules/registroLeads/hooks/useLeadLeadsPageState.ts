import { useEffect, useMemo, useState } from 'react';
import type { CreateLeadPayload, LeadRecord, UpdateLeadPayload } from '@/interfaces/lead.interface';
import type { PropertyRecord } from '@/interfaces/property.interface';
import type { UserRecord } from '@/interfaces/user.interface';
import toast from 'react-hot-toast';
import { getProperties } from '../../properties/services/properties.api';
import { getUsers } from '../../users/services/users.api';
import { formatDireccion } from '../../properties/utils/formatters';
import { useLeadLeadsStore } from '../store/useLeadLeadsStore';
import { ALL_STATES, PAGE_SIZE } from '../../leads/utils/leads.constants';
import {
  downloadLeadLeadsAsExcel,
  formatPhone,
  getComparableDate,
} from '../../leads/utils/leads.utils';

type UseLeadLeadsPageStateParams = {
  userId?: number | null;
  accessToken?: string | null;
};

export function useLeadLeadsPageState({ userId, accessToken }: UseLeadLeadsPageStateParams) {
  const {
    leads,
    isLoading,
    fetchLeadLeads,
    addLeadLead,
    editLeadLead,
    removeLeadLead,
  } = useLeadLeadsStore();
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL_STATES);
  const [leadDateFromFilter, setLeadDateFromFilter] = useState('');
  const [leadDateToFilter, setLeadDateToFilter] = useState('');
  const [updatingLeadId, setUpdatingLeadId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadRecord | null>(null);
  const [deletingLead, setDeletingLead] = useState<LeadRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    void fetchLeadLeads();
  }, [fetchLeadLeads]);

  useEffect(() => {
    let active = true;

    Promise.allSettled([getProperties(), accessToken ? getUsers(accessToken) : Promise.resolve([])]).then((results) => {
      if (!active) return;

      const [propertiesResult, usersResult] = results;
      setProperties(propertiesResult.status === 'fulfilled' ? propertiesResult.value : []);
      setUsers(usersResult.status === 'fulfilled' ? usersResult.value : []);
    });

    return () => {
      active = false;
    };
  }, [accessToken]);

  const statusOptions = useMemo(() => {
    const values = new Set<string>();
    leads.forEach((lead) => {
      const value = (lead.estado ?? '').trim();
      if (value) values.add(value);
    });
    return [ALL_STATES, ...Array.from(values)];
  }, [leads]);

  const propertyAddressById = useMemo(
    () =>
      new Map(
        properties.map((property) => [
          property.id,
          formatDireccion(property.direccion),
        ] as const),
      ),
    [properties],
  );

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const fullName = `${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim().toLowerCase();
      const phone = formatPhone(lead.lada, lead.telefono).toLowerCase();
      const leadDate = getComparableDate(lead.creado_en);

      const matchesSearch =
        query.length === 0 || fullName.includes(query) || phone.includes(query);
      const matchesStatus = statusFilter === ALL_STATES || (lead.estado ?? '').trim() === statusFilter;
      const matchesLeadDateFrom = leadDateFromFilter.length === 0 || (leadDate.length > 0 && leadDate >= leadDateFromFilter);
      const matchesLeadDateTo = leadDateToFilter.length === 0 || (leadDate.length > 0 && leadDate <= leadDateToFilter);

      return matchesSearch && matchesStatus && matchesLeadDateFrom && matchesLeadDateTo;
    });
  }, [leadDateFromFilter, leadDateToFilter, leads, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLeads.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredLeads]);

  const userNameById = useMemo(
    () =>
      new Map(
        users.map((user) => [
          user.id,
          `${user.nombres ?? ''} ${user.apellido_paterno ?? ''}`.trim() || user.correo_electronico || 'Sin nombre',
        ] as const),
      ),
    [users],
  );

  const userChoices = useMemo(
    () =>
      users.map((user) => ({
        id: user.id,
        label:
          `${user.nombres ?? ''} ${user.apellido_paterno ?? ''}`.trim() ||
          user.correo_electronico ||
          'Sin nombre',
      })),
    [users],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [leadDateFromFilter, leadDateToFilter, search, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  async function handleCreateLead(payload: Omit<CreateLeadPayload, 'creado_por_id'>): Promise<string | null> {
    if (!userId) {
      return 'No hay una sesion valida para asociar el creador.';
    }

    try {
      await addLeadLead({
        ...payload,
        creado_por_id: userId,
      });
      toast.success('El registro lead se creo con éxito.');
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No fue posible crear el registro lead.';
    }
  }

  async function handleEditLead(leadId: number, payload: UpdateLeadPayload): Promise<string | null> {
    try {
      await editLeadLead(leadId, payload);
      toast.success('El registro lead se actualizo con éxito.');
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No fue posible actualizar el registro lead.';
    }
  }

  async function handleDeleteLead(leadId: number): Promise<string | null> {
    try {
      await removeLeadLead(leadId);
      toast.success('El registro lead se elimino con éxito.');
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No fue posible eliminar el registro lead.';
    }
  }

  function handleDownloadFilteredLeads() {
    downloadLeadLeadsAsExcel(
      filteredLeads,
      filteredLeads.map((lead) =>
        lead.ubicacion_propiedad?.trim()
        || (lead.propiedad_id != null ? propertyAddressById.get(lead.propiedad_id) : '')
        || 'Sin ubicacion',
      ),
      filteredLeads.map((lead) =>
        lead.vendedor_asignado
          ? `${lead.vendedor_asignado.nombres ?? ''} ${lead.vendedor_asignado.apellido_paterno ?? ''}`.trim() || 'Sin asignar'
          : lead.vendedor_asignado_id
            ? userNameById.get(lead.vendedor_asignado_id) ?? 'Sin asignar'
            : 'Sin asignar',
      ),
    );
  }

  async function handleQuickLeadChange(leadId: number, field: 'estado' | 'prioridad', value: string) {
    const targetLead = leads.find((lead) => lead.id === leadId);
    if (!targetLead || targetLead[field] === value) return;

    const previousValue = targetLead[field];
    const previousLeads = leads;
    setUpdatingLeadId(leadId);
    useLeadLeadsStore.setState({
      leads: previousLeads.map((lead) => (lead.id === leadId ? { ...lead, [field]: value } : lead)),
    });

    try {
      await editLeadLead(leadId, { [field]: value });
      toast.success(`El ${field === 'estado' ? 'estatus' : 'prioridad'} del lead se actualizo.`);
    } catch {
      useLeadLeadsStore.setState({
        leads: previousLeads.map((lead) => (lead.id === leadId ? { ...lead, [field]: previousValue } : lead)),
      });
      toast.error('No fue posible actualizar el registro lead.');
    } finally {
      setUpdatingLeadId(null);
    }
  }

  return {
    isLoading,
    search,
    statusFilter,
    leadDateFromFilter,
    leadDateToFilter,
    updatingLeadId,
    isCreateModalOpen,
    editingLead,
    deletingLead,
    currentPage,
    statusOptions,
    propertyAddressById,
    filteredLeads,
    paginatedLeads,
    totalPages,
    userNameById,
    userChoices,
    setSearch,
    setStatusFilter,
    setLeadDateFromFilter,
    setLeadDateToFilter,
    setIsCreateModalOpen,
    setEditingLead,
    setDeletingLead,
    setCurrentPage,
    handleCreateLead,
    handleEditLead,
    handleDeleteLead,
    handleDownloadFilteredLeads,
    handleQuickLeadChange,
  };
}
