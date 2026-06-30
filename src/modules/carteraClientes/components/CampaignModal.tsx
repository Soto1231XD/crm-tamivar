import { useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { sendCampaign, type CampaignResult } from "../services/whatsapp.api";
import type { ClienteCartera } from "@/interfaces/cartera-clientes.interface";

const INPUT = "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const LABEL = "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";

interface Props {
  clientes: ClienteCartera[];
  onClose: () => void;
}

export function CampaignModal({ clientes, onClose }: Props) {
  const conTelefono = clientes.filter((c) => c.telefono);
  const [selected, setSelected] = useState<Set<number>>(new Set(conTelefono.map((c) => c.id)));
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<CampaignResult | null>(null);

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
    const phones = conTelefono
      .filter((c) => selected.has(c.id))
      .map((c) => c.telefono!);

    setSending(true);
    try {
      const res = await sendCampaign(phones, body);
      setResult(res);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al enviar campaña");
    } finally {
      setSending(false);
    }
  };

  if (result) {
    return (
      <AppModal isOpen onClose={onClose} title="Resultado de campaña" maxWidthClassName="max-w-lg">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
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

          {result.failed > 0 && (
            <div className="space-y-1">
              <p className={LABEL}>Errores</p>
              {result.detail.filter((d) => !d.ok).map((d) => (
                <p key={d.phone} className="text-xs text-red-600">
                  {d.phone}: {d.error}
                </p>
              ))}
            </div>
          )}

          <div className="flex justify-center border-t border-slate-200 pt-4">
            <button onClick={onClose} className="rounded-lg bg-[#312C85] px-6 py-2 text-sm font-semibold text-white">
              Cerrar
            </button>
          </div>
        </div>
      </AppModal>
    );
  }

  return (
    <AppModal
      isOpen
      onClose={onClose}
      title="Campaña de WhatsApp"
      subtitle={`${selected.size} destinatario${selected.size !== 1 ? "s" : ""} seleccionado${selected.size !== 1 ? "s" : ""}`}
      maxWidthClassName="max-w-2xl"
      panelClassName="max-h-[90vh]"
    >
      <div className="space-y-4">
        {/* Mensaje */}
        <div>
          <label className={LABEL}>Mensaje</label>
          <textarea
            rows={4}
            className={INPUT + " resize-none"}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Escribe el mensaje que recibirán todos los seleccionados..."
          />
        </div>

        {/* Lista de destinatarios */}
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
            disabled={sending || !body.trim() || selected.size === 0}
            className="rounded-lg bg-[#25D366] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {sending ? "Enviando..." : `Enviar a ${selected.size}`}
          </button>
        </div>
      </div>
    </AppModal>
  );
}
