import { create } from 'zustand';
import type { Etiqueta } from '@/interfaces/lead.interface';
import { getEtiquetas } from '../services/etiquetas.api';

type Scope = 'personal' | 'admin-shared';

type EtiquetasStore = {
  etiquetas: Etiqueta[];
  isLoading: boolean;
  currentScope: Scope | null;
  fetchEtiquetas: (scope?: Scope) => Promise<void>;
  addEtiqueta: (e: Etiqueta) => void;
  updateEtiqueta: (e: Etiqueta) => void;
  removeEtiqueta: (id: number) => void;
};

export const useEtiquetasStore = create<EtiquetasStore>((set, get) => ({
  etiquetas: [],
  isLoading: false,
  currentScope: null,

  async fetchEtiquetas(scope) {
    const requestedScope = scope ?? 'personal';
    // Allow re-fetch if scope changed, even if currently loading
    if (get().isLoading && get().currentScope === requestedScope) return;
    set({ isLoading: true, currentScope: requestedScope });
    try {
      const data = await getEtiquetas(scope);
      set({ etiquetas: data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addEtiqueta(e) {
    set((s) => ({ etiquetas: [...s.etiquetas, e].sort((a, b) => a.nombre.localeCompare(b.nombre)) }));
  },

  updateEtiqueta(e) {
    set((s) => ({
      etiquetas: s.etiquetas
        .map((x) => (x.id === e.id ? e : x))
        .sort((a, b) => a.nombre.localeCompare(b.nombre)),
    }));
  },

  removeEtiqueta(id) {
    set((s) => ({ etiquetas: s.etiquetas.filter((x) => x.id !== id) }));
  },
}));
