import { useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import type { Empleado } from "../services/empleados.api";
import type { Baja } from "../services/bajas.api";
import { generarFiniquito, type FiniquitoData } from "../utils/documentos-rh/doc-finiquito";

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const LABEL =
  "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";

interface Renglon {
  concepto: string;
  importe: string;
}

const DEFAULT_PERCEPCIONES: Renglon[] = [
  { concepto: "Sueldo devengado", importe: "" },
  { concepto: "Aguinaldo proporcional", importe: "" },
  { concepto: "Vacaciones proporcionales", importe: "" },
  { concepto: "Prima vacacional proporcional", importe: "" },
];

function parseMonto(val: string): number {
  return parseFloat(val.replace(/,/g, "").replace(/\$/g, "")) || 0;
}

function fmtTotal(n: number): string {
  return `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface Props {
  empleado: Empleado;
  baja: Baja;
  onClose: () => void;
}

export function FiniquitoModal({ empleado, baja, onClose }: Props) {
  const [sueldoMensual, setSueldoMensual] = useState("");
  const [percepciones, setPercepciones] = useState<Renglon[]>(() =>
    DEFAULT_PERCEPCIONES.map((r) => ({ ...r })),
  );
  const [descuentos, setDescuentos] = useState<Renglon[]>([]);
  const [nota, setNota] = useState("");
  const [generando, setGenerando] = useState(false);

  const totalPerc = percepciones.reduce((acc, r) => acc + parseMonto(r.importe), 0);
  const totalDesc = descuentos.reduce((acc, r) => acc + parseMonto(r.importe), 0);
  const neto = totalPerc - totalDesc;

  function updatePerc(idx: number, field: keyof Renglon, value: string) {
    setPercepciones((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }
  function updateDesc(idx: number, field: keyof Renglon, value: string) {
    setDescuentos((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  async function handleGenerar() {
    setGenerando(true);
    try {
      const finData: FiniquitoData = {
        sueldoMensual,
        percepciones: percepciones.filter((r) => r.concepto.trim()),
        descuentos: descuentos.filter((r) => r.concepto.trim()),
        nota,
      };
      await generarFiniquito(empleado, baja, finData);
      onClose();
    } catch (e) {
      alert("Error al generar el finiquito: " + (e instanceof Error ? e.message : e));
    } finally {
      setGenerando(false);
    }
  }

  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno ?? ""}`.trim();

  return (
    <AppModal isOpen onClose={onClose} title="Generar Finiquito" maxWidthClassName="max-w-2xl">
      <div className="space-y-5">

        {/* Info de la baja */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-700 space-y-1">
          <p><span className="font-semibold">Colaborador:</span> {nombre}</p>
          <p><span className="font-semibold">Puesto:</span> {empleado.puesto}</p>
          <p><span className="font-semibold">Tipo de baja:</span> {baja.tipo}</p>
          <p><span className="font-semibold">Fecha de baja:</span> {baja.fecha_baja.slice(0, 10)}</p>
        </div>

        {/* Sueldo mensual */}
        <div>
          <label className={LABEL}>Sueldo mensual</label>
          <input
            type="text"
            className={INPUT}
            value={sueldoMensual}
            onChange={(e) => setSueldoMensual(e.target.value)}
            placeholder="Ej. 8500.00"
          />
        </div>

        {/* Percepciones */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={LABEL + " mb-0"}>Percepciones</span>
            <button
              type="button"
              onClick={() => setPercepciones((p) => [...p, { concepto: "", importe: "" }])}
              className="text-xs font-semibold text-[#312C85] hover:underline"
            >
              + Agregar fila
            </button>
          </div>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-[1fr_140px_32px] bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <span>Concepto</span><span className="text-right">Importe</span><span />
            </div>
            {percepciones.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_140px_32px] items-center gap-2 px-3 py-1.5 border-t border-slate-100">
                <input
                  type="text"
                  className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-[#312C85] focus:ring-1 focus:ring-[#312C85]/20"
                  value={row.concepto}
                  onChange={(e) => updatePerc(i, "concepto", e.target.value)}
                  placeholder="Concepto"
                />
                <input
                  type="text"
                  className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 text-right outline-none focus:border-[#312C85] focus:ring-1 focus:ring-[#312C85]/20"
                  value={row.importe}
                  onChange={(e) => updatePerc(i, "importe", e.target.value)}
                  placeholder="0.00"
                />
                <button
                  type="button"
                  onClick={() => setPercepciones((p) => p.filter((_, j) => j !== i))}
                  className="flex items-center justify-center text-slate-400 hover:text-red-500"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <div className="grid grid-cols-[1fr_140px_32px] items-center px-3 py-2 bg-slate-50 border-t border-slate-200">
              <span className="text-xs font-semibold text-slate-600">Total Percepciones</span>
              <span className="text-sm font-bold text-slate-800 text-right">{fmtTotal(totalPerc)}</span>
              <span />
            </div>
          </div>
        </div>

        {/* Descuentos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={LABEL + " mb-0"}>Descuentos</span>
            <button
              type="button"
              onClick={() => setDescuentos((d) => [...d, { concepto: "", importe: "" }])}
              className="text-xs font-semibold text-[#312C85] hover:underline"
            >
              + Agregar fila
            </button>
          </div>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-[1fr_140px_32px] bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <span>Concepto</span><span className="text-right">Importe</span><span />
            </div>
            {descuentos.length === 0 && (
              <div className="px-3 py-3 text-center text-xs text-slate-400 border-t border-slate-100">
                Sin descuentos — haz clic en "+ Agregar fila" para añadir
              </div>
            )}
            {descuentos.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_140px_32px] items-center gap-2 px-3 py-1.5 border-t border-slate-100">
                <input
                  type="text"
                  className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-[#312C85] focus:ring-1 focus:ring-[#312C85]/20"
                  value={row.concepto}
                  onChange={(e) => updateDesc(i, "concepto", e.target.value)}
                  placeholder="Concepto"
                />
                <input
                  type="text"
                  className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 text-right outline-none focus:border-[#312C85] focus:ring-1 focus:ring-[#312C85]/20"
                  value={row.importe}
                  onChange={(e) => updateDesc(i, "importe", e.target.value)}
                  placeholder="0.00"
                />
                <button
                  type="button"
                  onClick={() => setDescuentos((d) => d.filter((_, j) => j !== i))}
                  className="flex items-center justify-center text-slate-400 hover:text-red-500"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <div className="grid grid-cols-[1fr_140px_32px] items-center px-3 py-2 bg-slate-50 border-t border-slate-200">
              <span className="text-xs font-semibold text-slate-600">Total Descuentos</span>
              <span className="text-sm font-bold text-slate-800 text-right">{fmtTotal(totalDesc)}</span>
              <span />
            </div>
          </div>
        </div>

        {/* Neto */}
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
          <span className="text-sm font-bold text-emerald-800">NETO A PAGAR</span>
          <span className="text-lg font-bold text-emerald-700">{fmtTotal(neto)}</span>
        </div>

        {/* Nota */}
        <div>
          <label className={LABEL}>Nota de cálculo (opcional)</label>
          <textarea
            rows={3}
            className={`${INPUT} resize-none`}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Detalles del cálculo, período, etc."
          />
        </div>

        {/* Botones */}
        <div className="flex justify-center gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGenerar}
            disabled={generando}
            className="flex items-center gap-2 rounded-lg bg-[#0F172A] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {generando ? "Generando..." : "Generar Finiquito"}
          </button>
        </div>
      </div>
    </AppModal>
  );
}
