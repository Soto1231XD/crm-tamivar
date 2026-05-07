import { create } from 'zustand';
import type { CreateLeadPayload, LeadRecord, UpdateLeadPayload } from '@/interfaces/lead.interface';
import {
  createLeadLead,
  deleteLeadLead,
  getLeadLeads,
  updateLeadLead,
} from '../services/leadLeads.api';
import { getReadableErrorMessage } from '@/shared/utils/errorMessages';

export interface LeadLeadsState {
  leads: LeadRecord[];
  isLoading: boolean;
  error: string | null;
  fetchLeadLeads: () => Promise<void>;
  addLeadLead: (payload: CreateLeadPayload) => Promise<LeadRecord>;
  editLeadLead: (id: number, payload: UpdateLeadPayload) => Promise<LeadRecord>;
  removeLeadLead: (id: number) => Promise<void>;
}

export const useLeadLeadsStore = create<LeadLeadsState>((set) => ({
  leads: [],
  isLoading: false,
  error: null,

  fetchLeadLeads: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getLeadLeads();
      set({ leads: data, isLoading: false });
    } catch (error) {
      set({
        error: getReadableErrorMessage(
          error,
          'No pudimos cargar los registros leads en este momento.',
        ),
        isLoading: false,
      });
    }
  },

  addLeadLead: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const newLead = await createLeadLead(payload);
      set((state) => ({
        leads: [newLead, ...state.leads],
        isLoading: false,
      }));
      return newLead;
    } catch (error) {
      set({
        error: getReadableErrorMessage(
          error,
          'No fue posible crear el registro lead.',
        ),
        isLoading: false,
      });
      throw error;
    }
  },

  editLeadLead: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      const updatedLead = await updateLeadLead(id, payload);
      set((state) => ({
        leads: state.leads.map((lead) => (lead.id === id ? updatedLead : lead)),
        isLoading: false,
      }));
      return updatedLead;
    } catch (error) {
      set({
        error: getReadableErrorMessage(
          error,
          'No fue posible actualizar el registro lead.',
        ),
        isLoading: false,
      });
      throw error;
    }
  },

  removeLeadLead: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteLeadLead(id);
      set((state) => ({
        leads: state.leads.filter((lead) => lead.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: getReadableErrorMessage(
          error,
          'No fue posible eliminar el registro lead.',
        ),
        isLoading: false,
      });
      throw error;
    }
  },
}));
