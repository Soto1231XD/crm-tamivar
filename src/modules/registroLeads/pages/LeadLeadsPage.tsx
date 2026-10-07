import { useEffect, useState } from 'react';
import agregarIcon from '../../../assets/images/Agregar.png';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useHasPermission } from '@/shared/auth/permissions/useHasPermission';
import { extractUserRoles, normalizeRoleName } from '@/shared/auth/role.utils';
import { TablePagination } from '../../../shared/components/TablePagination';
import { LeadLeadsFilters } from '../components/LeadLeadsFilters';
import { LeadLeadsTable } from '../components/LeadLeadsTable';
import { CreateLeadLeadModal } from '../components/CreateLeadLeadModal';
import { EditLeadLeadModal } from '../components/EditLeadLeadModal';
import { DeleteLeadConfirmModal } from '../../leads/components/DeleteLeadConfirmModal';
import { useLeadLeadsPageState } from '../hooks/useLeadLeadsPageState';
import { PAGE_SIZE } from '../../leads/utils/leads.constants';
import { useEtiquetasStore } from '@/modules/etiquetas/store/useEtiquetasStore';
import { assignEtiquetaToRegistroLead, removeEtiquetaFromRegistroLead } from '@/modules/etiquetas/services/etiquetas.api';
import type { Etiqueta, LeadRecord } from '@/interfaces/lead.interface';
import { useLeadLeadsStore } from '../store/useLeadLeadsStore';
import { EtiquetaAsignacionModal } from '@/modules/etiquetas/components/EtiquetaAsignacionModal';
import { GestionarEtiquetasModal } from '@/modules/etiquetas/components/GestionarEtiquetasModal';

export function LeadLeadsPage() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.token);
  const { can, isSuperAdmin, isAdmin } = useHasPermission();
  const userRoles = extractUserRoles(user ?? { rol: null, roles: [] });
  const isSalesAdvisor = userRoles.some(
    (role) => normalizeRoleName(role) === 'asesor de ventas',
  );
  const showTabs = userRoles.some((role) =>
    ['super administrador', 'administrador', 'coordinador de ventas'].includes(
      normalizeRoleName(role),
    ),
  );

  const canCreate = can('registros_leads', 'crear');
  const canEdit = can('registros_leads', 'actualizar');
  const [activeTab, setActiveTab] = useState<'todos' | 'mis_leads'>('todos');
  const canDelete = (isSuperAdmin || isAdmin) && can('registros_leads', 'eliminar');

  const { etiquetas, fetchEtiquetas } = useEtiquetasStore();

  const etiquetasScope: 'personal' = 'personal';

  useEffect(() => {
    void fetchEtiquetas('personal');
    setEtiquetaFilter(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [managingEtiquetasLead, setManagingEtiquetasLead] = useState<LeadRecord | null>(null);
  const [etiquetaFilter, setEtiquetaFilter] = useState<number | null>(null);
  const [isGestionarOpen, setIsGestionarOpen] = useState(false);

  // Always a Set — empty while loading, scoped IDs once loaded.
  // Never null, so asesor chips never flash through during the fetch.
  const visibleEtiquetaIds = new Set(etiquetas.map((e) => e.id));


  async function handleToggleEtiqueta(lead: LeadRecord, etiqueta: Etiqueta, assigned: boolean) {
    if (lead.vendedor_asignado_id !== user?.id) return;
    try {
      if (assigned) {
        await removeEtiquetaFromRegistroLead(lead.id, etiqueta.id);
        const updatedEtiquetas = (lead.etiquetas ?? []).filter((j) => j.etiqueta.id !== etiqueta.id);
        const updatedLead = { ...lead, etiquetas: updatedEtiquetas };
        useLeadLeadsStore.setState((s) => ({
          leads: s.leads.map((l) => l.id === lead.id ? updatedLead : l),
        }));
        setManagingEtiquetasLead((prev) => prev?.id === lead.id ? updatedLead : prev);
      } else {
        await assignEtiquetaToRegistroLead(lead.id, etiqueta.id);
        const updatedEtiquetas = [...(lead.etiquetas ?? []), { etiqueta }];
        const updatedLead = { ...lead, etiquetas: updatedEtiquetas };
        useLeadLeadsStore.setState((s) => ({
          leads: s.leads.map((l) => l.id === lead.id ? updatedLead : l),
        }));
        setManagingEtiquetasLead((prev) => prev?.id === lead.id ? updatedLead : prev);
      }
    } catch {
      toast.error('No se pudo actualizar la etiqueta.');
    }
  }
  const canQuickEditStatus = canEdit;
  const canQuickEditComments = canEdit;
  const canQuickEditPriority = canEdit;
  const canQuickEditAssignedSeller = canEdit;

  const {
    isLoading,
    search,
    statusFilter,
    sellerFilter,
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
    setSellerFilter,
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
  } = useLeadLeadsPageState({
    userId: user?.id,
    accessToken,
    restrictToUserId: isSalesAdvisor ? (user?.id ?? null) : null,
    myLeadsOnly: activeTab === 'mis_leads',
    etiquetaFilter,
  });

  return (
    <div className="min-w-0 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Prospección comercial</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-[2rem]">Leads redes sociales</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Da seguimiento a los leads con contexto comercial completo, asignación de vendedor y datos de origen.
          </p>
        </div>

        <button
          type="button"
          disabled={!canCreate}
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#312C85] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#27226f] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <img src={agregarIcon} alt="" className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span>Nuevo registro lead</span>
        </button>
      </header>

      <LeadLeadsFilters
        search={search}
        statusFilter={statusFilter}
        sellerFilter={sellerFilter}
        leadDateFromFilter={leadDateFromFilter}
        leadDateToFilter={leadDateToFilter}
        statusOptions={statusOptions}
        sellerOptions={userChoices}
        hasResults={filteredLeads.length > 0}
        hideSellerFilter={false}
        etiquetas={etiquetas}
        etiquetaFilter={etiquetaFilter}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onSellerChange={setSellerFilter}
        onLeadDateFromChange={setLeadDateFromFilter}
        onLeadDateToChange={setLeadDateToFilter}
        onDownload={handleDownloadFilteredLeads}
        onEtiquetaChange={setEtiquetaFilter}
        onManageEtiquetas={() => setIsGestionarOpen(true)}
      />

      {showTabs && (
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
          {([
            { key: 'todos', label: 'Todos los leads' },
            { key: 'mis_leads', label: 'Mis leads' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={[
                'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                activeTab === key
                  ? 'bg-[#312C85] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <LeadLeadsTable
          leads={paginatedLeads}
          isLoading={isLoading}
          updatingLeadId={updatingLeadId}
          propertyAddressById={propertyAddressById}
          userNameById={userNameById}
          canEditStatus={canQuickEditStatus}
          canEditPriority={canQuickEditPriority}
          canEditAssignedSeller={canQuickEditAssignedSeller}
          canEditComments={canQuickEditComments}
          canEdit={canEdit}
          canDelete={canDelete}
          userChoices={userChoices}
          onQuickChange={handleQuickLeadChange}
          onEdit={setEditingLead}
          onDelete={setDeletingLead}
          visibleEtiquetaIds={visibleEtiquetaIds}
          onManageEtiquetas={setManagingEtiquetasLead}
          currentUserId={user?.id}
        />

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredLeads.length}
          pageSize={PAGE_SIZE}
          itemLabel="registros leads"
          onPageChange={setCurrentPage}
        />
      </section>

      {canCreate ? (
        <CreateLeadLeadModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateLead}
          userOptions={userChoices}
        />
      ) : null}

      {canEdit ? (
        <EditLeadLeadModal
          isOpen={Boolean(editingLead)}
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onEdit={handleEditLead}
          userOptions={userChoices}
          allEtiquetas={etiquetas}
          onToggleEtiqueta={handleToggleEtiqueta}
        />
      ) : null}

      {canDelete ? (
        <DeleteLeadConfirmModal
          isOpen={Boolean(deletingLead)}
          lead={deletingLead}
          onClose={() => setDeletingLead(null)}
          onConfirm={handleDeleteLead}
        />
      ) : null}

      <EtiquetaAsignacionModal
        isOpen={Boolean(managingEtiquetasLead)}
        lead={managingEtiquetasLead}
        allEtiquetas={etiquetas}
        onToggle={handleToggleEtiqueta}
        onClose={() => setManagingEtiquetasLead(null)}
      />

      <GestionarEtiquetasModal
        isOpen={isGestionarOpen}
        scope={etiquetasScope}
        onClose={() => setIsGestionarOpen(false)}
      />

    </div>
  );
}
