import { create } from "zustand";
import type { DevelopmentRecord } from "@/interfaces/development.interface";
import {
  deleteDevelopment,
  getDevelopments,
} from "../services/developments.api";
import { getFriendlyDevelopmentError } from "../utils/developmentErrors";

interface DevelopmentsState {
  developments: DevelopmentRecord[];
  isLoading: boolean;
  error: string | null;
  fetchDevelopments: () => Promise<void>;
  removeDevelopment: (id: number) => Promise<void>;
}

export const useDevelopmentsStore = create<DevelopmentsState>((set) => ({
  developments: [],
  isLoading: false,
  error: null,

  fetchDevelopments: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await getDevelopments();
      set({ developments: data, isLoading: false });
    } catch (error) {
      set({
        developments: [],
        isLoading: false,
        error: getFriendlyDevelopmentError(error, "load_list"),
      });
    }
  },

  removeDevelopment: async (id: number) => {
    set({ isLoading: true, error: null });

    try {
      await deleteDevelopment(id);
      set((state) => ({
        developments: state.developments.filter(
          (development) => development.id !== id,
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: getFriendlyDevelopmentError(error, "delete"),
      });
      throw error;
    }
  },
}));
