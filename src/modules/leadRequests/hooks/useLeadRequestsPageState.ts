import { useEffect, useMemo, useState } from 'react';
import type {
  CreateLeadRequestPayload,
  LeadRequestRecord,
  UpdateLeadRequestPayload,
} from '@/interfaces/lead-request.interface';
import toast from 'react-hot-toast';
import { getReadableErrorMessage } from '@/shared/utils/errorMessages';
import { ALL_STATES, PAGE_SIZE } from '@/modules/leads/utils/leads.constants';
import { getLeadRequestSellerOptions } from '@/modules/users/services/users.api';
import type { UserRecord } from '@/interfaces/user.interface';
import { useLeadRequestsStore } from '../store/useLeadRequestsStore';
import { LEAD_REQUEST_STATUS_OPTIONS } from '../components/leadRequests.shared';
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
  const [sellerOptions, setSellerOptions] = useState<UserRecord[]>([]);
  const [updatingLeadRequestId, setUpdatingLeadRequestId] = useState<number | null>(null);

  useEffect(() => {
    void fetchLeadRequests();
  }, [fetchLeadRequests]);

  useEffect(() => {
    getLeadRequestSellerOptions()
      .then(setSellerOptions)
      .catch(() => setSellerOptions([]));
  }, []);

  const statusOptions = useMemo(() => {
    const values = new Set<string>();
    leadRequests.forEach((leadRequest) => {
      const value = (leadRequest.estado ?? '').trim();
      if (value) values.add(value);
    });

    const orderedStatuses = LEAD_REQUEST_STATUS_OPTIONS.filter((status) => values.has(status));
    const extraStatuses = Array.from(values)
      .filter((status) => !LEAD_REQUEST_STATUS_OPTIONS.includes(status as (typeof LEAD_REQUEST_STATUS_OPTIONS)[number]))
      .sort((left, right) => left.localeCompare(right));

    return [ALL_STATES, ...orderedStatuses, ...extraStatuses];
  }, [leadRequests]);

  const filteredLeadRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leadRequests
      .filter((leadRequest) => {
        const fullName = (leadRequest.nombre ?? '').trim().toLowerCase();
        const phone = String(leadRequest.telefono ?? '').toLowerCase();
        const leadDate = getComparableLeadRequestDate(leadRequest.fecha_alta);

        const matchesSearch = query.length === 0 || fullName.includes(query) || phone.includes(query);
        const matchesStatus = statusFilter === ALL_STATES || (leadRequest.estado ?? '').trim() === statusFilter;
        const matchesLeadDateFrom = leadDateFromFilter.length === 0 || (leadDate.length > 0 && leadDate >= leadDateFromFilter);
        const matchesLeadDateTo = leadDateToFilter.length === 0 || (leadDate.length > 0 && leadDate <= leadDateToFilter);

        return matchesSearch && matchesStatus && matchesLeadDateFrom && matchesLeadDateTo;
      })
      .sort((left, right) => {
        const leftBudget = left.presupuesto == null || Number.isNaN(Number(left.presupuesto)) ? Number.NEGATIVE_INFINITY : Number(left.presupuesto);
        const rightBudget =
          right.presupuesto == null || Number.isNaN(Number(right.presupuesto)) ? Number.NEGATIVE_INFINITY : Number(right.presupuesto);

        if (rightBudget !== leftBudget) {
          return rightBudget - leftBudget;
        }

        return getComparableLeadRequestDate(right.fecha_alta).localeCompare(getComparableLeadRequestDate(left.fecha_alta));
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
      return getReadableErrorMessage(
        error,
        'No fue posible crear la solicitud de lead. Revisa los campos obligatorios y vuelve a intentarlo.',
      );
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
      return getReadableErrorMessage(
        error,
        'No fue posible actualizar la solicitud de lead. Revisa la información modificada y vuelve a intentarlo.',
      );
    }
  }

  async function handleDeleteLeadRequest(leadRequestId: number): Promise<string | null> {
    try {
      await removeLeadRequest(leadRequestId);
      toast.success('La solicitud de lead se elimino con éxito.');
      return null;
    } catch (error) {
      return getReadableErrorMessage(
        error,
        'No fue posible eliminar la solicitud de lead.',
      );
    }
  }

  function handleDownloadFilteredLeadRequests() {
    downloadLeadRequestsAsExcel(filteredLeadRequests);
  }

  const sellerChoices = useMemo(
    () =>
      sellerOptions.map((user) => ({
        id: user.id,
        label: [user.nombres, user.apellido_paterno, user.apellido_materno].filter(Boolean).join(' ').trim() || `Usuario ${user.id}`,
      })),
    [sellerOptions],
  );

  async function handleQuickUpdateLeadRequest(
    leadRequestId: number,
    payload: UpdateLeadRequestPayload,
  ): Promise<void> {
    try {
      setUpdatingLeadRequestId(leadRequestId);
      await editLeadRequest(leadRequestId, payload);
      toast.success('La solicitud se actualizó con éxito.');
    } catch (error) {
      toast.error(
        getReadableErrorMessage(
          error,
          'No fue posible actualizar la solicitud.',
        ),
      );
    } finally {
      setUpdatingLeadRequestId(null);
    }
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
    sellerChoices,
    updatingLeadRequestId,
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
    handleQuickUpdateLeadRequest,
    handleDownloadFilteredLeadRequests,
  };
}
