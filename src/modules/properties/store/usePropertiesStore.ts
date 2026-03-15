import { create } from 'zustand';
import {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty
} from '../services/properties.api';
import type { 
  PropertyRecord, 
  CreatePropertyPayload, 
  UpdatePropertyPayload 
} from '@/interfaces/property.interface'

interface PropertiesState {
  // Estado
  properties: PropertyRecord[];
  currentProperty: PropertyRecord | null;
  isLoading: boolean;
  error: string | null;

  // Acciones
  fetchProperties: () => Promise<void>;
  fetchProperty: (id: number) => Promise<void>;
  addProperty: (payload: CreatePropertyPayload, files: File[]) => Promise<void>;
  editProperty: (id: number, payload: UpdatePropertyPayload, files?: File[]) => Promise<void>;
  removeProperty: (id: number) => Promise<void>;
  clearCurrentProperty: () => void;
}

export const usePropertiesStore = create<PropertiesState>((set, get) => ({
  properties: [],
  currentProperty: null,
  isLoading: false,
  error: null,

  // Obtener todas las propiedades
  fetchProperties: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getProperties();
      set({ properties: data, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al cargar las propiedades', 
        isLoading: false 
      });
    }
  },

  // Obtener una propiedad específica (para ver detalles o editar)
  fetchProperty: async (id: number) => {
    set({ isLoading: true, error: null, currentProperty: null });
    try {
      const data = await getProperty(id);
      set({ currentProperty: data, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al cargar la propiedad', 
        isLoading: false 
      });
    }
  },

  // Crear una nueva propiedad
  addProperty: async (payload: CreatePropertyPayload, files: File[]) => {
    set({ isLoading: true, error: null });
    try {
      const newProperty = await createProperty(payload, files);
      // Agregamos la nueva propiedad al inicio de la lista en memoria
      set((state) => ({
        properties: [newProperty, ...state.properties],
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al crear la propiedad', 
        isLoading: false 
      });
      throw error; // Lanzamos el error para que el componente UI (tu página) pueda mostrar una alerta si quiere
    }
  },

  // Actualizar una propiedad
  editProperty: async (id: number, payload: UpdatePropertyPayload, files: File[] = []) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProperty = await updateProperty(id, payload, files);
      // Actualizamos la propiedad específica en la lista en memoria
      set((state) => ({
        properties: state.properties.map((prop) => 
          prop.id === id ? { ...prop, ...updatedProperty } : prop
        ),
        currentProperty: state.currentProperty?.id === id 
          ? { ...state.currentProperty, ...updatedProperty }
          : updatedProperty,
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al actualizar la propiedad', 
        isLoading: false 
      });
      throw error;
    }
  },

  // Eliminar una propiedad
  removeProperty: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await deleteProperty(id);
      // Filtramos la propiedad eliminada de la lista en memoria
      set((state) => ({
        properties: state.properties.filter((prop) => prop.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al eliminar la propiedad', 
        isLoading: false 
      });
      throw error;
    }
  },

  // Limpiar la propiedad actual (útil al desmontar el componente de edición)
  clearCurrentProperty: () => set({ currentProperty: null }),
}));