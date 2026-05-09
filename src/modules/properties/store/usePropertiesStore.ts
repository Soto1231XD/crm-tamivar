import { create } from "zustand";
import {
  getPaginatedProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
} from "../services/properties.api";
import type {
  PropertyRecord,
  CreatePropertyPayload,
  UpdatePropertyPayload,
  NuevaImagen,
  PropertyFilters,
} from "@/interfaces/property.interface";
import { getReadableErrorMessage } from "@/shared/utils/errorMessages";

const initialFilters: PropertyFilters = {
  page: 1,
  limit: 10,
};

export interface PropertiesState {
  properties: PropertyRecord[];
  filteredProperties: PropertyRecord[];
  currentProperty: PropertyRecord | null;
  filters: PropertyFilters;
  totalItems: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  fetchProperties: (options?: { page?: number; limit?: number }) => Promise<void>;
  fetchProperty: (id: number) => Promise<void>;
  addProperty: (
    payload: CreatePropertyPayload,
    files: NuevaImagen[],
  ) => Promise<void>;
  editProperty: (
    id: number,
    payload: UpdatePropertyPayload,
    files?: NuevaImagen[],
  ) => Promise<void>;
  removeProperty: (id: number) => Promise<void>;
  clearCurrentProperty: () => void;
  setFilters: (filters: Partial<PropertyFilters>) => void;
  clearFilters: () => void;
}

export const usePropertiesStore = create<PropertiesState>((set, get) => ({
  properties: [],
  filteredProperties: [],
  currentProperty: null,
  filters: initialFilters,
  totalItems: 0,
  totalPages: 1,
  isLoading: false,
  error: null,

  fetchProperties: async (options = {}) => {
    set({ isLoading: true, error: null });
    try {
      const currentFilters = get().filters;
      const response = await getPaginatedProperties({
        ...currentFilters,
        page: options.page ?? currentFilters.page ?? 1,
        limit: options.limit ?? currentFilters.limit ?? 10,
      });

      set(() => ({
        properties: response.data,
        filteredProperties: response.data,
        totalItems: response.meta.total,
        totalPages: response.meta.lastPage,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: getReadableErrorMessage(
          error,
          "No pudimos cargar las propiedades en este momento.",
        ),
        properties: [],
        filteredProperties: [],
        totalItems: 0,
        totalPages: 1,
        isLoading: false,
      });
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: {
        ...state.filters,
        ...newFilters,
      },
    }));
  },

  clearFilters: () => {
    set({
      filters: initialFilters,
    });
  },

  fetchProperty: async (id: number) => {
    set({ isLoading: true, error: null, currentProperty: null });
    try {
      const data = await getProperty(id);
      set({ currentProperty: data, isLoading: false });
    } catch (error) {
      set({
        error: getReadableErrorMessage(
          error,
          "No pudimos cargar la propiedad solicitada.",
        ),
        isLoading: false,
      });
    }
  },

  addProperty: async (payload: CreatePropertyPayload, files: NuevaImagen[]) => {
    set({ isLoading: true, error: null });
    try {
      const newProperty = await createProperty(payload, files);
      set((state) => ({
        properties: [newProperty, ...state.properties],
        filteredProperties: [newProperty, ...state.filteredProperties],
        totalItems: state.totalItems + 1,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: getReadableErrorMessage(
          error,
          "No fue posible crear la propiedad.",
        ),
        isLoading: false,
      });
      throw error;
    }
  },

  editProperty: async (
    id: number,
    payload: UpdatePropertyPayload,
    files: NuevaImagen[] = [],
  ) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProperty = await updateProperty(id, payload, files);
      set((state) => {
        const updateList = (list: PropertyRecord[]) =>
          list.map((prop) =>
            prop.id === id ? { ...prop, ...updatedProperty } : prop,
          );

        return {
          properties: updateList(state.properties),
          filteredProperties: updateList(state.filteredProperties),
          currentProperty:
            state.currentProperty?.id === id
              ? { ...state.currentProperty, ...updatedProperty }
              : state.currentProperty,
          isLoading: false,
        };
      });
    } catch (error) {
      set({
        error: getReadableErrorMessage(
          error,
          "No fue posible actualizar la propiedad.",
        ),
        isLoading: false,
      });
      throw error;
    }
  },

  removeProperty: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await deleteProperty(id);
      set((state) => ({
        properties: state.properties.filter((prop) => prop.id !== id),
        filteredProperties: state.filteredProperties.filter(
          (prop) => prop.id !== id,
        ),
        totalItems: Math.max(0, state.totalItems - 1),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: getReadableErrorMessage(
          error,
          "No fue posible eliminar la propiedad.",
        ),
        isLoading: false,
      });
      throw error;
    }
  },

  clearCurrentProperty: () => set({ currentProperty: null }),
}));
