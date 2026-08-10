import { useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import type { ClienteCartera } from "@/interfaces/cartera-clientes.interface";
import { sendFestividadCampaign } from "../services/whatsapp.api";

const INPUT = "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const LABEL = "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";

interface Props {
  clientes: ClienteCartera[];
  onClose: () => void;
}

type Result = { total: number; sent: number; failed: number };

export function FestividadWhatsappModal({ clientes, onClose }: Props) {
  const conTelefono = clientes.filter((c) => c.telefono);
  const [selected, setSelected] = useState<Set<number>>(new Set(conTelefono.map((c) => c.id)));
  const [mensaje, setMensaje] = useState("");
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
      const res = await sendFestividadCampaign(destinatarios, mensaje);
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
      title="Mensaje de festividad"
      subtitle={`${selected.size} destinatario${selected.size !== 1 ? "s" : ""} seleccionado${selected.size !== 1 ? "s" : ""}`}
      maxWidthClassName="max-w-2xl"
      panelClassName="max-h-[90vh]"
    >
      <div className="space-y-4">
        <div>
          <label className={LABEL}>Mensaje de la festividad</label>
          <textarea
            rows={4}
            className={INPUT + " resize-none"}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Ej: En este Día de Navidad, todo el equipo de Tamivar te desea felices fiestas llenas de alegría y prosperidad. 🎄"
          />
          <p className="mt-1.5 text-xs text-slate-400">
            Cada cliente recibirá: "¡Hola <span className="font-medium">[nombre]</span>! 🎉 {mensaje || "..."} Con cariño, 🏠 Equipo Tamivar"
          </p>
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
            disabled={sending || !mensaje.trim() || selected.size === 0}
            className="rounded-lg bg-[#25D366] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {sending ? "Enviando..." : `Enviar a ${selected.size}`}
          </button>
        </div>
      </div>
    </AppModal>
  );
}
