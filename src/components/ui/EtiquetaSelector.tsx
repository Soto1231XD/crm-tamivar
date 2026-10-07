import { useState } from 'react';
import type { Etiqueta, LeadRecord } from '@/interfaces/lead.interface';
import { EtiquetaChip } from './EtiquetaChip';
import { useEtiquetasStore } from '@/modules/etiquetas/store/useEtiquetasStore';
import { createEtiqueta } from '@/modules/etiquetas/services/etiquetas.api';
import toast from 'react-hot-toast';

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4',
  '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B',
  '#6366F1', '#10B981', '#64748B', '#DC2626', '#7C3AED',
];

type Props = {
  lead: LeadRecord;
  allEtiquetas: Etiqueta[];
  onToggle: (etiqueta: Etiqueta, assigned: boolean) => void;
};

export function EtiquetaSelector({ lead, allEtiquetas, onToggle }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [saving, setSaving] = useState(false);
  const { addEtiqueta } = useEtiquetasStore();

  const assignedIds = new Set((lead.etiquetas ?? []).map((j) => j.etiqueta.id));

  async function handleCreate() {
    if (!nombre.trim()) return;
    setSaving(true);
    try {
      const created = await createEtiqueta({ nombre: nombre.trim(), color });
      addEtiqueta(created);
      toast.success('Etiqueta creada.');
      setNombre('');
      setColor('#3B82F6');
      setShowCreate(false);
    } catch {
      toast.error('No se pudo crear la etiqueta.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Etiquetas</p>

      {allEtiquetas.length === 0 && !showCreate ? (
        <p className="text-sm text-slate-400 py-1">No hay etiquetas creadas aún.</p>
      ) : (
        <div className="space-y-1.5">
          {allEtiquetas.map((et) => {
            const assigned = assignedIds.has(et.id);
            return (
              <button
                key={et.id}
                type="button"
                onClick={() => onToggle(et, assigned)}
                className={[
                  'flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors',
                  assigned
                    ? 'border-slate-300 bg-slate-50'
                    : 'border-slate-100 bg-white hover:bg-slate-50',
                ].join(' ')}
              >
                <EtiquetaChip etiqueta={et} compact />
                <span className="flex-1 text-sm font-medium text-slate-700">{et.nombre}</span>
                <span
                  className={[
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    assigned
                      ? 'border-[#312C85] bg-[#312C85]'
                      : 'border-slate-300 bg-white',
                  ].join(' ')}
                >
                  {assigned && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {showCreate ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Nueva etiqueta</p>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={50}
            placeholder="Nombre de la etiqueta"
            autoFocus
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#312C85] focus:ring-2 focus:ring-[#312C85]/10"
            onKeyDown={(e) => { if (e.key === 'Enter') void handleCreate(); }}
          />
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="h-8 w-8 rounded-full border-2 transition-transform active:scale-95"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? '#312C85' : 'transparent',
                  boxShadow: color === c ? '0 0 0 2px white, 0 0 0 4px #312C85' : undefined,
                }}
              />
            ))}
            <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-slate-400" title="Color personalizado">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="sr-only" />
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Vista previa:</span>
            <EtiquetaChip etiqueta={{ id: 0, nombre: nombre || 'Etiqueta', color }} />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setShowCreate(false); setNombre(''); setColor('#3B82F6'); }}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving || !nombre.trim()}
              className="flex-1 rounded-xl bg-[#312C85] py-2.5 text-sm font-semibold text-white transition hover:bg-[#27226f] disabled:opacity-60"
            >
              {saving ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex w-full items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm font-medium text-slate-500 transition hover:border-[#312C85] hover:text-[#312C85]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva etiqueta
        </button>
      )}
    </div>
  );
}
