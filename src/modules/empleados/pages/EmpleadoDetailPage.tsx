import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useHasPermission } from "@/shared/auth/permissions/useHasPermission";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { BaseTable } from "@/components/ui/BaseTable";
import { BadgeSelect } from "@/components/ui/BadgeSelect";
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
  clasificarPeriodoVacacion,
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
import {
  getHistorialIngresos,
  reactivarEmpleado,
  type HistorialIngreso,
} from "../services/historial-ingreso.api";
import { generarConstanciaAnual, generarSolicitudVacaciones } from "../utils/documentos-rh";
import {
  getAmonestacionesByEmpleado,
  createAmonestacion,
  updateAmonestacion,
  deleteAmonestacion,
  type Amonestacion,
  type CreateAmonestacionPayload,
  type UpdateAmonestacionPayload,
} from "../services/amonestaciones.api";
import { AmonestacionModal } from "../components/AmonestacionModal";

type Tab = "faltas" | "vacaciones" | "permisos" | "incapacidades" | "amonestaciones" | "historial" | "documentos" | "reporte";
const TABS: { key: Tab; label: string }[] = [
  { key: "faltas",          label: "Faltas" },
  { key: "vacaciones",      label: "Vacaciones" },
  { key: "permisos",        label: "Permisos" },
  { key: "incapacidades",   label: "Incapacidades" },
  { key: "amonestaciones",  label: "Amonestaciones" },
  { key: "historial",       label: "Historial" },
  { key: "documentos",      label: "Documentos" },
  { key: "reporte",         label: "Reporte Individual" },
];

function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
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

  // Amonestaciones state
  const [amonestaciones, setAmonestaciones] = useState<Amonestacion[]>([]);
  const [loadingAmonestaciones, setLoadingAmonestaciones] = useState(true);
  const [amonestacionModal, setAmonestacionModal] = useState<{ open: boolean; item: Amonestacion | null }>({ open: false, item: null });
  const [deleteAmonestacionModal, setDeleteAmonestacionModal] = useState<{ open: boolean; item: Amonestacion | null }>({ open: false, item: null });

  // Historial ingresos state
  const [historialIngresos, setHistorialIngresos] = useState<HistorialIngreso[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [reactivando, setReactivando] = useState(false);
  const [reactivarModal, setReactivarModal] = useState(false);
  const [fechaReingreso, setFechaReingreso] = useState("");

  // Documentos state
  const [documentos, setDocumentos] = useState<DocumentoEmpleado[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploadingTipo, setUploadingTipo] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null);
  const [psicModal, setPsicModal] = useState(false);
  const [psicNombre, setPsicNombre] = useState("");
  const [psicFile, setPsicFile] = useState<File | null>(null);
  const [examenModal, setExamenModal] = useState(false);
  const [examenNombre, setExamenNombre] = useState("");
  const [examenFile, setExamenFile] = useState<File | null>(null);

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

  const loadHistorial = async () => {
    setLoadingHistorial(true);
    try { setHistorialIngresos(await getHistorialIngresos(empleadoId)); }
    finally { setLoadingHistorial(false); }
  };

  useEffect(() => {
    if (empleadoId) {
      void loadBajas();
      void loadHistorial();
    }
  }, [empleadoId]);

  const handleSaveBaja = async (data: CreateBajaPayload | UpdateBajaPayload) => {
    if (bajaModal.item) {
      await updateBaja(bajaModal.item.id, data as UpdateBajaPayload);
      toast.success("Baja actualizada");
    } else {
      await createBaja(data as CreateBajaPayload);
      toast.success("Baja registrada");
      // Refresca el empleado para que el estatus se actualice en el header
      getEmpleado(empleadoId).then(setEmpleado).catch(() => null);
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

  const loadAmonestaciones = async () => {
    setLoadingAmonestaciones(true);
    try { setAmonestaciones(await getAmonestacionesByEmpleado(empleadoId)); }
    finally { setLoadingAmonestaciones(false); }
  };

  useEffect(() => { if (empleadoId) loadAmonestaciones(); }, [empleadoId]);

  const handleSaveAmonestacion = async (data: CreateAmonestacionPayload | UpdateAmonestacionPayload) => {
    if (amonestacionModal.item) {
      await updateAmonestacion(amonestacionModal.item.id, data as UpdateAmonestacionPayload);
      toast.success("Amonestación actualizada");
    } else {
      await createAmonestacion(data as CreateAmonestacionPayload);
      toast.success("Amonestación registrada");
    }
    await loadAmonestaciones();
  };

  const handleDeleteAmonestacion = async (id: number): Promise<string | null> => {
    try {
      await deleteAmonestacion(id);
      await loadAmonestaciones();
      toast.success("Amonestación eliminada");
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "No se pudo eliminar.";
    }
  };

  const handleReactivar = async () => {
    if (!fechaReingreso) return;
    setReactivando(true);
    try {
      await reactivarEmpleado(empleadoId, fechaReingreso);
      toast.success("Empleado reactivado");
      setReactivarModal(false);
      setFechaReingreso("");
      getEmpleado(empleadoId).then(setEmpleado).catch(() => null);
      await loadHistorial();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo reactivar.");
    } finally {
      setReactivando(false);
    }
  };

  const loadDocumentos = async () => {
    setLoadingDocs(true);
    try { setDocumentos(await getDocumentosByEmpleado(empleadoId)); }
    finally { setLoadingDocs(false); }
  };

  useEffect(() => { if (empleadoId) loadDocumentos(); }, [empleadoId]);

  const handleUploadDocumento = async (tipo: string, file: File, descripcion?: string) => {
    setUploadingTipo(tipo);
    try {
      await uploadDocumento(empleadoId, tipo, file, descripcion);
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

  const handleSaveVacacion = async (data: CreateVacacionPayload | UpdateVacacionPayload): Promise<Vacacion> => {
    let saved: Vacacion;
    if (vacModal.item) {
      saved = await updateVacacion(vacModal.item.id, data as UpdateVacacionPayload);
      toast.success("Vacación actualizada");
    } else {
      saved = await createVacacion(data as CreateVacacionPayload);
      toast.success("Vacación registrada");
    }
    const todasParaDoc = vacModal.item
      ? vacaciones.map((v) => (v.id === saved.id ? saved : v))
      : [...vacaciones, saved];
    if (empleado) generarSolicitudVacaciones(empleado, saved, todasParaDoc, saved.tipo === "Adelanto").catch(() => {});
    await loadVacaciones();
    return saved;
  };

  const [updatingEstatusVacId, setUpdatingEstatusVacId] = useState<number | null>(null);
  const [rechazoModal, setRechazoModal] = useState<{ vacId: number } | null>(null);
  const [rechazoMotivo, setRechazoMotivo] = useState("");

  const handleVacacionEstatusChange = async (vacId: number, estatus: string) => {
    if (estatus === "Rechazada") {
      setRechazoMotivo("");
      setRechazoModal({ vacId });
      return;
    }
    setUpdatingEstatusVacId(vacId);
    try {
      await updateVacacion(vacId, { estatus: estatus as "Pendiente" | "Aprobada" | "Rechazada", motivo_rechazo: null });
      await loadVacaciones();
    } catch {
      toast.error("No se pudo actualizar el estatus");
    } finally {
      setUpdatingEstatusVacId(null);
    }
  };

  const handleConfirmarRechazo = async () => {
    if (!rechazoModal) return;
    setUpdatingEstatusVacId(rechazoModal.vacId);
    try {
      await updateVacacion(rechazoModal.vacId, { estatus: "Rechazada", motivo_rechazo: rechazoMotivo.trim() || null, prima_vacacional: null });
      await loadVacaciones();
      setRechazoModal(null);
    } catch {
      toast.error("No se pudo actualizar el estatus");
    } finally {
      setUpdatingEstatusVacId(null);
    }
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
            header: "Tipo",
            render: (v: Vacacion) => {
              const periodo = clasificarPeriodoVacacion(empleado.fecha_ingreso, v.fecha_inicio);
              return (
                <div className="flex flex-col items-center gap-1">
                  <span className={[
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    v.tipo === "Adelanto" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700",
                  ].join(" ")}>
                    {v.tipo ?? "Solicitud"}
                  </span>
                  <span className={[
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    periodo === "Anticipada" ? "bg-orange-100 text-orange-700" : "bg-teal-100 text-teal-700",
                  ].join(" ")}>
                    {periodo === "Anticipada" ? "Anticipada" : "En periodo"}
                  </span>
                </div>
              );
            },
          },
          {
            header: "Estatus",
            render: (v: Vacacion) => (
              <div className="flex items-center justify-center gap-1.5">
                <BadgeSelect
                  value={v.estatus}
                  options={["Pendiente", "Aprobada", "Rechazada"]}
                  onChange={(val) => handleVacacionEstatusChange(v.id, val)}
                  disabled={updatingEstatusVacId === v.id}
                  canEdit={canEdit}
                  getStyles={(val) => ({
                    backgroundColor:
                      val === "Aprobada"  ? "#dcfce7" :
                      val === "Rechazada" ? "#fee2e2" : "#fef3c7",
                    color:
                      val === "Aprobada"  ? "#15803d" :
                      val === "Rechazada" ? "#b91c1c" : "#b45309",
                  })}
                />
                {v.estatus === "Rechazada" && v.motivo_rechazo && (
                  <div className="group relative flex shrink-0 items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 cursor-pointer text-red-400 hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                    </svg>
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-52 -translate-x-1/2 scale-95 rounded-xl bg-slate-800 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-all group-hover:scale-100 group-hover:opacity-100">
                      <p className="mb-0.5 font-semibold text-slate-300">Motivo de rechazo</p>
                      <p className="leading-relaxed">{v.motivo_rechazo}</p>
                      <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                    </div>
                  </div>
                )}
              </div>
            ),
          },
          {
            header: "Prima",
            render: (v: Vacacion) => {
              if (!v.prima_vacacional) return <span className="text-slate-400">—</span>;
              const monto = parseFloat(v.prima_vacacional);
              const tipoPrima = derecho > 0 && v.dias >= derecho ? "Completa" : "Parcial";
              return (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-semibold text-emerald-700 text-xs">
                    {monto.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                  </span>
                  <span className={[
                    "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    tipoPrima === "Completa" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
                  ].join(" ")}>
                    {tipoPrima}
                  </span>
                </div>
              );
            },
          },
          {
            header: "Documentos",
            render: (v: Vacacion) => (
              <div className="flex justify-center gap-1.5">
                {(v.tipo ?? "Solicitud") === "Solicitud" ? (
                  <button
                    type="button"
                    onClick={() => generarSolicitudVacaciones(empleado, v, vacaciones, false)}
                    className="rounded-lg bg-[#312C85] px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-[#4338ca]"
                  >
                    Solicitud
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => generarSolicitudVacaciones(empleado, v, vacaciones, true)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Adelanto
                  </button>
                )}
              </div>
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

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-[var(--crm-text-muted)]">
                {vacaciones.length} {vacaciones.length === 1 ? "período registrado" : "períodos registrados"}
              </p>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => generarConstanciaAnual(empleado)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                >
                  📄 Constancia Anual
                </button>
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

      {tab === "amonestaciones" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--crm-text-muted)]">
              {amonestaciones.length} {amonestaciones.length === 1 ? "amonestación registrada" : "amonestaciones registradas"}
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={() => setAmonestacionModal({ open: true, item: null })}
                className="flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e293b]"
              >
                <img src={agregarIcon} alt="" className="h-4 w-4" />
                Registrar amonestación
              </button>
            )}
          </div>

          <BaseTable
            data={amonestaciones}
            columns={[
              { header: "Fecha", render: (a: Amonestacion) => formatDate(a.fecha) },
              {
                header: "Tipo",
                render: (a: Amonestacion) => (
                  <span className={[
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    a.tipo === "Verbal"      ? "bg-amber-100 text-amber-700"   :
                    a.tipo === "Escrita"     ? "bg-orange-100 text-orange-700" :
                                              "bg-red-100 text-red-700",
                  ].join(" ")}>
                    {a.tipo}
                  </span>
                ),
              },
              { header: "Descripción", render: (a: Amonestacion) => a.descripcion ?? <span className="text-slate-300">—</span> },
            ]}
            isLoading={loadingAmonestaciones}
            emptyMessage="No hay amonestaciones registradas"
            onEdit={canEdit ? (a) => setAmonestacionModal({ open: true, item: a }) : undefined}
            onDelete={canEdit ? (a) => setDeleteAmonestacionModal({ open: true, item: a }) : undefined}
            canEdit={canEdit}
            canDelete={canEdit}
          />
        </div>
      )}

      {tab === "historial" && (() => {
        type TimelineItem =
          | { kind: "ingreso"; fecha: string; item: HistorialIngreso }
          | { kind: "baja";    fecha: string; item: Baja };

        const timeline: TimelineItem[] = [
          ...historialIngresos.map((h) => ({ kind: "ingreso" as const, fecha: h.fecha, item: h })),
          ...bajas.map((b) => ({ kind: "baja" as const, fecha: b.fecha_baja, item: b })),
        ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        return (
          <div className="flex flex-col gap-4">
            {/* Acciones */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--crm-text-muted)]">
                {timeline.length} {timeline.length === 1 ? "evento registrado" : "eventos registrados"}
              </p>
              <div className="flex items-center gap-2">
                {canEdit && empleado?.estatus === "Baja" && (
                  <button
                    type="button"
                    onClick={() => { setFechaReingreso(""); setReactivarModal(true); }}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    Reactivar empleado
                  </button>
                )}
                {canEdit && empleado?.estatus === "Activo" && (
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
            </div>

            {/* Timeline */}
            {(loadingHistorial || loadingBajas) ? (
              <p className="text-sm text-[var(--crm-text-muted)]">Cargando historial...</p>
            ) : timeline.length === 0 ? (
              <p className="text-sm text-[var(--crm-text-muted)]">Sin eventos registrados.</p>
            ) : (
              <ol className="relative border-l border-[var(--crm-border)] ml-3">
                {timeline.map((entry, i) => {
                  if (entry.kind === "ingreso") {
                    const h = entry.item as HistorialIngreso;
                    return (
                      <li key={`ingreso-${h.id}-${i}`} className="mb-6 ml-6">
                        <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 ring-4 ring-white dark:ring-gray-900">
                          <svg className="h-3 w-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-emerald-800">{h.tipo}</span>
                            <time className="text-xs text-emerald-600">{formatDate(h.fecha)}</time>
                          </div>
                          {h.descripcion && (
                            <p className="mt-1 text-xs text-emerald-700">{h.descripcion}</p>
                          )}
                        </div>
                      </li>
                    );
                  } else {
                    const b = entry.item as Baja;
                    return (
                      <li key={`baja-${b.id}-${i}`} className="mb-6 ml-6">
                        <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-red-100 ring-4 ring-white dark:ring-gray-900">
                          <svg className="h-3 w-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </span>
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-red-800">Baja</span>
                              <span className={[
                                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                b.tipo === "Renuncia" ? "bg-amber-100 text-amber-700" :
                                b.tipo === "Despido"  ? "bg-red-100 text-red-700"     :
                                                        "bg-slate-100 text-slate-600",
                              ].join(" ")}>
                                {b.tipo}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <time className="text-xs text-red-600">{formatDate(b.fecha_baja)}</time>
                              {canEdit && (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setBajaModal({ open: true, item: b })}
                                    className="rounded p-1 text-slate-400 hover:text-slate-600"
                                    title="Editar"
                                  >
                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteBajaModal({ open: true, item: b })}
                                    className="rounded p-1 text-slate-400 hover:text-red-500"
                                    title="Eliminar"
                                  >
                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          {b.descripcion && (
                            <p className="mt-1 text-xs text-red-700">{b.descripcion}</p>
                          )}
                        </div>
                      </li>
                    );
                  }
                })}
              </ol>
            )}
          </div>
        );
      })()}

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
        const TIPOS_MULTI = ["Exámenes médicos", "Pruebas psicométricas"] as const;
        const tiposConDoc = new Set(TIPOS_DOCUMENTO.filter((t) => documentos.some((d) => d.tipo === t)));
        const entregados = tiposConDoc.size;
        const total = TIPOS_DOCUMENTO.length;

        const DocItem = ({ doc }: { doc: typeof documentos[number] }) => (
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5">
            <svg className="h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-700">
                {doc.descripcion ?? doc.nombre_archivo}
              </p>
            </div>
            <a
              href={`${API_BASE}${doc.archivo_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-xs font-semibold text-[#312C85] hover:underline"
            >
              Ver
            </a>
            {canEdit && (
              <button
                type="button"
                disabled={deletingDocId === doc.id}
                onClick={() => handleDeleteDocumento(doc.id)}
                className="shrink-0 text-xs font-semibold text-red-500 hover:underline disabled:opacity-50"
              >
                {deletingDocId === doc.id ? "..." : "✕"}
              </button>
            )}
          </div>
        );

        return (
          <div className="flex flex-col gap-4">
            {/* Encabezado */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--crm-text-muted)]">
                {entregados} de {total} tipos de documento entregados
              </p>
              <span className={[
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                entregados === total ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
              ].join(" ")}>
                {entregados === total ? "Expediente completo" : `Faltan ${total - entregados} tipos`}
              </span>
            </div>

            {loadingDocs ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#312C85]" />
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* Tipos normales (1 archivo) */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {TIPOS_DOCUMENTO.filter((t) => !(TIPOS_MULTI as readonly string[]).includes(t)).map((tipo) => {
                    const doc = documentos.find((d) => d.tipo === tipo);
                    const isUploading = uploadingTipo === tipo;
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
                        {doc && <p className="truncate text-xs text-slate-400">{doc.nombre_archivo}</p>}
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
                                  disabled={deletingDocId === doc.id}
                                  onClick={() => handleDeleteDocumento(doc.id)}
                                  className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                                >
                                  {deletingDocId === doc.id ? "..." : "Eliminar"}
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
                                  const f = e.target.files?.[0];
                                  if (f) handleUploadDocumento(tipo, f);
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

                {/* Tipos multi (varios archivos) */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {(TIPOS_MULTI as readonly string[]).map((tipo) => {
                    const isPsic = tipo === "Pruebas psicométricas";
                    const docs = documentos.filter((d) => d.tipo === tipo);
                    const isUploading = uploadingTipo === tipo;
                    return (
                      <div key={tipo} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-700 leading-tight">{tipo}</p>
                          <span className={[
                            "shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                            docs.length > 0 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500",
                          ].join(" ")}>
                            {docs.length} archivo{docs.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {docs.length > 0 && (
                          <div className="flex flex-col gap-1.5">
                            {docs.map((d) => <DocItem key={d.id} doc={d} />)}
                          </div>
                        )}
                        {canEdit && (
                          <div className="mt-auto pt-1">
                            <button
                              type="button"
                              disabled={isUploading}
                              onClick={() => {
                                if (isPsic) { setPsicNombre(""); setPsicFile(null); setPsicModal(true); }
                                else        { setExamenNombre(""); setExamenFile(null); setExamenModal(true); }
                              }}
                              className={[
                                "w-full rounded-lg py-1.5 text-center text-xs font-semibold text-white transition",
                                isUploading ? "bg-[#312C85]/60 cursor-not-allowed" : "bg-[#312C85] hover:bg-[#4338ca]",
                              ].join(" ")}
                            >
                              {isUploading ? "Subiendo..." : isPsic ? "Agregar prueba" : "Agregar examen"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Modal examen médico */}
      {examenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-base font-semibold text-[var(--crm-text)]">Agregar examen médico</h2>
            <p className="mb-4 text-sm text-[var(--crm-text-muted)]">Indica el tipo de examen y sube el archivo.</p>

            <label className="mb-1 block text-xs font-medium text-[var(--crm-text-muted)]">
              Tipo de examen <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ej. General, Toxicológico, Audiometría…"
              value={examenNombre}
              onChange={(e) => setExamenNombre(e.target.value)}
              className="mb-4 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2 text-sm text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-[#312C85]/30"
            />

            <label className="mb-1 block text-xs font-medium text-[var(--crm-text-muted)]">
              Archivo <span className="text-red-500">*</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2.5 text-sm text-[var(--crm-text-muted)] hover:bg-slate-100">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="truncate">{examenFile ? examenFile.name : "Seleccionar archivo…"}</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setExamenFile(f); e.target.value = ""; }}
              />
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setExamenModal(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-[var(--crm-text-muted)] hover:bg-[var(--crm-hover)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!examenNombre.trim() || !examenFile || uploadingTipo === "Exámenes médicos"}
                onClick={async () => {
                  if (!examenFile) return;
                  setExamenModal(false);
                  await handleUploadDocumento("Exámenes médicos", examenFile, examenNombre.trim());
                  setExamenFile(null);
                  setExamenNombre("");
                }}
                className="rounded-xl bg-[#312C85] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4338ca] disabled:opacity-50"
              >
                Subir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal prueba psicométrica */}
      {psicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-base font-semibold text-[var(--crm-text)]">Agregar prueba psicométrica</h2>
            <p className="mb-4 text-sm text-[var(--crm-text-muted)]">Indica el nombre de la prueba y sube el archivo.</p>

            <label className="mb-1 block text-xs font-medium text-[var(--crm-text-muted)]">
              Nombre de la prueba <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ej. DISC, 16PF, Wonderlic…"
              value={psicNombre}
              onChange={(e) => setPsicNombre(e.target.value)}
              className="mb-4 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2 text-sm text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-[#312C85]/30"
            />

            <label className="mb-1 block text-xs font-medium text-[var(--crm-text-muted)]">
              Archivo <span className="text-red-500">*</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2.5 text-sm text-[var(--crm-text-muted)] hover:bg-slate-100">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="truncate">{psicFile ? psicFile.name : "Seleccionar archivo…"}</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setPsicFile(f); e.target.value = ""; }}
              />
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPsicModal(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-[var(--crm-text-muted)] hover:bg-[var(--crm-hover)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!psicNombre.trim() || !psicFile || uploadingTipo === "Pruebas psicométricas"}
                onClick={async () => {
                  if (!psicFile) return;
                  setPsicModal(false);
                  await handleUploadDocumento("Pruebas psicométricas", psicFile, psicNombre.trim());
                  setPsicFile(null);
                  setPsicNombre("");
                }}
                className="rounded-xl bg-[#312C85] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4338ca] disabled:opacity-50"
              >
                Subir
              </button>
            </div>
          </div>
        </div>
      )}

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

        const amonVerbales    = amonestaciones.filter((a) => a.tipo === "Verbal").length;
        const amonEscritas    = amonestaciones.filter((a) => a.tipo === "Escrita").length;
        const amonSuspensiones = amonestaciones.filter((a) => a.tipo === "Suspensión").length;

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

        const handlePrint = () => {
          const fecha = new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
          const nombreCompleto = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno}`;

          const row = (label: string, value: string | number) =>
            `<tr><td class="label">${label}</td><td class="value">${value}</td></tr>`;

          const card = (title: string, rows: string) =>
            `<div class="card"><h3>${title}</h3><table>${rows}</table></div>`;

          const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Reporte Individual – ${nombreCompleto}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 32px; }
    h1 { font-size: 18px; font-weight: 700; color: #0f172a; }
    .meta { font-size: 11px; color: #64748b; margin-top: 4px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    @media print { .grid { grid-template-columns: repeat(3, 1fr); } }
    .card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
    .card h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #64748b; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 4px 0; vertical-align: top; }
    td.label { color: #64748b; width: 55%; }
    td.value { font-weight: 600; color: #0f172a; text-align: right; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>${nombreCompleto}</h1>
  <p class="meta">Reporte al ${fecha} · ${empleado.puesto} · ${empleado.area}</p>
  <div class="grid">
    ${card("Datos generales", [
      row("Fecha de ingreso", formatDate(empleado.fecha_ingreso)),
      row("Antigüedad", `${antiguedad} año${antiguedad !== 1 ? "s" : ""}`),
      row("Estatus", empleado.estatus),
      ...(empleado.tipo_sangre ? [row("Tipo de sangre", empleado.tipo_sangre)] : []),
      ...(empleado.contacto_emergencia_nombre ? [row("Contacto emergencia", empleado.contacto_emergencia_nombre)] : []),
      ...(empleado.contacto_emergencia_telefono ? [row("Tel. emergencia", empleado.contacto_emergencia_telefono)] : []),
    ].join(""))}
    ${card("Vacaciones", [
      row("Derecho LFT", `${derechoVac} días`),
      row("Días tomados", `${vacAprobadas} días`),
      row("Días disponibles", `${vacDisponibles} días`),
      row("Períodos registrados", vacaciones.length),
    ].join(""))}
    ${card("Faltas", [
      row("Total de faltas", faltas.length),
      row("Justificadas", faltasJust),
      row("Injustificadas", faltasInjust),
    ].join(""))}
    ${card("Permisos", [
      row("Total de permisos", permisos.length),
      row("Con goce de sueldo", permisosConGoce),
      row("Sin goce de sueldo", permisosSinGoce),
      row("Aprobados", permisos.filter((p) => p.estatus === "Aprobado").length),
      row("Pendientes", permisos.filter((p) => p.estatus === "Pendiente").length),
    ].join(""))}
    ${card("Incapacidades", [
      row("Total", incapacidades.length),
      row("Días totales", `${diasIncap} días`),
      row("IMSS", incIMSS),
      row("Particulares", incPart),
      row("Aprobadas", incapacidades.filter((i) => i.estatus === "Aprobada").length),
    ].join(""))}
    ${card("Bajas", bajas.length === 0
      ? row("Bajas registradas", "Ninguna")
      : [
          row("Total de bajas", bajas.length),
          ...(ultimaBaja ? [
            row("Última baja", formatDate(ultimaBaja.fecha_baja)),
            row("Tipo", ultimaBaja.tipo),
          ] : []),
        ].join("")
    )}
    ${card("Amonestaciones", amonestaciones.length === 0
      ? row("Amonestaciones", "Ninguna")
      : [
          row("Total", amonestaciones.length),
          row("Verbales", amonVerbales),
          row("Escritas", amonEscritas),
          row("Suspensiones", amonSuspensiones),
        ].join("")
    )}
  </div>
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };<\/script>
</body>
</html>`;

          const win = window.open("", "_blank", "width=900,height=700");
          if (win) { win.document.write(html); win.document.close(); }
        };

        return (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--crm-text)]">Reporte al {new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}</p>
              <button
                type="button"
                onClick={handlePrint}
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
                {empleado.tipo_sangre && <StatRow label="Tipo de sangre" value={empleado.tipo_sangre} color="text-red-600" />}
                {empleado.contacto_emergencia_nombre && <StatRow label="Contacto emergencia" value={empleado.contacto_emergencia_nombre} />}
                {empleado.contacto_emergencia_telefono && <StatRow label="Tel. emergencia" value={empleado.contacto_emergencia_telefono} />}
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

              <Section title="Amonestaciones">
                {amonestaciones.length === 0 ? (
                  <p className="py-2 text-sm text-slate-400">Sin amonestaciones registradas</p>
                ) : (
                  <>
                    <StatRow label="Total" value={amonestaciones.length} color="text-orange-600" />
                    <StatRow label="Verbales"    value={amonVerbales}     color={amonVerbales    > 0 ? "text-amber-600"  : "text-slate-800"} />
                    <StatRow label="Escritas"    value={amonEscritas}     color={amonEscritas    > 0 ? "text-orange-600" : "text-slate-800"} />
                    <StatRow label="Suspensiones" value={amonSuspensiones} color={amonSuspensiones > 0 ? "text-red-600"   : "text-slate-800"} />
                  </>
                )}
              </Section>
            </div>
          </div>
        );
      })()}

      {/* Modal reactivar empleado */}
      {reactivarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-base font-semibold text-[var(--crm-text)]">
              Reactivar empleado
            </h2>
            <p className="mb-4 text-sm text-[var(--crm-text-muted)]">
              Ingresa la fecha de reingreso del empleado.
            </p>
            <label className="mb-1 block text-xs font-medium text-[var(--crm-text-muted)]">
              Fecha de reingreso
            </label>
            <input
              type="date"
              value={fechaReingreso}
              onChange={(e) => setFechaReingreso(e.target.value)}
              className="w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2 text-sm text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReactivarModal(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-[var(--crm-text-muted)] hover:bg-[var(--crm-hover)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReactivar}
                disabled={!fechaReingreso || reactivando}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {reactivando ? "Reactivando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modales amonestaciones */}
      {amonestacionModal.open && (
        <AmonestacionModal
          empleadoId={empleadoId}
          initial={amonestacionModal.item}
          onSave={handleSaveAmonestacion}
          onClose={() => setAmonestacionModal({ open: false, item: null })}
        />
      )}

      {deleteAmonestacionModal.open && deleteAmonestacionModal.item && (
        <DeleteConfirmModal
          isOpen
          title="Eliminar amonestación"
          subtitle="Esta acción no se puede deshacer."
          entityId={deleteAmonestacionModal.item.id}
          entityLabel={`Amonestación del ${formatDate(deleteAmonestacionModal.item.fecha)}`}
          descriptionPrefix="Estás a punto de eliminar la"
          fallbackLabel="esta amonestación"
          onConfirm={handleDeleteAmonestacion}
          onClose={() => setDeleteAmonestacionModal({ open: false, item: null })}
        />
      )}

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
      {vacModal.open && empleado && (() => {
        const ant = calcularAntigüedad(empleado.fecha_ingreso);
        const der = calcularDerechoVacaciones(ant);
        const derProximo = calcularDerechoVacaciones(ant + 1);
        const ocup = vacaciones
          .filter((v) => (v.estatus === "Aprobada" || v.estatus === "Pendiente") && v.id !== vacModal.item?.id)
          .reduce((s, v) => s + v.dias, 0);
        const disp = Math.max(0, der - ocup);
        const dispAnticipado = Math.max(0, derProximo - ocup);
        return (
          <VacacionModal
            empleadoId={empleadoId}
            fechaIngreso={empleado.fecha_ingreso}
            sueldoMensual={parseFloat(empleado.sueldo)}
            diasCorresponden={der}
            diasDisponibles={disp}
            diasDisponiblesAnticipado={dispAnticipado}
            initial={vacModal.item}
            onSave={handleSaveVacacion}
            onClose={() => setVacModal({ open: false, item: null })}
          />
        );
      })()}

      {/* Modal motivo de rechazo */}
      {rechazoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-base font-bold text-slate-800">Motivo de rechazo</h3>
            <p className="mb-4 text-sm text-slate-500">Indica la razón por la que se rechazan las vacaciones (opcional).</p>
            <textarea
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10 resize-none"
              rows={3}
              placeholder="Ej. No hay cobertura en esas fechas..."
              value={rechazoMotivo}
              onChange={(e) => setRechazoMotivo(e.target.value)}
              autoFocus
            />
            <div className="mt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setRechazoModal(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarRechazo}
                disabled={updatingEstatusVacId !== null}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {updatingEstatusVacId !== null ? "Guardando..." : "Confirmar rechazo"}
              </button>
            </div>
          </div>
        </div>
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
