import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useHasPermission } from "@/shared/auth/permissions/useHasPermission";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { getEmpleado, type Empleado } from "../services/empleados.api";
import {
  getFaltasByEmpleado, createFalta, updateFalta, deleteFalta,
  type Falta, type CreateFaltaPayload, type UpdateFaltaPayload,
} from "../services/faltas.api";
import {
  getVacacionesByEmpleado, createVacacion, updateVacacion, deleteVacacion,
  calcularAntigüedad, calcularDerechoVacaciones,
  type Vacacion, type CreateVacacionPayload, type UpdateVacacionPayload,
} from "../services/vacaciones.api";
import {
  getPermisosByEmpleado, createPermiso, updatePermiso, deletePermiso,
  type PermisoEmpleado, type CreatePermisoPayload, type UpdatePermisoPayload,
} from "../services/permisos.api";
import {
  getIncapacidadesByEmpleado, createIncapacidad, updateIncapacidad, deleteIncapacidad,
  type Incapacidad, type CreateIncapacidadPayload, type UpdateIncapacidadPayload,
} from "../services/incapacidades.api";
import {
  getBajasByEmpleado, createBaja, updateBaja, deleteBaja,
  type Baja, type CreateBajaPayload, type UpdateBajaPayload,
} from "../services/bajas.api";
import {
  getDocumentosByEmpleado, uploadDocumento, deleteDocumento,
  type DocumentoEmpleado,
} from "../services/documentos.api";
import { getHistorialIngresos, reactivarEmpleado, type HistorialIngreso } from "../services/historial-ingreso.api";
import {
  getAmonestacionesByEmpleado, createAmonestacion, updateAmonestacion, deleteAmonestacion,
  type Amonestacion, type CreateAmonestacionPayload, type UpdateAmonestacionPayload,
} from "../services/amonestaciones.api";
import {
  getNominasByEmpleado, createNomina, updateNomina, deleteNomina,
  type NominaEmpleado, type CreateNominaPayload, type UpdateNominaPayload,
} from "../services/nominas.api";
import {
  getAdelantosByEmpleado, createAdelanto, updateAdelanto, deleteAdelanto,
  type AdelantoEmpleado, type CreateAdelantoPayload, type UpdateAdelantoPayload,
} from "../services/adelantos.api";
import {
  getApoyosByEmpleado, createApoSolidario, updateApoSolidario, deleteApoSolidario,
  type ApoSolidario, type CreateApoSolidarioPayload, type UpdateApoSolidarioPayload,
} from "../services/apoyos-solidarios.api";
import { generarSolicitudVacaciones } from "../utils/documentos-rh";
import { convertirAEmpleado } from "../services/empleados.api";
import { FaltaModal } from "../components/FaltaModal";
import { VacacionModal } from "../components/VacacionModal";
import { PermisoModal } from "../components/PermisoModal";
import { IncapacidadModal } from "../components/IncapacidadModal";
import { IncapacidadDocsModal } from "../components/IncapacidadDocsModal";
import { BajaModal } from "../components/BajaModal";
import { AmonestacionModal } from "../components/AmonestacionModal";
import { NominaModal } from "../components/NominaModal";
import { ApoSolidarioModal } from "../components/ApoSolidarioModal";
import { FaltasTab } from "./tabs/FaltasTab";
import { VacacionesTab } from "./tabs/VacacionesTab";
import { PermisosTab } from "./tabs/PermisosTab";
import { IncapacidadesTab } from "./tabs/IncapacidadesTab";
import { AmonestacionesTab } from "./tabs/AmonestacionesTab";
import { HistorialTab } from "./tabs/HistorialTab";
import { DocumentosTab } from "./tabs/DocumentosTab";
import { ReporteTab } from "./tabs/ReporteTab";
import { NominaTab } from "./tabs/NominaTab";
import { ApoyosSolidariosTab } from "./tabs/ApoyosSolidariosTab";

type Tab = "faltas" | "vacaciones" | "permisos" | "incapacidades" | "amonestaciones" | "historial" | "documentos" | "reporte" | "nomina" | "apoyos";

const TABS_EMPLEADO: { key: Tab; label: string }[] = [
  { key: "faltas",         label: "Faltas" },
  { key: "vacaciones",     label: "Vacaciones" },
  { key: "permisos",       label: "Permisos" },
  { key: "incapacidades",  label: "Incapacidades" },
  { key: "amonestaciones", label: "Amonestaciones" },
  { key: "historial",      label: "Historial" },
  { key: "documentos",     label: "Documentos" },
  { key: "nomina",         label: "Nómina" },
  { key: "apoyos",         label: "Apoyo Solidario" },
  { key: "reporte",        label: "Reporte Individual" },
];

const TABS_BECARIO: { key: Tab; label: string }[] = [
  { key: "faltas",         label: "Faltas" },
  { key: "permisos",       label: "Permisos" },
  { key: "incapacidades",  label: "Incapacidades" },
  { key: "amonestaciones", label: "Amonestaciones" },
  { key: "historial",      label: "Historial" },
  { key: "documentos",     label: "Documentos" },
  { key: "nomina",         label: "Apoyo económico" },
  { key: "apoyos",         label: "Apoyo Solidario" },
  { key: "reporte",        label: "Reporte Individual" },
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
  const [convirtiendo, setConvirtiendo] = useState(false);

  // Faltas
  const [faltas, setFaltas] = useState<Falta[]>([]);
  const [loadingFaltas, setLoadingFaltas] = useState(true);
  const [faltaModal, setFaltaModal] = useState<{ open: boolean; item: Falta | null }>({ open: false, item: null });
  const [deleteFaltaModal, setDeleteFaltaModal] = useState<{ open: boolean; item: Falta | null }>({ open: false, item: null });

  // Vacaciones
  const [vacaciones, setVacaciones] = useState<Vacacion[]>([]);
  const [loadingVac, setLoadingVac] = useState(true);
  const [vacModal, setVacModal] = useState<{ open: boolean; item: Vacacion | null }>({ open: false, item: null });
  const [deleteVacModal, setDeleteVacModal] = useState<{ open: boolean; item: Vacacion | null }>({ open: false, item: null });
  const [updatingEstatusVacId, setUpdatingEstatusVacId] = useState<number | null>(null);
  const [rechazoModal, setRechazoModal] = useState<{ vacId: number } | null>(null);
  const [rechazoMotivo, setRechazoMotivo] = useState("");

  // Permisos
  const [permisos, setPermisos] = useState<PermisoEmpleado[]>([]);
  const [loadingPermisos, setLoadingPermisos] = useState(true);
  const [permisoModal, setPermisoModal] = useState<{ open: boolean; item: PermisoEmpleado | null }>({ open: false, item: null });
  const [deletePermisoModal, setDeletePermisoModal] = useState<{ open: boolean; item: PermisoEmpleado | null }>({ open: false, item: null });

  // Incapacidades
  const [incapacidades, setIncapacidades] = useState<Incapacidad[]>([]);
  const [loadingInc, setLoadingInc] = useState(true);
  const [incModal, setIncModal] = useState<{ open: boolean; item: Incapacidad | null }>({ open: false, item: null });
  const [deleteIncModal, setDeleteIncModal] = useState<{ open: boolean; item: Incapacidad | null }>({ open: false, item: null });
  const [incDocsModal, setIncDocsModal] = useState<{ open: boolean; item: Incapacidad | null }>({ open: false, item: null });
  const [updatingEstatusIncId, setUpdatingEstatusIncId] = useState<number | null>(null);

  // Amonestaciones
  const [amonestaciones, setAmonestaciones] = useState<Amonestacion[]>([]);
  const [loadingAmonestaciones, setLoadingAmonestaciones] = useState(true);
  const [amonestacionModal, setAmonestacionModal] = useState<{ open: boolean; item: Amonestacion | null }>({ open: false, item: null });
  const [deleteAmonestacionModal, setDeleteAmonestacionModal] = useState<{ open: boolean; item: Amonestacion | null }>({ open: false, item: null });

  // Historial / Bajas
  const [historialIngresos, setHistorialIngresos] = useState<HistorialIngreso[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [bajas, setBajas] = useState<Baja[]>([]);
  const [loadingBajas, setLoadingBajas] = useState(true);
  const [bajaModal, setBajaModal] = useState<{ open: boolean; item: Baja | null }>({ open: false, item: null });
  const [deleteBajaModal, setDeleteBajaModal] = useState<{ open: boolean; item: Baja | null }>({ open: false, item: null });
  const [reactivando, setReactivando] = useState(false);
  const [reactivarModal, setReactivarModal] = useState(false);
  const [fechaReingreso, setFechaReingreso] = useState("");

  // Documentos
  const [documentos, setDocumentos] = useState<DocumentoEmpleado[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploadingTipo, setUploadingTipo] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null);

  // Nóminas
  const [nominas, setNominas] = useState<NominaEmpleado[]>([]);
  const [loadingNominas, setLoadingNominas] = useState(true);
  const [nominaModal, setNominaModal] = useState<{ open: boolean; item: NominaEmpleado | null }>({ open: false, item: null });
  const [deleteNominaModal, setDeleteNominaModal] = useState<{ open: boolean; item: NominaEmpleado | null }>({ open: false, item: null });

  // Adelantos
  const [adelantos, setAdelantos] = useState<AdelantoEmpleado[]>([]);
  const [loadingAdelantos, setLoadingAdelantos] = useState(true);

  // Apoyos solidarios
  const [apoyos, setApoyos]               = useState<ApoSolidario[]>([]);
  const [loadingApoyos, setLoadingApoyos] = useState(true);
  const [apoyoModal, setApoyoModal]       = useState<{ open: boolean; item: ApoSolidario | null }>({ open: false, item: null });
  const [deleteApoyoModal, setDeleteApoyoModal] = useState<{ open: boolean; item: ApoSolidario | null }>({ open: false, item: null });
  const [updatingEstatusApoyoId, setUpdatingEstatusApoyoId] = useState<number | null>(null);

  // ── Carga inicial ────────────────────────────────────────────────────────────

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

  const loadPermisos = async () => {
    setLoadingPermisos(true);
    try { setPermisos(await getPermisosByEmpleado(empleadoId)); }
    finally { setLoadingPermisos(false); }
  };
  useEffect(() => { if (empleadoId) loadPermisos(); }, [empleadoId]);

  const loadIncapacidades = async () => {
    setLoadingInc(true);
    try { setIncapacidades(await getIncapacidadesByEmpleado(empleadoId)); }
    finally { setLoadingInc(false); }
  };
  useEffect(() => { if (empleadoId) loadIncapacidades(); }, [empleadoId]);

  const loadAmonestaciones = async () => {
    setLoadingAmonestaciones(true);
    try { setAmonestaciones(await getAmonestacionesByEmpleado(empleadoId)); }
    finally { setLoadingAmonestaciones(false); }
  };
  useEffect(() => { if (empleadoId) loadAmonestaciones(); }, [empleadoId]);

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
    if (empleadoId) { void loadBajas(); void loadHistorial(); }
  }, [empleadoId]);

  const loadDocumentos = async () => {
    setLoadingDocs(true);
    try { setDocumentos(await getDocumentosByEmpleado(empleadoId)); }
    finally { setLoadingDocs(false); }
  };
  useEffect(() => { if (empleadoId) loadDocumentos(); }, [empleadoId]);

  const loadNominas = async () => {
    setLoadingNominas(true);
    try { setNominas(await getNominasByEmpleado(empleadoId)); }
    finally { setLoadingNominas(false); }
  };
  useEffect(() => { if (empleadoId) loadNominas(); }, [empleadoId]);

  const loadAdelantos = async () => {
    setLoadingAdelantos(true);
    try { setAdelantos(await getAdelantosByEmpleado(empleadoId)); }
    finally { setLoadingAdelantos(false); }
  };
  useEffect(() => { if (empleadoId) loadAdelantos(); }, [empleadoId]);

  const loadApoyos = async () => {
    setLoadingApoyos(true);
    try { setApoyos(await getApoyosByEmpleado(empleadoId)); }
    finally { setLoadingApoyos(false); }
  };
  useEffect(() => { if (empleadoId) loadApoyos(); }, [empleadoId]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSaveFalta = async (data: CreateFaltaPayload | UpdateFaltaPayload) => {
    if (faltaModal.item) { await updateFalta(faltaModal.item.id, data as UpdateFaltaPayload); toast.success("Falta actualizada"); }
    else { await createFalta(data as CreateFaltaPayload); toast.success("Falta registrada"); }
    await loadFaltas();
  };
  const handleDeleteFalta = async (faltaId: number): Promise<string | null> => {
    try { await deleteFalta(faltaId); await loadFaltas(); toast.success("Falta eliminada"); return null; }
    catch (err) { return err instanceof Error ? err.message : "No se pudo eliminar."; }
  };

  const handleSaveVacacion = async (data: CreateVacacionPayload | UpdateVacacionPayload): Promise<Vacacion> => {
    let saved: Vacacion;
    if (vacModal.item) { saved = await updateVacacion(vacModal.item.id, data as UpdateVacacionPayload); toast.success("Vacación actualizada"); }
    else { saved = await createVacacion(data as CreateVacacionPayload); toast.success("Vacación registrada"); }
    const todasParaDoc = vacModal.item
      ? vacaciones.map((v) => (v.id === saved.id ? saved : v))
      : [...vacaciones, saved];
    if (empleado) generarSolicitudVacaciones(empleado, saved, todasParaDoc, saved.tipo === "Adelanto").catch(() => {});
    await loadVacaciones();
    return saved;
  };
  const handleDeleteVacacion = async (vacId: number): Promise<string | null> => {
    try { await deleteVacacion(vacId); await loadVacaciones(); toast.success("Vacación eliminada"); return null; }
    catch (err) { return err instanceof Error ? err.message : "No se pudo eliminar."; }
  };
  const handleVacacionEstatusChange = async (vacId: number, estatus: string) => {
    if (estatus === "Rechazada") { setRechazoMotivo(""); setRechazoModal({ vacId }); return; }
    setUpdatingEstatusVacId(vacId);
    try { await updateVacacion(vacId, { estatus: estatus as "Pendiente" | "Aprobada" | "Rechazada", motivo_rechazo: null }); await loadVacaciones(); }
    catch { toast.error("No se pudo actualizar el estatus"); }
    finally { setUpdatingEstatusVacId(null); }
  };
  const handleConfirmarRechazo = async () => {
    if (!rechazoModal) return;
    setUpdatingEstatusVacId(rechazoModal.vacId);
    try {
      await updateVacacion(rechazoModal.vacId, { estatus: "Rechazada", motivo_rechazo: rechazoMotivo.trim() || null, prima_vacacional: null });
      await loadVacaciones();
      setRechazoModal(null);
    } catch { toast.error("No se pudo actualizar el estatus"); }
    finally { setUpdatingEstatusVacId(null); }
  };

  const handleSavePermiso = async (data: CreatePermisoPayload | UpdatePermisoPayload) => {
    if (permisoModal.item) { await updatePermiso(permisoModal.item.id, data as UpdatePermisoPayload); toast.success("Permiso actualizado"); }
    else { await createPermiso(data as CreatePermisoPayload); toast.success("Permiso registrado"); }
    await loadPermisos();
  };
  const handleDeletePermiso = async (permisoId: number): Promise<string | null> => {
    try { await deletePermiso(permisoId); await loadPermisos(); toast.success("Permiso eliminado"); return null; }
    catch (err) { return err instanceof Error ? err.message : "No se pudo eliminar."; }
  };

  const handleSaveIncapacidad = async (data: CreateIncapacidadPayload | UpdateIncapacidadPayload) => {
    if (incModal.item) {
      const updated = await updateIncapacidad(incModal.item.id, data as UpdateIncapacidadPayload);
      toast.success("Incapacidad actualizada");
      await loadIncapacidades();
      return updated;
    } else {
      const created = await createIncapacidad(data as CreateIncapacidadPayload);
      toast.success("Incapacidad registrada");
      await loadIncapacidades();
      return created;
    }
  };
  const handleDeleteIncapacidad = async (incId: number): Promise<string | null> => {
    try { await deleteIncapacidad(incId); await loadIncapacidades(); toast.success("Incapacidad eliminada"); return null; }
    catch (err) { return err instanceof Error ? err.message : "No se pudo eliminar."; }
  };
  const handleIncapacidadEstatusChange = async (incId: number, estatus: string) => {
    setUpdatingEstatusIncId(incId);
    try { await updateIncapacidad(incId, { estatus: estatus as "Pendiente" | "Aprobada" | "Rechazada" }); await loadIncapacidades(); }
    catch { toast.error("No se pudo actualizar el estatus"); }
    finally { setUpdatingEstatusIncId(null); }
  };

  const handleSaveAmonestacion = async (data: CreateAmonestacionPayload | UpdateAmonestacionPayload) => {
    if (amonestacionModal.item) { await updateAmonestacion(amonestacionModal.item.id, data as UpdateAmonestacionPayload); toast.success("Amonestación actualizada"); }
    else { await createAmonestacion(data as CreateAmonestacionPayload); toast.success("Amonestación registrada"); }
    await loadAmonestaciones();
  };
  const handleDeleteAmonestacion = async (id: number): Promise<string | null> => {
    try { await deleteAmonestacion(id); await loadAmonestaciones(); toast.success("Amonestación eliminada"); return null; }
    catch (err) { return err instanceof Error ? err.message : "No se pudo eliminar."; }
  };

  const handleSaveBaja = async (data: CreateBajaPayload | UpdateBajaPayload) => {
    if (bajaModal.item) { await updateBaja(bajaModal.item.id, data as UpdateBajaPayload); toast.success("Baja actualizada"); }
    else {
      await createBaja(data as CreateBajaPayload);
      toast.success("Baja registrada");
      getEmpleado(empleadoId).then(setEmpleado).catch(() => null);
    }
    await loadBajas();
  };
  const handleDeleteBaja = async (bajaId: number): Promise<string | null> => {
    try { await deleteBaja(bajaId); await loadBajas(); toast.success("Baja eliminada"); return null; }
    catch (err) { return err instanceof Error ? err.message : "No se pudo eliminar."; }
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
    } finally { setReactivando(false); }
  };

  const handleSaveNomina = async (data: CreateNominaPayload | UpdateNominaPayload) => {
    if (nominaModal.item) { await updateNomina(nominaModal.item.id, data as UpdateNominaPayload); toast.success("Nómina actualizada"); }
    else { await createNomina(data as CreateNominaPayload); toast.success("Pago registrado"); }
    await loadNominas();
  };
  const handleDeleteNomina = async (nominaId: number): Promise<string | null> => {
    try { await deleteNomina(nominaId); await loadNominas(); toast.success("Pago eliminado"); return null; }
    catch (err) { return err instanceof Error ? err.message : "No se pudo eliminar."; }
  };

  const handleSaveAdelanto = async (data: CreateAdelantoPayload) => {
    await createAdelanto(data);
    toast.success("Adelanto registrado");
    await loadAdelantos();
  };
  const handleUpdateAdelanto = async (id: number, data: UpdateAdelantoPayload) => {
    await updateAdelanto(id, data);
    toast.success("Adelanto actualizado");
    await loadAdelantos();
  };
  const handleApplyAdelantos = async (deductions: { id: number; monto: number }[]) => {
    for (const d of deductions) {
      const a = adelantos.find(x => x.id === d.id);
      if (!a) continue;
      await updateAdelanto(d.id, { monto_recuperado: parseFloat(a.monto_recuperado) + d.monto });
    }
    await loadAdelantos();
  };
  const handleDeleteAdelanto = async (adelantoId: number): Promise<string | null> => {
    try { await deleteAdelanto(adelantoId); await loadAdelantos(); toast.success("Adelanto eliminado"); return null; }
    catch (err) { return err instanceof Error ? err.message : "No se pudo eliminar."; }
  };

  const handleSaveApoyo = async (data: CreateApoSolidarioPayload | UpdateApoSolidarioPayload) => {
    if (apoyoModal.item) {
      await updateApoSolidario(apoyoModal.item.id, data as UpdateApoSolidarioPayload);
      toast.success("Apoyo actualizado");
    } else {
      await createApoSolidario(data as CreateApoSolidarioPayload);
      toast.success("Apoyo registrado");
    }
    await loadApoyos();
  };
  const handleDeleteApoyo = async (apoyoId: number): Promise<string | null> => {
    try { await deleteApoSolidario(apoyoId); await loadApoyos(); toast.success("Apoyo eliminado"); return null; }
    catch (err) { return err instanceof Error ? err.message : "No se pudo eliminar."; }
  };
  const handleApoyoEstatusChange = async (id: number, estatus: string) => {
    setUpdatingEstatusApoyoId(id);
    try { await updateApoSolidario(id, { estatus: estatus as "Pendiente" | "Autorizado" | "Cancelado" }); await loadApoyos(); }
    catch { toast.error("No se pudo actualizar el estatus"); }
    finally { setUpdatingEstatusApoyoId(null); }
  };

  const handleUploadDocumento = async (tipo: string, file: File, descripcion?: string) => {
    setUploadingTipo(tipo);
    try { await uploadDocumento(empleadoId, tipo, file, { descripcion }); await loadDocumentos(); toast.success("Documento subido"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Error al subir documento"); }
    finally { setUploadingTipo(null); }
  };
  const handleDeleteDocumento = async (docId: number) => {
    setDeletingDocId(docId);
    try { await deleteDocumento(docId); await loadDocumentos(); toast.success("Documento eliminado"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Error al eliminar"); }
    finally { setDeletingDocId(null); }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (!empleado) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#312C85]" />
      </div>
    );
  }

  const nombreCompleto = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno}`;
  const esBecario = empleado.tipo === "Becario";
  const TABS = esBecario ? TABS_BECARIO : TABS_EMPLEADO;

  const handleConvertir = async () => {
    if (!confirm(`¿Convertir a ${nombreCompleto} de Becario a Empleado? Esta acción no se puede deshacer.`)) return;
    setConvirtiendo(true);
    try {
      const updated = await convertirAEmpleado(empleadoId);
      setEmpleado(updated);
      toast.success("Becario convertido a empleado exitosamente");
    } catch {
      toast.error("No se pudo realizar la conversión");
    } finally {
      setConvirtiendo(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(esBecario ? "/modulos/rh/becarios" : "/modulos/rh/empleados")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          ← Volver
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--crm-text)]">{nombreCompleto}</h1>
            {esBecario && (
              <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">BECARIO</span>
            )}
          </div>
          <p className="text-sm text-[var(--crm-text-muted)]">{empleado.puesto} · {empleado.area}</p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {esBecario && canEdit && (
            <button
              type="button"
              onClick={handleConvertir}
              disabled={convirtiendo}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {convirtiendo ? "Convirtiendo..." : "Convertir a empleado"}
            </button>
          )}
          <span className={[
            "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
            empleado.estatus === "Activo" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
          ].join(" ")}>
            {empleado.estatus}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <nav className="-mb-px flex gap-1 min-w-max">
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
        <FaltasTab
          faltas={faltas}
          loading={loadingFaltas}
          canEdit={canEdit}
          onAdd={() => setFaltaModal({ open: true, item: null })}
          onEdit={(f) => setFaltaModal({ open: true, item: f })}
          onDelete={(f) => setDeleteFaltaModal({ open: true, item: f })}
        />
      )}

      {tab === "vacaciones" && (
        <VacacionesTab
          vacaciones={vacaciones}
          loading={loadingVac}
          empleado={empleado}
          canEdit={canEdit}
          updatingEstatusVacId={updatingEstatusVacId}
          onAdd={() => setVacModal({ open: true, item: null })}
          onEdit={(v) => setVacModal({ open: true, item: v })}
          onDelete={(v) => setDeleteVacModal({ open: true, item: v })}
          onEstatusChange={handleVacacionEstatusChange}
        />
      )}

      {tab === "permisos" && (
        <PermisosTab
          permisos={permisos}
          loading={loadingPermisos}
          empleado={empleado}
          canEdit={canEdit}
          onAdd={() => setPermisoModal({ open: true, item: null })}
          onEdit={(p) => setPermisoModal({ open: true, item: p })}
          onDelete={(p) => setDeletePermisoModal({ open: true, item: p })}
        />
      )}

      {tab === "incapacidades" && (
        <IncapacidadesTab
          incapacidades={incapacidades}
          loading={loadingInc}
          canEdit={canEdit}
          onAdd={() => setIncModal({ open: true, item: null })}
          onEdit={(i) => setIncModal({ open: true, item: i })}
          onDelete={(i) => setDeleteIncModal({ open: true, item: i })}
          onViewDocs={(i) => setIncDocsModal({ open: true, item: i })}
          updatingEstatusIncId={updatingEstatusIncId}
          onEstatusChange={handleIncapacidadEstatusChange}
        />
      )}

      {tab === "amonestaciones" && (
        <AmonestacionesTab
          amonestaciones={amonestaciones}
          loading={loadingAmonestaciones}
          canEdit={canEdit}
          onAdd={() => setAmonestacionModal({ open: true, item: null })}
          onEdit={(a) => setAmonestacionModal({ open: true, item: a })}
          onDelete={(a) => setDeleteAmonestacionModal({ open: true, item: a })}
        />
      )}

      {tab === "historial" && (
        <HistorialTab
          historialIngresos={historialIngresos}
          bajas={bajas}
          loadingHistorial={loadingHistorial}
          loadingBajas={loadingBajas}
          empleado={empleado}
          canEdit={canEdit}
          onAddBaja={() => setBajaModal({ open: true, item: null })}
          onEditBaja={(b) => setBajaModal({ open: true, item: b })}
          onDeleteBaja={(b) => setDeleteBajaModal({ open: true, item: b })}
          onReactivar={() => { setFechaReingreso(""); setReactivarModal(true); }}
        />
      )}

      {tab === "documentos" && (
        <DocumentosTab
          documentos={documentos}
          loading={loadingDocs}
          empleado={empleado}
          canEdit={canEdit}
          uploadingTipo={uploadingTipo}
          deletingDocId={deletingDocId}
          onUpload={handleUploadDocumento}
          onDelete={handleDeleteDocumento}
        />
      )}

      {tab === "nomina" && (
        <NominaTab
          nominas={nominas}
          loadingNominas={loadingNominas}
          adelantos={adelantos}
          loadingAdelantos={loadingAdelantos}
          empleado={empleado}
          canEdit={canEdit}
          onAdd={() => setNominaModal({ open: true, item: null })}
          onEdit={(n) => setNominaModal({ open: true, item: n })}
          onDelete={(n) => setDeleteNominaModal({ open: true, item: n })}
          onSaveAdelanto={handleSaveAdelanto}
          onUpdateAdelanto={handleUpdateAdelanto}
          onDeleteAdelanto={handleDeleteAdelanto}
        />
      )}

      {tab === "apoyos" && (
        <ApoyosSolidariosTab
          apoyos={apoyos}
          loading={loadingApoyos}
          empleado={empleado}
          canEdit={canEdit}
          updatingEstatusId={updatingEstatusApoyoId}
          onAdd={() => setApoyoModal({ open: true, item: null })}
          onEdit={(a) => setApoyoModal({ open: true, item: a })}
          onDelete={(a) => setDeleteApoyoModal({ open: true, item: a })}
          onEstatusChange={handleApoyoEstatusChange}
        />
      )}

      {tab === "reporte" && (
        <ReporteTab
          empleado={empleado}
          faltas={faltas}
          vacaciones={vacaciones}
          permisos={permisos}
          incapacidades={incapacidades}
          bajas={bajas}
          amonestaciones={amonestaciones}
        />
      )}

      {/* ── Modales CRUD ──────────────────────────────────────────────────────── */}

      {faltaModal.open && (
        <FaltaModal
          empleadoId={empleadoId}
          initial={faltaModal.item}
          onSave={handleSaveFalta}
          onClose={() => setFaltaModal({ open: false, item: null })}
        />
      )}
      {deleteFaltaModal.open && deleteFaltaModal.item && (
        <DeleteConfirmModal isOpen title="Eliminar falta" subtitle="Esta acción no se puede deshacer."
          entityId={deleteFaltaModal.item.id} entityLabel={`Falta del ${formatDate(deleteFaltaModal.item.fecha)}`}
          descriptionPrefix="Estás a punto de eliminar la" fallbackLabel="esta falta"
          onConfirm={handleDeleteFalta} onClose={() => setDeleteFaltaModal({ open: false, item: null })} />
      )}

      {vacModal.open && empleado && (() => {
        const ant = calcularAntigüedad(empleado.fecha_ingreso);
        const der = calcularDerechoVacaciones(ant);
        const derProximo = calcularDerechoVacaciones(ant + 1);
        const ocup = vacaciones
          .filter((v) => (v.estatus === "Aprobada" || v.estatus === "Pendiente") && v.id !== vacModal.item?.id)
          .reduce((s, v) => s + v.dias, 0);
        return (
          <VacacionModal
            empleadoId={empleadoId}
            fechaIngreso={empleado.fecha_ingreso}
            sueldoMensual={parseFloat(empleado.sueldo)}
            diasCorresponden={der}
            diasDisponibles={Math.max(0, der - ocup)}
            diasDisponiblesAnticipado={Math.max(0, derProximo - ocup)}
            initial={vacModal.item}
            onSave={handleSaveVacacion}
            onClose={() => setVacModal({ open: false, item: null })}
          />
        );
      })()}
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
              <button type="button" onClick={() => setRechazoModal(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200">
                Cancelar
              </button>
              <button type="button" onClick={handleConfirmarRechazo} disabled={updatingEstatusVacId !== null}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {updatingEstatusVacId !== null ? "Guardando..." : "Confirmar rechazo"}
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteVacModal.open && deleteVacModal.item && (
        <DeleteConfirmModal isOpen title="Eliminar vacación" subtitle="Esta acción no se puede deshacer."
          entityId={deleteVacModal.item.id} entityLabel={`Vacación del ${formatDate(deleteVacModal.item.fecha_inicio)}`}
          descriptionPrefix="Estás a punto de eliminar la" fallbackLabel="esta vacación"
          onConfirm={handleDeleteVacacion} onClose={() => setDeleteVacModal({ open: false, item: null })} />
      )}

      {permisoModal.open && (
        <PermisoModal
          empleadoId={empleadoId}
          initial={permisoModal.item}
          onSave={handleSavePermiso}
          onClose={() => setPermisoModal({ open: false, item: null })}
        />
      )}
      {deletePermisoModal.open && deletePermisoModal.item && (
        <DeleteConfirmModal isOpen title="Eliminar permiso" subtitle="Esta acción no se puede deshacer."
          entityId={deletePermisoModal.item.id} entityLabel={`Permiso del ${formatDate(deletePermisoModal.item.fecha)}`}
          descriptionPrefix="Estás a punto de eliminar el" fallbackLabel="este permiso"
          onConfirm={handleDeletePermiso} onClose={() => setDeletePermisoModal({ open: false, item: null })} />
      )}

      {incModal.open && (
        <IncapacidadModal
          empleadoId={empleadoId}
          initial={incModal.item}
          onSave={handleSaveIncapacidad}
          onClose={() => setIncModal({ open: false, item: null })}
        />
      )}

      {incDocsModal.open && incDocsModal.item && (
        <IncapacidadDocsModal
          incapacidad={incDocsModal.item}
          empleadoId={empleadoId}
          canEdit={canEdit}
          onClose={() => setIncDocsModal({ open: false, item: null })}
        />
      )}
      {deleteIncModal.open && deleteIncModal.item && (
        <DeleteConfirmModal isOpen title="Eliminar incapacidad" subtitle="Esta acción no se puede deshacer."
          entityId={deleteIncModal.item.id} entityLabel={`Incapacidad del ${formatDate(deleteIncModal.item.fecha_inicio)}`}
          descriptionPrefix="Estás a punto de eliminar la" fallbackLabel="esta incapacidad"
          onConfirm={handleDeleteIncapacidad} onClose={() => setDeleteIncModal({ open: false, item: null })} />
      )}

      {amonestacionModal.open && (
        <AmonestacionModal
          empleadoId={empleadoId}
          initial={amonestacionModal.item}
          onSave={handleSaveAmonestacion}
          onClose={() => setAmonestacionModal({ open: false, item: null })}
        />
      )}
      {deleteAmonestacionModal.open && deleteAmonestacionModal.item && (
        <DeleteConfirmModal isOpen title="Eliminar amonestación" subtitle="Esta acción no se puede deshacer."
          entityId={deleteAmonestacionModal.item.id} entityLabel={`Amonestación del ${formatDate(deleteAmonestacionModal.item.fecha)}`}
          descriptionPrefix="Estás a punto de eliminar la" fallbackLabel="esta amonestación"
          onConfirm={handleDeleteAmonestacion} onClose={() => setDeleteAmonestacionModal({ open: false, item: null })} />
      )}

      {bajaModal.open && (
        <BajaModal
          empleadoId={empleadoId}
          initial={bajaModal.item}
          onSave={handleSaveBaja}
          onClose={() => setBajaModal({ open: false, item: null })}
        />
      )}
      {deleteBajaModal.open && deleteBajaModal.item && (
        <DeleteConfirmModal isOpen title="Eliminar baja" subtitle="Esta acción no se puede deshacer."
          entityId={deleteBajaModal.item.id} entityLabel={`Baja del ${formatDate(deleteBajaModal.item.fecha_baja)}`}
          descriptionPrefix="Estás a punto de eliminar la" fallbackLabel="esta baja"
          onConfirm={handleDeleteBaja} onClose={() => setDeleteBajaModal({ open: false, item: null })} />
      )}

      {nominaModal.open && empleado && (
        <NominaModal
          empleadoId={empleadoId}
          sueldoMensual={parseFloat(empleado.sueldo)}
          periodicidad={empleado.periodicidad_sueldo ?? "Quincenal"}
          initial={nominaModal.item}
          adelantosPendientes={adelantos.filter(a => a.estatus !== "Liquidado")}
          onSave={handleSaveNomina}
          onApplyAdelantos={handleApplyAdelantos}
          onClose={() => setNominaModal({ open: false, item: null })}
        />
      )}
      {deleteNominaModal.open && deleteNominaModal.item && (
        <DeleteConfirmModal isOpen title="Eliminar pago de nómina" subtitle="Esta acción no se puede deshacer."
          entityId={deleteNominaModal.item.id} entityLabel={`Pago del ${formatDate(deleteNominaModal.item.fecha_pago)}`}
          descriptionPrefix="Estás a punto de eliminar el" fallbackLabel="este pago"
          onConfirm={handleDeleteNomina} onClose={() => setDeleteNominaModal({ open: false, item: null })} />
      )}

      {apoyoModal.open && (
        <ApoSolidarioModal
          empleadoId={empleadoId}
          initial={apoyoModal.item}
          onSave={handleSaveApoyo}
          onClose={() => setApoyoModal({ open: false, item: null })}
        />
      )}
      {deleteApoyoModal.open && deleteApoyoModal.item && (
        <DeleteConfirmModal isOpen title="Eliminar apoyo solidario" subtitle="Esta acción no se puede deshacer."
          entityId={deleteApoyoModal.item.id} entityLabel={`Apoyo del ${formatDate(deleteApoyoModal.item.fecha_incidente)}`}
          descriptionPrefix="Estás a punto de eliminar el" fallbackLabel="este apoyo"
          onConfirm={handleDeleteApoyo} onClose={() => setDeleteApoyoModal({ open: false, item: null })} />
      )}

      {/* Modal reactivar empleado */}
      {reactivarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-base font-semibold text-[var(--crm-text)]">Reactivar empleado</h2>
            <p className="mb-4 text-sm text-[var(--crm-text-muted)]">Ingresa la fecha de reingreso del empleado.</p>
            <label className="mb-1 block text-xs font-medium text-[var(--crm-text-muted)]">Fecha de reingreso</label>
            <input
              type="date"
              value={fechaReingreso}
              onChange={(e) => setFechaReingreso(e.target.value)}
              className="w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2 text-sm text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setReactivarModal(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-[var(--crm-text-muted)] hover:bg-[var(--crm-hover)]">
                Cancelar
              </button>
              <button type="button" onClick={handleReactivar} disabled={!fechaReingreso || reactivando}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">
                {reactivando ? "Reactivando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
