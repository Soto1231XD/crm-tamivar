import { apiRequest } from "@/shared/apiRequest";
import type { OperacionProceso, OperacionFiniquitada, Comision } from "@/interfaces/operaciones.interface";

export type { OperacionProceso, OperacionFiniquitada, Comision };

// ── Operaciones en proceso ──────────────────────────────
export const getProceso = () =>
  apiRequest<OperacionProceso[]>("/operaciones/proceso");

export const createProceso = (data: Partial<OperacionProceso>) =>
  apiRequest<OperacionProceso>("/operaciones/proceso", { method: "POST", data });

export const updateProceso = (id: number, data: Partial<OperacionProceso>) =>
  apiRequest<OperacionProceso>(`/operaciones/proceso/${id}`, { method: "PATCH", data });

export const deleteProceso = (id: number) =>
  apiRequest<void>(`/operaciones/proceso/${id}`, { method: "DELETE" });

// ── Operaciones finiquitadas ────────────────────────────
export const getFiniquitadas = () =>
  apiRequest<OperacionFiniquitada[]>("/operaciones/finiquitadas");

export const createFiniquitada = (data: Partial<OperacionFiniquitada>) =>
  apiRequest<OperacionFiniquitada>("/operaciones/finiquitadas", { method: "POST", data });

export const updateFiniquitada = (id: number, data: Partial<OperacionFiniquitada>) =>
  apiRequest<OperacionFiniquitada>(`/operaciones/finiquitadas/${id}`, { method: "PATCH", data });

export const deleteFiniquitada = (id: number) =>
  apiRequest<void>(`/operaciones/finiquitadas/${id}`, { method: "DELETE" });

// ── Comisiones ─────────────────────────────────────────
export const getComisiones = () =>
  apiRequest<Comision[]>("/comisiones");

export const createComision = (data: Partial<Omit<Comision, "id" | "creado_en" | "actualizado_en" | "finiquitada">>) =>
  apiRequest<Comision>("/comisiones", { method: "POST", data });

export const updateComision = (id: number, data: Partial<Comision>) =>
  apiRequest<Comision>(`/comisiones/${id}`, { method: "PATCH", data });
