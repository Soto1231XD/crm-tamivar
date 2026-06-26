import { apiRequest } from "@/shared/apiRequest";
import type { ClienteCartera } from "@/interfaces/cartera-clientes.interface";

export type { ClienteCartera };

export const getCarteraClientes = () =>
  apiRequest<ClienteCartera[]>("/cartera-clientes");

export const createCarteraCliente = (data: Partial<ClienteCartera>) =>
  apiRequest<ClienteCartera>("/cartera-clientes", { method: "POST", data });

export const updateCarteraCliente = (id: number, data: Partial<ClienteCartera>) =>
  apiRequest<ClienteCartera>(`/cartera-clientes/${id}`, { method: "PATCH", data });

export const deleteCarteraCliente = (id: number) =>
  apiRequest<void>(`/cartera-clientes/${id}`, { method: "DELETE" });
