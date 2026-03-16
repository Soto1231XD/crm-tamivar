import agregarIcon from '../../../assets/images/Agregar.png';
import { TablePagination } from '../../../shared/components/TablePagination';
import { CreateLeadModal } from '../components/CreateLeadModal';
import { DeleteLeadConfirmModal } from '../components/DeleteLeadConfirmModal';
import { EditLeadModal } from '../components/EditLeadModal';
import { LeadFilters } from '../components/LeadFilters';
import { LeadsTable } from '../components/LeadsTable';
import { PAGE_SIZE } from '../utils/leads.constants';
import { useLeadsPageState } from '../hooks/useLeadsPageState';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useHasPermission } from '@/shared/auth/permissions/useHasPermission';

export function LeadsPage() {
  // Extraemos usuario de Zustand y la función can del Hook
  const user = useAuthStore((state) => state.user);
  const { can } = useHasPermission();

  const primaryRole = user?.roles?.[0];

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
          // 5. Usamos el booleano 'canCreate'
          disabled={!canCreate}
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
          // 6. Eliminamos la prop 'leadPermissions' que ya no existe en LeadsTable
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

      {/* 7. Protegemos los modales con los nuevos booleanos */}
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