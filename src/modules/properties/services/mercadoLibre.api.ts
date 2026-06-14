import { apiRequest } from "@/shared/apiRequest";
import type {
  MercadoLibreAccountStatus,
  MercadoLibreAuthUrlResponse,
  MercadoLibrePropertyStatusResponse,
  MercadoLibrePublishResponse,
  MercadoLibreSyncResponse,
} from "@/interfaces/mercadoLibre.interface";

const BASE_PATH = "/integrations/mercado-libre";

export function getMercadoLibreAccountStatusApi() {
  return apiRequest<MercadoLibreAccountStatus>(`${BASE_PATH}/account`);
}

export function getMercadoLibreAuthorizationUrlApi(propertyId?: number) {
  return apiRequest<MercadoLibreAuthUrlResponse>(`${BASE_PATH}/auth-url`, {
    method: "POST",
    data: propertyId ? { propertyId } : undefined,
  });
}

export function getMercadoLibrePropertyStatusApi(propertyId: number) {
  return apiRequest<MercadoLibrePropertyStatusResponse>(
    `${BASE_PATH}/properties/${propertyId}`,
  );
}

export function publishPropertyToMercadoLibreApi(propertyId: number) {
  return apiRequest<MercadoLibrePublishResponse>(
    `${BASE_PATH}/properties/${propertyId}/publish`,
    {
      method: "POST",
    },
  );
}

export function syncMercadoLibrePropertyApi(propertyId: number) {
  return apiRequest<MercadoLibreSyncResponse>(
    `${BASE_PATH}/properties/${propertyId}/sync`,
    {
      method: "POST",
    },
  );
}
