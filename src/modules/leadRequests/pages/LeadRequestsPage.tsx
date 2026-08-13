import agregarIcon from '../../../assets/images/Agregar.png';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useHasPermission } from '@/shared/auth/permissions/useHasPermission';
import { TablePagination } from '@/shared/components/TablePagination';
import { PAGE_SIZE } from '@/modules/leads/utils/leads.constants';
import { CreateLeadRequestModal } from '../components/CreateLeadRequestModal';
import { DeleteLeadRequestConfirmModal } from '../components/DeleteLeadRequestConfirmModal';
import { EditLeadRequestModal } from '../components/EditLeadRequestModal';
import { LeadRequestsFilters } from '../components/LeadRequestsFilters';
import { LeadRequestsTable } from '../components/LeadRequestsTable';
import { useLeadRequestsPageState } from '../hooks/useLeadRequestsPageState';

export function LeadRequestsPage() {
  const user = useAuthStore((state) => state.user);
  const { can, isSuperAdmin } = useHasPermission();

  const canCreate = can('solicitudes_leads', 'crear');
  const canEdit = can('solicitudes_leads', 'actualizar');
  const canDelete = isSuperAdmin && can('solicitudes_leads', 'eliminar');

  const {
    isLoading,
    search,
    statusFilter,
    leadDateFromFilter,
    leadDateToFilter,
    budgetMinFilter,
    budgetMaxFilter,
    operationTypeFilter,
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
    setBudgetMinFilter,
    setBudgetMaxFilter,
    setOperationTypeFilter,
    setIsCreateModalOpen,
    setEditingLeadRequest,
    setDeletingLeadRequest,
    setCurrentPage,
    handleCreateLeadRequest,
    handleEditLeadRequest,
    handleDeleteLeadRequest,
    handleQuickUpdateLeadRequest,
    handleDownloadFilteredLeadRequests,
  } = useLeadRequestsPageState({
    userId: user?.id,
  });

  return (
    <div className="min-w-0 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Prospección comercial</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-[2rem]">Solicitudes de leads</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Centraliza solicitudes comerciales con presupuesto, ubicación, seguimiento y opciones enviadas.
          </p>
        </div>

        <button
          type="button"
          disabled={!canCreate}
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#312C85] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#27226f] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <img src={agregarIcon} alt="" className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span>Nueva solicitud</span>
        </button>
      </header>

      <LeadRequestsFilters
        search={search}
        statusFilter={statusFilter}
        leadDateFromFilter={leadDateFromFilter}
        leadDateToFilter={leadDateToFilter}
        budgetMinFilter={budgetMinFilter}
        budgetMaxFilter={budgetMaxFilter}
        operationTypeFilter={operationTypeFilter}
        statusOptions={statusOptions}
        hasResults={filteredLeadRequests.length > 0}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onLeadDateFromChange={setLeadDateFromFilter}
        onLeadDateToChange={setLeadDateToFilter}
        onBudgetMinChange={setBudgetMinFilter}
        onBudgetMaxChange={setBudgetMaxFilter}
        onOperationTypeChange={setOperationTypeFilter}
        onDownload={handleDownloadFilteredLeadRequests}
      />

      <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <LeadRequestsTable
          leadRequests={paginatedLeadRequests}
          isLoading={isLoading}
          updatingLeadRequestId={updatingLeadRequestId}
          canEdit={canEdit}
          canDelete={canDelete}
          sellerChoices={sellerChoices}
          onQuickUpdate={handleQuickUpdateLeadRequest}
          onEdit={setEditingLeadRequest}
          onDelete={setDeletingLeadRequest}
        />

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredLeadRequests.length}
          pageSize={PAGE_SIZE}
          itemLabel="solicitudes"
          onPageChange={setCurrentPage}
        />
      </section>

      {canCreate ? (
        <CreateLeadRequestModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          sellerOptions={sellerChoices}
          onCreate={handleCreateLeadRequest}
        />
      ) : null}

      {canEdit ? (
        <EditLeadRequestModal
          isOpen={Boolean(editingLeadRequest)}
          leadRequest={editingLeadRequest}
          sellerOptions={sellerChoices}
          onClose={() => setEditingLeadRequest(null)}
          onEdit={handleEditLeadRequest}
        />
      ) : null}

      {canDelete ? (
        <DeleteLeadRequestConfirmModal
          isOpen={Boolean(deletingLeadRequest)}
          leadRequest={deletingLeadRequest}
          onClose={() => setDeletingLeadRequest(null)}
          onConfirm={handleDeleteLeadRequest}
        />
      ) : null}
    </div>
  );
}
