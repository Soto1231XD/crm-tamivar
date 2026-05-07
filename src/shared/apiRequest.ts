import axios, { AxiosError } from "axios";
import { useAuthStore } from "./auth/useAuthStore";
import { isTokenExpired } from "./auth/token.utils";
import { normalizeErrorMessage } from "./utils/errorMessages";

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
    const err = error as AxiosError<{
      message?: string | string[] | Record<string, unknown>;
      error?: string;
      details?: string | string[];
    }>;
    const finalMessage = extractServerMessage(err);
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
      throw new Error(
        normalizeErrorMessage(
          finalMessage,
          "Los datos enviados no son válidos. Revisa la información capturada.",
        ),
      );
    }

    if (err.response?.status === 413) {
      throw new Error(
        "Las imágenes exceden el límite permitido. Revisa el peso por archivo o el peso total del envío.",
      );
    }

    if (err.response?.status === 404) {
      throw new Error(
        normalizeErrorMessage(
          finalMessage,
          "El recurso solicitado no existe o ya no está disponible.",
        ),
      );
    }

    if (err.response?.status && err.response.status >= 500) {
      throw new Error(
        normalizeErrorMessage(
          finalMessage,
          "El servidor no pudo completar la solicitud. Intenta nuevamente en unos minutos.",
        ),
      );
    }

    throw new Error(
      normalizeErrorMessage(
        finalMessage || err.message,
        "No pudimos comunicarnos con el servidor. Verifica tu conexión e inténtalo nuevamente.",
      ),
    );
  }
}

export default api;

function extractServerMessage(
  error: AxiosError<{
    message?: string | string[] | Record<string, unknown>;
    error?: string;
    details?: string | string[];
  }>,
) {
  const payload = error.response?.data;
  const candidates = [payload?.message, payload?.details, payload?.error];

  for (const candidate of candidates) {
    const extracted = stringifyServerMessage(candidate);
    if (extracted) {
      return extracted;
    }
  }

  return "";
}

function stringifyServerMessage(value: unknown): string {
  if (!value) return "";

  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => stringifyServerMessage(item))
      .filter(Boolean)
      .join(" ");
  }

  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map((item) => stringifyServerMessage(item))
      .filter(Boolean)
      .join(" ");
  }

  return "";
}
