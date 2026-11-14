import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useHasPermission } from "@/shared/auth/permissions/useHasPermission";
import {
  getEvento, addParticipante, removeParticipante, addGasto, removeGasto,
  type EventoRH, type EventoParticipante, type EventoGasto,
} from "../services/eventos.api";
import { exportarEventoDetalle } from "../utils/export-excel";
import { getEmpleados, type Empleado } from "@/modules/empleados/services/empleados.api";
import desArcIcon from "@/assets/images/DesArc.png";

function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtMXN(val: string | number) {
  return (typeof val === "string" ? parseFloat(val) : val)
    .toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function nombreParticipante(p: EventoParticipante) {
  if (p.empleado) return `${p.empleado.nombre} ${p.empleado.apellido_paterno} ${p.empleado.apellido_materno}`.trim();
  return p.nombre_externo ?? "—";
}

const INPUT = "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";

type Tab = "participantes" | "gastos";

export function EventoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const eventoId = Number(id);
  const navigate = useNavigate();
  const { can } = useHasPermission();
  const canEdit = can("rh_eventos", "actualizar");

  const [evento, setEvento]       = useState<EventoRH | null>(null);
  const [loading, setLoading]     = useState(true);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [tab, setTab]             = useState<Tab>("participantes");

  // Participante form
  const [tipoP, setTipoP]         = useState<"interno" | "externo">("interno");
  const [empSelId, setEmpSelId]   = useState("");
  const [nombreExt, setNombreExt] = useState("");
  const [savingP, setSavingP]     = useState(false);

  // Gasto form
  const [concepto, setConcepto]   = useState("");
  const [monto, setMonto]         = useState("");
  const [savingG, setSavingG]     = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [ev, emps] = await Promise.all([getEvento(eventoId), getEmpleados()]);
      setEvento(ev);
      setEmpleados(emps);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [eventoId]);

  const totalGastos = evento?.gastos.reduce((s, g) => s + parseFloat(g.monto), 0) ?? 0;

  const handleAddParticipante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tipoP === "interno" && !empSelId) { toast.error("Selecciona un empleado"); return; }
    if (tipoP === "externo" && !nombreExt.trim()) { toast.error("Escribe el nombre del participante"); return; }
    setSavingP(true);
    try {
      const p = await addParticipante(eventoId, tipoP === "interno"
        ? { empleado_id: Number(empSelId) }
        : { nombre_externo: nombreExt.trim() });
      setEvento((prev) => prev ? { ...prev, participantes: [...prev.participantes, p] } : prev);
      setEmpSelId(""); setNombreExt("");
      toast.success("Participante agregado");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Error"); }
    finally { setSavingP(false); }
  };

  const handleRemoveParticipante = async (pid: number) => {
    try {
      await removeParticipante(pid);
      setEvento((prev) => prev ? { ...prev, participantes: prev.participantes.filter((p) => p.id !== pid) } : prev);
      toast.success("Participante eliminado");
    } catch { toast.error("Error al eliminar"); }
  };

  const handleAddGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concepto.trim()) { toast.error("Escribe el concepto"); return; }
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) { toast.error("Monto inválido"); return; }
    setSavingG(true);
    try {
      const g = await addGasto(eventoId, { concepto: concepto.trim(), monto: montoNum });
      setEvento((prev) => prev ? { ...prev, gastos: [...prev.gastos, g] } : prev);
      setConcepto(""); setMonto("");
      toast.success("Gasto registrado");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Error"); }
    finally { setSavingG(false); }
  };

  const handleRemoveGasto = async (gid: number) => {
    try {
      await removeGasto(gid);
      setEvento((prev) => prev ? { ...prev, gastos: prev.gastos.filter((g) => g.id !== gid) } : prev);
      toast.success("Gasto eliminado");
    } catch { toast.error("Error al eliminar"); }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#312C85]" />
      </div>
    );
  }

  if (!evento) return <p className="text-slate-500">Evento no encontrado.</p>;

  // Empleados no agregados aún
  const empIds = new Set(evento.participantes.map((p) => p.empleado_id).filter(Boolean));
  const empDisponibles = empleados.filter((e) => !empIds.has(e.id));

  const TABS: { key: Tab; label: string }[] = [
    { key: "participantes", label: `Participantes (${evento.participantes.length})` },
    { key: "gastos",        label: `Gastos (${evento.gastos.length})` },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* Cabecera */}
      <div className="flex flex-col gap-4">
        {/* Fila superior: título + cards */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <button type="button" onClick={() => navigate("/modulos/rh/eventos")}
              className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#312C85] hover:underline">
              ← Volver a eventos
            </button>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">{evento.nombre}</h1>
            <p className="mt-0.5 text-sm text-slate-500">{formatDate(evento.fecha)}</p>
            {evento.descripcion && <p className="mt-1 text-sm text-slate-600">{evento.descripcion}</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Participantes</p>
              <p className="mt-1 text-2xl font-bold text-blue-700">{evento.participantes.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total gastado</p>
              <p className="mt-1 text-xl font-bold text-emerald-700">{fmtMXN(totalGastos)}</p>
            </div>
          </div>
        </div>
        {/* Fila de acciones */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => exportarEventoDetalle(evento)}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d]"
          >
            <img src={desArcIcon} alt="" className="h-5 w-5 shrink-0" aria-hidden="true" />
            Descargar Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <nav className="flex min-w-max gap-1 rounded-xl bg-slate-100 p-1">
          {TABS.map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={[
                "rounded-lg px-4 py-2 text-sm font-semibold transition",
                tab === t.key ? "bg-white text-[#312C85] shadow-sm" : "text-slate-500 hover:text-slate-700",
              ].join(" ")}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab Participantes ── */}
      {tab === "participantes" && (
        <div className="flex flex-col gap-4">
          {canEdit && (
            <form onSubmit={handleAddParticipante}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Agregar participante</p>
              <div className="flex gap-2">
                {(["interno", "externo"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setTipoP(t)}
                    className={[
                      "flex-1 rounded-xl border py-2 text-sm font-semibold transition",
                      tipoP === t ? "border-[#312C85] bg-[#312C85] text-white" : "border-slate-300 bg-slate-50 text-slate-600 hover:border-[#312C85]",
                    ].join(" ")}>
                    {t === "interno" ? "Empleado interno" : "Externo"}
                  </button>
                ))}
              </div>
              {tipoP === "interno" ? (
                <select className={INPUT} value={empSelId} onChange={(e) => setEmpSelId(e.target.value)}>
                  <option value="">— Selecciona un empleado —</option>
                  {empDisponibles.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre} {e.apellido_paterno} {e.apellido_materno} · {e.puesto}
                    </option>
                  ))}
                </select>
              ) : (
                <input type="text" className={INPUT} placeholder="Nombre del participante externo"
                  value={nombreExt} onChange={(e) => setNombreExt(e.target.value)} />
              )}
              <button type="submit" disabled={savingP}
                className="self-end rounded-xl bg-[#312C85] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4338ca] disabled:opacity-50">
                {savingP ? "Agregando..." : "Agregar"}
              </button>
            </form>
          )}

          {evento.participantes.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">Sin participantes registrados</p>
          ) : (
            <div className="flex flex-col gap-2">
              {evento.participantes.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div>
                    <p className="font-semibold text-slate-800">{nombreParticipante(p)}</p>
                    <p className="text-xs text-slate-400">
                      {p.empleado ? `Interno · ${p.empleado.puesto}` : "Externo"}
                    </p>
                  </div>
                  {canEdit && (
                    <button type="button" onClick={() => handleRemoveParticipante(p.id)}
                      className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100">
                      Quitar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab Gastos ── */}
      {tab === "gastos" && (
        <div className="flex flex-col gap-4">
          {canEdit && (
            <form onSubmit={handleAddGasto}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Registrar gasto</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <input type="text" className={INPUT} placeholder="Concepto (Ej. Pollos asados, Refrescos)"
                  value={concepto} onChange={(e) => setConcepto(e.target.value)} />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <input type="number" min="0.01" step="0.01" className={`${INPUT} pl-7`}
                    placeholder="0.00" value={monto} onChange={(e) => setMonto(e.target.value)} />
                </div>
              </div>
              <button type="submit" disabled={savingG}
                className="self-end rounded-xl bg-[#312C85] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4338ca] disabled:opacity-50">
                {savingG ? "Registrando..." : "Agregar gasto"}
              </button>
            </form>
          )}

          {evento.gastos.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">Sin gastos registrados</p>
          ) : (
            <div className="flex flex-col gap-2">
              {evento.gastos.map((g) => (
                <div key={g.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="font-semibold text-slate-800">{g.concepto}</p>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-emerald-700">{fmtMXN(g.monto)}</span>
                    {canEdit && (
                      <button type="button" onClick={() => handleRemoveGasto(g.id)}
                        className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100">
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex justify-end rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm font-semibold text-slate-600 mr-4">Total</span>
                <span className="text-lg font-bold text-emerald-700">{fmtMXN(totalGastos)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
