import axios, { AxiosError } from "axios";
import { useAuthStore } from "./auth/useAuthStore";
import { isTokenExpired } from "./auth/token.utils";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token && isTokenExpired(token)) {
    useAuthStore.getState().logout();

    if (window.location.pathname !== "/login") {
      window.location.replace("/login");
    }

    return Promise.reject(new Error("Sesión expirada o no autorizada."));
  }

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers?.["Content-Type"];
  } else if (config.headers) {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

export async function apiRequest<T>(
  endpoint: string,
  {
    method = "GET",
    data,
    headers,
    params,
  }: {
    method?: HttpMethod;
    data?: unknown;
    headers?: Record<string, string>;
    params?: Record<string, unknown>;
  } = {},
): Promise<T> {
  try {
    const response = await api.request<T>({
      url: endpoint,
      method,
      data,
      headers,
      params,
    });

    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string | string[] }>;
    const serverMessage = err.response?.data?.message;
    const finalMessage = Array.isArray(serverMessage)
      ? serverMessage[0]
      : serverMessage;
    const token = useAuthStore.getState().token;

    console.error(`[API Error] ${method} ${endpoint}:`, {
      status: err.response?.status,
      message: finalMessage,
    });

    if (err.response?.status === 401) {
      if (token) {
        useAuthStore.getState().logout();

        if (window.location.pathname !== "/login") {
          window.location.replace("/login");
        }

        throw new Error("Sesión expirada o no autorizada.");
      }

      throw new Error(finalMessage || "No autorizado.");
    }

    if (err.response?.status === 403) {
      throw new Error("No tienes permisos para realizar esta acción.");
    }

    if (err.response?.status === 400) {
      throw new Error(finalMessage || "Datos de solicitud inválidos.");
    }

    if (err.response?.status === 413) {
      throw new Error(
        "Las imágenes exceden el límite permitido. Revisa el peso por archivo o el peso total del envío.",
      );
    }

    if (err.response?.status === 404) {
      throw new Error("El recurso solicitado no existe.");
    }

    if (err.response?.status && err.response.status >= 500) {
      throw new Error(finalMessage || "Error en el servidor. Inténtalo más tarde.");
    }

    throw new Error(finalMessage || "Error de conexión con el servidor.");
  }
}

export default api;
