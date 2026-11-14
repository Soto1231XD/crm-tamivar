import { useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { apiRequest } from "@/shared/apiRequest";
import { updateFiniquitada } from "../services/operaciones.api";
import type { OperacionFiniquitada } from "@/interfaces/operaciones.interface";

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const LABEL =
  "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";

const WA_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
  </svg>
);

interface Props {
  finiquitada: OperacionFiniquitada;
  onClose: () => void;
  onSent: () => void;
}

export function FiniquitadaWhatsappModal({ finiquitada, onClose, onSent }: Props) {
  const [nombre, setNombre] = useState(finiquitada.cliente ?? "");
  const [telefono, setTelefono] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend = nombre.trim().length > 0 && telefono.trim().length >= 8;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setError(null);
    try {
      await apiRequest("/whatsapp/send-resena", {
        method: "POST",
        data: { to: telefono.trim(), nombre: nombre.trim() },
      });
      await updateFiniquitada(finiquitada.id, {
        estado_whatsapp: "Enviado",
        whatsapp_enviado_en: new Date().toISOString(),
      });
      setSent(true);
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar el mensaje");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <AppModal isOpen onClose={onClose} title="¡Mensaje enviado!" maxWidthClassName="max-w-sm">
        <div className="space-y-4 text-center py-2">
          <p className="text-5xl">✅</p>
          <p className="text-sm text-slate-600">
            Solicitud de reseña enviada a{" "}
            <span className="font-semibold text-slate-800">{nombre}</span>.
          </p>
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
      title="Solicitar reseña en Facebook"
      subtitle="El mensaje se enviará por WhatsApp al cliente"
      maxWidthClassName="max-w-md"
    >
      <div className="space-y-4">
        {/* Campos */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={LABEL}>Nombre del cliente</label>
            <input
              type="text"
              className={INPUT}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Juan Pérez"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL}>Número de WhatsApp</label>
            <input
              type="tel"
              className={INPUT}
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: 9981234567"
            />
          </div>
        </div>

        {/* Info plantilla */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-start gap-3">
          <span className="text-xl shrink-0">⭐</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-0.5">Plantilla: v1_resena_tamivar</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Se enviará la plantilla aprobada de WhatsApp personalizada con el nombre del cliente.
            </p>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            {error}
          </p>
        )}

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
            disabled={sending || !canSend}
            className="flex items-center gap-2 rounded-lg bg-[#25D366] px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {WA_ICON}
            {sending ? "Enviando..." : "Enviar mensaje"}
          </button>
        </div>
      </div>
    </AppModal>
  );
}
