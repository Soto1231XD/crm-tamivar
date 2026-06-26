import { useEffect, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import type { ClienteCartera } from "@/interfaces/cartera-clientes.interface";

const INPUT = "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const LABEL = "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";

const MESES = [
  { v: 1, l: "Enero" }, { v: 2, l: "Febrero" }, { v: 3, l: "Marzo" },
  { v: 4, l: "Abril" }, { v: 5, l: "Mayo" }, { v: 6, l: "Junio" },
  { v: 7, l: "Julio" }, { v: 8, l: "Agosto" }, { v: 9, l: "Septiembre" },
  { v: 10, l: "Octubre" }, { v: 11, l: "Noviembre" }, { v: 12, l: "Diciembre" },
];

type Form = Partial<Omit<ClienteCartera, "id" | "creado_en" | "actualizado_en">>;

interface Props {
  initial?: ClienteCartera | null;
  onSave: (data: Form) => Promise<void>;
  onClose: () => void;
}

export function ClienteModal({ initial, onSave, onClose }: Props) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState<Form>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(initial ? { ...initial } : {});
  }, [initial]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre?.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(form);
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
      title={isEdit ? "Editar cliente" : "Nuevo cliente"}
      subtitle="Captura o actualiza los datos del cliente en cartera."
      maxWidthClassName="max-w-2xl"
      panelClassName="max-h-[90vh]"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">

            {/* Nombre */}
            <div className="sm:col-span-2">
              <label className={LABEL}>Nombre <span className="text-red-500">*</span></label>
              <input
                type="text"
                className={INPUT}
                value={form.nombre ?? ""}
                onChange={(e) => set("nombre", e.target.value)}
                placeholder="Nombre completo del cliente"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className={LABEL}>Teléfono</label>
              <input
                type="text"
                className={INPUT}
                value={form.telefono ?? ""}
                onChange={(e) => set("telefono", e.target.value || null)}
                placeholder="998 000 0000"
              />
            </div>

            {/* Comprador / Vendedor */}
            <div>
              <label className={LABEL}>Comprador / Vendedor</label>
              <select
                className={INPUT}
                value={form.tipo ?? ""}
                onChange={(e) => set("tipo", e.target.value || null)}
              >
                <option value="">Sin definir</option>
                <option>Comprador</option>
                <option>Vendedor</option>
                <option>Inquilino</option>
              </select>
            </div>

            {/* Cumpleaños */}
            <div>
              <label className={LABEL}>Día de cumpleaños</label>
              <input
                type="number"
                min={1}
                max={31}
                className={INPUT}
                value={form.cumple_dia ?? ""}
                onChange={(e) => set("cumple_dia", e.target.value ? Number(e.target.value) : null)}
                placeholder="1 – 31"
              />
            </div>
            <div>
              <label className={LABEL}>Mes de cumpleaños</label>
              <select
                className={INPUT}
                value={form.cumple_mes ?? ""}
                onChange={(e) => set("cumple_mes", e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Sin mes</option>
                {MESES.map((m) => (
                  <option key={m.v} value={m.v}>{m.l}</option>
                ))}
              </select>
            </div>

            {/* Propiedad */}
            <div className="sm:col-span-2">
              <label className={LABEL}>Propiedad</label>
              <input
                type="text"
                className={INPUT}
                value={form.propiedad ?? ""}
                onChange={(e) => set("propiedad", e.target.value || null)}
                placeholder="Nombre o descripción de la propiedad"
              />
            </div>

            {/* Ubicación */}
            <div className="sm:col-span-2">
              <label className={LABEL}>Ubicación</label>
              <input
                type="text"
                className={INPUT}
                value={form.ubicacion ?? ""}
                onChange={(e) => set("ubicacion", e.target.value || null)}
                placeholder="Colonia, fraccionamiento, etc."
              />
            </div>

            {/* Referencia */}
            <div>
              <label className={LABEL}>Referencia</label>
              <input
                type="text"
                className={INPUT}
                value={form.referencia ?? ""}
                onChange={(e) => set("referencia", e.target.value || null)}
                placeholder="Nombre del referido"
              />
            </div>

            {/* Teléfono referencia */}
            <div>
              <label className={LABEL}>Teléfono referencia</label>
              <input
                type="text"
                className={INPUT}
                value={form.telefono_referencia ?? ""}
                onChange={(e) => set("telefono_referencia", e.target.value || null)}
                placeholder="998 000 0000"
              />
            </div>

            {/* SMS Post venta */}
            <div className="sm:col-span-2">
              <label className={LABEL}>SMS Post venta</label>
              <textarea
                rows={3}
                className={INPUT + " resize-none"}
                value={form.sms_post_venta ?? ""}
                onChange={(e) => set("sms_post_venta", e.target.value || null)}
                placeholder="Notas o mensaje de seguimiento post venta..."
              />
            </div>

          </div>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex items-center justify-center gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={onClose} className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear"}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
