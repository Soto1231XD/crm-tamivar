import { useState } from 'react';
import agregarIcon from '../../../assets/images/Agregar.png';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useHasPermission } from '@/shared/auth/permissions/useHasPermission';
import { TablePagination } from '../../../shared/components/TablePagination';
import { useAsesorExternoPageState } from '../hooks/useAsesorExternoPageState';
import { AsesorExternoTable } from '../components/AsesorExternoTable';
import { CreateAsesorExternoModal } from '../components/CreateAsesorExternoModal';
import { EditAsesorExternoModal } from '../components/EditAsesorExternoModal';
import type { LeadRecord } from '@/interfaces/lead.interface';

const ALL_STATES = 'Todos';

export function AsesorExternoPage() {
  const user = useAuthStore((state) => state.user);
  const { can, isSuperAdmin } = useHasPermission();

  const canCreate = can('asesor_externo', 'crear');
  const canEdit = can('asesor_externo', 'actualizar');
  const canDelete = isSuperAdmin && can('asesor_externo', 'eliminar');

  const {
    isLoading,
    search,
    statusFilter,
    isCreateModalOpen,
    editingLead,
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
    setCurrentPage,
    handleCreate,
    handleEdit,
    handleDelete,
    handleQuickStatusChange,
  } = useAsesorExternoPageState({ userId: user?.id });

  const [confirmingDelete, setConfirmingDelete] = useState<LeadRecord | null>(null);

  async function confirmDelete() {
    if (!confirmingDelete) return;
    await handleDelete(confirmingDelete.id);
    setConfirmingDelete(null);
    setDeletingLead(null);
  }

  return (
    <div className="min-w-0 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Captación directa
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-[2rem]">
            Asesor externo
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Registra leads captados directamente por ti, de forma rápida y sin datos de seguimiento interno.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#312C85] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#27226f]"
          >
            <img src={agregarIcon} alt="" className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span>Nuevo lead</span>
          </button>
        )}
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre..."
          className="h-9 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:ring-2 focus:ring-[#312C85]/10 min-w-[180px]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-[#312C85] focus:ring-2 focus:ring-[#312C85]/10"
        >
          {statusOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt === ALL_STATES ? 'Todos los estados' : opt}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <AsesorExternoTable
          leads={paginatedLeads}
          isLoading={isLoading}
          updatingLeadId={updatingLeadId}
          canEdit={canEdit}
          canDelete={canDelete}
          onQuickStatusChange={handleQuickStatusChange}
          onEdit={setEditingLead}
          onDelete={(lead) => setConfirmingDelete(lead)}
        />

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredLeads.length}
          pageSize={PAGE_SIZE}
          itemLabel="leads externos"
          onPageChange={setCurrentPage}
        />
      </section>

      {canCreate && (
        <CreateAsesorExternoModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreate}
        />
      )}

      {canEdit && (
        <EditAsesorExternoModal
          isOpen={Boolean(editingLead)}
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onEdit={handleEdit}
        />
      )}

      {/* Delete confirmation */}
      {canDelete && confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Eliminar lead</h3>
            <p className="mt-2 text-sm text-slate-600">
              ¿Estás seguro de que deseas eliminar a{' '}
              <strong>
                {`${confirmingDelete.nombres ?? ''} ${confirmingDelete.apellidos ?? ''}`.trim()}
              </strong>
              ? Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmingDelete(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
