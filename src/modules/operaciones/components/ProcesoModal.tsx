import { useEffect, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import type { OperacionProceso } from "../services/operaciones.api";

const INPUT = "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const LABEL = "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";

export const ETAPA_COLORS: Record<string, { bg: string; text: string }> = {
  "En proceso": { bg: "#fec306", text: "#78350f" },
  "Finalizado": { bg: "#b86d00", text: "#fff" },
};

export type EtapaValue = { s: string; n: string };

export function parseEtapa(raw: string | null | undefined): EtapaValue {
  if (!raw) return { s: "", n: "" };
  try {
    const p = JSON.parse(raw);
    if (p && typeof p === "object") return { s: p.s ?? "", n: p.n ?? "" };
  } catch {}
  return { s: "", n: raw };
}

export function encodeEtapa(s: string, n: string): string | null {
  if (!s && !n.trim()) return null;
  return JSON.stringify({ s, n });
}

const ETAPAS: { key: keyof OperacionProceso; label: string }[] = [
  { key: "etapa_expediente",  label: "Reunión del expediente" },
  { key: "etapa_documentos",  label: "Actualización de documentos" },
  { key: "etapa_avaluo",      label: "Avalúo" },
  { key: "etapa_inscripcion", label: "Inscripción del crédito" },
  { key: "etapa_notaria",     label: "Docs en notaría" },
  { key: "etapa_constancia",  label: "Constancia de no adeudo" },
  { key: "etapa_firma",       label: "Firma" },
];

interface Props {
  initial?: OperacionProceso | null;
  onSave: (data: Partial<OperacionProceso>) => Promise<void>;
  onClose: () => void;
}

export function ProcesoModal({ initial, onSave, onClose }: Props) {
  const isEdit = Boolean(initial);

  const [form, setForm] = useState<Partial<OperacionProceso>>({
    propietario: "", cliente: "", propiedad: "", fecha_inicio: null,
    estatus: null, etapa_expediente: null, etapa_documentos: null,
    etapa_avaluo: null, etapa_inscripcion: null, etapa_notaria: null,
    etapa_constancia: null, etapa_firma: null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial]);

  const set = (k: keyof OperacionProceso, v: string | null) =>
    setForm((f) => ({ ...f, [k]: v }));

  const setEtapa = (key: keyof OperacionProceso, field: "s" | "n", value: string) => {
    const current = parseEtapa(form[key] as string | null);
    const updated = field === "s"
      ? encodeEtapa(value, current.n)
      : encodeEtapa(current.s, value);
    set(key, updated);
  };

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
      title={isEdit ? "Editar operación en proceso" : "Nueva operación en proceso"}
      subtitle="Captura o actualiza los datos de seguimiento de la operación."
      maxWidthClassName="max-w-2xl"
      panelClassName="max-h-[90vh]"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Información principal */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <p className={LABEL}>Información principal</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Propietario <span className="text-red-500">*</span></label>
              <input type="text" className={INPUT} value={form.propietario ?? ""} onChange={(e) => set("propietario", e.target.value)} placeholder="Nombre del propietario" />
            </div>
            <div>
              <label className={LABEL}>Cliente <span className="text-red-500">*</span></label>
              <input type="text" className={INPUT} value={form.cliente ?? ""} onChange={(e) => set("cliente", e.target.value)} placeholder="Nombre del cliente" />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Propiedad <span className="text-red-500">*</span></label>
              <input type="text" className={INPUT} value={form.propiedad ?? ""} onChange={(e) => set("propiedad", e.target.value)} placeholder="Nombre o dirección de la propiedad" />
            </div>
            <div>
              <label className={LABEL}>Fecha de inicio</label>
              <input type="date" className={INPUT} value={form.fecha_inicio ? form.fecha_inicio.slice(0, 10) : ""} onChange={(e) => set("fecha_inicio", e.target.value || null)} />
            </div>
            <div>
              <label className={LABEL}>Estatus general</label>
              <input type="text" className={INPUT} value={form.estatus ?? ""} onChange={(e) => set("estatus", e.target.value || null)} placeholder="Estado actual de la operación" />
            </div>
          </div>
        </div>

        {/* Etapas */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <p className={LABEL}>Etapas del proceso</p>
          <div className="space-y-4">
            {ETAPAS.map(({ key, label }) => {
              const etapa = parseEtapa(form[key] as string | null);
              const colorStyle = ETAPA_COLORS[etapa.s];
              return (
                <div key={key} className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className={LABEL + " mb-2"}>{label}</p>
                  <div className="flex gap-2 mb-2">
                    {Object.entries(ETAPA_COLORS).map(([status, { bg, text }]) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setEtapa(key, "s", etapa.s === status ? "" : status)}
                        className="rounded-full px-3 py-1 text-xs font-semibold transition-all"
                        style={{
                          backgroundColor: bg,
                          color: text,
                          opacity: etapa.s && etapa.s !== status ? 0.35 : 1,
                          outline: etapa.s === status ? `2px solid ${bg}` : "none",
                          outlineOffset: "2px",
                        }}
                      >
                        {status}
                      </button>
                    ))}
                    {etapa.s && (
                      <button
                        type="button"
                        onClick={() => setEtapa(key, "s", "")}
                        className="rounded-full px-2 py-1 text-xs text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition resize-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#312C85]/10"
                    style={colorStyle
                      ? { backgroundColor: colorStyle.bg + "22", borderColor: colorStyle.bg + "66", color: "#1e293b" }
                      : { borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }
                    }
                    value={etapa.n}
                    onChange={(e) => setEtapa(key, "n", e.target.value)}
                    placeholder="Notas de seguimiento..."
                  />
                </div>
              );
            })}
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
