import { apiRequest } from "@/shared/apiRequest";
import type {
  MovementFilters,
  PaginatedMovementResponse,
} from "@/interfaces/movement.interface";

const PATH = "/movimientos";

export async function getMovements(
  filters?: MovementFilters,
): Promise<PaginatedMovementResponse> {
  return apiRequest<PaginatedMovementResponse>(PATH, {
    params: filters as Record<string, unknown> | undefined,
  });
}
