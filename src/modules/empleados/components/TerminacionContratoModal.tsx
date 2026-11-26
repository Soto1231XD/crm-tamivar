import { useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import type { Empleado } from "../services/empleados.api";
import { generarTerminacionContrato } from "../utils/documentos-rh/doc-terminacion-contrato";

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const INPUT_SM =
  "w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-1 focus:ring-[#312C85]/10";
const LABEL =
  "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";


function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

interface Props {
  empleado: Empleado;
  onClose: () => void;
}

export function TerminacionContratoModal({ empleado, onClose }: Props) {
  const [domicilio,          setDomicilio]          = useState("");
  const [fechaContrato,      setFechaContrato]      = useState("");
  const [fechaNotificacion,  setFechaNotificacion]  = useState(todayISO());
  const [fechaEfectiva,      setFechaEfectiva]      = useState("");
  const [entregables,        setEntregables]        = useState<string[]>([""]);
  const [error,              setError]              = useState("");

  const setItem = (idx: number, val: string) =>
    setEntregables(prev => prev.map((item, i) => i === idx ? val : item));

  const addItem = () => setEntregables(prev => [...prev, ""]);

  const removeItem = (idx: number) =>
    setEntregables(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  const handleGenerar = () => {
    setError("");
    if (!domicilio.trim())         { setError("El domicilio es obligatorio."); return; }
    if (!fechaContrato)            { setError("La fecha del contrato original es obligatoria."); return; }
    if (!fechaNotificacion)        { setError("La fecha de notificación es obligatoria."); return; }
    if (!fechaEfectiva)            { setError("La fecha efectiva de terminación es obligatoria."); return; }
    const itemsOk = entregables.filter(i => i.trim());
    if (!itemsOk.length)           { setError("Agrega al menos un punto de entrega."); return; }

    generarTerminacionContrato({
      nombre:              empleado.nombre,
      apellido_paterno:    empleado.apellido_paterno,
      apellido_materno:    empleado.apellido_materno ?? "",
      puesto:              empleado.puesto,
      domicilio:           domicilio.trim(),
      fecha_contrato:      fechaContrato,
      fecha_notificacion:  fechaNotificacion,
      fecha_efectiva:      fechaEfectiva,
      entrega_items:       itemsOk,
    });
    onClose();
  };

  return (
    <AppModal
      isOpen
      onClose={onClose}
      title="Notificación de terminación de contrato"
      maxWidthClassName="max-w-2xl"
    >
      <div className="space-y-4">

        {/* Colaborador */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <span className="font-semibold">Colaborador: </span>
          {empleado.nombre} {empleado.apellido_paterno} {empleado.apellido_materno}
          <span className="ml-2 text-slate-400">· {empleado.puesto}</span>
        </div>

        {/* Domicilio */}
        <div>
          <label className={LABEL}>
            Domicilio del colaborador <span className="text-red-500">*</span>
          </label>
          <textarea
            className={INPUT + " resize-none h-16"}
            placeholder="Calle, Manzana, Lote, Colonia, CP, Ciudad, Estado…"
            value={domicilio}
            onChange={e => setDomicilio(e.target.value)}
          />
        </div>

        {/* Fechas */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>
              Fecha del contrato original <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={INPUT}
              value={fechaContrato}
              onChange={e => setFechaContrato(e.target.value)}
            />
          </div>
          <div>
            <label className={LABEL}>
              Fecha de esta notificación <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={INPUT}
              value={fechaNotificacion}
              onChange={e => setFechaNotificacion(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={LABEL}>
            Fecha efectiva de terminación <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            className={INPUT}
            value={fechaEfectiva}
            onChange={e => setFechaEfectiva(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-slate-400">
            El día de la semana se incluirá automáticamente en el documento.
          </p>
        </div>

        {/* Entregables */}
        <div>
          <label className={LABEL}>
            Qué debe entregar el colaborador <span className="text-red-500">*</span>
          </label>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            {entregables.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 border-b border-slate-100 last:border-b-0 px-3 py-2">
                <span className="mt-2 shrink-0 text-xs font-semibold text-slate-400 w-5 text-right">
                  {idx + 1}.
                </span>
                <textarea
                  className={INPUT_SM + " resize-none h-14 flex-1"}
                  placeholder="Describe lo que debe entregar…"
                  value={item}
                  onChange={e => setItem(idx, e.target.value)}
                />
                {entregables.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="mt-2 shrink-0 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <div className="px-3 py-2 bg-slate-50">
              <button
                type="button"
                onClick={addItem}
                className="text-xs text-[#312C85] font-semibold hover:underline"
              >
                + Agregar punto
              </button>
            </div>
          </div>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

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
            className="rounded-lg bg-[#0F172A] px-5 py-2 text-sm font-semibold text-white"
          >
            Generar documento
          </button>
        </div>
      </div>
    </AppModal>
  );
}
