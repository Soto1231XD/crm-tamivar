import { useState, useEffect } from "react";
import type { NominaEmpleado, CreateNominaPayload, UpdateNominaPayload } from "../services/nominas.api";
import type { AdelantoEmpleado } from "../services/adelantos.api";

interface AdelantoDeduccion {
  id: number;
  monto: number;
}

interface Props {
  empleadoId: number;
  sueldoMensual: number;
  periodicidad: string;
  initial: NominaEmpleado | null;
  adelantosPendientes: AdelantoEmpleado[];
  onSave: (data: CreateNominaPayload | UpdateNominaPayload) => Promise<void>;
  onApplyAdelantos: (deductions: AdelantoDeduccion[]) => Promise<void>;
  onClose: () => void;
}

const inputClass = "w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2 text-sm text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-[#312C85]/30";
const labelClass = "mb-1 block text-xs font-medium text-[var(--crm-text-muted)]";

function fmtMXN(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function sugeridaPorAdelanto(a: AdelantoEmpleado): number {
  const monto     = parseFloat(a.monto);
  const recuperado = parseFloat(a.monto_recuperado);
  const saldo     = monto - recuperado;
  if (a.forma_descuento === "parcialidades" && a.parcialidades) {
    const cuota = monto / a.parcialidades;
    return parseFloat(Math.min(cuota, saldo).toFixed(2));
  }
  return parseFloat(saldo.toFixed(2));
}

export function NominaModal({
  empleadoId, sueldoMensual, periodicidad, initial, adelantosPendientes,
  onSave, onApplyAdelantos, onClose,
}: Props) {
  const sueldoPeriodoPor = periodicidad === "Quincenal"
    ? (sueldoMensual / 2).toFixed(2)
    : sueldoMensual.toFixed(2);

  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFin, setPeriodoFin]       = useState("");
  const [fechaPago, setFechaPago]         = useState("");
  const [sueldoPeriodo, setSueldoPeriodo] = useState(sueldoPeriodoPor);
  const [otrosConceptos, setOtrosConceptos]             = useState("");
  const [descuentosAutorizados, setDescuentosAutorizados] = useState("");
  const [otrosDescuentos, setOtrosDescuentos]           = useState("");
  const [observaciones, setObservaciones]               = useState("");
  const [saving, setSaving]                             = useState(false);

  // Estado adelantos
  const [adelantoChecks, setAdelantoChecks] = useState<Record<number, boolean>>({});
  const [adelantoMontos, setAdelantoMontos] = useState<Record<number, string>>({});

  useEffect(() => {
    if (initial) {
      setPeriodoInicio(initial.periodo_inicio.slice(0, 10));
      setPeriodoFin(initial.periodo_fin.slice(0, 10));
      setFechaPago(initial.fecha_pago.slice(0, 10));
      setSueldoPeriodo(initial.sueldo_periodo);
      setOtrosConceptos(initial.otros_conceptos ?? "");
      setDescuentosAutorizados(initial.descuentos_autorizados ?? "");
      setOtrosDescuentos(initial.otros_descuentos ?? "");
      setObservaciones(initial.observaciones ?? "");
    }
  }, [initial]);

  // Pre-cargar sugerencias de adelantos solo en modo crear
  useEffect(() => {
    if (initial) return;
    const checks: Record<number, boolean> = {};
    const montos: Record<number, string>  = {};
    for (const a of adelantosPendientes) {
      checks[a.id] = true;
      montos[a.id] = String(sugeridaPorAdelanto(a));
    }
    setAdelantoChecks(checks);
    setAdelantoMontos(montos);
  }, [adelantosPendientes, initial]);

  const adelantoTotal = adelantosPendientes
    .filter(a => adelantoChecks[a.id])
    .reduce((sum, a) => sum + (parseFloat(adelantoMontos[a.id] || "0") || 0), 0);

  const totalCalculado = (
    (parseFloat(sueldoPeriodo) || 0) +
    (parseFloat(otrosConceptos) || 0) -
    (parseFloat(descuentosAutorizados) || 0) -
    (parseFloat(otrosDescuentos) || 0) -
    adelantoTotal
  ).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        empleado_id:            empleadoId,
        periodo_inicio:         periodoInicio,
        periodo_fin:            periodoFin,
        fecha_pago:             fechaPago,
        sueldo_periodo:         parseFloat(sueldoPeriodo) || 0,
        otros_conceptos:        parseFloat(otrosConceptos) || undefined,
        descuentos_autorizados: parseFloat(descuentosAutorizados) || undefined,
        otros_descuentos:       (parseFloat(otrosDescuentos) || 0) + adelantoTotal || undefined,
        total_pagado:           parseFloat(totalCalculado),
        observaciones:          observaciones.trim() || undefined,
      };
      await onSave(initial ? { ...payload } : payload as CreateNominaPayload);

      const aplicados = adelantosPendientes
        .filter(a => adelantoChecks[a.id] && parseFloat(adelantoMontos[a.id] || "0") > 0)
        .map(a => ({ id: a.id, monto: parseFloat(adelantoMontos[a.id]) }));

      if (aplicados.length > 0) await onApplyAdelantos(aplicados);

      onClose();
    } finally {
      setSaving(false);
    }
  };

  const canSave = periodoInicio && periodoFin && fechaPago && parseFloat(sueldoPeriodo) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-[var(--crm-text)]">
            {initial ? "Editar recibo de nómina" : "Registrar pago de nómina"}
          </h2>
          <p className="mt-0.5 text-sm text-[var(--crm-text-muted)]">
            Recibo de pago en efectivo · <span className="font-semibold">{periodicidad}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          {/* Adelantos pendientes */}
          {adelantosPendientes.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                Adelantos pendientes de recuperar
              </p>
              {adelantosPendientes.map(a => {
                const saldo = parseFloat(a.monto) - parseFloat(a.monto_recuperado);
                return (
                  <div key={a.id} className="flex flex-col gap-1.5">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adelantoChecks[a.id] ?? false}
                        onChange={e => setAdelantoChecks(prev => ({ ...prev, [a.id]: e.target.checked }))}
                        className="mt-0.5 accent-amber-600"
                      />
                      <span className="text-xs text-amber-800">
                        <span className="font-semibold">Saldo pendiente: {fmtMXN(saldo)}</span>
                        {a.forma_descuento === "parcialidades" && a.parcialidades && (
                          <span className="ml-1 text-amber-600">
                            · Cuota sugerida: {fmtMXN(parseFloat(a.monto) / a.parcialidades)}
                          </span>
                        )}
                      </span>
                    </label>
                    {adelantoChecks[a.id] && (
                      <div className="ml-6">
                        <label className="mb-1 block text-xs font-medium text-amber-700">
                          Descontar en este pago
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-amber-500">$</span>
                          <input
                            type="number" min="0.01" step="0.01"
                            max={saldo}
                            value={adelantoMontos[a.id] ?? ""}
                            onChange={e => setAdelantoMontos(prev => ({ ...prev, [a.id]: e.target.value }))}
                            className="w-40 rounded-lg border border-amber-300 bg-white px-3 py-1.5 pl-6 text-sm text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Periodo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Inicio del periodo <span className="text-red-500">*</span></label>
              <input type="date" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Fin del periodo <span className="text-red-500">*</span></label>
              <input type="date" value={periodoFin} onChange={(e) => setPeriodoFin(e.target.value)} className={inputClass} required />
            </div>
          </div>

          {/* Fecha de pago */}
          <div>
            <label className={labelClass}>Fecha de pago <span className="text-red-500">*</span></label>
            <input type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} className={inputClass} required />
          </div>

          {/* Montos */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Detalle del pago</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Sueldo del periodo <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <input type="number" min="0" step="0.01" value={sueldoPeriodo} onChange={(e) => setSueldoPeriodo(e.target.value)}
                    className={`${inputClass} pl-6`} required />
                </div>
              </div>
              <div>
                <label className={labelClass}>Otros conceptos</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <input type="number" min="0" step="0.01" value={otrosConceptos} onChange={(e) => setOtrosConceptos(e.target.value)}
                    placeholder="0.00" className={`${inputClass} pl-6`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Descuentos autorizados</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <input type="number" min="0" step="0.01" value={descuentosAutorizados} onChange={(e) => setDescuentosAutorizados(e.target.value)}
                    placeholder="0.00" className={`${inputClass} pl-6`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Otros descuentos</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <input type="number" min="0" step="0.01" value={otrosDescuentos} onChange={(e) => setOtrosDescuentos(e.target.value)}
                    placeholder="0.00" className={`${inputClass} pl-6`} />
                </div>
              </div>
            </div>

            {/* Desglose del total */}
            {adelantoTotal > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
                <span className="text-xs text-amber-700">Descuento por adelanto</span>
                <span className="text-xs font-semibold text-amber-700">− {fmtMXN(adelantoTotal)}</span>
              </div>
            )}

            <div className="flex items-center justify-between rounded-xl bg-[#312C85]/5 px-4 py-3">
              <span className="text-sm font-semibold text-slate-700">Total a pagar</span>
              <span className="text-lg font-bold text-[#312C85]">
                {parseFloat(totalCalculado).toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
              </span>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className={labelClass}>Observaciones</label>
            <textarea rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas adicionales..." className={`${inputClass} resize-none`} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-[var(--crm-text-muted)] hover:bg-[var(--crm-hover)]">
              Cancelar
            </button>
            <button type="submit" disabled={!canSave || saving}
              className="rounded-xl bg-[#312C85] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#4338ca] disabled:opacity-50">
              {saving ? "Guardando..." : initial ? "Guardar cambios" : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
