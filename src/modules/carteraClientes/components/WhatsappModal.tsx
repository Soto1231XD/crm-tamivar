import { useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { sendWhatsapp } from "../services/whatsapp.api";
import type { ClienteCartera } from "@/interfaces/cartera-clientes.interface";

const INPUT = "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const LABEL = "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";

interface Props {
  cliente: ClienteCartera;
  defaultMessage?: string;
  onClose: () => void;
}

export function WhatsappModal({ cliente, defaultMessage = "", onClose }: Props) {
  const [body, setBody] = useState(defaultMessage);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleSend = async () => {
    if (!cliente.telefono?.trim()) return;
    setSending(true);
    try {
      const res = await sendWhatsapp(cliente.telefono, body);
      setResult({ ok: true, msg: `Mensaje enviado (${res.sid})` });
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : "Error al enviar" });
    } finally {
      setSending(false);
    }
  };

  return (
    <AppModal
      isOpen
      onClose={onClose}
      title="Enviar WhatsApp"
      subtitle={`Enviando a ${cliente.nombre} · ${cliente.telefono}`}
      maxWidthClassName="max-w-lg"
    >
      <div className="space-y-4">
        <div>
          <label className={LABEL}>Mensaje</label>
          <textarea
            rows={5}
            className={INPUT + " resize-none"}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Escribe el mensaje..."
            disabled={!!result?.ok}
          />
        </div>

        {result && (
          <p className={`text-sm font-medium ${result.ok ? "text-green-600" : "text-red-600"}`}>
            {result.msg}
          </p>
        )}

        <div className="flex justify-center gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white"
          >
            {result?.ok ? "Cerrar" : "Cancelar"}
          </button>
          {!result?.ok && (
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !body.trim() || !cliente.telefono}
              className="rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {sending ? "Enviando..." : "Enviar"}
            </button>
          )}
        </div>
      </div>
    </AppModal>
  );
}
