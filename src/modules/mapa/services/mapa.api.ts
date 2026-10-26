import { apiRequest } from "@/shared/apiRequest";

const BATCH_SIZE = 40;

export async function resolveMapLinks(
  urls: string[],
): Promise<Record<string, { lat: number; lng: number } | null>> {
  if (!urls.length) return {};

  // Partir en chunks para no superar el límite del backend
  const chunks: string[][] = [];
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    chunks.push(urls.slice(i, i + BATCH_SIZE));
  }

  const results: Record<string, { lat: number; lng: number } | null> = {};
  for (const chunk of chunks) {
    const partial = await apiRequest<Record<string, { lat: number; lng: number } | null>>(
      "/mapa/resolve-batch",
      { params: { urls: JSON.stringify(chunk) } },
    );
    Object.assign(results, partial);
  }
  return results;
}
