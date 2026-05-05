import { create } from "zustand";
import {
  getProperties,
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

export interface PropertiesState {
  // Estado
  properties: PropertyRecord[];
  filteredProperties: PropertyRecord[];
  currentProperty: PropertyRecord | null;
  filters: PropertyFilters;
  isLoading: boolean;
  error: string | null;

  // Acciones
  fetchProperties: () => Promise<void>;
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

// Función auxiliar para aplicar la lógica de filtrado
const applyFilters = (
  properties: PropertyRecord[],
  filters: PropertyFilters,
) => {
  return properties.filter((prop) => {
    // Filtro: Estatus
    if (
      filters.estatus &&
      filters.estatus !== "Todos los estados" &&
      prop.estatus !== filters.estatus
    ) {
      return false;
    }

    // Filtro: Tipo de Inmueble
    if (
      filters.tipo_inmueble &&
      filters.tipo_inmueble !== "Todos los tipos" &&
      prop.tipo_inmueble !== filters.tipo_inmueble
    ) {
      return false;
    }

    if (
      filters.direccionMunicipio &&
      filters.direccionMunicipio !== "Todos los municipios" &&
      (prop.direccion?.municipio ?? "").trim() !== filters.direccionMunicipio
    ) {
      return false;
    }

    if (filters.exclusiva && filters.exclusiva !== "Todas las exclusividades") {
      const isExclusive = Boolean(prop.exclusiva);
      if (filters.exclusiva === "Exclusivas" && !isExclusive) {
        return false;
      }
      if (filters.exclusiva === "No exclusivas" && isExclusive) {
        return false;
      }
    }

    // Filtros de Esquema Comercial (Operación y Precios)
    const schemes = Array.isArray(prop.esquema_comercial)
      ? prop.esquema_comercial
      : [];

    // Filtro: Tipo de Operación
    if (
      filters.tipo_operacion &&
      filters.tipo_operacion !== "Todas las operaciones"
    ) {
      const matchesOperacion = schemes.some(
        (scheme: any) => scheme.tipo_operacion === filters.tipo_operacion,
      );
      if (!matchesOperacion) return false;
    }

    // Filtro: Precios
    const minPrice = filters.minPrecio;
    const maxPrice = filters.maxPrecio;

    if (minPrice != null || maxPrice != null) {
      const matchesPrice = schemes.some((scheme: any) => {
        const price = Number(scheme.precio);
        if (isNaN(price)) return false;
        if (minPrice != null && price < minPrice) return false;
        if (maxPrice != null && price > maxPrice) return false;
        return true;
      });
      if (!matchesPrice) return false;
    }

    return true;
  });
};

const initialFilters: PropertyFilters = {};

export const usePropertiesStore = create<PropertiesState>((set, get) => ({
  properties: [],
  filteredProperties: [],
  currentProperty: null,
  filters: initialFilters,
  isLoading: false,
  error: null,

  // Obtener todas las propiedades
  fetchProperties: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getProperties();
      const currentFilters = get().filters;
      set({
        properties: data,
        filteredProperties: applyFilters(data, currentFilters),
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Error al cargar las propiedades",
        isLoading: false,
      });
    }
  },

  // Actualizar filtros
  setFilters: (newFilters) => {
    set((state) => {
      const updatedFilters = { ...state.filters, ...newFilters };
      return {
        filters: updatedFilters,
        filteredProperties: applyFilters(state.properties, updatedFilters),
      };
    });
  },

  clearFilters: () => {
    set((state) => ({
      filters: initialFilters,
      filteredProperties: state.properties, // Restauramos la lista completa
    }));
  },

  // Obtener una propiedad específica (para ver detalles o editar)
  fetchProperty: async (id: number) => {
    set({ isLoading: true, error: null, currentProperty: null });
    try {
      const data = await getProperty(id);
      set({ currentProperty: data, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Error al cargar la propiedad",
        isLoading: false,
      });
    }
  },

  // Crear una nueva propiedad
  addProperty: async (payload: CreatePropertyPayload, files: NuevaImagen[]) => {
    set({ isLoading: true, error: null });
    try {
      const newProperty = await createProperty(payload, files);
      // Agregamos la nueva propiedad al inicio de la lista en memoria
      set((state) => {
        const updatedProperties = [newProperty, ...state.properties];
        return {
          properties: updatedProperties,
          filteredProperties: applyFilters(updatedProperties, state.filters),
          isLoading: false,
        };
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Error al crear la propiedad",
        isLoading: false,
      });
      throw error; // Lanzamos el error para que el componente UI (tu página) pueda mostrar una alerta si quiere
    }
  },

  // Actualizar una propiedad
  editProperty: async (
    id: number,
    payload: UpdatePropertyPayload,
    files: NuevaImagen[] = [],
  ) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProperty = await updateProperty(id, payload, files);
      // Actualizamos la propiedad específica en la lista en memoria
      set((state) => {
        const updatedProperties = state.properties.map((prop) =>
          prop.id === id ? { ...prop, ...updatedProperty } : prop,
        );
        return {
          properties: updatedProperties,
          filteredProperties: applyFilters(updatedProperties, state.filters), // Mantenemos sincronía
          currentProperty:
            state.currentProperty?.id === id
              ? { ...state.currentProperty, ...updatedProperty }
              : state.currentProperty,
          isLoading: false,
        };
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Error al actualizar la propiedad",
        isLoading: false,
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
      set((state) => {
        const updatedProperties = state.properties.filter(
          (prop) => prop.id !== id,
        );
        return {
          properties: updatedProperties,
          filteredProperties: applyFilters(updatedProperties, state.filters), // Mantenemos sincronía
          isLoading: false,
        };
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Error al eliminar la propiedad",
        isLoading: false,
      });
      throw error;
    }
  },

  // Limpiar la propiedad actual (útil al desmontar el componente de edición)
  clearCurrentProperty: () => set({ currentProperty: null }),
}));
