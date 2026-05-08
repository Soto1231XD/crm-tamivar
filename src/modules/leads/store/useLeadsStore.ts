import { create } from 'zustand';
import type { CreateLeadPayload, LeadRecord, UpdateLeadPayload } from '@/interfaces/lead.interface';
import {
  createLead,
  deleteLead,
  getLeads,
  getLeadsByDevelopment,
  getLeadsByProperty,
  updateLead,
} from '../services/leads.api';
import { getReadableErrorMessage } from '@/shared/utils/errorMessages';

export interface LeadsState {
  leads: LeadRecord[];
  propertyLeads: LeadRecord[];
  developmentLeads: LeadRecord[];
  isLoading: boolean;
  error: string | null;
  fetchLeads: () => Promise<void>;
  fetchLeadsByProperty: (propertyId: number) => Promise<void>;
  fetchLeadsByDevelopment: (developmentId: number) => Promise<void>;
  addLead: (payload: CreateLeadPayload) => Promise<LeadRecord>;
  editLead: (id: number, payload: UpdateLeadPayload) => Promise<LeadRecord>;
  removeLead: (id: number) => Promise<void>;
  clearPropertyLeads: () => void;
  clearDevelopmentLeads: () => void;
}

export const useLeadsStore = create<LeadsState>((set) => ({
  leads: [],
  propertyLeads: [],
  developmentLeads: [],
  isLoading: false,
  error: null,
  clearPropertyLeads: () => {
    set({ propertyLeads: [], error: null });
  },
  clearDevelopmentLeads: () => {
    set({ developmentLeads: [], error: null });
  },

  fetchLeads: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getLeads();
      set({ leads: data, isLoading: false });
    } catch (error) {
      set({
        error: getReadableErrorMessage(
          error,
          'No pudimos cargar los registros en este momento.',
        ),
        isLoading: false,
      });
    }
  },

  fetchLeadsByProperty: async (propertyId: number) => {
    set({ isLoading: true, error: null });
    try {
      const data = await getLeadsByProperty(propertyId);
      set({ propertyLeads: data, isLoading: false });
    } catch (error) {
      set({
        error: getReadableErrorMessage(
          error,
          'No pudimos cargar los registros de la propiedad en este momento.',
        ),
        isLoading: false,
      });
    }
  },

  fetchLeadsByDevelopment: async (developmentId: number) => {
    set({ isLoading: true, error: null });
    try {
      const data = await getLeadsByDevelopment(developmentId);
      set({ developmentLeads: data, isLoading: false });
    } catch (error) {
      set({
        error: getReadableErrorMessage(
          error,
          'No pudimos cargar los registros del desarrollo en este momento.',
        ),
        isLoading: false,
      });
    }
  },

  addLead: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const newLead = await createLead(payload);
      set((state) => ({
        leads: [newLead, ...state.leads],
        isLoading: false,
      }));
      return newLead;
    } catch (error) {
      set({
        error: getReadableErrorMessage(
          error,
          'No fue posible crear el registro.',
        ),
        isLoading: false,
      });
      throw error;
    }
  },

  editLead: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      const updatedLead = await updateLead(id, payload);
      set((state) => ({
        leads: state.leads.map((lead) => (lead.id === id ? updatedLead : lead)),
        isLoading: false,
      }));
      return updatedLead;
    } catch (error) {
      set({
        error: getReadableErrorMessage(
          error,
          'No fue posible actualizar el registro.',
        ),
        isLoading: false,
      });
      throw error;
    }
  },

  removeLead: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteLead(id);
      set((state) => ({
        leads: state.leads.filter((lead) => lead.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: getReadableErrorMessage(
          error,
          'No fue posible eliminar el registro.',
        ),
        isLoading: false,
      });
      throw error;
    }
  },
}));
