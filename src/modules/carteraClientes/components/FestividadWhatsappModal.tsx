import { useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import type { ClienteCartera } from "@/interfaces/cartera-clientes.interface";
import { sendFestividadCampaign } from "../services/whatsapp.api";

const LABEL = "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";

interface Props {
  clientes: ClienteCartera[];
  onClose: () => void;
}

type Result = { total: number; sent: number; failed: number };

export function FestividadWhatsappModal({ clientes, onClose }: Props) {
  const conTelefono = clientes.filter((c) => c.telefono);
  const [selected, setSelected] = useState<Set<number>>(new Set(conTelefono.map((c) => c.id)));
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(
      selected.size === conTelefono.length
        ? new Set()
        : new Set(conTelefono.map((c) => c.id)),
    );

  const handleSend = async () => {
    const destinatarios = conTelefono
      .filter((c) => selected.has(c.id))
      .map((c) => ({ telefono: c.telefono!, nombre: c.nombre }));

    setSending(true);
    setError(null);
    try {
      const res = await sendFestividadCampaign(destinatarios);
      setResult({ total: res.total, sent: res.sent, failed: res.failed });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar");
    } finally {
      setSending(false);
    }
  };

  if (result) {
    return (
      <AppModal isOpen onClose={onClose} title="Resultado de envío" maxWidthClassName="max-w-sm">
        <div className="space-y-4 text-center">
          <p className="text-4xl">🎉</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-2xl font-black text-[var(--crm-text)]">{result.total}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
            <div className="rounded-xl bg-green-50 p-3">
              <p className="text-2xl font-black text-green-600">{result.sent}</p>
              <p className="text-xs text-slate-500">Enviados</p>
            </div>
            <div className="rounded-xl bg-red-50 p-3">
              <p className="text-2xl font-black text-red-600">{result.failed}</p>
              <p className="text-xs text-slate-500">Fallidos</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#312C85] px-6 py-2 text-sm font-semibold text-white"
          >
            Cerrar
          </button>
        </div>
      </AppModal>
    );
  }

  return (
    <AppModal
      isOpen
      onClose={onClose}
      title="Día de Muertos — WhatsApp"
      subtitle={`${selected.size} destinatario${selected.size !== 1 ? "s" : ""} seleccionado${selected.size !== 1 ? "s" : ""}`}
      maxWidthClassName="max-w-2xl"
      panelClassName="max-h-[90vh]"
    >
      <div className="space-y-4">
        {/* Info del template */}
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 flex items-start gap-3">
          <span className="text-2xl shrink-0">💀</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-orange-700 mb-0.5">Plantilla: dia_de_muertos</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Se enviará la plantilla de WhatsApp aprobada de Día de Muertos personalizada con el nombre de cada cliente. No necesitas escribir ningún mensaje.
            </p>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className={LABEL}>Destinatarios ({conTelefono.length} con teléfono)</label>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs font-semibold text-[#312C85] hover:underline"
            >
              {selected.size === conTelefono.length ? "Deseleccionar todos" : "Seleccionar todos"}
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200">
            {conTelefono.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2 last:border-0 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => toggle(c.id)}
                  className="accent-[#312C85]"
                />
                <span className="flex-1 text-sm font-medium text-[var(--crm-text)]">{c.nombre}</span>
                <span className="text-xs text-slate-400">{c.telefono}</span>
              </label>
            ))}
          </div>
        </div>

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
            onClick={handleSend}
            disabled={sending || selected.size === 0}
            className="rounded-lg bg-[#25D366] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {sending ? "Enviando..." : `Enviar a ${selected.size}`}
          </button>
        </div>
      </div>
    </AppModal>
  );
}
