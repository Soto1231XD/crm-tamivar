import { useEffect, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import type { Baja, CreateBajaPayload, UpdateBajaPayload } from "../services/bajas.api";

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const LABEL =
  "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";

interface Props {
  empleadoId: number;
  initial?: Baja | null;
  onSave: (data: CreateBajaPayload | UpdateBajaPayload) => Promise<void>;
  onClose: () => void;
}

export function BajaModal({ empleadoId, initial, onSave, onClose }: Props) {
  const isEdit = Boolean(initial);

  const [fechaBaja, setFechaBaja] = useState("");
  const [tipo, setTipo] = useState<"Renuncia" | "Despido" | "Fin de contrato">("Renuncia");
  const [descripcion, setDescripcion] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) {
      setFechaBaja(initial.fecha_baja.slice(0, 10));
      setTipo(initial.tipo);
      setDescripcion(initial.descripcion ?? "");
    }
  }, [initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaBaja) { setError("La fecha de baja es obligatoria."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = isEdit
        ? ({ fecha_baja: fechaBaja, tipo, descripcion: descripcion || undefined } as UpdateBajaPayload)
        : ({ empleado_id: empleadoId, fecha_baja: fechaBaja, tipo, descripcion: descripcion || undefined } as CreateBajaPayload);
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
      title={isEdit ? "Editar baja" : "Registrar baja"}
      maxWidthClassName="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Fecha de baja <span className="text-red-500">*</span></label>
            <input type="date" className={INPUT} value={fechaBaja} onChange={(e) => setFechaBaja(e.target.value)} />
          </div>

          <div>
            <label className={LABEL}>Tipo <span className="text-red-500">*</span></label>
            <select className={INPUT} value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}>
              <option value="Renuncia">Renuncia</option>
              <option value="Despido">Despido</option>
              <option value="Fin de contrato">Fin de contrato</option>
            </select>
          </div>
        </div>

        <div>
          <label className={LABEL}>Motivo / Descripción</label>
          <textarea
            rows={3}
            className={`${INPUT} resize-none`}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Motivo de la baja..."
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
