import { create } from 'zustand';
import type { RecomendacionRecord } from '@/interfaces/recomendacion.interface';
import {
  getRecomendacionesRecibidas,
  getRecomendacionesEnviadas,
  marcarRecomendacionLeida,
} from '../services/recomendaciones.api';

type State = {
  recibidas: RecomendacionRecord[];
  enviadas: RecomendacionRecord[];
  unreadCount: number;
  isLoadingRecibidas: boolean;
  isLoadingEnviadas: boolean;
  fetchRecibidas: () => Promise<void>;
  fetchEnviadas: () => Promise<void>;
  marcarLeida: (id: number) => Promise<void>;
  reset: () => void;
};

export const useRecomendacionesStore = create<State>((set) => ({
  recibidas: [],
  enviadas: [],
  unreadCount: 0,
  isLoadingRecibidas: false,
  isLoadingEnviadas: false,

  fetchRecibidas: async () => {
    set({ isLoadingRecibidas: true });
    try {
      const data = await getRecomendacionesRecibidas();
      set({
        recibidas: data,
        unreadCount: data.filter((r) => !r.leida).length,
      });
    } finally {
      set({ isLoadingRecibidas: false });
    }
  },

  fetchEnviadas: async () => {
    set({ isLoadingEnviadas: true });
    try {
      const data = await getRecomendacionesEnviadas();
      set({ enviadas: data });
    } finally {
      set({ isLoadingEnviadas: false });
    }
  },

  marcarLeida: async (id: number) => {
    await marcarRecomendacionLeida(id);
    set((state) => {
      const recibidas = state.recibidas.map((r) =>
        r.id === id ? { ...r, leida: true, leida_en: new Date().toISOString() } : r,
      );
      return { recibidas, unreadCount: recibidas.filter((r) => !r.leida).length };
    });
  },

  reset: () => set({ recibidas: [], enviadas: [], unreadCount: 0 }),
}));
