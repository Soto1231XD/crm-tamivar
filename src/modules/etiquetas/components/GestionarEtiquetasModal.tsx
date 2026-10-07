import { useEffect, useRef, useState } from 'react';
import type { Etiqueta } from '@/interfaces/lead.interface';
import { useEtiquetasStore } from '../store/useEtiquetasStore';
import { createEtiqueta, updateEtiqueta, deleteEtiqueta } from '../services/etiquetas.api';
import toast from 'react-hot-toast';

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4',
  '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B',
  '#6366F1', '#10B981', '#64748B', '#DC2626', '#7C3AED',
];

type Props = {
  isOpen: boolean;
  scope?: 'personal' | 'admin-shared';
  onClose: () => void;
};

type Mode = 'list' | 'create' | 'edit';

export function GestionarEtiquetasModal({ isOpen, scope, onClose }: Props) {
  const { etiquetas, fetchEtiquetas, addEtiqueta, updateEtiqueta: updateStore, removeEtiqueta } = useEtiquetasStore();

  const [mode, setMode] = useState<Mode>('list');
  const [editingEtiqueta, setEditingEtiqueta] = useState<Etiqueta | null>(null);
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const nombreRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) void fetchEtiquetas(scope);
  }, [isOpen, scope, fetchEtiquetas]);

  useEffect(() => {
    if (mode !== 'list') setTimeout(() => nombreRef.current?.focus(), 50);
  }, [mode]);

  function openCreate() {
    setNombre('');
    setColor('#3B82F6');
    setEditingEtiqueta(null);
    setMode('create');
  }

  function openEdit(et: Etiqueta) {
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
        const updated = await updateEtiqueta(editingEtiqueta.id, { nombre: nombre.trim(), color });
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

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await deleteEtiqueta(id);
      removeEtiqueta(id);
      toast.success('Etiqueta eliminada.');
    } catch {
      toast.error('No se pudo eliminar la etiqueta.');
    } finally {
      setDeletingId(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            {mode !== 'list' && (
              <button
                type="button"
                onClick={() => setMode('list')}
                className="mr-1 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h3 className="text-base font-bold text-slate-900">
              {mode === 'list' ? 'Gestionar etiquetas' : mode === 'create' ? 'Nueva etiqueta' : 'Editar etiqueta'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {mode === 'list' ? (
            <>
              <button
                type="button"
                onClick={openCreate}
                className="mb-4 inline-flex items-center gap-2 rounded-xl bg-[#312C85] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#27226f]"
              >
                + Nueva etiqueta
              </button>

              {etiquetas.length === 0 ? (
                <p className="text-sm text-slate-500">No hay etiquetas creadas aún.</p>
              ) : (
                <ul className="space-y-2 max-h-72 overflow-y-auto">
                  {etiquetas.map((et) => (
                    <li key={et.id} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2">
                      <span
                        className="h-4 w-4 shrink-0 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: et.color }}
                      />
                      <span className="flex-1 truncate text-sm font-medium text-slate-700">{et.nombre}</span>
                      <button
                        type="button"
                        onClick={() => openEdit(et)}
                        className="rounded-lg p-1 text-slate-400 hover:text-slate-700 transition-colors"
                        title="Editar"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(et.id)}
                        disabled={deletingId === et.id}
                        className="rounded-lg p-1 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
                        title="Eliminar"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">
                  Nombre
                </label>
                <input
                  ref={nombreRef}
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  maxLength={50}
                  placeholder="Ej. Cliente potencial"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#312C85] focus:ring-2 focus:ring-[#312C85]/10"
                  onKeyDown={(e) => { if (e.key === 'Enter') void handleSave(); }}
                />
              </div>

              {/* Color */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">
                  Color
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c,
                        borderColor: color === c ? '#312C85' : 'transparent',
                        boxShadow: color === c ? '0 0 0 2px white, 0 0 0 4px #312C85' : undefined,
                      }}
                    />
                  ))}
                  <label className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-slate-400 hover:border-[#312C85] hover:text-[#312C85] transition-colors" title="Color personalizado">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="sr-only"
                    />
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </label>
                </div>
                {/* Preview */}
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center pl-2.5 pr-6 text-xs font-semibold leading-none"
                    style={{
                      backgroundColor: color,
                      color: '#fff',
                      minHeight: '22px',
                      clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)',
                    }}
                  >
                    {nombre || 'Vista previa'}
                  </span>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setColor(v);
                    }}
                    maxLength={7}
                    className="w-28 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-mono text-slate-700 outline-none transition focus:border-[#312C85]"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !nombre.trim() || color.length !== 7}
                  className="rounded-xl bg-[#312C85] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#27226f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : mode === 'create' ? 'Crear' : 'Guardar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
