import agregarIcon from '../../../assets/images/Agregar.png';
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

function normalizeRoleName(role: string): string {
  return role
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function LeadsPage() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.token);
  const { can, isSuperAdmin } = useHasPermission();

  const canCreate = can('registros', 'crear');
  const canEditOwn = can('registros', 'actualizar');
  const canEditAll = can('registros', 'actualizar_todos');
  const canDelete = can('registros', 'eliminar');
  const normalizedRoles = (user?.roles ?? []).map(normalizeRoleName);
  const isSalesAdvisor =
    normalizedRoles.includes('asesor de ventas') || normalizedRoles.includes('asesor ventas');
  const canSeeInterno =
    normalizedRoles.includes('super administrador') ||
    normalizedRoles.includes('administrador') ||
    normalizedRoles.includes('coordinador de ventas');

  const {
    isLoading,
    search,
    responsibleSearch,
    statusFilter,
    propertyFilter,
    appointmentDateFromFilter,
    appointmentDateToFilter,
    updatingLeadId,
    isCreateModalOpen,
    editingLead,
    deletingLead,
    currentPage,
    statusOptions,
    targetTitleByLeadId,
    propertyFilterOptions,
    filteredLeads,
    paginatedLeads,
    totalPages,
    propertyChoices,
    developmentChoices,
    setSearch,
    setResponsibleSearch,
    setStatusFilter,
    setPropertyFilter,
    setAppointmentDateFromFilter,
    setAppointmentDateToFilter,
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
    userId: user?.id,
    accessToken,
    canSeeInterno,
  });

  const canEditVisit = (lead: { creado_por_id?: number | null; creador?: { id?: number | null } | null }) => {
    if (canEditAll) return true;
    if (!canEditOwn || !user?.id) return false;
    return (
      (lead.creado_por_id ?? lead.creador?.id ?? null) === user.id ||
      ('vendedor_asignado_id' in lead &&
        (lead as { vendedor_asignado_id?: number | null }).vendedor_asignado_id === user.id)
    );
  };

  return (
    <div className="min-w-0 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Seguimiento comercial
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-[2rem]">Registros visitas</h2>
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
          <span>Nuevo registro visita</span>
        </button>
      </header>

      <LeadFilters
        search={search}
        responsibleSearch={responsibleSearch}
        statusFilter={statusFilter}
        propertyFilter={propertyFilter}
        appointmentDateFromFilter={appointmentDateFromFilter}
        appointmentDateToFilter={appointmentDateToFilter}
        statusOptions={statusOptions}
        propertyFilterOptions={propertyFilterOptions}
        hasResults={filteredLeads.length > 0}
        onSearchChange={setSearch}
        onResponsibleSearchChange={setResponsibleSearch}
        onStatusChange={setStatusFilter}
        onPropertyChange={setPropertyFilter}
        onAppointmentDateFromChange={setAppointmentDateFromFilter}
        onAppointmentDateToChange={setAppointmentDateToFilter}
        onDownload={handleDownloadFilteredLeads}
      />

      <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <LeadsTable
          leads={paginatedLeads}
          isLoading={isLoading}
          updatingLeadId={updatingLeadId}
          targetTitleByLeadId={targetTitleByLeadId}
          currentUserId={user?.id ?? null}
          hideResponsibleColumn={isSalesAdvisor}
          showFolioColumn={isSuperAdmin}
          canQuickEdit={canEditAll || canEditOwn}
          canQuickEditItem={canEditVisit}
          canEditItem={canEditVisit}
          canDeleteItem={() => isSuperAdmin && canDelete}
          onQuickChange={handleQuickLeadChange}
          onEdit={setEditingLead}
          onDelete={setDeletingLead}
        />

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredLeads.length}
          pageSize={PAGE_SIZE}
          itemLabel="registros visitas"
          onPageChange={setCurrentPage}
        />
      </section>

      {canCreate ? (
        <CreateLeadModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateLead}
          propertyOptions={propertyChoices}
          developmentOptions={developmentChoices}
        />
      ) : null}

      {canEditAll || canEditOwn ? (
        <EditLeadModal
          isOpen={Boolean(editingLead)}
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onEdit={handleEditLead}
          propertyOptions={propertyChoices}
          developmentOptions={developmentChoices}
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
