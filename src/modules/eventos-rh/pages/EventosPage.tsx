import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { BaseTable } from "@/components/ui/BaseTable";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { useHasPermission } from "@/shared/auth/permissions/useHasPermission";
import agregarIcon from "@/assets/images/Agregar.png";
import {
  getEventos, createEvento, updateEvento, deleteEvento, getReporte,
  type EventoRH,
} from "../services/eventos.api";
import { EventoModal } from "../components/EventoModal";
import { ReporteModal } from "../components/ReporteModal";

function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function totalGastos(e: EventoRH) {
  return e.gastos.reduce((s, g) => s + parseFloat(g.monto), 0);
}

export function EventosPage() {
  const navigate = useNavigate();
  const { can } = useHasPermission();
  const canCreate = can("rh_eventos", "crear");
  const canEdit   = can("rh_eventos", "actualizar");
  const canDelete = can("rh_eventos", "eliminar");

  const [eventos, setEventos]   = useState<EventoRH[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal]         = useState<{ open: boolean; item: EventoRH | null }>({ open: false, item: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: EventoRH | null }>({ open: false, item: null });
  const [reporteOpen, setReporteOpen] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try { setEventos(await getEventos()); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data: { nombre: string; fecha: string; descripcion?: string }) => {
    if (modal.item) {
      const updated = await updateEvento(modal.item.id, data);
      setEventos((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)));
      toast.success("Evento actualizado");
    } else {
      const created = await createEvento(data);
      setEventos((prev) => [created, ...prev]);
      toast.success("Evento registrado");
    }
  };

  const handleDelete = async (id: number): Promise<string | null> => {
    try {
      await deleteEvento(id);
      setEventos((prev) => prev.filter((e) => e.id !== id));
      setDeleteModal({ open: false, item: null });
      toast.success("Evento eliminado");
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Error al eliminar";
    }
  };

  const totalGastoGeneral = eventos.reduce((s, e) => s + totalGastos(e), 0);

  const columns = [
    {
      header: "Evento",
      render: (e: EventoRH) => (
        <div>
          <p className="font-semibold text-slate-800">{e.nombre}</p>
          {e.descripcion && <p className="text-xs text-slate-400 truncate max-w-[200px]">{e.descripcion}</p>}
        </div>
      ),
    },
    { header: "Fecha",         render: (e: EventoRH) => formatDate(e.fecha) },
    { header: "Participantes", render: (e: EventoRH) => <span className="font-semibold text-slate-700">{e.participantes.length}</span> },
    {
      header: "Gasto total",
      render: (e: EventoRH) => (
        <span className="font-semibold text-emerald-700">
          {totalGastos(e).toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
        </span>
      ),
    },
    {
      header: "",
      render: (e: EventoRH) => (
        <button
          type="button"
          onClick={() => navigate(`/modulos/rh/eventos/${e.id}`)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          Ver detalle →
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Eventos / Convivios</h1>
          <p className="mt-0.5 text-sm text-slate-500">Registro de actividades, días festivos y convivios de la empresa</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setReporteOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-[#312C85] px-4 py-2.5 text-sm font-semibold text-[#312C85] transition hover:bg-[#312C85]/5"
          >
            Exportar Excel
          </button>
          {canCreate && (
            <button
              type="button"
              onClick={() => setModal({ open: true, item: null })}
              className="flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e293b]"
            >
              <img src={agregarIcon} alt="" className="h-4 w-4" />
              Nuevo evento
            </button>
          )}
        </div>
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Eventos registrados", value: eventos.length,                                        color: "text-slate-700", fmt: false },
          { label: "Total participantes",  value: eventos.reduce((s, e) => s + e.participantes.length, 0), color: "text-blue-700",  fmt: false },
          { label: "Gasto acumulado",      value: totalGastoGeneral,                                     color: "text-emerald-700", fmt: true  },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.label}</p>
            <p className={`mt-1 text-2xl font-bold ${card.color}`}>
              {card.fmt
                ? card.value.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
                : card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <BaseTable
        data={eventos}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No hay eventos registrados"
        onEdit={canEdit ? (e) => setModal({ open: true, item: e }) : undefined}
        onDelete={canDelete ? (e) => setDeleteModal({ open: true, item: e }) : undefined}
        canEdit={canEdit}
        canDelete={canDelete}
      />

      {modal.open && (
        <EventoModal
          initial={modal.item}
          onSave={handleSave}
          onClose={() => setModal({ open: false, item: null })}
        />
      )}

      {deleteModal.open && deleteModal.item && (
        <DeleteConfirmModal
          isOpen
          title="Eliminar evento"
          subtitle="Se eliminarán también todos sus gastos y participantes."
          entityId={deleteModal.item.id}
          entityLabel={deleteModal.item.nombre}
          descriptionPrefix="Estás a punto de eliminar"
          fallbackLabel="este evento"
          onConfirm={handleDelete}
          onClose={() => setDeleteModal({ open: false, item: null })}
        />
      )}

      {reporteOpen && (
        <ReporteModal
          onExport={getReporte}
          onClose={() => setReporteOpen(false)}
        />
      )}
    </div>
  );
}
