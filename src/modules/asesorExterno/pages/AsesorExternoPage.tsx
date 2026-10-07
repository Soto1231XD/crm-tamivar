import { useEffect, useState } from 'react';
import agregarIcon from '../../../assets/images/Agregar.png';
import desArcIcon from '../../../assets/images/DesArc.png';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useHasPermission } from '@/shared/auth/permissions/useHasPermission';
import { EtiquetaChip } from '@/components/ui/EtiquetaChip';
import { TablePagination } from '../../../shared/components/TablePagination';
import { useAsesorExternoPageState } from '../hooks/useAsesorExternoPageState';
import { AsesorExternoTable } from '../components/AsesorExternoTable';
import { CreateAsesorExternoModal } from '../components/CreateAsesorExternoModal';
import { EditAsesorExternoModal } from '../components/EditAsesorExternoModal';
import { AgendarCitaModal } from '../components/AgendarCitaModal';
import type { Etiqueta, LeadRecord } from '@/interfaces/lead.interface';
import { createLead } from '@/modules/leads/services/leads.api';
import { getProperties } from '@/modules/properties/services/properties.api';
import { getDevelopments } from '@/modules/developments/services/developments.api';
import { getReadableErrorMessage } from '@/shared/utils/errorMessages';
import { updateAsesorExternoLead } from '../services/asesorExterno.api';
import { useAsesorExternoStore } from '../store/useAsesorExternoStore';
import { useEtiquetasStore } from '@/modules/etiquetas/store/useEtiquetasStore';
import { assignEtiquetaToLeadExterno, removeEtiquetaFromLeadExterno } from '@/modules/etiquetas/services/etiquetas.api';
import { EtiquetaAsignacionModal } from '@/modules/etiquetas/components/EtiquetaAsignacionModal';
import { GestionarEtiquetasModal } from '@/modules/etiquetas/components/GestionarEtiquetasModal';

const ALL_STATES = 'Todos';

type PropertyOption = { id: number; label: string };

export function AsesorExternoPage() {
  const user = useAuthStore((state) => state.user);
  const { can, isSuperAdmin, isAdmin } = useHasPermission();

  const canCreate = can('asesor_externo', 'crear');
  const canEdit = can('asesor_externo', 'actualizar');
  const canDelete = (isSuperAdmin || isAdmin) && can('asesor_externo', 'eliminar');
  const showCreator = can('asesor_externo', 'leer_todos');
  const canRecomend = can('recomendaciones', 'crear');

  const [activeTab, setActiveTab] = useState<'todos' | 'mis_leads'>('todos');
  const [managingEtiquetasLead, setManagingEtiquetasLead] = useState<LeadRecord | null>(null);
  const [etiquetaFilter, setEtiquetaFilter] = useState<number | null>(null);
  const [isGestionarOpen, setIsGestionarOpen] = useState(false);

  const {
    isLoading,
    search,
    statusFilter,
    asesorFilter,
    asesorOptions,
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
    setAsesorFilter,
    setIsCreateModalOpen,
    setEditingLead,
    setCurrentPage,
    handleCreate,
    handleEdit,
    handleDelete,
    handleDownload,
    handleQuickStatusChange,
  } = useAsesorExternoPageState({ userId: user?.id, myLeadsOnly: activeTab === 'mis_leads', etiquetaFilter });

  const { etiquetas, fetchEtiquetas } = useEtiquetasStore();
  useEffect(() => { void fetchEtiquetas('personal'); }, [fetchEtiquetas]);

  const visibleEtiquetaIds = new Set(etiquetas.map((e) => e.id));

  async function handleToggleEtiqueta(lead: LeadRecord, etiqueta: Etiqueta, assigned: boolean) {
    if (lead.creado_por_id !== user?.id) return;
    try {
      if (assigned) {
        await removeEtiquetaFromLeadExterno(lead.id, etiqueta.id);
        const updatedEtiquetas = (lead.etiquetas ?? []).filter((j) => j.etiqueta.id !== etiqueta.id);
        const updatedLead = { ...lead, etiquetas: updatedEtiquetas };
        useAsesorExternoStore.setState((s) => ({
          leads: s.leads.map((l) => l.id === lead.id ? updatedLead : l),
        }));
        setManagingEtiquetasLead((prev) => prev?.id === lead.id ? updatedLead : prev);
      } else {
        await assignEtiquetaToLeadExterno(lead.id, etiqueta.id);
        const updatedEtiquetas = [...(lead.etiquetas ?? []), { etiqueta }];
        const updatedLead = { ...lead, etiquetas: updatedEtiquetas };
        useAsesorExternoStore.setState((s) => ({
          leads: s.leads.map((l) => l.id === lead.id ? updatedLead : l),
        }));
        setManagingEtiquetasLead((prev) => prev?.id === lead.id ? updatedLead : prev);
      }
    } catch {
      toast.error('No se pudo actualizar la etiqueta.');
    }
  }

  const [confirmingDelete, setConfirmingDelete] = useState<LeadRecord | null>(null);
  const [agendarCitaLead, setAgendarCitaLead] = useState<LeadRecord | null>(null);
  const [propertyOptions, setPropertyOptions] = useState<PropertyOption[]>([]);
  const [developmentOptions, setDevelopmentOptions] = useState<PropertyOption[]>([]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([getProperties(), getDevelopments()]).then((results) => {
      if (!active) return;
      const [propsResult, devsResult] = results;
      if (propsResult.status === 'fulfilled') {
        setPropertyOptions(
          propsResult.value
            .filter((p) => p.estatus === 'Disponible')
            .map((p) => ({ id: p.id, label: p.titulo?.trim() || `Propiedad #${p.id}` })),
        );
      }
      if (devsResult.status === 'fulfilled') {
        setDevelopmentOptions(
          devsResult.value
            .filter((d) => d.estatus === 'Disponible')
            .map((d) => ({ id: d.id, label: d.titulo?.trim() || `Desarrollo #${d.id}` })),
        );
      }
    });
    return () => { active = false; };
  }, []);

  function handleStatusChangeIntercepted(leadId: number, value: string) {
    if (value === 'Cita agendada') {
      const lead = paginatedLeads.find((l) => l.id === leadId) ?? filteredLeads.find((l) => l.id === leadId);
      if (lead) {
        setAgendarCitaLead(lead);
        return;
      }
    }
    void handleQuickStatusChange(leadId, value);
  }

  async function handleAgendarCitaConfirm({
    tipoObjetivo,
    objetivoId,
    fechaCita,
    asesorExterno,
    asesorExternoNombre,
  }: {
    tipoObjetivo: 'propiedad' | 'desarrollo';
    objetivoId: number;
    fechaCita: string;
    asesorExterno: boolean;
    asesorExternoNombre?: string;
  }): Promise<string | null> {
    if (!agendarCitaLead || !user) return 'No hay sesión válida.';
    const lead = agendarCitaLead;
    let nuevaVisita;
    try {
      nuevaVisita = await createLead({
        nombres: lead.nombres,
        apellidos: lead.apellidos,
        telefono: String(lead.telefono),
        lada: lead.lada ?? undefined,
        estado: 'Agendado',
        fecha_cita: fechaCita,
        asesor_externo: asesorExterno,
        asesor_externo_nombre: asesorExterno ? asesorExternoNombre : undefined,
        creado_por_id: user.id,
        ...(tipoObjetivo === 'propiedad' ? { propiedad_id: objetivoId } : { desarrollo_id: objetivoId }),
      });
    } catch (error) {
      // Solo aquí, si falla la creación, mostramos error (nada fue creado)
      return getReadableErrorMessage(error, 'No fue posible registrar la visita.');
    }

    // La visita ya fue creada — a partir de aquí cerramos el modal sin importar qué pase
    // Intentamos vincular el lead externo con la visita; si falla, no bloqueamos el flujo
    try {
      await updateAsesorExternoLead(lead.id, { registro_lead_id: nuevaVisita.id });
    } catch {
      // El vínculo falló pero la visita ya existe; el botón se ocultará en sesión actual
    }

    useAsesorExternoStore.setState((state) => ({
      leads: state.leads.map((l) =>
        l.id === lead.id ? { ...l, registro_lead_id: nuevaVisita.id } : l,
      ),
    }));
    await handleQuickStatusChange(lead.id, 'Cita agendada');
    setAgendarCitaLead(null);
    toast.success('Cita agendada y registro de visita creado.');
    return null;
  }

  function handleAgendarCitaCancel() {
    setAgendarCitaLead(null);
  }

  async function confirmDelete() {
    if (!confirmingDelete) return;
    await handleDelete(confirmingDelete.id);
    setConfirmingDelete(null);
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
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
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
          {showCreator && (
            <select
              value={asesorFilter}
              onChange={(e) => setAsesorFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-[#312C85] focus:ring-2 focus:ring-[#312C85]/10"
            >
              {asesorOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={filteredLeads.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[#16A34A] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <img src={desArcIcon} alt="" className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span>Descargar Excel</span>
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
          <span className="shrink-0 text-xs font-semibold text-slate-500">Etiquetas:</span>
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {etiquetas.length === 0 ? (
              <span className="text-xs text-slate-400">Sin etiquetas</span>
            ) : (
              <>
                {etiquetas.map((et) => {
                  const active = etiquetaFilter === et.id;
                  return (
                    <button
                      key={et.id}
                      type="button"
                      onClick={() => setEtiquetaFilter(active ? null : et.id)}
                      className={[
                        'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition',
                        active
                          ? 'border-[#312C85] bg-[#312C85]/10 text-[#312C85]'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                      ].join(' ')}
                    >
                      <EtiquetaChip etiqueta={et} compact />
                      <span>{et.nombre}</span>
                    </button>
                  );
                })}
                {etiquetaFilter !== null && (
                  <button
                    type="button"
                    onClick={() => setEtiquetaFilter(null)}
                    className="shrink-0 text-xs text-slate-400 transition hover:text-slate-600"
                  >
                    × Limpiar
                  </button>
                )}
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsGestionarOpen(true)}
            title="Gestionar etiquetas"
            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-[#312C85]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {showCreator && (
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
          {([
            { key: 'todos', label: 'Leads asesores' },
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

      {/* Table */}
      <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <AsesorExternoTable
          leads={paginatedLeads}
          isLoading={isLoading}
          updatingLeadId={updatingLeadId}
          canEdit={canEdit}
          canDelete={canDelete}
          showCreator={showCreator}
          canRecomend={canRecomend}
          onQuickStatusChange={handleStatusChangeIntercepted}
          onEdit={setEditingLead}
          onDelete={(lead) => setConfirmingDelete(lead)}
          visibleEtiquetaIds={visibleEtiquetaIds}
          onManageEtiquetas={setManagingEtiquetasLead}
          currentUserId={user?.id}
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
          allEtiquetas={etiquetas}
          onToggleEtiqueta={handleToggleEtiqueta}
        />
      )}

      <AgendarCitaModal
        isOpen={Boolean(agendarCitaLead)}
        lead={agendarCitaLead}
        propertyOptions={propertyOptions}
        developmentOptions={developmentOptions}
        onConfirm={handleAgendarCitaConfirm}
        onCancel={handleAgendarCitaCancel}
      />

      <EtiquetaAsignacionModal
        isOpen={Boolean(managingEtiquetasLead)}
        lead={managingEtiquetasLead}
        allEtiquetas={etiquetas}
        onToggle={handleToggleEtiqueta}
        onClose={() => setManagingEtiquetasLead(null)}
      />

      <GestionarEtiquetasModal
        isOpen={isGestionarOpen}
        scope="personal"
        onClose={() => setIsGestionarOpen(false)}
      />

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
