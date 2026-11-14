import { useEffect, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import type { ApoSolidario, CreateApoSolidarioPayload, UpdateApoSolidarioPayload } from "../services/apoyos-solidarios.api";

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const LABEL =
  "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";

interface Props {
  empleadoId: number;
  initial?: ApoSolidario | null;
  onSave: (data: CreateApoSolidarioPayload | UpdateApoSolidarioPayload) => Promise<void>;
  onClose: () => void;
}

export function ApoSolidarioModal({ empleadoId, initial, onSave, onClose }: Props) {
  const isEdit = Boolean(initial);

  const [fechaIncidente, setFechaIncidente] = useState("");
  const [horaIncidente, setHoraIncidente]   = useState("");
  const [descripcion, setDescripcion]       = useState("");
  const [monto, setMonto]                   = useState("");
  const [estatus, setEstatus]               = useState<"Pendiente" | "Autorizado" | "Cancelado">("Pendiente");
  const [saving, setSaving]                 = useState(false);
  const [error, setError]                   = useState("");

  useEffect(() => {
    if (initial) {
      setFechaIncidente(initial.fecha_incidente.slice(0, 10));
      setHoraIncidente(initial.hora_incidente);
      setDescripcion(initial.descripcion);
      setMonto(parseFloat(initial.monto).toFixed(2));
      setEstatus(initial.estatus);
    }
  }, [initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaIncidente) { setError("La fecha del incidente es obligatoria."); return; }
    if (!horaIncidente.trim()) { setError("La hora aproximada es obligatoria."); return; }
    if (!descripcion.trim()) { setError("La descripción del incidente es obligatoria."); return; }
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) { setError("El monto debe ser mayor a cero."); return; }

    setSaving(true);
    setError("");
    try {
      const payload = isEdit
        ? ({ fecha_incidente: fechaIncidente, hora_incidente: horaIncidente.trim(), descripcion: descripcion.trim(), monto: montoNum.toFixed(2), estatus } as UpdateApoSolidarioPayload)
        : ({ empleado_id: empleadoId, fecha_incidente: fechaIncidente, hora_incidente: horaIncidente.trim(), descripcion: descripcion.trim(), monto: montoNum.toFixed(2), estatus } as CreateApoSolidarioPayload);
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      isOpen
      onClose={onClose}
      title={isEdit ? "Editar apoyo solidario" : "Registrar apoyo solidario"}
      maxWidthClassName="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Fecha del incidente <span className="text-red-500">*</span></label>
            <input type="date" className={INPUT} value={fechaIncidente} onChange={e => setFechaIncidente(e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Hora aprox. <span className="text-red-500">*</span></label>
            <input
              type="text"
              className={INPUT}
              value={horaIncidente}
              onChange={e => setHoraIncidente(e.target.value)}
              placeholder="Ej. 4:00 p.m."
            />
          </div>
        </div>

        <div>
          <label className={LABEL}>Descripción del incidente <span className="text-red-500">*</span></label>
          <textarea
            rows={5}
            className={`${INPUT} resize-none`}
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Describe qué pasó, cómo reaccionó la empresa, contexto del accidente..."
          />
          <p className="mt-1 text-xs text-slate-400">Este texto aparecerá tal cual en el documento generado.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Monto del apoyo (MXN) <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={INPUT}
              value={monto}
              onChange={e => setMonto(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className={LABEL}>Estatus</label>
            <select className={INPUT} value={estatus} onChange={e => setEstatus(e.target.value as typeof estatus)}>
              <option value="Pendiente">Pendiente</option>
              <option value="Autorizado">Autorizado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex justify-center gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={onClose} className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-[#0F172A] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Registrar"}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
