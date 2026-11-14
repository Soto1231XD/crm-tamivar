import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { BaseTable } from "@/components/ui/BaseTable";
import { BadgeSelect } from "@/components/ui/BadgeSelect";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { useHasPermission } from "@/shared/auth/permissions/useHasPermission";
import agregarIcon from "@/assets/images/Agregar.png";
import {
  getCandidatos, createCandidato, updateCandidato, deleteCandidato,
  type Candidato, type CreateCandidatoPayload, type UpdateCandidatoPayload,
} from "../services/candidatos.api";
import { CandidatoModal } from "../components/CandidatoModal";

function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

const ESTATUS_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  Pendiente:    { backgroundColor: "#fef3c7", color: "#b45309" },
  Entrevistado: { backgroundColor: "#dbeafe", color: "#1d4ed8" },
  Aprobado:     { backgroundColor: "#dcfce7", color: "#15803d" },
  Rechazado:    { backgroundColor: "#fee2e2", color: "#b91c1c" },
};

const TIPO_BADGE: Record<string, string> = {
  Empleado: "bg-slate-100 text-slate-700",
  Becario:  "bg-purple-100 text-purple-700",
};

export function CandidatosPage() {
  const navigate = useNavigate();
  const { can } = useHasPermission();
  const canCreate = can("rh_candidatos", "crear");
  const canEdit   = can("rh_candidatos", "actualizar");
  const canDelete = can("rh_candidatos", "eliminar");

  const [candidatos, setCandidatos]       = useState<Candidato[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [search, setSearch]               = useState("");
  const [filterTipo, setFilterTipo]       = useState("");
  const [filterEstatus, setFilterEstatus] = useState("");

  const [modal, setModal]       = useState<{ open: boolean; item: Candidato | null }>({ open: false, item: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: Candidato | null }>({ open: false, item: null });
  const [updatingEstatusId, setUpdatingEstatusId] = useState<number | null>(null);

  const load = async () => {
    setIsLoading(true);
    try { setCandidatos(await getCandidatos()); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return candidatos.filter((c) => {
      const name = `${c.nombre} ${c.apellido_paterno} ${c.apellido_materno ?? ""}`.toLowerCase();
      const matchSearch = !q || name.includes(q) || c.puesto_solicitado.toLowerCase().includes(q) || c.area.toLowerCase().includes(q);
      const matchTipo = !filterTipo || c.tipo === filterTipo;
      const matchEstatus = !filterEstatus || c.estatus === filterEstatus;
      return matchSearch && matchTipo && matchEstatus;
    });
  }, [candidatos, search, filterTipo, filterEstatus]);

  const handleSave = async (data: CreateCandidatoPayload | UpdateCandidatoPayload) => {
    if (modal.item) {
      const updated = await updateCandidato(modal.item.id, data as UpdateCandidatoPayload);
      setCandidatos((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast.success("Candidato actualizado");
    } else {
      const created = await createCandidato(data as CreateCandidatoPayload);
      setCandidatos((prev) => [created, ...prev]);
      toast.success("Candidato registrado");
    }
  };

  const handleDelete = async (id: number): Promise<string | null> => {
    try {
      await deleteCandidato(id);
      setCandidatos((prev) => prev.filter((c) => c.id !== id));
      setDeleteModal({ open: false, item: null });
      toast.success("Candidato eliminado");
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Error al eliminar";
    }
  };

  const handleEstatusChange = async (id: number, estatus: string) => {
    setUpdatingEstatusId(id);
    try {
      const updated = await updateCandidato(id, { estatus });
      setCandidatos((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch { toast.error("No se pudo actualizar el estatus"); }
    finally { setUpdatingEstatusId(null); }
  };

  // Cuando HR aprueba: navegar a empleados/becarios con datos pre-cargados
  const handleDarDeAlta = (c: Candidato) => {
    const dest = c.tipo === "Becario" ? "/modulos/rh/becarios" : "/modulos/rh/empleados";
    navigate(dest, {
      state: {
        prefill: {
          tipo: c.tipo,
          nombre: c.nombre,
          apellido_paterno: c.apellido_paterno,
          apellido_materno: c.apellido_materno ?? "",
          area: c.area,
          puesto: c.puesto_solicitado,
          telefono: c.telefono ?? "",
          correo: c.correo ?? "",
        },
      },
    });
  };

  const columns = [
    {
      header: "Candidato",
      cellClassName: "min-w-[200px]",
      render: (c: Candidato) => (
        <div>
          <p className="font-semibold text-slate-800">
            {c.nombre} {c.apellido_paterno} {c.apellido_materno ?? ""}
          </p>
          <p className="text-xs text-slate-500">{c.puesto_solicitado}</p>
        </div>
      ),
    },
    {
      header: "Tipo",
      render: (c: Candidato) => (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TIPO_BADGE[c.tipo] ?? ""}`}>
          {c.tipo}
        </span>
      ),
    },
    { header: "Área", render: (c: Candidato) => c.area },
    {
      header: "Entrevista",
      render: (c: Candidato) =>
        c.fecha_entrevista ? formatDate(c.fecha_entrevista) : <span className="text-slate-400">—</span>,
    },
    {
      header: "Estatus",
      render: (c: Candidato) => (
        <BadgeSelect
          value={c.estatus}
          options={["Pendiente", "Entrevistado", "Aprobado", "Rechazado"]}
          onChange={(val) => handleEstatusChange(c.id, val)}
          disabled={updatingEstatusId === c.id}
          canEdit={canEdit}
          getStyles={(val) => ESTATUS_STYLES[val] ?? { backgroundColor: "#f1f5f9", color: "#475569" }}
        />
      ),
    },
    {
      header: "Acción",
      render: (c: Candidato) =>
        c.estatus === "Aprobado" ? (
          <button
            type="button"
            onClick={() => handleDarDeAlta(c)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3M13.5 4.5 10.5 1.5m0 0L7.5 4.5M10.5 1.5v13.5a4.5 4.5 0 0 0 9 0V12" />
            </svg>
            Dar de alta
          </button>
        ) : null,
    },
  ];

  // Resumen
  const totalAprobados    = candidatos.filter((c) => c.estatus === "Aprobado").length;
  const totalEntrevistados = candidatos.filter((c) => c.estatus === "Entrevistado").length;
  const totalRechazados   = candidatos.filter((c) => c.estatus === "Rechazado").length;

  return (
    <div className="flex flex-col gap-6">

      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Candidatos</h1>
          <p className="mt-0.5 text-sm text-slate-500">Registro de entrevistas y candidatos para empleados o becarios</p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setModal({ open: true, item: null })}
            className="flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e293b]"
          >
            <img src={agregarIcon} alt="" className="h-4 w-4" />
            Registrar candidato
          </button>
        )}
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total",        value: candidatos.length,    color: "text-slate-700" },
          { label: "Entrevistados", value: totalEntrevistados,  color: "text-blue-700" },
          { label: "Aprobados",    value: totalAprobados,       color: "text-emerald-700" },
          { label: "Rechazados",   value: totalRechazados,      color: "text-red-600" },
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
          placeholder="Buscar candidato, puesto o área..."
          className="min-w-[220px] flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:ring-2 focus:ring-[#312C85]/10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-[#312C85]"
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
        >
          <option value="">Todos los tipos</option>
          <option value="Empleado">Empleado</option>
          <option value="Becario">Becario</option>
        </select>
        <select
          className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-[#312C85]"
          value={filterEstatus}
          onChange={(e) => setFilterEstatus(e.target.value)}
        >
          <option value="">Todos los estatus</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Entrevistado">Entrevistado</option>
          <option value="Aprobado">Aprobado</option>
          <option value="Rechazado">Rechazado</option>
        </select>
      </div>

      {/* Tabla */}
      <BaseTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No hay candidatos registrados"
        onEdit={canEdit ? (c) => setModal({ open: true, item: c }) : undefined}
        onDelete={canDelete ? (c) => setDeleteModal({ open: true, item: c }) : undefined}
        canEdit={canEdit}
        canDelete={canDelete}
      />

      {/* Modal registro/edición */}
      {modal.open && (
        <CandidatoModal
          initial={modal.item}
          onSave={handleSave}
          onClose={() => setModal({ open: false, item: null })}
        />
      )}

      {/* Modal eliminar */}
      {deleteModal.open && deleteModal.item && (
        <DeleteConfirmModal
          isOpen
          title="Eliminar candidato"
          subtitle="Confirma que deseas eliminar este registro."
          entityId={deleteModal.item.id}
          entityLabel={`${deleteModal.item.nombre} ${deleteModal.item.apellido_paterno}${deleteModal.item.apellido_materno ? ` ${deleteModal.item.apellido_materno}` : ""}`}
          descriptionPrefix="Estás a punto de eliminar a"
          fallbackLabel="este candidato"
          onConfirm={handleDelete}
          onClose={() => setDeleteModal({ open: false, item: null })}
        />
      )}
    </div>
  );
}
