import { useEffect, useMemo, useState } from 'react';
import type { CreateLeadPayload, LeadRecord, UpdateLeadPayload } from '@/interfaces/lead.interface';
import type { PropertyRecord } from '@/interfaces/property.interface';
import type { RecordsReadScope } from '@/shared/auth/permissions/permissions.util';
import toast from 'react-hot-toast';
import { getProperties } from '../../properties/services/properties.api';
import { useLeadsStore } from '../store/useLeadsStore';
import { ALL_PROPERTIES, ALL_PRIORITIES, ALL_STATES, PAGE_SIZE } from '../utils/leads.constants';
import {
  downloadLeadsAsExcel,
  formatPhone,
  getComparableDate,
  normalizePriority,
} from '../utils/leads.utils';

type UseLeadsPageStateParams = {
  recordsReadScope?: RecordsReadScope;
  userId?: number | null;
};

export function useLeadsPageState({ recordsReadScope = 'all', userId }: UseLeadsPageStateParams) {
  const { leads, isLoading, fetchLeads, addLead, editLead, removeLead } = useLeadsStore();
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL_STATES);
  const [priorityFilter, setPriorityFilter] = useState(ALL_PRIORITIES);
  const [propertyFilter, setPropertyFilter] = useState(ALL_PROPERTIES);
  const [appointmentDateFilter, setAppointmentDateFilter] = useState('');
  const [updatingLeadId, setUpdatingLeadId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadRecord | null>(null);
  const [deletingLead, setDeletingLead] = useState<LeadRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    void fetchLeads();
  }, [fetchLeads]);

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
      recordsReadScope === 'own' && userId
        ? leads.filter((lead) => lead.creador?.id === userId)
        : leads;

    return visibleLeads.filter((lead) => {
      const fullName = `${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim().toLowerCase();
      const email = (lead.correo_electronico ?? '').toLowerCase();
      const phone = formatPhone(lead.lada, lead.telefono).toLowerCase();
      const priority = normalizePriority(lead.prioridad ?? '');
      const propertyTitle = propertyTitleById.get(lead.propiedad_id) ?? 'Sin titulo';
      const appointmentDate = getComparableDate(lead.fecha_cita);

      const matchesSearch =
        query.length === 0 || fullName.includes(query) || email.includes(query) || phone.includes(query);
      const matchesStatus = statusFilter === ALL_STATES || (lead.estado ?? '').trim() === statusFilter;
      const matchesPriority =
        priorityFilter === ALL_PRIORITIES || priority === normalizePriority(priorityFilter);
      const matchesProperty = propertyFilter === ALL_PROPERTIES || propertyTitle === propertyFilter;
      const matchesAppointmentDate =
        appointmentDateFilter.length === 0 || appointmentDate === appointmentDateFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesProperty && matchesAppointmentDate;
    });
  }, [appointmentDateFilter, leads, propertyFilter, propertyTitleById, priorityFilter, recordsReadScope, search, statusFilter, userId]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLeads.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredLeads]);

  const propertyChoices = useMemo(
    () =>
      properties.map((property) => ({
        id: property.id,
        label: property.titulo?.trim() || 'Sin titulo',
      })),
    [properties],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [appointmentDateFilter, propertyFilter, priorityFilter, search, statusFilter]);

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
      await addLead({
        ...payload,
        creado_por_id: userId,
      });
      toast.success('El registro se creó con éxito.');
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No fue posible crear el registro.';
    }
  }

  async function handleEditLead(leadId: number, payload: UpdateLeadPayload): Promise<string | null> {
    try {
      await editLead(leadId, payload);
      toast.success('El registro se actualizó con éxito.');
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No fue posible actualizar el registro.';
    }
  }

  async function handleDeleteLead(leadId: number): Promise<string | null> {
    try {
      await removeLead(leadId);
      toast.success('El registro se eliminó con éxito.');
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No fue posible eliminar el registro.';
    }
  }

  function handleDownloadFilteredLeads() {
    downloadLeadsAsExcel(
      filteredLeads,
      filteredLeads.map((lead) => propertyTitleById.get(lead.propiedad_id) ?? 'Sin titulo'),
    );
  }

  async function handleQuickLeadChange(leadId: number, field: 'estado' | 'prioridad', value: string) {
    const targetLead = leads.find((lead) => lead.id === leadId);
    if (!targetLead || targetLead[field] === value) return;

    const previousValue = targetLead[field];
    const previousLeads = leads;
    setUpdatingLeadId(leadId);
    useLeadsStore.setState({
      leads: previousLeads.map((lead) => (lead.id === leadId ? { ...lead, [field]: value } : lead)),
    });

    try {
      await editLead(leadId, { [field]: value });
      toast.success(`El ${field === 'estado' ? 'estado' : 'prioridad'} del registro se actualizó.`);
    } catch {
      useLeadsStore.setState({
        leads: previousLeads.map((lead) => (lead.id === leadId ? { ...lead, [field]: previousValue } : lead)),
      });
      toast.error('No fue posible actualizar el registro.');
    } finally {
      setUpdatingLeadId(null);
    }
  }

  return {
    leads,
    isLoading,
    search,
    statusFilter,
    priorityFilter,
    propertyFilter,
    appointmentDateFilter,
    updatingLeadId,
    isCreateModalOpen,
    editingLead,
    deletingLead,
    currentPage,
    statusOptions,
    propertyTitleById,
    propertyFilterOptions,
    filteredLeads,
    paginatedLeads,
    totalPages,
    propertyChoices,
    setSearch,
    setStatusFilter,
    setPriorityFilter,
    setPropertyFilter,
    setAppointmentDateFilter,
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
