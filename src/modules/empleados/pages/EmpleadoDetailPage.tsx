import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useHasPermission } from "@/shared/auth/permissions/useHasPermission";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { BaseTable } from "@/components/ui/BaseTable";
import agregarIcon from "@/assets/images/Agregar.png";
import {
  getEmpleado,
  type Empleado,
} from "../services/empleados.api";
import {
  getFaltasByEmpleado,
  createFalta,
  updateFalta,
  deleteFalta,
  type Falta,
  type CreateFaltaPayload,
  type UpdateFaltaPayload,
} from "../services/faltas.api";
import {
  getVacacionesByEmpleado,
  createVacacion,
  updateVacacion,
  deleteVacacion,
  calcularAntigüedad,
  calcularDerechoVacaciones,
  type Vacacion,
  type CreateVacacionPayload,
  type UpdateVacacionPayload,
} from "../services/vacaciones.api";
import {
  getPermisosByEmpleado,
  createPermiso,
  updatePermiso,
  deletePermiso,
  type PermisoEmpleado,
  type CreatePermisoPayload,
  type UpdatePermisoPayload,
} from "../services/permisos.api";
import { FaltaModal } from "../components/FaltaModal";
import { VacacionModal } from "../components/VacacionModal";
import { PermisoModal } from "../components/PermisoModal";
import {
  getIncapacidadesByEmpleado,
  createIncapacidad,
  updateIncapacidad,
  deleteIncapacidad,
  type Incapacidad,
  type CreateIncapacidadPayload,
  type UpdateIncapacidadPayload,
} from "../services/incapacidades.api";
import { IncapacidadModal } from "../components/IncapacidadModal";
import {
  getBajasByEmpleado,
  createBaja,
  updateBaja,
  deleteBaja,
  type Baja,
  type CreateBajaPayload,
  type UpdateBajaPayload,
} from "../services/bajas.api";
import { BajaModal } from "../components/BajaModal";
import {
  getDocumentosByEmpleado,
  uploadDocumento,
  deleteDocumento,
  TIPOS_DOCUMENTO,
  type DocumentoEmpleado,
} from "../services/documentos.api";

type Tab = "faltas" | "vacaciones" | "permisos" | "incapacidades" | "bajas" | "documentos" | "reporte";
const TABS: { key: Tab; label: string }[] = [
  { key: "faltas",         label: "Faltas" },
  { key: "vacaciones",     label: "Vacaciones" },
  { key: "permisos",       label: "Permisos" },
  { key: "incapacidades",  label: "Incapacidades" },
  { key: "bajas",          label: "Bajas" },
  { key: "documentos",     label: "Documentos" },
  { key: "reporte",        label: "Reporte Individual" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export function EmpleadoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const empleadoId = Number(id);
  const { can } = useHasPermission();
  const canEdit = can("rh_empleados", "actualizar");

  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [tab, setTab] = useState<Tab>("faltas");

  // Faltas state
  const [faltas, setFaltas] = useState<Falta[]>([]);
  const [loadingFaltas, setLoadingFaltas] = useState(true);
  const [faltaModal, setFaltaModal] = useState<{ open: boolean; item: Falta | null }>({ open: false, item: null });
  const [deleteFaltaModal, setDeleteFaltaModal] = useState<{ open: boolean; item: Falta | null }>({ open: false, item: null });

  // Vacaciones state
  const [vacaciones, setVacaciones] = useState<Vacacion[]>([]);
  const [loadingVac, setLoadingVac] = useState(true);
  const [vacModal, setVacModal] = useState<{ open: boolean; item: Vacacion | null }>({ open: false, item: null });
  const [deleteVacModal, setDeleteVacModal] = useState<{ open: boolean; item: Vacacion | null }>({ open: false, item: null });

  // Incapacidades state
  const [incapacidades, setIncapacidades] = useState<Incapacidad[]>([]);
  const [loadingInc, setLoadingInc] = useState(true);
  const [incModal, setIncModal] = useState<{ open: boolean; item: Incapacidad | null }>({ open: false, item: null });
  const [deleteIncModal, setDeleteIncModal] = useState<{ open: boolean; item: Incapacidad | null }>({ open: false, item: null });

  // Permisos state
  const [permisos, setPermisos] = useState<PermisoEmpleado[]>([]);
  const [loadingPermisos, setLoadingPermisos] = useState(true);
  const [permisoModal, setPermisoModal] = useState<{ open: boolean; item: PermisoEmpleado | null }>({ open: false, item: null });
  const [deletePermisoModal, setDeletePermisoModal] = useState<{ open: boolean; item: PermisoEmpleado | null }>({ open: false, item: null });

  // Bajas state
  const [bajas, setBajas] = useState<Baja[]>([]);
  const [loadingBajas, setLoadingBajas] = useState(true);
  const [bajaModal, setBajaModal] = useState<{ open: boolean; item: Baja | null }>({ open: false, item: null });
  const [deleteBajaModal, setDeleteBajaModal] = useState<{ open: boolean; item: Baja | null }>({ open: false, item: null });

  // Documentos state
  const [documentos, setDocumentos] = useState<DocumentoEmpleado[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploadingTipo, setUploadingTipo] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null);

  useEffect(() => {
    if (!empleadoId) return;
    getEmpleado(empleadoId)
      .then(setEmpleado)
      .catch(() => navigate("/modulos/rh/empleados", { replace: true }));
  }, [empleadoId, navigate]);

  const loadFaltas = async () => {
    setLoadingFaltas(true);
    try { setFaltas(await getFaltasByEmpleado(empleadoId)); }
    finally { setLoadingFaltas(false); }
  };

  useEffect(() => { if (empleadoId) loadFaltas(); }, [empleadoId]);

  const loadVacaciones = async () => {
    setLoadingVac(true);
    try { setVacaciones(await getVacacionesByEmpleado(empleadoId)); }
    finally { setLoadingVac(false); }
  };

  useEffect(() => { if (empleadoId) loadVacaciones(); }, [empleadoId]);

  const handleSaveFalta = async (data: CreateFaltaPayload | UpdateFaltaPayload) => {
    if (faltaModal.item) {
      await updateFalta(faltaModal.item.id, data as UpdateFaltaPayload);
      toast.success("Falta actualizada");
    } else {
      await createFalta(data as CreateFaltaPayload);
      toast.success("Falta registrada");
    }
    await loadFaltas();
  };

  const handleDeleteFalta = async (faltaId: number): Promise<string | null> => {
    try {
      await deleteFalta(faltaId);
      await loadFaltas();
      toast.success("Falta eliminada");
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "No se pudo eliminar.";
    }
  };

  const loadIncapacidades = async () => {
    setLoadingInc(true);
    try { setIncapacidades(await getIncapacidadesByEmpleado(empleadoId)); }
    finally { setLoadingInc(false); }
  };

  useEffect(() => { if (empleadoId) loadIncapacidades(); }, [empleadoId]);

  const handleSaveIncapacidad = async (data: CreateIncapacidadPayload | UpdateIncapacidadPayload) => {
    if (incModal.item) {
      await updateIncapacidad(incModal.item.id, data as UpdateIncapacidadPayload);
      toast.success("Incapacidad actualizada");
    } else {
      await createIncapacidad(data as CreateIncapacidadPayload);
      toast.success("Incapacidad registrada");
    }
    await loadIncapacidades();
  };

  const handleDeleteIncapacidad = async (incId: number): Promise<string | null> => {
    try {
      await deleteIncapacidad(incId);
      await loadIncapacidades();
      toast.success("Incapacidad eliminada");
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "No se pudo eliminar.";
    }
  };

  const loadPermisos = async () => {
    setLoadingPermisos(true);
    try { setPermisos(await getPermisosByEmpleado(empleadoId)); }
    finally { setLoadingPermisos(false); }
  };

  useEffect(() => { if (empleadoId) loadPermisos(); }, [empleadoId]);

  const handleSavePermiso = async (data: CreatePermisoPayload | UpdatePermisoPayload) => {
    if (permisoModal.item) {
      await updatePermiso(permisoModal.item.id, data as UpdatePermisoPayload);
      toast.success("Permiso actualizado");
    } else {
      await createPermiso(data as CreatePermisoPayload);
      toast.success("Permiso registrado");
    }
    await loadPermisos();
  };

  const handleDeletePermiso = async (permisoId: number): Promise<string | null> => {
    try {
      await deletePermiso(permisoId);
      await loadPermisos();
      toast.success("Permiso eliminado");
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "No se pudo eliminar.";
    }
  };

  const loadBajas = async () => {
    setLoadingBajas(true);
    try { setBajas(await getBajasByEmpleado(empleadoId)); }
    finally { setLoadingBajas(false); }
  };

  useEffect(() => { if (empleadoId) loadBajas(); }, [empleadoId]);

  const handleSaveBaja = async (data: CreateBajaPayload | UpdateBajaPayload) => {
    if (bajaModal.item) {
      await updateBaja(bajaModal.item.id, data as UpdateBajaPayload);
      toast.success("Baja actualizada");
    } else {
      await createBaja(data as CreateBajaPayload);
      toast.success("Baja registrada");
    }
    await loadBajas();
  };

  const handleDeleteBaja = async (bajaId: number): Promise<string | null> => {
    try {
      await deleteBaja(bajaId);
      await loadBajas();
      toast.success("Baja eliminada");
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "No se pudo eliminar.";
    }
  };

  const loadDocumentos = async () => {
    setLoadingDocs(true);
    try { setDocumentos(await getDocumentosByEmpleado(empleadoId)); }
    finally { setLoadingDocs(false); }
  };

  useEffect(() => { if (empleadoId) loadDocumentos(); }, [empleadoId]);

  const handleUploadDocumento = async (tipo: string, file: File) => {
    setUploadingTipo(tipo);
    try {
      await uploadDocumento(empleadoId, tipo, file);
      await loadDocumentos();
      toast.success("Documento subido");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir documento");
    } finally {
      setUploadingTipo(null);
    }
  };

  const handleDeleteDocumento = async (id: number) => {
    setDeletingDocId(id);
    try {
      await deleteDocumento(id);
      await loadDocumentos();
      toast.success("Documento eliminado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleSaveVacacion = async (data: CreateVacacionPayload | UpdateVacacionPayload) => {
    if (vacModal.item) {
      await updateVacacion(vacModal.item.id, data as UpdateVacacionPayload);
      toast.success("Vacación actualizada");
    } else {
      await createVacacion(data as CreateVacacionPayload);
      toast.success("Vacación registrada");
    }
    await loadVacaciones();
  };

  const handleDeleteVacacion = async (vacId: number): Promise<string | null> => {
    try {
      await deleteVacacion(vacId);
      await loadVacaciones();
      toast.success("Vacación eliminada");
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "No se pudo eliminar.";
    }
  };

  const faltasColumns = [
    { header: "Fecha", render: (f: Falta) => formatDate(f.fecha) },
    {
      header: "Tipo",
      render: (f: Falta) => (
        <span className={[
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
          f.tipo === "Justificada" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700",
        ].join(" ")}>
          {f.tipo}
        </span>
      ),
    },
    { header: "Descripción", render: (f: Falta) => f.descripcion ?? <span className="text-slate-300">—</span> },
  ];

  if (!empleado) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#312C85]" />
      </div>
    );
  }

  const nombreCompleto = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno}`;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate("/modulos/rh/empleados")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          ← Volver
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--crm-text)]">{nombreCompleto}</h1>
          <p className="text-sm text-[var(--crm-text-muted)]">{empleado.puesto} · {empleado.area}</p>
        </div>
        <span className={[
          "ml-auto inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
          empleado.estatus === "Activo" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
        ].join(" ")}>
          {empleado.estatus}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={[
                "px-5 py-2.5 text-sm font-semibold transition border-b-2",
                tab === t.key
                  ? "border-[#312C85] text-[#312C85]"
                  : "border-transparent text-slate-500 hover:text-slate-700",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {tab === "faltas" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--crm-text-muted)]">
              {faltas.length} {faltas.length === 1 ? "falta registrada" : "faltas registradas"}
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={() => setFaltaModal({ open: true, item: null })}
                className="flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e293b]"
              >
                <img src={agregarIcon} alt="" className="h-4 w-4" />
                Registrar falta
              </button>
            )}
          </div>

          <BaseTable
            data={faltas}
            columns={faltasColumns}
            isLoading={loadingFaltas}
            emptyMessage="No hay faltas registradas"
            onEdit={canEdit ? (f) => setFaltaModal({ open: true, item: f }) : undefined}
            onDelete={canEdit ? (f) => setDeleteFaltaModal({ open: true, item: f }) : undefined}
            canEdit={canEdit}
            canDelete={canEdit}
          />
        </div>
      )}

      {tab === "vacaciones" && empleado && (() => {
        const antiguedad = calcularAntigüedad(empleado.fecha_ingreso);
        const derecho    = calcularDerechoVacaciones(antiguedad);
        const ocupados   = vacaciones
          .filter((v) => v.estatus === "Aprobada" || v.estatus === "Pendiente")
          .reduce((s, v) => s + v.dias, 0);
        const disponibles = Math.max(0, derecho - ocupados);

        const vacColumns = [
          { header: "Inicio",  render: (v: Vacacion) => formatDate(v.fecha_inicio) },
          { header: "Fin",     render: (v: Vacacion) => formatDate(v.fecha_fin) },
          { header: "Días",    render: (v: Vacacion) => <span className="font-semibold">{v.dias}</span> },
          {
            header: "Estatus",
            render: (v: Vacacion) => (
              <span className={[
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                v.estatus === "Aprobada"  ? "bg-green-100 text-green-700"  :
                v.estatus === "Rechazada" ? "bg-red-100 text-red-700"      :
                                            "bg-amber-100 text-amber-700",
              ].join(" ")}>
                {v.estatus}
              </span>
            ),
          },
        ];

        return (
          <div className="flex flex-col gap-4">
            {/* Tarjetas resumen */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Antigüedad",            value: `${antiguedad} año${antiguedad !== 1 ? "s" : ""}`, color: "text-slate-700" },
                { label: "Derecho a vacaciones",  value: `${derecho} días`,     color: "text-[#312C85]" },
                { label: "Días ocupados",         value: `${ocupados} días`,    color: "text-amber-600" },
                { label: "Días disponibles",      value: `${disponibles} días`, color: disponibles > 0 ? "text-green-600" : "text-red-600" },
              ].map((card) => (
                <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.label}</p>
                  <p className={`mt-1 text-xl font-bold ${card.color}`}>{card.value}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--crm-text-muted)]">
                {vacaciones.length} {vacaciones.length === 1 ? "período registrado" : "períodos registrados"}
              </p>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setVacModal({ open: true, item: null })}
                  className="flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e293b]"
                >
                  <img src={agregarIcon} alt="" className="h-4 w-4" />
                  Registrar vacación
                </button>
              )}
            </div>

            <BaseTable
              data={vacaciones}
              columns={vacColumns}
              isLoading={loadingVac}
              emptyMessage="No hay vacaciones registradas"
              onEdit={canEdit ? (v) => setVacModal({ open: true, item: v }) : undefined}
              onDelete={canEdit ? (v) => setDeleteVacModal({ open: true, item: v }) : undefined}
              canEdit={canEdit}
              canDelete={canEdit}
            />
          </div>
        );
      })()}

      {tab === "incapacidades" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--crm-text-muted)]">
              {incapacidades.length} {incapacidades.length === 1 ? "incapacidad registrada" : "incapacidades registradas"}
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={() => setIncModal({ open: true, item: null })}
                className="flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e293b]"
              >
                <img src={agregarIcon} alt="" className="h-4 w-4" />
                Registrar incapacidad
              </button>
            )}
          </div>

          <BaseTable
            data={incapacidades}
            columns={[
              { header: "Inicio",  render: (i: Incapacidad) => formatDate(i.fecha_inicio) },
              { header: "Fin",     render: (i: Incapacidad) => formatDate(i.fecha_fin) },
              { header: "Días",    render: (i: Incapacidad) => <span className="font-semibold">{i.dias}</span> },
              {
                header: "Tipo",
                render: (i: Incapacidad) => (
                  <span className={[
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    i.tipo === "IMSS" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700",
                  ].join(" ")}>
                    {i.tipo}
                  </span>
                ),
              },
              {
                header: "Estatus",
                render: (i: Incapacidad) => (
                  <span className={[
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    i.estatus === "Aprobada"  ? "bg-green-100 text-green-700"  :
                    i.estatus === "Rechazada" ? "bg-red-100 text-red-700"      :
                                                "bg-amber-100 text-amber-700",
                  ].join(" ")}>
                    {i.estatus}
                  </span>
                ),
              },
              { header: "Descripción", render: (i: Incapacidad) => i.descripcion ?? <span className="text-slate-300">—</span> },
            ]}
            isLoading={loadingInc}
            emptyMessage="No hay incapacidades registradas"
            onEdit={canEdit ? (i) => setIncModal({ open: true, item: i }) : undefined}
            onDelete={canEdit ? (i) => setDeleteIncModal({ open: true, item: i }) : undefined}
            canEdit={canEdit}
            canDelete={canEdit}
          />
        </div>
      )}

      {tab === "permisos" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--crm-text-muted)]">
              {permisos.length} {permisos.length === 1 ? "permiso registrado" : "permisos registrados"}
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={() => setPermisoModal({ open: true, item: null })}
                className="flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e293b]"
              >
                <img src={agregarIcon} alt="" className="h-4 w-4" />
                Registrar permiso
              </button>
            )}
          </div>

          <BaseTable
            data={permisos}
            columns={[
              { header: "Fecha", render: (p: PermisoEmpleado) => formatDate(p.fecha) },
              {
                header: "Tipo",
                render: (p: PermisoEmpleado) => (
                  <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    {p.tipo}
                  </span>
                ),
              },
              {
                header: "Goce",
                render: (p: PermisoEmpleado) => (
                  <span className={[
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    p.con_goce ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600",
                  ].join(" ")}>
                    {p.con_goce ? "Con goce" : "Sin goce"}
                  </span>
                ),
              },
              {
                header: "Estatus",
                render: (p: PermisoEmpleado) => (
                  <span className={[
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    p.estatus === "Aprobado"  ? "bg-green-100 text-green-700"  :
                    p.estatus === "Rechazado" ? "bg-red-100 text-red-700"      :
                                                "bg-amber-100 text-amber-700",
                  ].join(" ")}>
                    {p.estatus}
                  </span>
                ),
              },
              { header: "Descripción", render: (p: PermisoEmpleado) => p.descripcion ?? <span className="text-slate-300">—</span> },
            ]}
            isLoading={loadingPermisos}
            emptyMessage="No hay permisos registrados"
            onEdit={canEdit ? (p) => setPermisoModal({ open: true, item: p }) : undefined}
            onDelete={canEdit ? (p) => setDeletePermisoModal({ open: true, item: p }) : undefined}
            canEdit={canEdit}
            canDelete={canEdit}
          />
        </div>
      )}

      {tab === "bajas" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--crm-text-muted)]">
              {bajas.length} {bajas.length === 1 ? "baja registrada" : "bajas registradas"}
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={() => setBajaModal({ open: true, item: null })}
                className="flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e293b]"
              >
                <img src={agregarIcon} alt="" className="h-4 w-4" />
                Registrar baja
              </button>
            )}
          </div>

          <BaseTable
            data={bajas}
            columns={[
              { header: "Fecha de baja", render: (b: Baja) => formatDate(b.fecha_baja) },
              {
                header: "Tipo",
                render: (b: Baja) => (
                  <span className={[
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    b.tipo === "Renuncia"         ? "bg-amber-100 text-amber-700"  :
                    b.tipo === "Despido"           ? "bg-red-100 text-red-700"      :
                                                    "bg-slate-100 text-slate-600",
                  ].join(" ")}>
                    {b.tipo}
                  </span>
                ),
              },
              { header: "Motivo", render: (b: Baja) => b.descripcion ?? <span className="text-slate-300">—</span> },
            ]}
            isLoading={loadingBajas}
            emptyMessage="No hay bajas registradas"
            onEdit={canEdit ? (b) => setBajaModal({ open: true, item: b }) : undefined}
            onDelete={canEdit ? (b) => setDeleteBajaModal({ open: true, item: b }) : undefined}
            canEdit={canEdit}
            canDelete={canEdit}
          />
        </div>
      )}

      {/* Modales faltas */}
      {faltaModal.open && (
        <FaltaModal
          empleadoId={empleadoId}
          initial={faltaModal.item}
          onSave={handleSaveFalta}
          onClose={() => setFaltaModal({ open: false, item: null })}
        />
      )}

      {deleteFaltaModal.open && deleteFaltaModal.item && (
        <DeleteConfirmModal
          isOpen
          title="Eliminar falta"
          subtitle="Esta acción no se puede deshacer."
          entityId={deleteFaltaModal.item.id}
          entityLabel={`Falta del ${formatDate(deleteFaltaModal.item.fecha)}`}
          descriptionPrefix="Estás a punto de eliminar la"
          fallbackLabel="esta falta"
          onConfirm={handleDeleteFalta}
          onClose={() => setDeleteFaltaModal({ open: false, item: null })}
        />
      )}

      {/* Modales incapacidades */}
      {incModal.open && (
        <IncapacidadModal
          empleadoId={empleadoId}
          initial={incModal.item}
          onSave={handleSaveIncapacidad}
          onClose={() => setIncModal({ open: false, item: null })}
        />
      )}

      {deleteIncModal.open && deleteIncModal.item && (
        <DeleteConfirmModal
          isOpen
          title="Eliminar incapacidad"
          subtitle="Esta acción no se puede deshacer."
          entityId={deleteIncModal.item.id}
          entityLabel={`Incapacidad del ${formatDate(deleteIncModal.item.fecha_inicio)}`}
          descriptionPrefix="Estás a punto de eliminar la"
          fallbackLabel="esta incapacidad"
          onConfirm={handleDeleteIncapacidad}
          onClose={() => setDeleteIncModal({ open: false, item: null })}
        />
      )}

      {/* Modales permisos */}
      {permisoModal.open && (
        <PermisoModal
          empleadoId={empleadoId}
          initial={permisoModal.item}
          onSave={handleSavePermiso}
          onClose={() => setPermisoModal({ open: false, item: null })}
        />
      )}

      {deletePermisoModal.open && deletePermisoModal.item && (
        <DeleteConfirmModal
          isOpen
          title="Eliminar permiso"
          subtitle="Esta acción no se puede deshacer."
          entityId={deletePermisoModal.item.id}
          entityLabel={`Permiso del ${formatDate(deletePermisoModal.item.fecha)}`}
          descriptionPrefix="Estás a punto de eliminar el"
          fallbackLabel="este permiso"
          onConfirm={handleDeletePermiso}
          onClose={() => setDeletePermisoModal({ open: false, item: null })}
        />
      )}

      {tab === "documentos" && (() => {
        const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
        const subidos = TIPOS_DOCUMENTO.length;
        const entregados = documentos.length;

        return (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--crm-text-muted)]">
                {entregados} de {subidos} documentos entregados
              </p>
              <span className={[
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                entregados === subidos ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
              ].join(" ")}>
                {entregados === subidos ? "Expediente completo" : `Faltan ${subidos - entregados} documentos`}
              </span>
            </div>

            {loadingDocs ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#312C85]" />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {TIPOS_DOCUMENTO.map((tipo) => {
                  const doc = documentos.find((d) => d.tipo === tipo);
                  const isUploading = uploadingTipo === tipo;
                  const isDeleting  = doc ? deletingDocId === doc.id : false;

                  return (
                    <div key={tipo} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-700 leading-tight">{tipo}</p>
                        <span className={[
                          "shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                          doc ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500",
                        ].join(" ")}>
                          {doc ? "Subido" : "Pendiente"}
                        </span>
                      </div>

                      {doc && (
                        <p className="truncate text-xs text-slate-400">{doc.nombre_archivo}</p>
                      )}

                      <div className="mt-auto flex gap-2 pt-1">
                        {doc ? (
                          <>
                            <a
                              href={`${API_BASE}${doc.archivo_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-center text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                            >
                              Ver
                            </a>
                            {canEdit && (
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleDeleteDocumento(doc.id)}
                                className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                              >
                                {isDeleting ? "..." : "Eliminar"}
                              </button>
                            )}
                          </>
                        ) : canEdit ? (
                          <label className={[
                            "flex-1 cursor-pointer rounded-lg py-1.5 text-center text-xs font-semibold text-white transition",
                            isUploading ? "bg-[#312C85]/60 cursor-not-allowed" : "bg-[#312C85] hover:bg-[#4338ca]",
                          ].join(" ")}>
                            {isUploading ? "Subiendo..." : "Subir archivo"}
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.webp"
                              className="hidden"
                              disabled={isUploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadDocumento(tipo, file);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        ) : (
                          <span className="flex-1 py-1.5 text-center text-xs text-slate-400">Sin permiso</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {tab === "reporte" && empleado && (() => {
        const antiguedad     = calcularAntigüedad(empleado.fecha_ingreso);
        const derechoVac     = calcularDerechoVacaciones(antiguedad);
        const vacAprobadas   = vacaciones.filter((v) => v.estatus === "Aprobada" || v.estatus === "Pendiente").reduce((s, v) => s + v.dias, 0);
        const vacDisponibles = Math.max(0, derechoVac - vacAprobadas);

        const faltasJust   = faltas.filter((f) => f.tipo === "Justificada").length;
        const faltasInjust = faltas.filter((f) => f.tipo === "Injustificada").length;

        const permisosConGoce = permisos.filter((p) => p.con_goce).length;
        const permisosSinGoce = permisos.filter((p) => !p.con_goce).length;

        const diasIncap = incapacidades.reduce((s, i) => s + i.dias, 0);
        const incIMSS   = incapacidades.filter((i) => i.tipo === "IMSS").length;
        const incPart   = incapacidades.filter((i) => i.tipo === "Particular").length;

        const ultimaBaja = bajas.length > 0
          ? bajas.sort((a, b) => new Date(b.fecha_baja).getTime() - new Date(a.fecha_baja).getTime())[0]
          : null;

        const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">{title}</h3>
            {children}
          </div>
        );

        const StatRow = ({ label, value, color = "text-slate-800" }: { label: string; value: string | number; color?: string }) => (
          <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <span className="text-sm text-slate-500">{label}</span>
            <span className={`text-sm font-semibold ${color}`}>{value}</span>
          </div>
        );

        return (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--crm-text)]">Reporte al {new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}</p>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
              >
                Imprimir
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Datos del empleado */}
              <Section title="Datos generales">
                <StatRow label="Nombre"         value={`${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno}`} />
                <StatRow label="Puesto"          value={empleado.puesto} />
                <StatRow label="Área"            value={empleado.area} />
                <StatRow label="Fecha de ingreso" value={formatDate(empleado.fecha_ingreso)} />
                <StatRow label="Antigüedad"      value={`${antiguedad} año${antiguedad !== 1 ? "s" : ""}`} color="text-[#312C85]" />
                <StatRow
                  label="Estatus"
                  value={empleado.estatus}
                  color={empleado.estatus === "Activo" ? "text-green-600" : "text-red-600"}
                />
              </Section>

              {/* Vacaciones */}
              <Section title="Vacaciones">
                <StatRow label="Derecho LFT"    value={`${derechoVac} días`}      color="text-[#312C85]" />
                <StatRow label="Días tomados"    value={`${vacAprobadas} días`}    color="text-amber-600" />
                <StatRow label="Días disponibles" value={`${vacDisponibles} días`} color={vacDisponibles > 0 ? "text-green-600" : "text-red-600"} />
                <StatRow label="Períodos registrados" value={vacaciones.length} />
              </Section>

              {/* Faltas */}
              <Section title="Faltas">
                <StatRow label="Total de faltas"    value={faltas.length}  color={faltas.length > 0 ? "text-red-600" : "text-slate-800"} />
                <StatRow label="Justificadas"       value={faltasJust}     color={faltasJust > 0 ? "text-blue-600" : "text-slate-800"} />
                <StatRow label="Injustificadas"     value={faltasInjust}   color={faltasInjust > 0 ? "text-red-600" : "text-slate-800"} />
              </Section>

              {/* Permisos */}
              <Section title="Permisos">
                <StatRow label="Total de permisos" value={permisos.length} />
                <StatRow label="Con goce de sueldo" value={permisosConGoce} color="text-green-600" />
                <StatRow label="Sin goce de sueldo" value={permisosSinGoce} color={permisosSinGoce > 0 ? "text-amber-600" : "text-slate-800"} />
                <StatRow label="Aprobados"          value={permisos.filter((p) => p.estatus === "Aprobado").length}  color="text-green-600" />
                <StatRow label="Pendientes"         value={permisos.filter((p) => p.estatus === "Pendiente").length} color="text-amber-600" />
                <StatRow label="Rechazados"         value={permisos.filter((p) => p.estatus === "Rechazado").length} color={permisos.filter((p) => p.estatus === "Rechazado").length > 0 ? "text-red-600" : "text-slate-800"} />
              </Section>

              {/* Incapacidades */}
              <Section title="Incapacidades">
                <StatRow label="Total de incapacidades" value={incapacidades.length} />
                <StatRow label="Días totales"           value={`${diasIncap} días`} color={diasIncap > 0 ? "text-amber-600" : "text-slate-800"} />
                <StatRow label="IMSS"                   value={incIMSS} color="text-blue-600" />
                <StatRow label="Particulares"           value={incPart} color="text-purple-600" />
                <StatRow label="Aprobadas"              value={incapacidades.filter((i) => i.estatus === "Aprobada").length}  color="text-green-600" />
                <StatRow label="Pendientes"             value={incapacidades.filter((i) => i.estatus === "Pendiente").length} color="text-amber-600" />
              </Section>

              {/* Bajas */}
              <Section title="Bajas">
                {bajas.length === 0 ? (
                  <p className="py-2 text-sm text-slate-400">Sin bajas registradas</p>
                ) : (
                  <>
                    <StatRow label="Total de bajas" value={bajas.length} />
                    {ultimaBaja && (
                      <>
                        <StatRow label="Última baja"  value={formatDate(ultimaBaja.fecha_baja)} />
                        <StatRow
                          label="Tipo"
                          value={ultimaBaja.tipo}
                          color={ultimaBaja.tipo === "Despido" ? "text-red-600" : "text-amber-600"}
                        />
                        {ultimaBaja.descripcion && (
                          <div className="mt-2 rounded-lg bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">{ultimaBaja.descripcion}</p>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </Section>
            </div>
          </div>
        );
      })()}

      {/* Modales bajas */}
      {bajaModal.open && (
        <BajaModal
          empleadoId={empleadoId}
          initial={bajaModal.item}
          onSave={handleSaveBaja}
          onClose={() => setBajaModal({ open: false, item: null })}
        />
      )}

      {deleteBajaModal.open && deleteBajaModal.item && (
        <DeleteConfirmModal
          isOpen
          title="Eliminar baja"
          subtitle="Esta acción no se puede deshacer."
          entityId={deleteBajaModal.item.id}
          entityLabel={`Baja del ${formatDate(deleteBajaModal.item.fecha_baja)}`}
          descriptionPrefix="Estás a punto de eliminar la"
          fallbackLabel="esta baja"
          onConfirm={handleDeleteBaja}
          onClose={() => setDeleteBajaModal({ open: false, item: null })}
        />
      )}

      {/* Modales vacaciones */}
      {vacModal.open && (
        <VacacionModal
          empleadoId={empleadoId}
          initial={vacModal.item}
          onSave={handleSaveVacacion}
          onClose={() => setVacModal({ open: false, item: null })}
        />
      )}

      {deleteVacModal.open && deleteVacModal.item && (
        <DeleteConfirmModal
          isOpen
          title="Eliminar vacación"
          subtitle="Esta acción no se puede deshacer."
          entityId={deleteVacModal.item.id}
          entityLabel={`Vacación del ${formatDate(deleteVacModal.item.fecha_inicio)}`}
          descriptionPrefix="Estás a punto de eliminar la"
          fallbackLabel="esta vacación"
          onConfirm={handleDeleteVacacion}
          onClose={() => setDeleteVacModal({ open: false, item: null })}
        />
      )}
    </div>
  );
}
