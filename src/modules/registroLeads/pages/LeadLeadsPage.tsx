import agregarIcon from '../../../assets/images/Agregar.png';
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

export function LeadLeadsPage() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.token);
  const { can, isSuperAdmin } = useHasPermission();
  const isSalesCoordinator = extractUserRoles(user ?? { rol: null, roles: [] }).some(
    (role) => normalizeRoleName(role) === 'coordinador de ventas',
  );
  const isSalesAdvisor = extractUserRoles(user ?? { rol: null, roles: [] }).some(
    (role) => normalizeRoleName(role) === 'asesor de ventas',
  );

  const canCreate = can('registros_leads', 'crear');
  const canEdit = can('registros_leads', 'actualizar');
  const canDelete = isSuperAdmin && can('registros_leads', 'eliminar');
  const canQuickEditStatus = canEdit || isSalesAdvisor;
  const canQuickEditComments = canEdit || isSalesAdvisor;
  const canQuickEditPriority = canEdit && !isSalesAdvisor;
  const canQuickEditAssignedSeller = canEdit && !isSalesAdvisor;

  const {
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
  } = useLeadLeadsPageState({
    userId: user?.id,
    accessToken,
  });

  return (
    <div className="min-w-0 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Prospección comercial</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-[2rem]">Registros leads</h2>
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
        leadDateFromFilter={leadDateFromFilter}
        leadDateToFilter={leadDateToFilter}
        statusOptions={statusOptions}
        hasResults={filteredLeads.length > 0}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onLeadDateFromChange={setLeadDateFromFilter}
        onLeadDateToChange={setLeadDateToFilter}
        onDownload={handleDownloadFilteredLeads}
      />

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
          canEdit={canEdit && !isSalesCoordinator && !isSalesAdvisor}
          canDelete={canDelete}
          userChoices={userChoices}
          onQuickChange={handleQuickLeadChange}
          onEdit={setEditingLead}
          onDelete={setDeletingLead}
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

      {canEdit && !isSalesCoordinator && !isSalesAdvisor ? (
        <EditLeadLeadModal
          isOpen={Boolean(editingLead)}
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onEdit={handleEditLead}
          userOptions={userChoices}
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
    </div>
  );
}
