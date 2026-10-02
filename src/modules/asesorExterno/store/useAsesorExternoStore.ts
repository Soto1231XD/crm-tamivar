import { create } from 'zustand';
import type { LeadRecord } from '@/interfaces/lead.interface';
import { getReadableErrorMessage } from '@/shared/utils/errorMessages';
import {
  createAsesorExternoLead,
  deleteAsesorExternoLead,
  getAsesorExternoLeads,
  updateAsesorExternoLead,
  type CreateAsesorExternoPayload,
  type UpdateAsesorExternoPayload,
} from '../services/asesorExterno.api';

interface AsesorExternoState {
  leads: LeadRecord[];
  isLoading: boolean;
  error: string | null;
  fetchLeads: () => Promise<void>;
  addLead: (payload: CreateAsesorExternoPayload) => Promise<LeadRecord>;
  editLead: (id: number, payload: UpdateAsesorExternoPayload) => Promise<LeadRecord>;
  removeLead: (id: number) => Promise<void>;
}

export const useAsesorExternoStore = create<AsesorExternoState>((set) => ({
  leads: [],
  isLoading: false,
  error: null,

  fetchLeads: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getAsesorExternoLeads();
      set({ leads: data, isLoading: false });
    } catch (error) {
      set({
        error: getReadableErrorMessage(
          error,
          'No pudimos cargar los leads externos.',
        ),
        isLoading: false,
      });
    }
  },

  addLead: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const newLead = await createAsesorExternoLead(payload);
      set((state) => ({ leads: [newLead, ...state.leads], isLoading: false }));
      return newLead;
    } catch (error) {
      set({
        error: getReadableErrorMessage(error, 'No fue posible crear el lead.'),
        isLoading: false,
      });
      throw error;
    }
  },

  editLead: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await updateAsesorExternoLead(id, payload);
      set((state) => ({
        leads: state.leads.map((lead) => (lead.id === id ? updated : lead)),
        isLoading: false,
      }));
      return updated;
    } catch (error) {
      set({
        error: getReadableErrorMessage(error, 'No fue posible actualizar el lead.'),
        isLoading: false,
      });
      throw error;
    }
  },

  removeLead: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteAsesorExternoLead(id);
      set((state) => ({
        leads: state.leads.filter((lead) => lead.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: getReadableErrorMessage(error, 'No fue posible eliminar el lead.'),
        isLoading: false,
      });
      throw error;
    }
  },
}));
