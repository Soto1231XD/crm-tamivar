import { useEffect, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import type { PermisoEmpleado, CreatePermisoPayload, UpdatePermisoPayload } from "../services/permisos.api";

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const LABEL =
  "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";

interface Props {
  empleadoId: number;
  initial?: PermisoEmpleado | null;
  onSave: (data: CreatePermisoPayload | UpdatePermisoPayload) => Promise<void>;
  onClose: () => void;
}

export function PermisoModal({ empleadoId, initial, onSave, onClose }: Props) {
  const isEdit = Boolean(initial);

  const [fecha, setFecha] = useState("");
  const [tipo, setTipo] = useState<"Personal" | "Médico" | "Familiar">("Personal");
  const [conGoce, setConGoce] = useState(true);
  const [descripcion, setDescripcion] = useState("");
  const [estatus, setEstatus] = useState<"Pendiente" | "Aprobado" | "Rechazado">("Pendiente");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) {
      setFecha(initial.fecha.slice(0, 10));
      setTipo(initial.tipo);
      setConGoce(initial.con_goce);
      setDescripcion(initial.descripcion ?? "");
      setEstatus(initial.estatus);
    }
  }, [initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha) { setError("La fecha es obligatoria."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = isEdit
        ? ({ fecha, tipo, con_goce: conGoce, descripcion: descripcion || undefined, estatus } as UpdatePermisoPayload)
        : ({ empleado_id: empleadoId, fecha, tipo, con_goce: conGoce, descripcion: descripcion || undefined, estatus } as CreatePermisoPayload);
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
      title={isEdit ? "Editar permiso" : "Registrar permiso"}
      maxWidthClassName="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Fecha <span className="text-red-500">*</span></label>
            <input
              type="date"
              className={INPUT}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          <div>
            <label className={LABEL}>Tipo <span className="text-red-500">*</span></label>
            <select className={INPUT} value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}>
              <option value="Personal">Personal</option>
              <option value="Médico">Médico</option>
              <option value="Familiar">Familiar</option>
            </select>
          </div>

          <div>
            <label className={LABEL}>Estatus</label>
            <select className={INPUT} value={estatus} onChange={(e) => setEstatus(e.target.value as typeof estatus)}>
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          </div>

          <div>
            <label className={LABEL}>Goce de sueldo</label>
            <div className="flex h-[42px] items-center gap-4">
              {(["Con goce", "Sin goce"] as const).map((opt) => (
                <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-700">
                  <input
                    type="radio"
                    name="con_goce"
                    checked={conGoce === (opt === "Con goce")}
                    onChange={() => setConGoce(opt === "Con goce")}
                    className="accent-[#312C85]"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className={LABEL}>Descripción</label>
          <textarea
            rows={3}
            className={`${INPUT} resize-none`}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Motivo o detalles del permiso..."
          />
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
