import { apiRequest } from "@/shared/apiRequest";

export async function resolveMapLinks(
  urls: string[],
): Promise<Record<string, { lat: number; lng: number } | null>> {
  if (!urls.length) return {};
  return apiRequest<Record<string, { lat: number; lng: number } | null>>(
    "/mapa/resolve-batch",
    { params: { urls: JSON.stringify(urls) } },
  );
}
