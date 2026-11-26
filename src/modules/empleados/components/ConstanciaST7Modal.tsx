import { useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import type { Empleado } from "../services/empleados.api";
import type { Incapacidad } from "../services/incapacidades.api";
import { generarConstanciaST7 } from "../utils/documentos-rh/doc-constancia-st7";

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const LABEL =
  "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface Props {
  empleado: Empleado;
  incapacidad: Incapacidad;
  onClose: () => void;
}

export function ConstanciaST7Modal({ empleado, incapacidad, onClose }: Props) {
  const [fechaActa,          setFechaActa]          = useState(todayISO());
  const [horaActa,           setHoraActa]           = useState(nowHHMM());
  const [horaIncidente,      setHoraIncidente]      = useState("");
  const [comoOcurrio,        setComoOcurrio]        = useState("");
  const [folioST7,           setFolioST7]           = useState("");
  const [argumentoTrabajador,setArgumentoTrabajador]= useState("");
  const [generating, setGenerating]                 = useState(false);
  const [error, setError]                           = useState("");

  const handleGenerar = async () => {
    if (!fechaActa)              { setError("La fecha del acta es obligatoria.");               return; }
    if (!horaActa)               { setError("La hora del acta es obligatoria.");                return; }
    if (!horaIncidente)          { setError("La hora del incidente es obligatoria.");           return; }
    if (!comoOcurrio.trim())     { setError("La descripción del incidente es obligatoria.");    return; }
    if (!folioST7.trim())        { setError("El folio ST-7 es obligatorio.");                   return; }
    if (!argumentoTrabajador.trim()) { setError("El argumento del trabajador es obligatorio."); return; }
    setGenerating(true);
    setError("");
    try {
      await generarConstanciaST7(empleado, incapacidad, {
        fecha_acta: fechaActa,
        hora_acta: horaActa,
        hora_incidente: horaIncidente,
        como_ocurrio: comoOcurrio.trim(),
        folio_st7: folioST7.trim().toUpperCase(),
        argumento_trabajador: argumentoTrabajador.trim(),
      });
      onClose();
    } catch {
      setError("Error al generar el documento.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppModal
      isOpen
      onClose={onClose}
      title="Constancia Entrega ST-7"
      maxWidthClassName="max-w-xl"
    >
      <div className="space-y-4">

        {/* Fecha y hora del acta */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Fecha del acta <span className="text-red-500">*</span></label>
            <input type="date" className={INPUT} value={fechaActa} onChange={(e) => setFechaActa(e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Hora del acta <span className="text-red-500">*</span></label>
            <input type="time" className={INPUT} value={horaActa} onChange={(e) => setHoraActa(e.target.value)} />
          </div>
        </div>

        {/* Folio ST-7 y hora del incidente */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Folio ST-7 <span className="text-red-500">*</span></label>
            <input
              type="text"
              className={INPUT}
              placeholder="Ej. UX798208"
              value={folioST7}
              onChange={(e) => setFolioST7(e.target.value)}
            />
          </div>
          <div>
            <label className={LABEL}>Hora del incidente <span className="text-red-500">*</span></label>
            <input type="time" className={INPUT} value={horaIncidente} onChange={(e) => setHoraIncidente(e.target.value)} />
          </div>
        </div>

        {/* Cómo ocurrió */}
        <div>
          <label className={LABEL}>¿Cómo ocurrió el accidente? <span className="text-red-500">*</span></label>
          <textarea
            rows={3}
            className={`${INPUT} resize-none`}
            placeholder="Ej. al regresar de su hora de comida, reportando un derrapamiento en motocicleta"
            value={comoOcurrio}
            onChange={(e) => setComoOcurrio(e.target.value)}
          />
        </div>

        {/* Argumento trabajador */}
        <div>
          <label className={LABEL}>Argumento del trabajador para no entregar <span className="text-red-500">*</span></label>
          <input
            type="text"
            className={INPUT}
            placeholder='Ej. no tener tiempo'
            value={argumentoTrabajador}
            onChange={(e) => setArgumentoTrabajador(e.target.value)}
          />
        </div>

        {/* Info autollenada */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 space-y-1">
          <p><span className="font-semibold">Trabajador:</span> {empleado.nombre} {empleado.apellido_paterno} {empleado.apellido_materno}</p>
          <p><span className="font-semibold">Incapacidad:</span> {incapacidad.dias} días — inicio {incapacidad.fecha_inicio.slice(0, 10)}</p>
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
            disabled={generating}
            className="rounded-lg bg-[#0F172A] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {generating ? "Generando..." : "Generar constancia"}
          </button>
        </div>
      </div>
    </AppModal>
  );
}
