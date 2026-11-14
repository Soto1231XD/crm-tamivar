import { useState } from "react";
import toast from "react-hot-toast";
import { AppModal } from "@/components/ui/AppModal";
import type { EventoRH } from "../services/eventos.api";
import { exportarReporteEventos } from "../utils/export-excel";

interface Props {
  onExport: (desde: string, hasta: string) => Promise<EventoRH[]>;
  onClose: () => void;
}

const INPUT = "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";
const LABEL = "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1.5";

export function ReporteModal({ onExport, onClose }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfYear = `${new Date().getFullYear()}-01-01`;

  const [desde, setDesde] = useState(firstOfYear);
  const [hasta, setHasta] = useState(today);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!desde || !hasta) { toast.error("Selecciona el rango de fechas"); return; }
    if (desde > hasta) { toast.error("La fecha inicial no puede ser mayor a la final"); return; }
    setLoading(true);
    try {
      const eventos = await onExport(desde, hasta);
      if (eventos.length === 0) { toast.error("No hay eventos en ese rango de fechas"); return; }
      exportarReporteEventos(eventos, desde, hasta);
      toast.success(`Reporte exportado — ${eventos.length} evento(s)`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al generar reporte");
    } finally { setLoading(false); }
  };

  return (
    <AppModal isOpen onClose={onClose} title="Exportar reporte" subtitle="Selecciona el rango de fechas para el reporte Excel." maxWidthClassName="max-w-sm">
      <div className="space-y-4">
        <div>
          <label className={LABEL}>Desde</label>
          <input type="date" className={INPUT} value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Hasta</label>
          <input type="date" className={INPUT} value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
        <p className="text-xs text-slate-400">
          El archivo incluirá 3 hojas: resumen de eventos, detalle de gastos y lista de participantes.
        </p>
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={onClose}
            className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white">
            Cancelar
          </button>
          <button type="button" onClick={handleExport} disabled={loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-70">
            {loading ? "Generando..." : "Descargar Excel"}
          </button>
        </div>
      </div>
    </AppModal>
  );
}
