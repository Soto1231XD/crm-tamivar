import { useState } from 'react';
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
  const userRoles = extractUserRoles(user ?? { rol: null, roles: [] });
  const isSalesCoordinator = userRoles.some(
    (role) => normalizeRoleName(role) === 'coordinador de ventas',
  );
  const isAdmin = userRoles.some(
    (role) => normalizeRoleName(role) === 'admin',
  );
  const isSalesAdvisor = userRoles.some(
    (role) => normalizeRoleName(role) === 'asesor de ventas',
  );
  // Roles que ven sus propios leads separados por interno/externo además del vista global
  const showsOwnLeadsByType = (isSuperAdmin || isAdmin || isSalesCoordinator) && !isSalesAdvisor;

  const canCreate = can('registros_leads', 'crear');
  const canEdit = can('registros_leads', 'actualizar');
  const [activeTab, setActiveTab] = useState<'todos' | 'mis_leads' | 'internos' | 'externos' | 'mis_internos' | 'mis_externos'>(
    isSalesAdvisor ? 'internos' : 'todos',
  );
  const canDelete = isSuperAdmin && can('registros_leads', 'eliminar');
  const canQuickEditStatus = canEdit || isSalesAdvisor;
  const canQuickEditComments = canEdit || isSalesAdvisor;
  const canQuickEditPriority = canEdit && !isSalesAdvisor;
  const canQuickEditAssignedSeller = canEdit && !isSalesAdvisor;

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
    leadsType: isSalesAdvisor
      ? (activeTab === 'internos' ? 'internos' : 'externos')
      : activeTab === 'mis_internos' || activeTab === 'mis_externos'
        ? (activeTab === 'mis_internos' ? 'internos' : 'externos')
        : undefined,
    myLeadsOnly: !isSalesAdvisor && (activeTab === 'mis_leads' || activeTab === 'mis_internos' || activeTab === 'mis_externos'),
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
        sellerFilter={sellerFilter}
        leadDateFromFilter={leadDateFromFilter}
        leadDateToFilter={leadDateToFilter}
        statusOptions={statusOptions}
        sellerOptions={userChoices}
        hasResults={filteredLeads.length > 0}
        hideSellerFilter={isSalesAdvisor}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onSellerChange={setSellerFilter}
        onLeadDateFromChange={setLeadDateFromFilter}
        onLeadDateToChange={setLeadDateToFilter}
        onDownload={handleDownloadFilteredLeads}
      />

      {isSalesAdvisor ? (
        <div className="space-y-2">
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
            {([
              { key: 'internos', label: 'Internos' },
              { key: 'externos', label: 'Externos' },
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
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-600">Internos:</span> leads asignados por la oficina.&nbsp;&nbsp;
            <span className="font-semibold text-slate-600">Externos:</span> leads conseguidos por ti mismo.
          </p>
        </div>
      ) : showsOwnLeadsByType ? (
        <div className="space-y-2">
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
            {([
              { key: 'todos', label: 'Todos los leads' },
              { key: 'mis_leads', label: 'Mis leads' },
              { key: 'mis_internos', label: 'Mis internos' },
              { key: 'mis_externos', label: 'Mis externos' },
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
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-600">Mis internos:</span> leads que la oficina te asignó.&nbsp;&nbsp;
            <span className="font-semibold text-slate-600">Mis externos:</span> leads que tú mismo conseguiste.
          </p>
        </div>
      ) : (
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
          canEdit={canEdit && !isSalesCoordinator}
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
          autoAssignUserId={isSalesAdvisor ? (user?.id ?? undefined) : undefined}
        />
      ) : null}

      {canEdit && !isSalesCoordinator ? (
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
