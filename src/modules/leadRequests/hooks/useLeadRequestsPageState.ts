import { useEffect, useMemo, useState } from 'react';
import type {
  CreateLeadRequestPayload,
  LeadRequestRecord,
  UpdateLeadRequestPayload,
} from '@/interfaces/lead-request.interface';
import toast from 'react-hot-toast';
import { ALL_STATES, PAGE_SIZE } from '@/modules/leads/utils/leads.constants';
import { useLeadRequestsStore } from '../store/useLeadRequestsStore';
import {
  downloadLeadRequestsAsExcel,
  getComparableLeadRequestDate,
} from '../utils/leadRequests.utils';

type UseLeadRequestsPageStateParams = {
  userId?: number | null;
};

export function useLeadRequestsPageState({ userId }: UseLeadRequestsPageStateParams) {
  const { leadRequests, isLoading, fetchLeadRequests, addLeadRequest, editLeadRequest, removeLeadRequest } =
    useLeadRequestsStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL_STATES);
  const [leadDateFromFilter, setLeadDateFromFilter] = useState('');
  const [leadDateToFilter, setLeadDateToFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLeadRequest, setEditingLeadRequest] = useState<LeadRequestRecord | null>(null);
  const [deletingLeadRequest, setDeletingLeadRequest] = useState<LeadRequestRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    void fetchLeadRequests();
  }, [fetchLeadRequests]);

  const statusOptions = useMemo(() => {
    const values = new Set<string>();
    leadRequests.forEach((leadRequest) => {
      const value = (leadRequest.estado ?? '').trim();
      if (value) values.add(value);
    });
    return [ALL_STATES, ...Array.from(values)];
  }, [leadRequests]);

  const filteredLeadRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leadRequests.filter((leadRequest) => {
      const fullName = (leadRequest.nombre ?? '').trim().toLowerCase();
      const phone = String(leadRequest.telefono ?? '').toLowerCase();
      const leadDate = getComparableLeadRequestDate(leadRequest.fecha_alta);

      const matchesSearch = query.length === 0 || fullName.includes(query) || phone.includes(query);
      const matchesStatus = statusFilter === ALL_STATES || (leadRequest.estado ?? '').trim() === statusFilter;
      const matchesLeadDateFrom = leadDateFromFilter.length === 0 || (leadDate.length > 0 && leadDate >= leadDateFromFilter);
      const matchesLeadDateTo = leadDateToFilter.length === 0 || (leadDate.length > 0 && leadDate <= leadDateToFilter);

      return matchesSearch && matchesStatus && matchesLeadDateFrom && matchesLeadDateTo;
    });
  }, [leadDateFromFilter, leadDateToFilter, leadRequests, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLeadRequests.length / PAGE_SIZE));

  const paginatedLeadRequests = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLeadRequests.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredLeadRequests]);

  useEffect(() => {
    setCurrentPage(1);
  }, [leadDateFromFilter, leadDateToFilter, search, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  async function handleCreateLeadRequest(
    payload: Omit<CreateLeadRequestPayload, 'creado_por_id'>,
  ): Promise<string | null> {
    if (!userId) {
      return 'No hay una sesión valida para asociar el creador.';
    }

    try {
      await addLeadRequest({
        ...payload,
        creado_por_id: userId,
      });
      toast.success('La solicitud de lead se creo con éxito.');
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No fue posible crear la solicitud de lead.';
    }
  }

  async function handleEditLeadRequest(
    leadRequestId: number,
    payload: UpdateLeadRequestPayload,
  ): Promise<string | null> {
    try {
      await editLeadRequest(leadRequestId, payload);
      toast.success('La solicitud de lead se actualizo con éxito.');
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No fue posible actualizar la solicitud de lead.';
    }
  }

  async function handleDeleteLeadRequest(leadRequestId: number): Promise<string | null> {
    try {
      await removeLeadRequest(leadRequestId);
      toast.success('La solicitud de lead se elimino con éxito.');
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No fue posible eliminar la solicitud de lead.';
    }
  }

  function handleDownloadFilteredLeadRequests() {
    downloadLeadRequestsAsExcel(filteredLeadRequests);
  }

  return {
    isLoading,
    search,
    statusFilter,
    leadDateFromFilter,
    leadDateToFilter,
    isCreateModalOpen,
    editingLeadRequest,
    deletingLeadRequest,
    currentPage,
    statusOptions,
    filteredLeadRequests,
    paginatedLeadRequests,
    totalPages,
    setSearch,
    setStatusFilter,
    setLeadDateFromFilter,
    setLeadDateToFilter,
    setIsCreateModalOpen,
    setEditingLeadRequest,
    setDeletingLeadRequest,
    setCurrentPage,
    handleCreateLeadRequest,
    handleEditLeadRequest,
    handleDeleteLeadRequest,
    handleDownloadFilteredLeadRequests,
  };
}
