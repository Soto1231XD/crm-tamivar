import agregarIcon from '../../../assets/images/Agregar.png';
import { getModulePermissions, getPrimaryRole } from '../../../shared/constants/roles';
import { useAuth } from '../../../shared/context/AuthContext';
import { TablePagination } from '../../../shared/components/TablePagination';
import { CreateLeadModal } from '../components/CreateLeadModal';
import { DeleteLeadConfirmModal } from '../components/DeleteLeadConfirmModal';
import { EditLeadModal } from '../components/EditLeadModal';
import { LeadFilters } from '../components/LeadFilters';
import { LeadsTable } from '../components/LeadsTable';
import { PAGE_SIZE } from '../utils/leads.constants';
import { useLeadsPageState } from '../hooks/useLeadsPageState';

export function LeadsPage() {
  const { user } = useAuth();
  const primaryRole = getPrimaryRole(user?.roles ?? []);
  const leadPermissions = getModulePermissions(user?.roles ?? [], 'leads');
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
    handleDownloadLead,
    handleDownloadFilteredLeads,
    handleQuickLeadChange,
  } = useLeadsPageState({
    primaryRole,
    userId: user?.id,
  });

  return (
    <div className="min-w-0 space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Registros</h2>
          <p className="mt-1 text-sm text-slate-600">Gestiona todos los registros</p>
        </div>
        <button
          type="button"
          disabled={!leadPermissions.create}
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#312C85] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
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

      <section className="min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <LeadsTable
          leads={paginatedLeads}
          isLoading={isLoading}
          updatingLeadId={updatingLeadId}
          leadPermissions={leadPermissions}
          propertyTitleById={propertyTitleById}
          onQuickChange={handleQuickLeadChange}
          onEdit={setEditingLead}
          onDelete={setDeletingLead}
          onDownload={handleDownloadLead}
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

      {leadPermissions.create ? (
        <CreateLeadModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateLead}
          propertyOptions={propertyChoices}
        />
      ) : null}
      {leadPermissions.edit ? (
        <EditLeadModal
          isOpen={Boolean(editingLead)}
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onEdit={handleEditLead}
          propertyOptions={propertyChoices}
        />
      ) : null}
      {leadPermissions.delete ? (
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
