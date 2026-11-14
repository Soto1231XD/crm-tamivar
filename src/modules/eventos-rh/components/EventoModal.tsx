import { useEffect, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import type { EventoRH } from "../services/eventos.api";

const INPUT = "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const LABEL = "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";

interface Props {
  initial: EventoRH | null;
  onSave: (data: { nombre: string; fecha: string; descripcion?: string }) => Promise<void>;
  onClose: () => void;
}

export function EventoModal({ initial, onSave, onClose }: Props) {
  const [nombre, setNombre]       = useState(initial?.nombre ?? "");
  const [fecha, setFecha]         = useState(initial?.fecha.slice(0, 10) ?? "");
  const [descripcion, setDesc]    = useState(initial?.descripcion ?? "");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    setNombre(initial?.nombre ?? "");
    setFecha(initial?.fecha.slice(0, 10) ?? "");
    setDesc(initial?.descripcion ?? "");
  }, [initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    if (!fecha) { setError("La fecha es obligatoria."); return; }
    setSaving(true); setError("");
    try {
      await onSave({ nombre: nombre.trim(), fecha, descripcion: descripcion.trim() || undefined });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally { setSaving(false); }
  };

  return (
    <AppModal
      isOpen
      onClose={onClose}
      title={initial ? "Editar evento" : "Nuevo evento"}
      subtitle="Captura los datos del convivio o actividad."
      maxWidthClassName="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL}>Nombre del evento <span className="text-red-500">*</span></label>
          <input type="text" className={INPUT} value={nombre}
            onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Posada 2026, Día del trabajo" />
        </div>
        <div>
          <label className={LABEL}>Fecha <span className="text-red-500">*</span></label>
          <input type="date" className={INPUT} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Descripción</label>
          <textarea rows={3} className={`${INPUT} resize-none`} value={descripcion}
            onChange={(e) => setDesc(e.target.value)} placeholder="Notas sobre el evento..." />
        </div>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={onClose}
            className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70">
            {saving ? "Guardando..." : initial ? "Guardar cambios" : "Registrar evento"}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
