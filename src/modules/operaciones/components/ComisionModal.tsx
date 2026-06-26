import { useEffect, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { MoneyInput } from "./MoneyInput";
import type { Comision } from "../services/operaciones.api";

const INPUT = "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const LABEL = "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";

const MONEY_FIELDS: { key: keyof Comision; label: string }[] = [
  { key: "comision_total",      label: "Comisión total ($)" },
  { key: "comision_tamivar",    label: "Comisión Tamivar ($)" },
  { key: "comision_extra",      label: "Comisión extra ($)" },
  { key: "monto_operacion",     label: "Monto de operación ($)" },
  { key: "ganancias_mensuales", label: "Ganancias mensuales ($)" },
  { key: "ganancias_anuales",   label: "Ganancias anuales ($)" },
];

const PARTICIPANT_FIELDS: { key: keyof Comision; contactKey: keyof Comision; label: string; contactLabel: string }[] = [
  { key: "vendedor",  contactKey: "contacto_vendedor",  label: "Vendedor / Arrendador",    contactLabel: "Contacto vendedor" },
  { key: "comprador", contactKey: "contacto_comprador", label: "Comprador / Arrendatario", contactLabel: "Contacto comprador" },
  { key: "referido",  contactKey: "contacto_referido",  label: "Referido",                 contactLabel: "Contacto referido" },
];

interface Props {
  comision?: Comision | null;
  onSave: (id: number | null, data: Partial<Comision>) => Promise<void>;
  onClose: () => void;
}

export function ComisionModal({ comision, onSave, onClose }: Props) {
  const isEdit = Boolean(comision);

  const [form, setForm] = useState<Partial<Comision>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (comision) setForm(comision);
  }, [comision]);

  const set = (k: keyof Comision, v: string) =>
    setForm((f) => ({ ...f, [k]: v || null }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(comision?.id ?? null, form);
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
      title={isEdit ? "Editar comisión" : "Nueva comisión"}
      subtitle={isEdit ? `Propiedad: ${comision?.propiedad ?? "—"}` : "Registra una nueva comisión de forma independiente."}
      maxWidthClassName="max-w-2xl"
      panelClassName="max-h-[90vh]"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Datos generales */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <p className={LABEL}>Datos generales</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Fecha</label>
              <input type="date" className={INPUT} value={form.fecha ? form.fecha.slice(0, 10) : ""} onChange={(e) => set("fecha", e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Propiedad</label>
              <input type="text" className={INPUT} value={form.propiedad ?? ""} onChange={(e) => set("propiedad", e.target.value)} placeholder="Nombre de la propiedad" />
            </div>
            <div>
              <label className={LABEL}>Asesor Tamivar</label>
              <input type="text" className={INPUT} value={form.asesor_tamivar ?? ""} onChange={(e) => set("asesor_tamivar", e.target.value)} placeholder="Nombre del asesor" />
            </div>
          </div>
        </div>

        {/* Importes */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <p className={LABEL}>Importes</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {MONEY_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label className={LABEL}>{label}</label>
                <MoneyInput
                  value={(form[key] as string) ?? null}
                  onChange={(v) => setForm((f) => ({ ...f, [key]: v }))}
                  className={INPUT}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Participantes */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <p className={LABEL}>Participantes</p>
          <div className="space-y-4">
            {PARTICIPANT_FIELDS.map(({ key, contactKey, label, contactLabel }) => (
              <div key={key} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL}>{label}</label>
                  <input type="text" className={INPUT} value={(form[key] as string) ?? ""} onChange={(e) => set(key, e.target.value)} placeholder="Nombre" />
                </div>
                <div>
                  <label className={LABEL}>{contactLabel}</label>
                  <input type="text" className={INPUT} value={(form[contactKey] as string) ?? ""} onChange={(e) => set(contactKey, e.target.value)} placeholder="Teléfono o correo" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex items-center justify-center gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={onClose} className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear comisión"}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
