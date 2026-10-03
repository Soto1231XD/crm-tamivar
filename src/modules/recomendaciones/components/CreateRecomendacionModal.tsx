import { useState } from 'react';
import toast from 'react-hot-toast';
import { createRecomendacion } from '../services/recomendaciones.api';
import { useRecomendacionesStore } from '../store/useRecomendacionesStore';
import { getReadableErrorMessage } from '@/shared/utils/errorMessages';
import type { LeadRecord } from '@/interfaces/lead.interface';

type Props = {
  isOpen: boolean;
  paraId: number;
  paraNombre: string;
  leads?: LeadRecord[];
  onClose: () => void;
};

export function CreateRecomendacionModal({ isOpen, paraId, paraNombre, leads = [], onClose }: Props) {
  const [contenido, setContenido] = useState('');
  const [leadSeleccionado, setLeadSeleccionado] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fetchEnviadas = useRecomendacionesStore((s) => s.fetchEnviadas);

  if (!isOpen) return null;

  const referencia = leadSeleccionado || undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contenido.trim()) return;
    setIsSubmitting(true);
    try {
      await createRecomendacion(paraId, contenido.trim(), referencia);
      toast.success('Recomendación enviada.');
      void fetchEnviadas();
      setContenido('');
      setLeadSeleccionado('');
      onClose();
    } catch (error) {
      toast.error(getReadableErrorMessage(error, 'No fue posible enviar la recomendación.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900">Enviar recomendación</h3>
        <p className="mt-1 text-sm text-slate-500">
          Para: <span className="font-semibold text-slate-700">{paraNombre}</span>
        </p>

        <form onSubmit={(e) => { void handleSubmit(e); }} className="mt-4 space-y-3">
          {/* Selector de lead (contexto) */}
          {leads.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Relacionado con (opcional)
              </label>
              <select
                value={leadSeleccionado}
                onChange={(e) => setLeadSeleccionado(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#312C85] focus:ring-2 focus:ring-[#312C85]/10"
              >
                <option value="">— General, sin lead específico —</option>
                {leads.map((lead) => {
                  const nombre = `${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim() || 'Sin nombre';
                  const estado = lead.estado ? ` · ${lead.estado}` : '';
                  return (
                    <option key={lead.id} value={`${nombre}${estado}`}>
                      {nombre}{estado}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Mensaje */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Recomendación
            </label>
            <textarea
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder="Escribe tu recomendación aquí..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:ring-2 focus:ring-[#312C85]/10 resize-none"
            />
            <p className="mt-1 text-right text-[11px] text-slate-400">{contenido.length}/2000</p>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !contenido.trim()}
              className="rounded-xl bg-[#312C85] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#27226f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
