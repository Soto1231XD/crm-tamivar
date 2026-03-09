import axios, { AxiosError } from "axios";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: Inyecta el token de seguridad en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Función genérica reutilizable para todos los servicios
export async function apiRequest<T>(
  endpoint: string,
  {
    method = "GET",
    data,
    headers,
    params,
  }: {
    method?: HttpMethod;
    data?: any;
    headers?: Record<string, string>;
    params?: Record<string, any>;
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
    const err = error as AxiosError<any>;

    // Extraemos el mensaje real que viene del backend si existe
    const serverMessage = err.response?.data?.message;
    const finalMessage = Array.isArray(serverMessage)
      ? serverMessage[0]
      : serverMessage;

    console.error(`[API Error] ${method} ${endpoint}:`, {
      status: err.response?.status,
      message: finalMessage,
    });

    // Manejo de errores por códigos de estado
    if (err.response?.status === 401) {
      throw new Error("Sesión expirada o no autorizada.");
    }

    if (err.response?.status === 403) {
      throw new Error("No tienes permisos para realizar esta acción.");
    }

    if (err.response?.status === 400) {
      throw new Error(finalMessage || "Datos de solicitud inválidos.");
    }

    if (err.response?.status === 404) {
      throw new Error("El recurso solicitado no existe.");
    }

    if (err.response?.status && err.response.status >= 500) {
      throw new Error("Error en el servidor. Inténtalo más tarde.");
    }

    throw new Error(finalMessage || "Error de conexión con el servidor.");
  }
}

export default api;