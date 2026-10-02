import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { LeadRecord } from '@/interfaces/lead.interface';
import { getReadableErrorMessage } from '@/shared/utils/errorMessages';
import { useAsesorExternoStore } from '../store/useAsesorExternoStore';
import { updateAsesorExternoLead } from '../services/asesorExterno.api';
import type {
  CreateAsesorExternoPayload,
  UpdateAsesorExternoPayload,
} from '../services/asesorExterno.api';

const PAGE_SIZE = 10;
const ALL_STATES = 'Todos';

type Params = {
  userId?: number | null;
};

export function useAsesorExternoPageState({ userId }: Params) {
  const { leads, isLoading, fetchLeads, addLead, editLead, removeLead } =
    useAsesorExternoStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL_STATES);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadRecord | null>(null);
  const [deletingLead, setDeletingLead] = useState<LeadRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingLeadId, setUpdatingLeadId] = useState<number | null>(null);

  useEffect(() => {
    void fetchLeads();
  }, [fetchLeads]);

  const statusOptions = useMemo(() => {
    const values = new Set<string>();
    leads.forEach((lead) => {
      const val = (lead.estado ?? '').trim();
      if (val) values.add(val);
    });
    return [ALL_STATES, ...Array.from(values)];
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads
      .filter((lead) => {
        const fullName = `${lead.nombres ?? ''} ${lead.apellidos ?? ''}`
          .trim()
          .toLowerCase();
        const matchesSearch = query.length === 0 || fullName.includes(query);
        const matchesStatus =
          statusFilter === ALL_STATES ||
          (lead.estado ?? '').trim() === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort(
        (a, b) =>
          new Date(b.creado_en ?? 0).getTime() -
          new Date(a.creado_en ?? 0).getTime(),
      );
  }, [leads, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLeads.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredLeads]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  async function handleCreate(
    payload: Omit<CreateAsesorExternoPayload, 'creado_por_id'>,
  ): Promise<string | null> {
    if (!userId) return 'No hay sesión válida.';
    try {
      await addLead({ ...payload, creado_por_id: userId });
      toast.success('Lead externo creado con éxito.');
      return null;
    } catch (error) {
      return getReadableErrorMessage(
        error,
        'No fue posible crear el lead externo.',
      );
    }
  }

  async function handleEdit(
    leadId: number,
    payload: UpdateAsesorExternoPayload,
  ): Promise<string | null> {
    try {
      await editLead(leadId, payload);
      toast.success('Lead externo actualizado.');
      return null;
    } catch (error) {
      return getReadableErrorMessage(
        error,
        'No fue posible actualizar el lead externo.',
      );
    }
  }

  async function handleDelete(leadId: number): Promise<string | null> {
    try {
      await removeLead(leadId);
      toast.success('Lead externo eliminado.');
      return null;
    } catch (error) {
      return getReadableErrorMessage(
        error,
        'No fue posible eliminar el lead externo.',
      );
    }
  }

  async function handleQuickStatusChange(leadId: number, value: string) {
    const current = leads.find((l) => l.id === leadId);
    if (!current || current.estado === value) return;

    const previousLeads = leads;
    setUpdatingLeadId(leadId);
    useAsesorExternoStore.setState({
      leads: previousLeads.map((l) =>
        l.id === leadId ? { ...l, estado: value } : l,
      ),
    });

    try {
      const updated = await updateAsesorExternoLead(leadId, { estado: value });
      useAsesorExternoStore.setState((state) => ({
        leads: state.leads.map((l) => (l.id === leadId ? updated : l)),
      }));
      toast.success('Estatus actualizado.');
    } catch (error) {
      useAsesorExternoStore.setState({ leads: previousLeads });
      toast.error(
        getReadableErrorMessage(
          error,
          'No fue posible actualizar el estatus.',
        ),
      );
    } finally {
      setUpdatingLeadId(null);
    }
  }

  return {
    isLoading,
    search,
    statusFilter,
    isCreateModalOpen,
    editingLead,
    deletingLead,
    currentPage,
    updatingLeadId,
    statusOptions,
    filteredLeads,
    paginatedLeads,
    totalPages,
    PAGE_SIZE,
    setSearch,
    setStatusFilter,
    setIsCreateModalOpen,
    setEditingLead,
    setDeletingLead,
    setCurrentPage,
    handleCreate,
    handleEdit,
    handleDelete,
    handleQuickStatusChange,
  };
}
