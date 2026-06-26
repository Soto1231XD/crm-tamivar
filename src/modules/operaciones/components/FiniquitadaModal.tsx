import { useEffect, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { MoneyInput } from "./MoneyInput";
import type { OperacionFiniquitada } from "../services/operaciones.api";

const INPUT = "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const LABEL = "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";

interface Props {
  initial?: OperacionFiniquitada | null;
  prefill?: { propietario?: string; cliente?: string; propiedad?: string };
  onSave: (data: Partial<OperacionFiniquitada>) => Promise<void>;
  onClose: () => void;
}

export function FiniquitadaModal({ initial, prefill, onSave, onClose }: Props) {
  const isEdit = Boolean(initial);

  const [form, setForm] = useState<Partial<OperacionFiniquitada>>({
    propietario: prefill?.propietario ?? "",
    cliente: prefill?.cliente ?? "",
    propiedad: prefill?.propiedad ?? "",
    fecha_firma: null, monto_operacion: null, estatus_pago: null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial]);

  const set = (k: keyof OperacionFiniquitada, v: string) =>
    setForm((f) => ({ ...f, [k]: v || null }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.propietario?.trim() || !form.cliente?.trim() || !form.propiedad?.trim()) {
      setError("Propietario, cliente y propiedad son obligatorios.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(form);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      isOpen
      onClose={onClose}
      title={isEdit ? "Editar operación finiquitada" : "Finiquitar operación"}
      subtitle={isEdit ? "Actualiza los datos de la operación finiquitada." : "Al guardar se creará automáticamente un registro en Comisiones."}
      maxWidthClassName="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <p className={LABEL}>Información de la operación</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={LABEL}>Propietario <span className="text-red-500">*</span></label>
              <input type="text" className={INPUT} value={form.propietario ?? ""} onChange={(e) => set("propietario", e.target.value)} placeholder="Nombre del propietario" />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Cliente <span className="text-red-500">*</span></label>
              <input type="text" className={INPUT} value={form.cliente ?? ""} onChange={(e) => set("cliente", e.target.value)} placeholder="Nombre del cliente" />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Propiedad <span className="text-red-500">*</span></label>
              <input type="text" className={INPUT} value={form.propiedad ?? ""} onChange={(e) => set("propiedad", e.target.value)} placeholder="Nombre o dirección de la propiedad" />
            </div>
            <div>
              <label className={LABEL}>Fecha de firma</label>
              <input type="date" className={INPUT} value={form.fecha_firma ? form.fecha_firma.slice(0, 10) : ""} onChange={(e) => set("fecha_firma", e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>OPERACIÓN CERRADA EN ($)</label>
              <MoneyInput
                value={form.monto_operacion ?? null}
                onChange={(v) => setForm((f) => ({ ...f, monto_operacion: v }))}
                className={INPUT}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Estatus de pago</label>
              <input type="text" className={INPUT} value={form.estatus_pago ?? ""} onChange={(e) => set("estatus_pago", e.target.value)} placeholder="Ej: Saldado, Pendiente, En proceso..." />
            </div>
          </div>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex items-center justify-center gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={onClose} className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Finiquitar"}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
