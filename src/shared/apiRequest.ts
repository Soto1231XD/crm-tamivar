import axios, { AxiosError } from 'axios';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const SESSION_STORAGE_KEY = 'crm_tamivar_session';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);
  const token = rawSession ? (JSON.parse(rawSession) as { accessToken?: string | null }).accessToken : null;

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers?.['Content-Type'];
    return config;
  }

  config.headers['Content-Type'] = 'application/json';
  return config;
});

export async function apiRequest<T>(
  endpoint: string,
  {
    method = 'GET',
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
    const finalMessage = Array.isArray(serverMessage) ? serverMessage[0] : serverMessage;

    console.error(`[API Error] ${method} ${endpoint}:`, {
      status: err.response?.status,
      message: finalMessage,
    });

    if (err.response?.status === 401) {
      throw new Error('Sesión expirada o no autorizada.');
    }

    if (err.response?.status === 403) {
      throw new Error('No tienes permisos para realizar esta acción.');
    }

    if (err.response?.status === 400) {
      throw new Error(finalMessage || 'Datos de solicitud inválidos.');
    }

    if (err.response?.status === 404) {
      throw new Error('El recurso solicitado no existe.');
    }

    if (err.response?.status && err.response.status >= 500) {
      throw new Error('Error en el servidor. Inténtalo más tarde.');
    }

    throw new Error(finalMessage || 'Error de conexión con el servidor.');
  }
}

export default api;
