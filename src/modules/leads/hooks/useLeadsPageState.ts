import { useEffect, useMemo, useState } from 'react';
import type { CreateLeadPayload, LeadRecord, UpdateLeadPayload } from '@/interfaces/lead.interface';
import type { DevelopmentRecord } from '@/interfaces/development.interface';
import type { PropertyRecord } from '@/interfaces/property.interface';
import type { UserRecord } from '@/interfaces/user.interface';
import toast from 'react-hot-toast';
import { getReadableErrorMessage } from '@/shared/utils/errorMessages';
import { getDevelopments } from '../../developments/services/developments.api';
import { getProperties } from '../../properties/services/properties.api';
import { getUsers } from '../../users/services/users.api';
import { formatDireccion } from '../../properties/utils/formatters';
import { useLeadsStore } from '../store/useLeadsStore';
import { ALL_PROPERTIES, ALL_STATES, PAGE_SIZE } from '../utils/leads.constants';
import { downloadLeadsAsExcel, formatPhone, getComparableDate } from '../utils/leads.utils';

type UseLeadsPageStateParams = {
  userId?: number | null;
  accessToken?: string | null;
  canSeeInterno?: boolean;
};

export function useLeadsPageState({ userId, accessToken, canSeeInterno = false }: UseLeadsPageStateParams) {
  const { leads, isLoading, fetchLeads, addLead, editLead, removeLead } = useLeadsStore();
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [developments, setDevelopments] = useState<DevelopmentRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState('');
  const [responsibleSearch, setResponsibleSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL_STATES);
  const [propertyFilter, setPropertyFilter] = useState(ALL_PROPERTIES);
  const [appointmentDateFromFilter, setAppointmentDateFromFilter] = useState('');
  const [appointmentDateToFilter, setAppointmentDateToFilter] = useState('');
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

    Promise.allSettled([
      getProperties(),
      getDevelopments(),
      accessToken ? getUsers(accessToken) : Promise.resolve([]),
    ]).then((results) => {
      if (!active) return;

      const [propertiesResult, developmentsResult, usersResult] = results;

      setProperties(propertiesResult.status === 'fulfilled' ? propertiesResult.value : []);
      setDevelopments(developmentsResult.status === 'fulfilled' ? developmentsResult.value : []);
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

  const propertyTitleById = useMemo(
    () =>
      new Map(
        properties.map((property) => [property.id, property.titulo?.trim() || 'Sin titulo'] as const),
      ),
    [properties],
  );

  const propertyAddressById = useMemo(
    () =>
      new Map(
        properties.map((property) => [property.id, formatDireccion(property.direccion)] as const),
      ),
    [properties],
  );

  const developmentTitleById = useMemo(
    () =>
      new Map(
        developments.map((development) => [development.id, development.titulo?.trim() || 'Sin titulo'] as const),
      ),
    [developments],
  );

  const targetTitleByLeadId = useMemo(() => {
    const titleMap = new Map<number, string>();

    leads.forEach((lead) => {
      if (lead.propiedad_id != null) {
        titleMap.set(lead.id, propertyTitleById.get(lead.propiedad_id) ?? 'Sin titulo');
        return;
      }

      if (lead.desarrollo_id != null) {
        titleMap.set(lead.id, developmentTitleById.get(lead.desarrollo_id) ?? 'Sin titulo');
        return;
      }

      titleMap.set(lead.id, 'Sin referencia');
    });

    return titleMap;
  }, [developmentTitleById, leads, propertyTitleById]);

  const propertyFilterOptions = useMemo(
    () => [
      ALL_PROPERTIES,
      ...Array.from(
        new Set([
          ...properties.map((property) => property.titulo?.trim() || 'Sin titulo'),
          ...developments.map((development) => development.titulo?.trim() || 'Sin titulo'),
        ]),
      ),
    ],
    [developments, properties],
  );

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    const responsibleQuery = responsibleSearch.trim().toLowerCase();

    return leads.filter((lead) => {
      const fullName = `${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim().toLowerCase();
      const phone = formatPhone(lead.lada, lead.telefono).toLowerCase();
      const responsibleName = `${lead.creador?.nombres ?? ''} ${lead.creador?.apellido_paterno ?? ''}`.trim().toLowerCase();
      const targetTitle = targetTitleByLeadId.get(lead.id) ?? 'Sin referencia';
      const appointmentDate = getComparableDate(lead.fecha_cita);

      const matchesSearch =
        query.length === 0 || fullName.includes(query) || phone.includes(query);
      const matchesResponsible =
        responsibleQuery.length === 0 || responsibleName.includes(responsibleQuery);
      const matchesStatus = statusFilter === ALL_STATES || (lead.estado ?? '').trim() === statusFilter;
      const matchesProperty = propertyFilter === ALL_PROPERTIES || targetTitle === propertyFilter;
      const matchesAppointmentDateFrom =
        appointmentDateFromFilter.length === 0 ||
        (appointmentDate.length > 0 && appointmentDate >= appointmentDateFromFilter);
      const matchesAppointmentDateTo =
        appointmentDateToFilter.length === 0 ||
        (appointmentDate.length > 0 && appointmentDate <= appointmentDateToFilter);

      return (
        matchesSearch &&
        matchesResponsible &&
        matchesStatus &&
        matchesProperty &&
        matchesAppointmentDateFrom &&
        matchesAppointmentDateTo
      );
    }).sort((a, b) => {
      const aCancel = (a.estado ?? '').trim().toLowerCase() === 'cancelado';
      const bCancel = (b.estado ?? '').trim().toLowerCase() === 'cancelado';
      if (aCancel === bCancel) return 0;
      return aCancel ? 1 : -1;
    });
  }, [
    appointmentDateFromFilter,
    appointmentDateToFilter,
    leads,
    propertyFilter,
    targetTitleByLeadId,
    responsibleSearch,
    search,
    statusFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLeads.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredLeads]);

  const availableProperties = useMemo(() => {
    return properties
      .filter((property) => {
        const estatus = (property.estatus ?? '').trim().toLowerCase();
        if (estatus === 'disponible') return true;
        if (estatus === 'interno' && canSeeInterno) return true;
        return false;
      });
  }, [properties, canSeeInterno]);

  const availableDevelopments = useMemo(
    () =>
      developments.filter(
        (development) => (development.estatus ?? '').trim().toLowerCase() === 'disponible',
      ),
    [developments],
  );

  const propertyChoices = useMemo(
    () =>
      availableProperties
        .map((property) => ({
          id: property.id,
          label: property.titulo?.trim() || 'Sin titulo',
        }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es')),
    [availableProperties],
  );

  const developmentChoices = useMemo(
    () =>
      availableDevelopments
        .map((development) => ({
          id: development.id,
          label: development.titulo?.trim() || 'Sin titulo',
        }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es')),
    [availableDevelopments],
  );

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
  }, [appointmentDateFromFilter, appointmentDateToFilter, propertyFilter, responsibleSearch, search, statusFilter]);

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
      toast.success('El registro se creo con exito.');
      return null;
    } catch (error) {
      return getReadableErrorMessage(
        error,
        'No fue posible crear el registro. Revisa cliente, propiedad o desarrollo, estado y fecha de cita.',
      );
    }
  }

  async function handleEditLead(leadId: number, payload: UpdateLeadPayload): Promise<string | null> {
    try {
      await editLead(leadId, payload);
      toast.success('El registro se actualizo con exito.');
      return null;
    } catch (error) {
      return getReadableErrorMessage(
        error,
        'No fue posible actualizar el registro. Revisa la información modificada.',
      );
    }
  }

  async function handleDeleteLead(leadId: number): Promise<string | null> {
    try {
      await removeLead(leadId);
      toast.success('El registro se elimino con exito.');
      return null;
    } catch (error) {
      return getReadableErrorMessage(
        error,
        'No fue posible eliminar el registro.',
      );
    }
  }

  function handleDownloadFilteredLeads() {
    downloadLeadsAsExcel(
      filteredLeads,
      filteredLeads.map((lead) => targetTitleByLeadId.get(lead.id) ?? 'Sin referencia'),
    );
  }

  async function handleQuickLeadChange(leadId: number, field: 'estado', value: string) {
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
      toast.success('El estado del registro se actualizo.');
    } catch (error) {
      useLeadsStore.setState({
        leads: previousLeads.map((lead) => (lead.id === leadId ? { ...lead, [field]: previousValue } : lead)),
      });
      toast.error(
        getReadableErrorMessage(
          error,
          'No fue posible actualizar el registro.',
        ),
      );
    } finally {
      setUpdatingLeadId(null);
    }
  }

  return {
    leads,
    isLoading,
    search,
    responsibleSearch,
    statusFilter,
    propertyFilter,
    appointmentDateFromFilter,
    appointmentDateToFilter,
    updatingLeadId,
    isCreateModalOpen,
    editingLead,
    deletingLead,
    currentPage,
    statusOptions,
    propertyTitleById,
    targetTitleByLeadId,
    propertyAddressById,
    propertyFilterOptions,
    filteredLeads,
    paginatedLeads,
    totalPages,
    propertyChoices,
    developmentChoices,
    userNameById,
    userChoices,
    setSearch,
    setResponsibleSearch,
    setStatusFilter,
    setPropertyFilter,
    setAppointmentDateFromFilter,
    setAppointmentDateToFilter,
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
