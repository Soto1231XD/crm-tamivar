import { apiRequest } from "@/shared/apiRequest";
import type {
  MovementFilters,
  MovementRecord,
} from "@/interfaces/movement.interface";

const PATH = "/movimientos";

export async function getMovements(
  filters?: MovementFilters,
): Promise<MovementRecord[]> {
  const hasFilters = filters
    ? Object.values(filters).some((value) => value !== undefined && value !== "")
    : false;

  return apiRequest<MovementRecord[]>(
    hasFilters ? `${PATH}/filtrar` : PATH,
    hasFilters
      ? { params: filters as Record<string, unknown> }
      : undefined,
  );
}
