import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { BaseTable } from "@/components/ui/BaseTable";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { useHasPermission } from "@/shared/auth/permissions/useHasPermission";
import agregarIcon from "@/assets/images/Agregar.png";
import {
  getEmpleados,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado,
  uploadFotoEmpleado,
  type Empleado,
  type CreateEmpleadoPayload,
  type UpdateEmpleadoPayload,
} from "../services/empleados.api";
import { EmpleadoModal } from "../components/EmpleadoModal";

const PAGE_SIZE = 10;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function formatSueldo(val: string) {
  const n = parseFloat(val);
  if (isNaN(n)) return "—";
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export function EmpleadosPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useHasPermission();
  const canCreate = can("rh_empleados", "crear");
  const canEdit   = can("rh_empleados", "actualizar");
  const canDelete = can("rh_empleados", "eliminar");

  const [empleados, setEmpleados]     = useState<Empleado[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [search, setSearch]           = useState("");
  const [filterEstatus, setFilterEstatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Pre-llenado desde candidatos aprobados (sueldo se omite — el usuario lo ingresa)
  const prefill = (location.state as { prefill?: Record<string, string> } | null)?.prefill ?? null;
  const [modal, setModal]             = useState<{ open: boolean; item: Empleado | null }>({ open: false, item: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: Empleado | null }>({ open: false, item: null });

  const load = async () => {
    setIsLoading(true);
    try {
      setEmpleados(await getEmpleados({ tipo: "Empleado" }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search, filterEstatus]);

  // Abrir modal de alta tras montar el componente para no colisionar con la animación de entrada
  useEffect(() => {
    if (prefill) {
      const t = setTimeout(() => setModal({ open: true, item: null }), 300);
      return () => clearTimeout(t);
    }
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return empleados.filter((e) => {
      const nombre = `${e.nombre} ${e.apellido_paterno} ${e.apellido_materno}`.toLowerCase();
      if (q && !nombre.includes(q) && !e.area.toLowerCase().includes(q) && !e.puesto.toLowerCase().includes(q)) return false;
      if (filterEstatus && e.estatus !== filterEstatus) return false;
      return true;
    });
  }, [empleados, search, filterEstatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSave = async (data: CreateEmpleadoPayload | UpdateEmpleadoPayload, fotoFile?: File) => {
    if (modal.item) {
      await updateEmpleado(modal.item.id, data as UpdateEmpleadoPayload);
      if (fotoFile) await uploadFotoEmpleado(modal.item.id, fotoFile);
      toast.success("Empleado actualizado");
    } else {
      const created = await createEmpleado(data as CreateEmpleadoPayload);
      if (fotoFile) await uploadFotoEmpleado(created.id, fotoFile);
      toast.success("Empleado registrado");
    }
    await load();
  };

  const handleDelete = async (id: number): Promise<string | null> => {
    try {
      await deleteEmpleado(id);
      await load();
      toast.success("Empleado eliminado");
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "No se pudo eliminar.";
    }
  };

  const columns = [
    {
      header: "Nombre",
      render: (e: Empleado) => (
        <span className="font-semibold">
          {e.nombre} {e.apellido_paterno} {e.apellido_materno}
        </span>
      ),
    },
    { header: "Área",   render: (e: Empleado) => e.area },
    { header: "Puesto", render: (e: Empleado) => e.puesto },
    { header: "Ingreso", render: (e: Empleado) => formatDate(e.fecha_ingreso) },
    { header: "Sueldo",  render: (e: Empleado) => formatSueldo(e.sueldo) },
    { header: "Teléfono", render: (e: Empleado) => e.telefono ?? "—" },
    { header: "Correo",   render: (e: Empleado) => e.correo ?? "—" },
    {
      header: "Estatus",
      render: (e: Empleado) => (
        <span
          className={[
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
            e.estatus === "Activo"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700",
          ].join(" ")}
        >
          {e.estatus}
        </span>
      ),
    },
    {
      header: "",
      render: (e: Empleado) => (
        <button
          type="button"
          onClick={() => navigate(`/modulos/rh/empleados/${e.id}`)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          Ver detalle →
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--crm-text)]">Empleados</h1>
          <p className="text-sm text-[var(--crm-text-muted)]">
            {filtered.length} {filtered.length === 1 ? "empleado" : "empleados"}
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setModal({ open: true, item: null })}
            className="flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e293b]"
          >
            <img src={agregarIcon} alt="" className="h-4 w-4" />
            Nuevo empleado
          </button>
        )}
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Total",   value: empleados.length,                                       color: "text-slate-700" },
          { label: "Activos", value: empleados.filter(e => e.estatus === "Activo").length,   color: "text-emerald-700" },
          { label: "Baja",    value: empleados.filter(e => e.estatus === "Baja").length,     color: "text-red-600" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.label}</p>
            <p className={`mt-1 text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, área o puesto..."
          className="w-full max-w-xs rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3.5 py-2 text-sm text-[var(--crm-text)] placeholder:text-[var(--crm-text-muted)] outline-none focus:border-[#312C85] focus:ring-2 focus:ring-[#312C85]/10"
        />
        <select
          value={filterEstatus}
          onChange={(e) => setFilterEstatus(e.target.value)}
          className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3.5 py-2 text-sm text-[var(--crm-text)] outline-none focus:border-[#312C85] focus:ring-2 focus:ring-[#312C85]/10"
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
        emptyMessage="No se encontraron empleados"
        onEdit={canEdit ? (e) => setModal({ open: true, item: e }) : undefined}
        onDelete={canDelete ? (e) => setDeleteModal({ open: true, item: e }) : undefined}
        canEdit={canEdit}
        canDelete={canDelete}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modales */}
      {modal.open && (
        <EmpleadoModal
          initial={modal.item}
          prefillData={!modal.item && prefill ? prefill : undefined}
          onSave={handleSave}
          onClose={() => setModal({ open: false, item: null })}
        />
      )}

      {deleteModal.open && deleteModal.item && (
        <DeleteConfirmModal
          isOpen
          title="Eliminar empleado"
          subtitle="Confirma que deseas eliminar este registro."
          entityId={deleteModal.item.id}
          entityLabel={`${deleteModal.item.nombre} ${deleteModal.item.apellido_paterno} ${deleteModal.item.apellido_materno}`}
          descriptionPrefix="Estás a punto de eliminar a"
          fallbackLabel="este empleado"
          onConfirm={handleDelete}
          onClose={() => setDeleteModal({ open: false, item: null })}
        />
      )}
    </div>
  );
}
