import { useEffect, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { calcularDias } from "../services/vacaciones.api";
import type { Vacacion, CreateVacacionPayload, UpdateVacacionPayload } from "../services/vacaciones.api";

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const LABEL =
  "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";

interface Props {
  empleadoId: number;
  initial?: Vacacion | null;
  onSave: (data: CreateVacacionPayload | UpdateVacacionPayload) => Promise<void>;
  onClose: () => void;
}

export function VacacionModal({ empleadoId, initial, onSave, onClose }: Props) {
  const isEdit = Boolean(initial);

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [estatus, setEstatus] = useState<"Pendiente" | "Aprobada" | "Rechazada">("Pendiente");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) {
      setFechaInicio(initial.fecha_inicio.slice(0, 10));
      setFechaFin(initial.fecha_fin.slice(0, 10));
      setEstatus(initial.estatus);
    }
  }, [initial]);

  const dias = fechaInicio && fechaFin && fechaFin >= fechaInicio
    ? calcularDias(fechaInicio, fechaFin)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaInicio || !fechaFin) { setError("Las fechas son obligatorias."); return; }
    if (fechaFin < fechaInicio) { setError("La fecha fin debe ser igual o posterior a la fecha inicio."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = isEdit
        ? ({ fecha_inicio: fechaInicio, fecha_fin: fechaFin, dias, estatus } as UpdateVacacionPayload)
        : ({ empleado_id: empleadoId, fecha_inicio: fechaInicio, fecha_fin: fechaFin, dias, estatus } as CreateVacacionPayload);
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
      title={isEdit ? "Editar vacación" : "Registrar vacación"}
      maxWidthClassName="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Fecha inicio <span className="text-red-500">*</span></label>
            <input
              type="date"
              className={INPUT}
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div>
            <label className={LABEL}>Fecha fin <span className="text-red-500">*</span></label>
            <input
              type="date"
              className={INPUT}
              value={fechaFin}
              min={fechaInicio}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>

          {/* Días calculados */}
          <div>
            <label className={LABEL}>Días</label>
            <div className="flex h-[42px] items-center rounded-xl border border-slate-200 bg-slate-100 px-3.5 text-sm font-semibold text-[#312C85]">
              {dias > 0 ? `${dias} día${dias !== 1 ? "s" : ""}` : "—"}
            </div>
          </div>

          <div>
            <label className={LABEL}>Estatus</label>
            <select
              className={INPUT}
              value={estatus}
              onChange={(e) => setEstatus(e.target.value as typeof estatus)}
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobada">Aprobada</option>
              <option value="Rechazada">Rechazada</option>
            </select>
          </div>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex justify-center gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={onClose} className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white">
            Cancelar
          </button>
          <button type="submit" disabled={saving || dias === 0} className="rounded-lg bg-[#0F172A] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Registrar"}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
