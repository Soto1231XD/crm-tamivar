import { create } from 'zustand';
import type {
  CreateLeadRequestPayload,
  LeadRequestRecord,
  UpdateLeadRequestPayload,
} from '@/interfaces/lead-request.interface';
import {
  createLeadRequest,
  deleteLeadRequest,
  getLeadRequests,
  updateLeadRequest,
} from '../services/leadRequests.api';
import { getReadableErrorMessage } from '@/shared/utils/errorMessages';

export interface LeadRequestsState {
  leadRequests: LeadRequestRecord[];
  isLoading: boolean;
  error: string | null;
  fetchLeadRequests: () => Promise<void>;
  addLeadRequest: (payload: CreateLeadRequestPayload) => Promise<LeadRequestRecord>;
  editLeadRequest: (id: number, payload: UpdateLeadRequestPayload) => Promise<LeadRequestRecord>;
  removeLeadRequest: (id: number) => Promise<void>;
}

export const useLeadRequestsStore = create<LeadRequestsState>((set) => ({
  leadRequests: [],
  isLoading: false,
  error: null,

  fetchLeadRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getLeadRequests();
      set({ leadRequests: data, isLoading: false });
    } catch (error) {
      set({
        error: getReadableErrorMessage(
          error,
          'No pudimos cargar las solicitudes de leads en este momento.',
        ),
        isLoading: false,
      });
    }
  },

  addLeadRequest: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const newLeadRequest = await createLeadRequest(payload);
      set((state) => ({
        leadRequests: [newLeadRequest, ...state.leadRequests],
        isLoading: false,
      }));
      return newLeadRequest;
    } catch (error) {
      set({
        error: getReadableErrorMessage(
          error,
          'No fue posible crear la solicitud de lead.',
        ),
        isLoading: false,
      });
      throw error;
    }
  },

  editLeadRequest: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      const updatedLeadRequest = await updateLeadRequest(id, payload);
      set((state) => ({
        leadRequests: state.leadRequests.map((item) => (item.id === id ? updatedLeadRequest : item)),
        isLoading: false,
      }));
      return updatedLeadRequest;
    } catch (error) {
      set({
        error: getReadableErrorMessage(
          error,
          'No fue posible actualizar la solicitud de lead.',
        ),
        isLoading: false,
      });
      throw error;
    }
  },

  removeLeadRequest: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteLeadRequest(id);
      set((state) => ({
        leadRequests: state.leadRequests.filter((item) => item.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: getReadableErrorMessage(
          error,
          'No fue posible eliminar la solicitud de lead.',
        ),
        isLoading: false,
      });
      throw error;
    }
  },
}));
