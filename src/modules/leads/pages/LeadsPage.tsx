import agregarIcon from '../../../assets/images/Agregar.png';
import { getRecordsReadScope } from '@/shared/auth/permissions/permissions.util';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useHasPermission } from '@/shared/auth/permissions/useHasPermission';
import { TablePagination } from '../../../shared/components/TablePagination';
import { CreateLeadModal } from '../components/CreateLeadModal';
import { DeleteLeadConfirmModal } from '../components/DeleteLeadConfirmModal';
import { EditLeadModal } from '../components/EditLeadModal';
import { LeadFilters } from '../components/LeadFilters';
import { LeadsTable } from '../components/LeadsTable';
import { useLeadsPageState } from '../hooks/useLeadsPageState';
import { PAGE_SIZE } from '../utils/leads.constants';

export function LeadsPage() {
  const user = useAuthStore((state) => state.user);
  const { can } = useHasPermission();
  const recordsReadScope = getRecordsReadScope(user);

  const canCreate = can('registros', 'crear');
  const canEdit = can('registros', 'actualizar');
  const canDelete = can('registros', 'eliminar');

  const {
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
  } = useLeadsPageState({
    recordsReadScope,
    userId: user?.id,
  });

  return (
    <div className="min-w-0 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Seguimiento comercial
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-[2rem]">Registros</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Administra el flujo comercial, revisa estados y da seguimiento puntual a cada prospecto desde un solo lugar.
          </p>
        </div>

        <button
          type="button"
          disabled={!canCreate}
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#312C85] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#27226f] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <img src={agregarIcon} alt="" className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span>Nuevo registro</span>
        </button>
      </header>

      <LeadFilters
        search={search}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        propertyFilter={propertyFilter}
        appointmentDateFilter={appointmentDateFilter}
        statusOptions={statusOptions}
        propertyFilterOptions={propertyFilterOptions}
        hasResults={filteredLeads.length > 0}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
        onPropertyChange={setPropertyFilter}
        onAppointmentDateChange={setAppointmentDateFilter}
        onDownload={handleDownloadFilteredLeads}
      />

      <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <LeadsTable
          leads={paginatedLeads}
          isLoading={isLoading}
          updatingLeadId={updatingLeadId}
          propertyTitleById={propertyTitleById}
          onQuickChange={handleQuickLeadChange}
          onEdit={setEditingLead}
          onDelete={setDeletingLead}
        />

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredLeads.length}
          pageSize={PAGE_SIZE}
          itemLabel="registros"
          onPageChange={setCurrentPage}
        />
      </section>

      {canCreate ? (
        <CreateLeadModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateLead}
          propertyOptions={propertyChoices}
        />
      ) : null}

      {canEdit ? (
        <EditLeadModal
          isOpen={Boolean(editingLead)}
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onEdit={handleEditLead}
          propertyOptions={propertyChoices}
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
