import { useEffect, useRef, useState } from 'react';
import type { Etiqueta } from '@/interfaces/lead.interface';
import { EtiquetaChip } from './EtiquetaChip';
import { useEtiquetasStore } from '@/modules/etiquetas/store/useEtiquetasStore';
import {
  createEtiqueta,
  updateEtiqueta as apiUpdateEtiqueta,
  deleteEtiqueta,
} from '@/modules/etiquetas/services/etiquetas.api';
import toast from 'react-hot-toast';

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4',
  '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B',
  '#6366F1', '#10B981', '#64748B', '#DC2626', '#7C3AED',
];

type Props = {
  allEtiquetas: Etiqueta[];
  assignedIds: Set<number>;
  onToggle: (etiqueta: Etiqueta, assigned: boolean) => void;
};

type Mode = 'list' | 'create' | 'edit';

export function EtiquetaPicker({ allEtiquetas, assignedIds, onToggle }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('list');
  const [editingEtiqueta, setEditingEtiqueta] = useState<Etiqueta | null>(null);
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const ref = useRef<HTMLDivElement>(null);
  const nombreRef = useRef<HTMLInputElement>(null);

  const { addEtiqueta, updateEtiqueta: updateStore, removeEtiqueta } = useEtiquetasStore();

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setMode('list');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (mode !== 'list') setTimeout(() => nombreRef.current?.focus(), 50);
  }, [mode]);

  function openCreate() {
    setNombre('');
    setColor('#3B82F6');
    setEditingEtiqueta(null);
    setMode('create');
  }

  function openEdit(et: Etiqueta, e: React.MouseEvent) {
    e.stopPropagation();
    setNombre(et.nombre);
    setColor(et.color);
    setEditingEtiqueta(et);
    setMode('edit');
  }

  async function handleSave() {
    if (!nombre.trim()) return;
    setSaving(true);
    try {
      if (mode === 'create') {
        const created = await createEtiqueta({ nombre: nombre.trim(), color });
        addEtiqueta(created);
        toast.success('Etiqueta creada.');
      } else if (mode === 'edit' && editingEtiqueta) {
        const updated = await apiUpdateEtiqueta(editingEtiqueta.id, { nombre: nombre.trim(), color });
        updateStore(updated);
        toast.success('Etiqueta actualizada.');
      }
      setMode('list');
    } catch {
      toast.error('No se pudo guardar la etiqueta.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(et: Etiqueta, e: React.MouseEvent) {
    e.stopPropagation();
    setDeletingId(et.id);
    try {
      await deleteEtiqueta(et.id);
      removeEtiqueta(et.id);
      toast.success('Etiqueta eliminada.');
    } catch {
      toast.error('No se pudo eliminar la etiqueta.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
          if (!open) setMode('list');
        }}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400 hover:border-[#312C85] hover:text-[#312C85] transition-colors text-sm leading-none"
        title="Gestionar etiquetas"
      >
        +
      </button>

      {open && (
        <div
          className="absolute left-0 top-7 z-50 w-64 rounded-xl border border-slate-200 bg-white shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-1 border-b border-slate-100 px-3 py-2">
            {mode !== 'list' && (
              <button
                type="button"
                onClick={() => setMode('list')}
                className="mr-1 rounded p-0.5 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {mode === 'list' ? 'Etiquetas' : mode === 'create' ? 'Nueva etiqueta' : 'Editar etiqueta'}
            </p>
          </div>

          {mode === 'list' ? (
            <div className="p-2">
              {allEtiquetas.length === 0 ? (
                <p className="px-1 py-2 text-xs text-slate-400">No hay etiquetas aún.</p>
              ) : (
                <ul className="max-h-52 space-y-0.5 overflow-y-auto">
                  {allEtiquetas.map((et) => {
                    const assigned = assignedIds.has(et.id);
                    return (
                      <li key={et.id} className="group flex items-center gap-1 rounded-lg px-1 py-1 hover:bg-slate-50">
                        <button
                          type="button"
                          onClick={() => onToggle(et, assigned)}
                          className="flex flex-1 items-center gap-2 min-w-0"
                        >
                          <EtiquetaChip etiqueta={et} compact />
                          <span className="flex-1 truncate text-xs text-slate-700 text-left">{et.nombre}</span>
                          {assigned && (
                            <svg className="h-3.5 w-3.5 shrink-0 text-[#312C85]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => openEdit(et, e)}
                          className="shrink-0 rounded p-1 text-slate-300 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100"
                          title="Editar"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(et, e)}
                          disabled={deletingId === et.id}
                          className="shrink-0 rounded p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40"
                          title="Eliminar"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="mt-1 border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={openCreate}
                  className="w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-[#312C85] hover:bg-slate-50 transition-colors"
                >
                  + Nueva etiqueta
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Nombre
                </label>
                <input
                  ref={nombreRef}
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  maxLength={50}
                  placeholder="Ej. Cliente potencial"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-[#312C85] focus:ring-1 focus:ring-[#312C85]/20"
                  onKeyDown={(e) => { if (e.key === 'Enter') void handleSave(); }}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Color
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c,
                        borderColor: color === c ? '#312C85' : 'transparent',
                        boxShadow: color === c ? '0 0 0 2px white, 0 0 0 3px #312C85' : undefined,
                      }}
                    />
                  ))}
                  <label
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-slate-400 hover:border-[#312C85] hover:text-[#312C85] transition-colors"
                    title="Color personalizado"
                  >
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="sr-only"
                    />
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">Vista previa:</span>
                  <EtiquetaChip etiqueta={{ id: 0, nombre: nombre || 'Etiqueta', color }} />
                </div>
              </div>

              <div className="flex gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !nombre.trim() || color.length !== 7}
                  className="flex-1 rounded-lg bg-[#312C85] py-1.5 text-xs font-semibold text-white transition hover:bg-[#27226f] disabled:opacity-60"
                >
                  {saving ? '...' : mode === 'create' ? 'Crear' : 'Guardar'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
