import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BaseTable, type ColumnDef } from "@/components/ui/BaseTable";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import agregarIcon from "@/assets/images/Agregar.png";
import type { OperacionProceso, OperacionFiniquitada, Comision } from "@/interfaces/operaciones.interface";
import { parseEtapa, ETAPA_COLORS } from "../components/ProcesoModal";
import { useHasPermission } from "@/shared/auth/permissions/useHasPermission";
import {
  getProceso, createProceso, updateProceso, deleteProceso,
  getFiniquitadas, createFiniquitada, updateFiniquitada, deleteFiniquitada,
  getComisiones, createComision, updateComision,
} from "../services/operaciones.api";
import { ProcesoModal } from "../components/ProcesoModal";
import { FiniquitadaModal } from "../components/FiniquitadaModal";
import { ComisionModal } from "../components/ComisionModal";

type Tab = "proceso" | "finiquitadas" | "comisiones";

const fmtDate = (s: string | null) => {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtMoney = (s: string | null) => {
  if (!s) return "—";
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(Number(s));
};

function makeGroupRowSpan<T>(key: keyof T) {
  return (item: T, index: number, data: T[]) => {
    const val = item[key];
    if (!val) return 1;
    if (index > 0 && data[index - 1][key] === val) return 0;
    let span = 1;
    while (index + span < data.length && data[index + span][key] === val) span++;
    return span;
  };
}

const TAB_META: Record<Tab, { category: string; title: string; description: string }> = {
  proceso: {
    category: "Gestión de operaciones",
    title: "Operaciones en proceso",
    description: "Seguimiento de cada etapa del proceso inmobiliario: expediente, documentos, avalúo, notaría y firma.",
  },
  finiquitadas: {
    category: "Gestión de operaciones",
    title: "Operaciones finiquitadas",
    description: "Registro de operaciones concluidas con sus datos de cierre, monto y estatus de pago.",
  },
  comisiones: {
    category: "Gestión de operaciones",
    title: "Comisiones",
    description: "Detalle económico y de participantes por cada operación finiquitada registrada.",
  },
};

const TAB_STYLES  = "px-5 py-2 rounded-full text-sm font-semibold transition-colors";
const activeTab   = TAB_STYLES + " bg-slate-900 text-white";
const inactiveTab = TAB_STYLES + " text-slate-500 hover:text-slate-800 hover:bg-slate-100";

export function OperacionesPage() {
  const { can } = useHasPermission();
  const canCreateProceso  = can("Operaciones", "crear");
  const canEditProceso    = can("Operaciones", "actualizar");
  const canDeleteProceso  = can("Operaciones", "eliminar");
  const canCreateComision = can("Comisiones",  "crear");
  const canEditComision   = can("Comisiones",  "actualizar");
  const canReadComisiones = can("Comisiones",  "leer");

  const [tab, setTab] = useState<Tab>("proceso");

  // ── En Proceso ────────────────────────────────────────
  const [proceso, setProceso]             = useState<OperacionProceso[]>([]);
  const [loadingProceso, setLoadingProceso] = useState(true);
  const [procesoModal, setProcesoModal]   = useState<{ open: boolean; item: OperacionProceso | null }>({ open: false, item: null });
  const [deleteProcesoId, setDeleteProcesoId] = useState<number | null>(null);

  // ── Finiquitadas ──────────────────────────────────────
  const [finiquitadas, setFiniquitadas]   = useState<OperacionFiniquitada[]>([]);
  const [loadingFin, setLoadingFin]       = useState(true);
  const [finModal, setFinModal]           = useState<{ open: boolean; item: OperacionFiniquitada | null }>({ open: false, item: null });
  const [finiquitarProceso, setFiniquitarProceso] = useState<OperacionProceso | null>(null);
  const [deleteFinId, setDeleteFinId]     = useState<number | null>(null);

  // ── Comisiones ────────────────────────────────────────
  const [comisiones, setComisiones]       = useState<Comision[]>([]);
  const [loadingCom, setLoadingCom]       = useState(true);
  const [comisionModal, setComisionModal] = useState<{ open: boolean; item: Comision | null }>({ open: false, item: null });
  const [selectedComisionIds, setSelectedComisionIds] = useState<Set<number>>(new Set());
  const [saving, setSaving]               = useState<"mensual" | "anual" | null>(null);

  // ── Filtros ───────────────────────────────────────────
  const [filterProcesoQ,       setFilterProcesoQ]       = useState("");
  const [filterProcesoEstatus, setFilterProcesoEstatus] = useState("");
  const [filterFinQ,           setFilterFinQ]           = useState("");
  const [filterFinYear,        setFilterFinYear]        = useState("");
  const [filterFinPago,        setFilterFinPago]        = useState("");
  const [filterComQ,           setFilterComQ]           = useState("");
  const [filterComYear,        setFilterComYear]        = useState("");
  const [filterComAsesor,      setFilterComAsesor]      = useState("");

  useEffect(() => {
    loadProceso();
    loadFiniquitadas();
    if (canReadComisiones) loadComisiones();
  }, [canReadComisiones]);

  useEffect(() => {
    setSelectedComisionIds(new Set());
    setFilterProcesoQ(""); setFilterProcesoEstatus("");
    setFilterFinQ("");     setFilterFinYear("");     setFilterFinPago("");
    setFilterComQ("");     setFilterComYear("");     setFilterComAsesor("");
  }, [tab]);

  async function loadProceso() {
    setLoadingProceso(true);
    try { setProceso(await getProceso()); } finally { setLoadingProceso(false); }
  }
  async function loadFiniquitadas() {
    setLoadingFin(true);
    try { setFiniquitadas(await getFiniquitadas()); } finally { setLoadingFin(false); }
  }
  async function loadComisiones() {
    setLoadingCom(true);
    try { setComisiones(await getComisiones()); } finally { setLoadingCom(false); }
  }

  // ── Handlers: Proceso ────────────────────────────────
  const handleSaveProceso = async (data: Partial<OperacionProceso>) => {
    const { id: _id, creado_en: _c, actualizado_en: _a, ...payload } = data as OperacionProceso;
    try {
      if (procesoModal.item) {
        await updateProceso(procesoModal.item.id, payload);
        toast.success("Operación actualizada con éxito.");
      } else {
        await createProceso(payload);
        toast.success("Operación creada con éxito.");
      }
      await loadProceso();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la operación.");
      throw err;
    }
  };

  const handleDeleteProceso = async (id: number): Promise<string | null> => {
    try {
      await deleteProceso(id);
      await loadProceso();
      toast.success("Operación eliminada.");
      return null;
    } catch (err: unknown) {
      return err instanceof Error ? err.message : "No se pudo eliminar la operación.";
    }
  };

  // ── Handlers: Finiquitada ────────────────────────────
  const handleSaveFin = async (data: Partial<OperacionFiniquitada>) => {
    const { id: _id, creado_en: _c, actualizado_en: _a, comision: _com, ...payload } = data as OperacionFiniquitada;
    try {
      if (finModal.item) {
        await updateFiniquitada(finModal.item.id, payload);
        toast.success("Operación finiquitada actualizada.");
      } else {
        await createFiniquitada(payload);
        toast.success("Operación finiquitada y comisión creadas con éxito.");
        if (finiquitarProceso) {
          await deleteProceso(finiquitarProceso.id);
          setFiniquitarProceso(null);
          await loadProceso();
        }
      }
      await loadFiniquitadas();
      if (canReadComisiones) await loadComisiones();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la operación.");
      throw err;
    }
  };

  const handleDeleteFin = async (id: number): Promise<string | null> => {
    try {
      await deleteFiniquitada(id);
      await loadFiniquitadas();
      if (canReadComisiones) await loadComisiones();
      toast.success("Operación finiquitada eliminada.");
      return null;
    } catch (err: unknown) {
      return err instanceof Error ? err.message : "No se pudo eliminar la operación.";
    }
  };

  // ── Handlers: Comisiones ─────────────────────────────
  const toggleComision = (id: number) =>
    setSelectedComisionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const toggleAllComisiones = () =>
    setSelectedComisionIds(
      selectedComisionIds.size === comisiones.length
        ? new Set()
        : new Set(comisiones.map((c) => c.id))
    );

  const handleSaveComision = async (id: number | null, data: Partial<Comision>) => {
    const { id: _id, creado_en: _c, actualizado_en: _a, finiquitada: _f, finiquitada_id: _fid, ...payload } = data as Comision;
    try {
      if (id !== null) {
        await updateComision(id, payload);
        toast.success("Comisión actualizada con éxito.");
      } else {
        await createComision(payload);
        toast.success("Comisión creada con éxito.");
      }
      await loadComisiones();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la comisión.");
      throw err;
    }
  };

  const handleGuardarMensual = async (total: number) => {
    const ids = [...selectedComisionIds];
    setSaving("mensual");
    try {
      await Promise.all(ids.map((id) => updateComision(id, { ganancias_mensuales: String(total) })));
      await loadComisiones();
      setSelectedComisionIds(new Set());
      toast.success(`Ganancia mensual guardada en ${ids.length} registro(s).`);
    } catch {
      toast.error("No se pudo guardar la ganancia mensual.");
    } finally {
      setSaving(null);
    }
  };

  const handleGuardarAnual = async () => {
    const ids = [...selectedComisionIds];
    const totalAnual = comisiones.reduce((sum, c, i) => {
      const val = Number(c.ganancias_mensuales ?? 0);
      if (!val) return sum;
      const prev = comisiones[i - 1];
      if (prev && prev.ganancias_mensuales === c.ganancias_mensuales) return sum;
      return sum + val;
    }, 0);
    setSaving("anual");
    try {
      await Promise.all(ids.map((id) => updateComision(id, { ganancias_anuales: String(totalAnual) })));
      await loadComisiones();
      setSelectedComisionIds(new Set());
      toast.success(`Ganancia anual acumulada (${fmtMoney(String(totalAnual))}) guardada en ${ids.length} registro(s).`);
    } catch {
      toast.error("No se pudo guardar la ganancia anual.");
    } finally {
      setSaving(null);
    }
  };

  // ── Datos filtrados ───────────────────────────────────
  const ETAPA_KEYS: (keyof OperacionProceso)[] = [
    "etapa_expediente", "etapa_documentos", "etapa_avaluo",
    "etapa_inscripcion", "etapa_notaria", "etapa_constancia", "etapa_firma",
  ];

  const procesoFiltrado = proceso.filter((r) => {
    const q = filterProcesoQ.toLowerCase();
    const matchQ = !q || [r.propietario, r.cliente, r.propiedad].some((v) => v?.toLowerCase().includes(q));
    const matchEstatus = !filterProcesoEstatus ||
      ETAPA_KEYS.some((k) => parseEtapa(r[k] as string | null).s === filterProcesoEstatus);
    return matchQ && matchEstatus;
  });

  const finiquitadasFiltradas = finiquitadas.filter((r) => {
    const q = filterFinQ.toLowerCase();
    const matchQ = !q || [r.propietario, r.cliente, r.propiedad].some((v) => v?.toLowerCase().includes(q));
    const matchYear = !filterFinYear || r.fecha_firma?.startsWith(filterFinYear);
    const matchPago = !filterFinPago || r.estatus_pago === filterFinPago;
    return matchQ && matchYear && matchPago;
  });

  const comisionesFiltradas = comisiones.filter((r) => {
    const q = filterComQ.toLowerCase();
    const matchQ = !q || [r.propiedad, r.vendedor, r.comprador, r.asesor_tamivar].some((v) => v?.toLowerCase().includes(q));
    const matchYear = !filterComYear || r.fecha?.startsWith(filterComYear);
    const matchAsesor = !filterComAsesor || r.asesor_tamivar === filterComAsesor;
    return matchQ && matchYear && matchAsesor;
  });

  const yearsFiniquitadas = [...new Set(finiquitadas.map((r) => r.fecha_firma?.slice(0, 4)).filter(Boolean))].sort().reverse() as string[];
  const pagosUnicos       = [...new Set(finiquitadas.map((r) => r.estatus_pago).filter(Boolean))] as string[];
  const yearsComisiones   = [...new Set(comisiones.map((r) => r.fecha?.slice(0, 4)).filter(Boolean))].sort().reverse() as string[];
  const asesoresUnicos    = [...new Set(comisiones.map((r) => r.asesor_tamivar).filter(Boolean))].sort() as string[];

  // ── Columns ───────────────────────────────────────────
  const etapaCell = (raw: string | null) => {
    const { s, n } = parseEtapa(raw);
    if (!s && !n) return <span className="text-slate-300">—</span>;
    const color = ETAPA_COLORS[s];
    return (
      <div
        className="min-w-[130px] max-w-[200px] rounded-lg px-2.5 py-1.5 text-xs leading-snug whitespace-pre-line"
        style={color
          ? { backgroundColor: color.bg, color: color.text }
          : { backgroundColor: "#f1f5f9", color: "#334155" }}
      >
        {n || s || "—"}
      </div>
    );
  };

  const procesoColumns: ColumnDef<OperacionProceso>[] = [
    { header: "Fecha inicio",                 render: (r) => fmtDate(r.fecha_inicio) },
    { header: "Propietario",                  accessorKey: "propietario" },
    { header: "Cliente",                      accessorKey: "cliente" },
    { header: "Estatus",                      render: (r) => r.estatus ? <span className="block max-w-[160px] whitespace-pre-line text-xs leading-relaxed text-blue-700">{r.estatus}</span> : <span className="text-slate-300">—</span> },
    { header: "Propiedad",                    accessorKey: "propiedad" },
    { header: "Reunión del expediente",       render: (r) => etapaCell(r.etapa_expediente) },
    { header: "Actualización de documentos",  render: (r) => etapaCell(r.etapa_documentos) },
    { header: "Avalúo",                       render: (r) => etapaCell(r.etapa_avaluo) },
    { header: "Inscripción del crédito",      render: (r) => etapaCell(r.etapa_inscripcion) },
    { header: "Docs en notaría",              render: (r) => etapaCell(r.etapa_notaria) },
    { header: "Constancia de no adeudo",      render: (r) => etapaCell(r.etapa_constancia) },
    { header: "Firma",                        render: (r) => etapaCell(r.etapa_firma) },
  ];

  const finiquitadasColumns: ColumnDef<OperacionFiniquitada>[] = [
    { header: "Propietario", accessorKey: "propietario" },
    { header: "Cliente",     accessorKey: "cliente" },
    { header: "Propiedad",   accessorKey: "propiedad" },
    { header: "Fecha firma", render: (r) => fmtDate(r.fecha_firma) },
    { header: "Monto",       render: (r) => fmtMoney(r.monto_operacion) },
    { header: "Pago",        render: (r) => r.estatus_pago
        ? <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">{r.estatus_pago}</span>
        : <span className="text-slate-300">—</span> },
  ];

  const allComSelected  = comisiones.length > 0 && selectedComisionIds.size === comisiones.length;
  const someComSelected = selectedComisionIds.size > 0 && selectedComisionIds.size < comisiones.length;
  const selectedComRows = comisiones.filter((c) => selectedComisionIds.has(c.id));
  const sumTamivar      = selectedComRows.reduce((s, r) => s + Number(r.comision_tamivar ?? 0), 0);
  const sumExtra        = selectedComRows.reduce((s, r) => s + Number(r.comision_extra   ?? 0), 0);
  const mensualTotal    = sumTamivar + sumExtra;

  const comisionColumns: ColumnDef<Comision>[] = [
    {
      header: (
        <input
          type="checkbox"
          checked={allComSelected}
          ref={(el) => { if (el) el.indeterminate = someComSelected; }}
          onChange={toggleAllComisiones}
          className="h-4 w-4 cursor-pointer accent-[#312C85]"
        />
      ),
      render: (r) => (
        <input
          type="checkbox"
          checked={selectedComisionIds.has(r.id)}
          onChange={() => toggleComision(r.id)}
          className="h-4 w-4 cursor-pointer accent-[#312C85]"
        />
      ),
      headerClassName: "w-10",
      cellClassName: "w-10 text-center",
    },
    { header: "Fecha",                  render: (r) => fmtDate(r.fecha) },
    { header: "Propiedad",              render: (r) => r.propiedad ?? "—" },
    { header: "Comisión total",         render: (r) => fmtMoney(r.comision_total) },
    { header: "Tamivar",                render: (r) => fmtMoney(r.comision_tamivar) },
    { header: "Extra",                  render: (r) => fmtMoney(r.comision_extra) },
    { header: "Vendedor/Arrendador",    render: (r) => r.vendedor ?? "—" },
    { header: "Contacto",               render: (r) => r.contacto_vendedor ?? "—" },
    { header: "Comprador/Arrendatario", render: (r) => r.comprador ?? "—" },
    { header: "Contacto",               render: (r) => r.contacto_comprador ?? "—" },
    { header: "Referido",               render: (r) => r.referido ?? "—" },
    { header: "Contacto",               render: (r) => r.contacto_referido ?? "—" },
    { header: "Asesor Tamivar",         render: (r) => r.asesor_tamivar ?? "—" },
    { header: "Operación",              render: (r) => fmtMoney(r.monto_operacion) },
    { header: "Mensual",       render: (r) => fmtMoney(r.ganancias_mensuales), rowSpan: makeGroupRowSpan<Comision>("ganancias_mensuales") },
    { header: "Ganancias anual", render: (r) => fmtMoney(r.ganancias_anuales),   rowSpan: makeGroupRowSpan<Comision>("ganancias_anuales") },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {TAB_META[tab].category}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-[2rem]">
            {TAB_META[tab].title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {TAB_META[tab].description}
          </p>
        </div>
        {tab === "proceso" && canCreateProceso && (
          <button
            onClick={() => setProcesoModal({ open: true, item: null })}
            className="inline-flex items-center gap-2 rounded-xl bg-[#312C85] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#27226f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <img src={agregarIcon} alt="" className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">Nueva operación</span>
          </button>
        )}
        {tab === "finiquitadas" && canCreateProceso && (
          <button
            onClick={() => setFinModal({ open: true, item: null })}
            className="inline-flex items-center gap-2 rounded-xl bg-[#312C85] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#27226f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <img src={agregarIcon} alt="" className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">Nueva finiquitada</span>
          </button>
        )}
        {tab === "comisiones" && canCreateComision && (
          <button
            onClick={() => setComisionModal({ open: true, item: null })}
            className="inline-flex items-center gap-2 rounded-xl bg-[#312C85] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#27226f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <img src={agregarIcon} alt="" className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">Nueva comisión</span>
          </button>
        )}
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-0">
        <button className={tab === "proceso"      ? activeTab : inactiveTab} onClick={() => setTab("proceso")}>
          En proceso ({proceso.length})
        </button>
        <button className={tab === "finiquitadas" ? activeTab : inactiveTab} onClick={() => setTab("finiquitadas")}>
          Finiquitadas ({finiquitadas.length})
        </button>
        {canReadComisiones && (
          <button className={tab === "comisiones" ? activeTab : inactiveTab} onClick={() => setTab("comisiones")}>
            Comisiones ({comisiones.length})
          </button>
        )}
      </div>

      {/* En proceso */}
      {tab === "proceso" && (
        <div className="space-y-3">
          <FiltersBar>
            <SearchInput value={filterProcesoQ} onChange={setFilterProcesoQ} placeholder="Buscar propietario, cliente o propiedad..." />
            <FilterSelect value={filterProcesoEstatus} onChange={setFilterProcesoEstatus} label="Estatus de etapa">
              {Object.keys(ETAPA_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
            </FilterSelect>
          </FiltersBar>
          <BaseTable
            data={procesoFiltrado}
            columns={procesoColumns}
            isLoading={loadingProceso}
            emptyMessage="No hay operaciones en proceso"
            onEdit={canEditProceso   ? (item) => setProcesoModal({ open: true, item }) : undefined}
            onDelete={canDeleteProceso ? (item) => setDeleteProcesoId(item.id)         : undefined}
            canEdit={canEditProceso}
            canDelete={canDeleteProceso}
            customActions={(item) =>
              canCreateProceso ? (
                <button
                  onClick={() => setFiniquitarProceso(item)}
                  title="Finiquitar operación"
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Finiquitar
                </button>
              ) : null
            }
          />
        </div>
      )}

      {/* Finiquitadas */}
      {tab === "finiquitadas" && (
        <div className="space-y-3">
          <FiltersBar>
            <SearchInput value={filterFinQ} onChange={setFilterFinQ} placeholder="Buscar propietario, cliente o propiedad..." />
            <FilterSelect value={filterFinYear} onChange={setFilterFinYear} label="Año">
              {yearsFiniquitadas.map((y) => <option key={y} value={y}>{y}</option>)}
            </FilterSelect>
            <FilterSelect value={filterFinPago} onChange={setFilterFinPago} label="Estatus de pago">
              {pagosUnicos.map((p) => <option key={p} value={p}>{p}</option>)}
            </FilterSelect>
          </FiltersBar>
          <BaseTable
            data={finiquitadasFiltradas}
            columns={finiquitadasColumns}
            isLoading={loadingFin}
            emptyMessage="No hay operaciones finiquitadas"
            onEdit={canEditProceso   ? (item) => setFinModal({ open: true, item }) : undefined}
            onDelete={canDeleteProceso ? (item) => setDeleteFinId(item.id)           : undefined}
            canEdit={canEditProceso}
            canDelete={canDeleteProceso}
          />
        </div>
      )}

      {/* Comisiones */}
      {tab === "comisiones" && (
        <div className="space-y-3">
          {selectedComisionIds.size > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#312C85]/25 bg-[#312C85]/5 px-5 py-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[#312C85]">
                  {selectedComisionIds.size} registro{selectedComisionIds.size !== 1 ? "s" : ""} seleccionado{selectedComisionIds.size !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => setSelectedComisionIds(new Set())}
                  className="text-xs text-slate-500 underline hover:text-slate-700"
                >
                  Limpiar selección
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-slate-600">
                  Tamivar: <strong className="text-slate-900">{fmtMoney(String(sumTamivar))}</strong>
                </span>
                <span className="text-sm text-slate-600">
                  Extra: <strong className="text-slate-900">{fmtMoney(String(sumExtra))}</strong>
                </span>
                <div className="flex items-center gap-2 rounded-xl bg-[#312C85] px-4 py-2.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/70">Mensual</span>
                  <span className="ml-1 text-base font-bold text-white">{fmtMoney(String(mensualTotal))}</span>
                </div>
                {canEditComision && (
                  <>
                    <button
                      onClick={() => handleGuardarMensual(mensualTotal)}
                      disabled={saving !== null || mensualTotal === 0}
                      className="rounded-xl border border-[#312C85] bg-white px-4 py-2.5 text-sm font-semibold text-[#312C85] transition hover:bg-[#312C85]/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving === "mensual" ? "Guardando..." : "Guardar mensual"}
                    </button>
                    <button
                      onClick={handleGuardarAnual}
                      disabled={saving !== null}
                      className="rounded-xl border border-emerald-600 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving === "anual" ? "Guardando..." : "Guardar anual"}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
          <FiltersBar>
            <SearchInput value={filterComQ} onChange={setFilterComQ} placeholder="Buscar propiedad, vendedor, comprador o asesor..." />
            <FilterSelect value={filterComYear} onChange={setFilterComYear} label="Año">
              {yearsComisiones.map((y) => <option key={y} value={y}>{y}</option>)}
            </FilterSelect>
            <FilterSelect value={filterComAsesor} onChange={setFilterComAsesor} label="Asesor Tamivar">
              {asesoresUnicos.map((a) => <option key={a} value={a}>{a}</option>)}
            </FilterSelect>
          </FiltersBar>
          <BaseTable
            data={comisionesFiltradas}
            columns={comisionColumns}
            isLoading={loadingCom}
            emptyMessage="No hay comisiones registradas"
            onEdit={canEditComision ? (item) => setComisionModal({ open: true, item }) : undefined}
            canEdit={canEditComision}
            canDelete={false}
            rowClassName={(item) => selectedComisionIds.has(item.id) ? "!bg-[#312C85]/5" : ""}
          />
        </div>
      )}

      {/* ── Modales ── */}
      {procesoModal.open && (
        <ProcesoModal
          initial={procesoModal.item}
          onSave={handleSaveProceso}
          onClose={() => setProcesoModal({ open: false, item: null })}
        />
      )}

      {(finModal.open || finiquitarProceso) && (
        <FiniquitadaModal
          initial={finModal.item}
          prefill={finiquitarProceso ? {
            propietario: finiquitarProceso.propietario,
            cliente: finiquitarProceso.cliente,
            propiedad: finiquitarProceso.propiedad,
          } : undefined}
          onSave={handleSaveFin}
          onClose={() => {
            setFinModal({ open: false, item: null });
            setFiniquitarProceso(null);
          }}
        />
      )}

      {comisionModal.open && (
        <ComisionModal
          comision={comisionModal.item}
          onSave={handleSaveComision}
          onClose={() => setComisionModal({ open: false, item: null })}
        />
      )}

      {/* ── Confirmar eliminación ── */}
      <DeleteConfirmModal
        isOpen={deleteProcesoId != null}
        entityId={deleteProcesoId}
        title="Eliminar operación en proceso"
        subtitle="Esta acción no se puede deshacer."
        descriptionPrefix="Se eliminará la operación de"
        entityLabel={proceso.find((p) => p.id === deleteProcesoId)?.propietario ?? ""}
        fallbackLabel="esta operación"
        onConfirm={handleDeleteProceso}
        onClose={() => setDeleteProcesoId(null)}
      />

      <DeleteConfirmModal
        isOpen={deleteFinId != null}
        entityId={deleteFinId}
        title="Eliminar operación finiquitada"
        subtitle="Esto también eliminará la comisión asociada."
        descriptionPrefix="Se eliminará la operación finiquitada de"
        entityLabel={finiquitadas.find((f) => f.id === deleteFinId)?.propietario ?? ""}
        fallbackLabel="esta operación"
        onConfirm={handleDeleteFin}
        onClose={() => setDeleteFinId(null)}
      />
    </div>
  );
}

// ── Componentes de filtros ────────────────────────────────

function FiltersBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      {children}
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative min-w-[220px] flex-1">
      <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10"
      />
    </div>
  );
}

function FilterSelect({ value, onChange, label, children }: { value: string; onChange: (v: string) => void; label: string; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#312C85] focus:ring-2 focus:ring-[#312C85]/10"
    >
      <option value="">Todos — {label}</option>
      {children}
    </select>
  );
}
