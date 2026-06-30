import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { BaseTable } from "@/components/ui/BaseTable";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import {
  CollapsibleFilters,
  FilterSearchInput,
  FilterSelect,
} from "@/components/ui/AppFilters";
import { useHasPermission } from "@/shared/auth/permissions/useHasPermission";
import agregarIcon from "@/assets/images/Agregar.png";
import {
  getCarteraClientes,
  createCarteraCliente,
  updateCarteraCliente,
  deleteCarteraCliente,
  type ClienteCartera,
} from "../services/cartera-clientes.api";
import { ClienteModal } from "../components/ClienteModal";
import { WhatsappModal } from "../components/WhatsappModal";
import { CampaignModal } from "../components/CampaignModal";

const MESES: Record<number, string> = {
  1: "ENE", 2: "FEB", 3: "MAR", 4: "ABR", 5: "MAY", 6: "JUN",
  7: "JUL", 8: "AGO", 9: "SEP", 10: "OCT", 11: "NOV", 12: "DIC",
};

function formatCumple(dia: number | null, mes: number | null) {
  if (!dia && !mes) return "—";
  if (!mes) return `${dia}`;
  if (!dia) return MESES[mes] ?? "—";
  return `${dia} ${MESES[mes]}`;
}

export function CarteraClientesPage() {
  const { can } = useHasPermission();
  const canCreate  = can("CarteraClientes", "crear");
  const canEdit    = can("CarteraClientes", "actualizar");
  const canDelete  = can("CarteraClientes", "eliminar");
  const canMessage = can("CarteraClientes", "actualizar");

  const [clientes, setClientes]       = useState<ClienteCartera[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [modal, setModal]             = useState<{ open: boolean; item: ClienteCartera | null }>({ open: false, item: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: ClienteCartera | null }>({ open: false, item: null });
  const [waModal, setWaModal]         = useState<{ open: boolean; item: ClienteCartera | null; defaultMsg?: string }>({ open: false, item: null });
  const [campaignOpen, setCampaignOpen] = useState(false);

  const [search, setSearch]       = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterMes, setFilterMes]   = useState("");

  const load = async () => {
    setIsLoading(true);
    try {
      setClientes(await getCarteraClientes());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clientes.filter((c) => {
      if (q && !`${c.nombre} ${c.telefono ?? ""} ${c.propiedad ?? ""} ${c.referencia ?? ""}`.toLowerCase().includes(q)) return false;
      if (filterTipo && c.tipo !== filterTipo) return false;
      if (filterMes && String(c.cumple_mes) !== filterMes) return false;
      return true;
    });
  }, [clientes, search, filterTipo, filterMes]);

  const handleSave = async (data: Partial<ClienteCartera>) => {
    if (modal.item) {
      await updateCarteraCliente(modal.item.id, data);
      toast.success("Cliente actualizado");
    } else {
      await createCarteraCliente(data);
      toast.success("Cliente creado");
    }
    await load();
  };

  const handleDelete = async (id: number): Promise<string | null> => {
    try {
      await deleteCarteraCliente(id);
      await load();
      toast.success("Cliente eliminado");
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "No se pudo eliminar.";
    }
  };

  // Cumpleaños próximos (30 días)
  const hoy = new Date();
  const cumplePróximos = useMemo(() => {
    return clientes
      .filter((c) => c.cumple_mes && c.cumple_dia)
      .filter((c) => {
        const dia = c.cumple_dia!;
        const mes = c.cumple_mes!;
        const fechaCumple = new Date(hoy.getFullYear(), mes - 1, dia);
        if (fechaCumple < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) {
          fechaCumple.setFullYear(hoy.getFullYear() + 1);
        }
        const diff = (fechaCumple.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 30;
      })
      .sort((a, b) => {
        const fa = new Date(hoy.getFullYear(), (a.cumple_mes ?? 1) - 1, a.cumple_dia ?? 1);
        const fb = new Date(hoy.getFullYear(), (b.cumple_mes ?? 1) - 1, b.cumple_dia ?? 1);
        if (fa < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) fa.setFullYear(hoy.getFullYear() + 1);
        if (fb < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) fb.setFullYear(hoy.getFullYear() + 1);
        return fa.getTime() - fb.getTime();
      });
  }, [clientes]);

  const columns = [
    { header: "Nombre",              render: (c: ClienteCartera) => <span className="font-semibold">{c.nombre}</span> },
    { header: "Cumpleaños",          render: (c: ClienteCartera) => formatCumple(c.cumple_dia, c.cumple_mes) },
    { header: "Teléfono",            render: (c: ClienteCartera) => c.telefono ?? "—" },
    { header: "Comprador / Vendedor",render: (c: ClienteCartera) => c.tipo ?? "—" },
    { header: "Propiedad",           render: (c: ClienteCartera) => c.propiedad ?? "—" },
    { header: "Ubicación",           render: (c: ClienteCartera) => c.ubicacion ?? "—" },
    { header: "Referencia",          render: (c: ClienteCartera) => c.referencia ?? "—" },
    { header: "Tel. Referencia",     render: (c: ClienteCartera) => c.telefono_referencia ?? "—" },
    { header: "SMS Post venta",      render: (c: ClienteCartera) => c.sms_post_venta
      ? <span className="max-w-[200px] truncate block" title={c.sms_post_venta}>{c.sms_post_venta}</span>
      : "—"
    },
    ...(canMessage
      ? [{
          header: "WhatsApp",
          render: (c: ClienteCartera) =>
            c.telefono ? (
              <button
                type="button"
                onClick={() => setWaModal({ open: true, item: c })}
                className="rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1da851]"
              >
                Enviar
              </button>
            ) : (
              <span className="text-xs text-slate-400">Sin tel.</span>
            ),
        }]
      : []),
  ];

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6">
      {/* Encabezado */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--crm-text-muted)]">
            Módulo
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[var(--crm-text)]">
            Cartera de Clientes
          </h1>
          <p className="mt-1 text-sm text-[var(--crm-text-muted)]">
            Directorio de compradores, vendedores e inquilinos con historial de operaciones.
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          {canMessage && clientes.some((c) => c.telefono) && (
            <button
              type="button"
              onClick={() => setCampaignOpen(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1da851] sm:w-auto"
            >
              <span>📣</span>
              <span className="whitespace-nowrap">Campaña WhatsApp</span>
            </button>
          )}
          {canCreate && (
            <button
              type="button"
              onClick={() => setModal({ open: true, item: null })}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#312C85] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#27226f] sm:w-auto"
            >
              <img src={agregarIcon} alt="" className="h-6 w-6 shrink-0" aria-hidden="true" />
              <span className="whitespace-nowrap">Nuevo cliente</span>
            </button>
          )}
        </div>
      </header>

      {/* Cumpleaños próximos */}
      {cumplePróximos.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400">
            Cumpleaños próximos (30 días)
          </p>
          <div className="flex flex-wrap gap-2">
            {cumplePróximos.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  canMessage && c.telefono
                    ? setWaModal({
                        open: true,
                        item: c,
                        defaultMsg: `¡Feliz cumpleaños ${c.nombre}! 🎉 De parte de todo el equipo Tamivar, te deseamos un excelente día.`,
                      })
                    : undefined
                }
                className="flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:shadow-md dark:border-amber-800 dark:bg-amber-900/30"
              >
                <span className="text-lg">🎂</span>
                <span>
                  <span className="font-semibold text-[var(--crm-text)]">{c.nombre}</span>
                  <span className="ml-1.5 text-xs text-amber-600">{formatCumple(c.cumple_dia, c.cumple_mes)}</span>
                </span>
                {c.telefono && canMessage && (
                  <span className="ml-1 text-xs font-medium text-green-600">Enviar →</span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Filtros */}
      <CollapsibleFilters
        searchSlot={
          <FilterSearchInput
            placeholder="Buscar por nombre, teléfono, propiedad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        }
        activeCount={[filterTipo, filterMes].filter(Boolean).length}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <FilterSelect value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
            <option value="">Todos los tipos</option>
            <option>Comprador</option>
            <option>Vendedor</option>
            <option>Inquilino</option>
          </FilterSelect>
          <FilterSelect value={filterMes} onChange={(e) => setFilterMes(e.target.value)}>
            <option value="">Todos los meses de cumple</option>
            {Object.entries(MESES).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </FilterSelect>
        </div>
      </CollapsibleFilters>

      {/* Tabla */}
      <BaseTable
        data={filtrados}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No se encontraron clientes."
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={(item) => setModal({ open: true, item })}
        onDelete={(item) => setDeleteModal({ open: true, item })}
      />

      {/* Modal crear/editar */}
      {modal.open && (
        <ClienteModal
          initial={modal.item}
          onSave={handleSave}
          onClose={() => setModal({ open: false, item: null })}
        />
      )}

      {/* Modal WhatsApp individual */}
      {waModal.open && waModal.item && (
        <WhatsappModal
          cliente={waModal.item}
          defaultMessage={waModal.defaultMsg}
          onClose={() => setWaModal({ open: false, item: null })}
        />
      )}

      {/* Modal campaña masiva */}
      {campaignOpen && (
        <CampaignModal
          clientes={filtrados}
          onClose={() => setCampaignOpen(false)}
        />
      )}

      {/* Modal eliminar */}
      <DeleteConfirmModal
        isOpen={deleteModal.open}
        entityId={deleteModal.item?.id ?? null}
        entityLabel={deleteModal.item?.nombre ?? ""}
        title="Eliminar cliente"
        subtitle="Esta acción eliminará el cliente de la cartera."
        descriptionPrefix="Se eliminará el cliente"
        fallbackLabel="este cliente"
        onClose={() => setDeleteModal({ open: false, item: null })}
        onConfirm={handleDelete}
      />
    </div>
  );
}
