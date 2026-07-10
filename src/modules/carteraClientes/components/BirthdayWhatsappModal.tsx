import { useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import type { ClienteCartera } from "@/interfaces/cartera-clientes.interface";

const INPUT = "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const LABEL = "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";

interface Props {
  cliente: ClienteCartera;
  defaultMessage?: string;
  onClose: () => void;
}

export function BirthdayWhatsappModal({ cliente, defaultMessage = "", onClose }: Props) {
  const [body, setBody] = useState(defaultMessage);

  const handleOpen = () => {
    if (!cliente.telefono?.trim() || !body.trim()) return;
    const phone = cliente.telefono.replace(/\D/g, "");
    window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(body)}`, "_blank");
    onClose();
  };

  return (
    <AppModal
      isOpen
      onClose={onClose}
      title="Enviar felicitación"
      subtitle={`Para ${cliente.nombre} · ${cliente.telefono}`}
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
          />
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
            onClick={handleOpen}
            disabled={!body.trim() || !cliente.telefono}
            className="flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
            </svg>
            Abrir WhatsApp
          </button>
        </div>
      </div>
    </AppModal>
  );
}
