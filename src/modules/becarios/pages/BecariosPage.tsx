import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { BaseTable } from "@/components/ui/BaseTable";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { useHasPermission } from "@/shared/auth/permissions/useHasPermission";
import agregarIcon from "@/assets/images/Agregar.png";
import {
  getEmpleados, createEmpleado, updateEmpleado, deleteEmpleado, uploadFotoEmpleado,
  type Empleado, type CreateEmpleadoPayload, type UpdateEmpleadoPayload,
} from "@/modules/empleados/services/empleados.api";
import { EmpleadoModal } from "@/modules/empleados/components/EmpleadoModal";

const PAGE_SIZE = 10;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export function BecariosPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = (location.state as { prefill?: Record<string, string> } | null)?.prefill ?? null;
  const { can } = useHasPermission();
  const canCreate = can("rh_empleados", "crear");
  const canEdit   = can("rh_empleados", "actualizar");
  const canDelete = can("rh_empleados", "eliminar");

  const [becarios, setBecarios]       = useState<Empleado[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [search, setSearch]           = useState("");
  const [filterEstatus, setFilterEstatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [modal, setModal]             = useState<{ open: boolean; item: Empleado | null }>({ open: false, item: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: Empleado | null }>({ open: false, item: null });

  const load = async () => {
    setIsLoading(true);
    try { setBecarios(await getEmpleados({ tipo: "Becario" })); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search, filterEstatus]);

  useEffect(() => {
    if (prefill) {
      const t = setTimeout(() => setModal({ open: true, item: null }), 300);
      return () => clearTimeout(t);
    }
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return becarios.filter((b) => {
      const name = `${b.nombre} ${b.apellido_paterno} ${b.apellido_materno}`.toLowerCase();
      const matchSearch = !q || name.includes(q) || b.area.toLowerCase().includes(q) || b.puesto.toLowerCase().includes(q);
      const matchEstatus = !filterEstatus || b.estatus === filterEstatus;
      return matchSearch && matchEstatus;
    });
  }, [becarios, search, filterEstatus]);

  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleSave = async (data: CreateEmpleadoPayload | UpdateEmpleadoPayload, fotoFile?: File) => {
    if (modal.item) {
      const updated = await updateEmpleado(modal.item.id, data as UpdateEmpleadoPayload);
      setBecarios((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      toast.success("Becario actualizado");
    } else {
      const payload = { ...data, tipo: "Becario" } as CreateEmpleadoPayload;
      const created = await createEmpleado(payload);
      if (fotoFile) await uploadFotoEmpleado(created.id, fotoFile);
      setBecarios((prev) => [created, ...prev]);
      toast.success("Becario registrado");
    }
  };

  const handleDelete = async (id: number): Promise<string | null> => {
    try {
      await deleteEmpleado(id);
      setBecarios((prev) => prev.filter((b) => b.id !== id));
      setDeleteModal({ open: false, item: null });
      toast.success("Becario eliminado");
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Error al eliminar";
    }
  };

  const columns = [
    {
      header: "Nombre",
      render: (b: Empleado) => (
        <div>
          <p className="font-semibold text-slate-800">{b.nombre} {b.apellido_paterno} {b.apellido_materno}</p>
          <p className="text-xs text-slate-500">{b.puesto}</p>
        </div>
      ),
    },
    { header: "Área",   render: (b: Empleado) => b.area },
    { header: "Ingreso", render: (b: Empleado) => formatDate(b.fecha_ingreso) },
    {
      header: "Apoyo ec.",
      render: (b: Empleado) => (
        <span className="font-semibold text-emerald-700">
          {parseFloat(b.sueldo).toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
        </span>
      ),
    },
    {
      header: "Estatus",
      render: (b: Empleado) => (
        <span className={[
          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
          b.estatus === "Activo" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
        ].join(" ")}>
          {b.estatus}
        </span>
      ),
    },
    {
      header: "",
      render: (b: Empleado) => (
        <button
          type="button"
          onClick={() => navigate(`/modulos/rh/empleados/${b.id}`)}
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
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Becarios</h1>
          <p className="mt-0.5 text-sm text-slate-500">Registro de becarios y estudiantes en prácticas profesionales</p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setModal({ open: true, item: null })}
            className="flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e293b]"
          >
            <img src={agregarIcon} alt="" className="h-4 w-4" />
            Registrar becario
          </button>
        )}
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Total",   value: becarios.length,                                       color: "text-slate-700" },
          { label: "Activos", value: becarios.filter(b => b.estatus === "Activo").length,   color: "text-emerald-700" },
          { label: "Baja",    value: becarios.filter(b => b.estatus === "Baja").length,     color: "text-red-600" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.label}</p>
            <p className={`mt-1 text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar becario, área o puesto..."
          className="min-w-[220px] flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:ring-2 focus:ring-[#312C85]/10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-[#312C85]"
          value={filterEstatus}
          onChange={(e) => setFilterEstatus(e.target.value)}
        >
          <option value="">Todos los estatus</option>
          <option value="Activo">Activo</option>
          <option value="Baja">Baja</option>
        </select>
      </div>

      {/* Tabla */}
      <BaseTable
        data={paginated}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No hay becarios registrados"
        onEdit={canEdit ? (b) => setModal({ open: true, item: b }) : undefined}
        onDelete={canDelete ? (b) => setDeleteModal({ open: true, item: b }) : undefined}
        canEdit={canEdit}
        canDelete={canDelete}
      />

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setCurrentPage(p)}
              className={[
                "h-8 w-8 rounded-lg text-sm font-semibold transition",
                p === currentPage ? "bg-[#312C85] text-white" : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <EmpleadoModal
          initial={modal.item}
          prefillData={!modal.item ? { tipo: "Becario", ...(prefill ?? {}) } : undefined}
          onSave={handleSave}
          onClose={() => setModal({ open: false, item: null })}
        />
      )}

      {deleteModal.open && deleteModal.item && (
        <DeleteConfirmModal
          isOpen
          title="Eliminar becario"
          subtitle="Confirma que deseas eliminar este registro."
          entityId={deleteModal.item.id}
          entityLabel={`${deleteModal.item.nombre} ${deleteModal.item.apellido_paterno} ${deleteModal.item.apellido_materno}`}
          descriptionPrefix="Estás a punto de eliminar a"
          fallbackLabel="este becario"
          onConfirm={handleDelete}
          onClose={() => setDeleteModal({ open: false, item: null })}
        />
      )}
    </div>
  );
}
