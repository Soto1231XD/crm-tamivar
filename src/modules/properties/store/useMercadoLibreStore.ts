import { create } from "zustand";
import type {
  MercadoLibreAccountStatus,
  MercadoLibrePublishResponse,
  MercadoLibrePropertyStatusResponse,
  MercadoLibrePublicationRecord,
  MercadoLibreSyncResponse,
} from "@/interfaces/mercadoLibre.interface";
import {
  getMercadoLibreAccountStatusApi,
  getMercadoLibreAuthorizationUrlApi,
  getMercadoLibrePropertyStatusApi,
  publishPropertyToMercadoLibreApi,
  syncMercadoLibrePropertyApi,
} from "../services/mercadoLibre.api";
import { getReadableErrorMessage } from "@/shared/utils/errorMessages";

interface MercadoLibreState {
  account: MercadoLibreAccountStatus | null;
  publication: MercadoLibrePublicationRecord | null;
  isLoadingStatus: boolean;
  isAuthorizing: boolean;
  isPublishing: boolean;
  isSyncing: boolean;
  error: string | null;
  fetchAccountStatus: () => Promise<MercadoLibreAccountStatus | null>;
  fetchPropertyStatus: (propertyId: number) => Promise<MercadoLibrePropertyStatusResponse | null>;
  startAuthorization: (propertyId?: number) => Promise<string>;
  publishProperty: (propertyId: number) => Promise<MercadoLibrePublishResponse>;
  syncProperty: (propertyId: number) => Promise<MercadoLibreSyncResponse>;
  reset: () => void;
}

const DEFAULT_ACCOUNT: MercadoLibreAccountStatus = {
  connected: false,
  nickname: null,
  expires_at: null,
};

const NOT_IMPLEMENTED_HINT =
  "Aun no encontramos el backend de Mercado Libre en este entorno. La base del CRM ya esta lista; falta habilitar los endpoints en la API.";

function normalizeMercadoLibreError(error: unknown, fallback: string) {
  const message = getReadableErrorMessage(error, fallback);

  if (
    message.toLowerCase().includes("no existe") ||
    message.toLowerCase().includes("not found")
  ) {
    return NOT_IMPLEMENTED_HINT;
  }

  return message;
}

export const useMercadoLibreStore = create<MercadoLibreState>((set) => ({
  account: null,
  publication: null,
  isLoadingStatus: false,
  isAuthorizing: false,
  isPublishing: false,
  isSyncing: false,
  error: null,

  fetchAccountStatus: async () => {
    set({ isLoadingStatus: true, error: null });
    try {
      const account = await getMercadoLibreAccountStatusApi();
      set({ account, isLoadingStatus: false });
      return account;
    } catch (error) {
      const message = normalizeMercadoLibreError(
        error,
        "No pudimos consultar la cuenta de Mercado Libre.",
      );
      set({
        account: DEFAULT_ACCOUNT,
        isLoadingStatus: false,
        error: message,
      });
      return null;
    }
  },

  fetchPropertyStatus: async (propertyId) => {
    set({ isLoadingStatus: true, error: null });
    try {
      const response = await getMercadoLibrePropertyStatusApi(propertyId);
      set({
        account: response.account,
        publication: response.publication,
        isLoadingStatus: false,
      });
      return response;
    } catch (error) {
      const message = normalizeMercadoLibreError(
        error,
        "No pudimos consultar el estado de la publicación.",
      );
      set({
        account: DEFAULT_ACCOUNT,
        publication: null,
        isLoadingStatus: false,
        error: message,
      });
      return null;
    }
  },

  startAuthorization: async (propertyId) => {
    set({ isAuthorizing: true, error: null });
    try {
      const response = await getMercadoLibreAuthorizationUrlApi(propertyId);
      set({ isAuthorizing: false });
      return response.authorization_url;
    } catch (error) {
      const message = normalizeMercadoLibreError(
        error,
        "No pudimos iniciar la autorizacion con Mercado Libre.",
      );
      set({ isAuthorizing: false, error: message });
      throw new Error(message);
    }
  },

  publishProperty: async (propertyId) => {
    set({ isPublishing: true, error: null });
    try {
      const response = await publishPropertyToMercadoLibreApi(propertyId);
      set({
        publication: response.publication,
        isPublishing: false,
      });
      return response;
    } catch (error) {
      const message = normalizeMercadoLibreError(
        error,
        "No pudimos publicar la propiedad en Mercado Libre.",
      );
      set({ isPublishing: false, error: message });
      throw new Error(message);
    }
  },

  syncProperty: async (propertyId) => {
    set({ isSyncing: true, error: null });
    try {
      const response = await syncMercadoLibrePropertyApi(propertyId);
      set({
        publication: response.publication,
        isSyncing: false,
      });
      return response;
    } catch (error) {
      const message = normalizeMercadoLibreError(
        error,
        "No pudimos sincronizar la propiedad en Mercado Libre.",
      );
      set({ isSyncing: false, error: message });
      throw new Error(message);
    }
  },

  reset: () =>
    set({
      account: null,
      publication: null,
      isLoadingStatus: false,
      isAuthorizing: false,
      isPublishing: false,
      isSyncing: false,
      error: null,
    }),
}));
