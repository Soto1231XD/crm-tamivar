import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { LeadRecord } from '@/interfaces/lead.interface';
import { getReadableErrorMessage } from '@/shared/utils/errorMessages';
import { downloadLeadExternoAsExcel } from '@/modules/leads/utils/leads.utils';
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
  myLeadsOnly?: boolean;
  etiquetaFilter?: number | null;
};

export function useAsesorExternoPageState({ userId, myLeadsOnly = false, etiquetaFilter = null }: Params) {
  const { leads, isLoading, fetchLeads, addLead, editLead, removeLead } =
    useAsesorExternoStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL_STATES);
  const [asesorFilter, setAsesorFilter] = useState(ALL_STATES);
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

  const asesorOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const lead of leads) {
      if (!lead.creado_por) continue;
      const id = String(lead.creado_por.id);
      if (!seen.has(id)) {
        const cp = lead.creado_por;
        const nombre = `${cp.nombres ?? ''} ${cp.apellido_paterno ?? ''}`.trim() || 'Sin nombre';
        seen.set(id, nombre);
      }
    }
    return [
      { value: ALL_STATES, label: 'Todos los asesores' },
      ...Array.from(seen.entries()).map(([value, label]) => ({ value, label })),
    ];
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
        const matchesAsesor =
          asesorFilter === ALL_STATES ||
          String(lead.creado_por?.id ?? '') === asesorFilter;
        const matchesMyLeads =
          !myLeadsOnly || lead.creado_por?.id === userId;
        const matchesEtiqueta =
          etiquetaFilter == null || (lead.etiquetas ?? []).some((j) => j.etiqueta.id === etiquetaFilter);
        return matchesSearch && matchesStatus && matchesAsesor && matchesMyLeads && matchesEtiqueta;
      })
      .sort(
        (a, b) =>
          new Date(b.creado_en ?? 0).getTime() -
          new Date(a.creado_en ?? 0).getTime(),
      );
  }, [leads, search, statusFilter, asesorFilter, myLeadsOnly, userId, etiquetaFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLeads.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredLeads]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, asesorFilter, myLeadsOnly, etiquetaFilter]);

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

  function handleDownload() {
    downloadLeadExternoAsExcel(filteredLeads);
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
    asesorFilter,
    asesorOptions,
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
    setAsesorFilter,
    setIsCreateModalOpen,
    setEditingLead,
    setDeletingLead,
    setCurrentPage,
    handleCreate,
    handleEdit,
    handleDelete,
    handleDownload,
    handleQuickStatusChange,
  };
}
