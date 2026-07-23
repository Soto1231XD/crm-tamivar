// CartoDB tiles — soportan CORS (Access-Control-Allow-Origin: *) de forma confiable
const TILE_URL = "https://a.basemaps.cartocdn.com/rastertiles/voyager";

// Resuelve URLs cortas de Google Maps (maps.app.goo.gl) a través del API server-side
async function expandShortUrl(url: string): Promise<string> {
  if (!/maps\.app\.goo\.gl|goo\.gl\/maps/i.test(url)) return url;
  try {
    const apiBase =
      (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ||
      "http://localhost:3000";
    const res = await fetch(
      `${apiBase}/utils/expand-maps-url?url=${encodeURIComponent(url)}`,
    );
    const data: { url: string } = await res.json();
    return data.url || url;
  } catch {
    return url;
  }
}
const TILE_SIZE = 256;

function latLonToTileFloat(lat: number, lon: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = ((lon + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    n;
  return { x, y };
}

// Extrae coordenadas directamente de la URL de Google Maps
function extractCoordsFromUrl(url: string): { lat: number; lon: number } | null {
  // Formato más común: .../@21.1619,-86.8515,15z...
  const atMatch = url.match(/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lon = parseFloat(atMatch[2]);
    // Sanidad básica: coordenadas válidas
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }

  // Formato ?q=lat,lon o ?ll=lat,lon
  const qMatch = url.match(/[?&](?:q|ll)=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lon: parseFloat(qMatch[2]) };
  }

  return null;
}

// Extrae el texto de búsqueda de la URL para pasarlo a Nominatim
function extractQueryFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const q =
      parsed.searchParams.get("q") ||
      parsed.searchParams.get("query") ||
      parsed.searchParams.get("destination");
    if (q && !/^-?\d/.test(q)) return q; // Si empieza con número es coord, no texto
  } catch {}
  return null;
}

async function nominatim(query: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=mx`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "es,en;q=0.8" },
    });
    const data: Array<{ lat: string; lon: string }> = await res.json();
    if (data?.length) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
  } catch {}
  return null;
}

function loadTile(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  tx: number,
  ty: number,
  drawX: number,
  drawY: number,
): Promise<void> {
  return new Promise((resolve) => {
    const n = Math.pow(2, zoom);
    const normX = ((tx % n) + n) % n;
    const normY = Math.max(0, Math.min(n - 1, ty));

    const img = new Image();
    img.crossOrigin = "Anonymous";

    const done = () => resolve();
    const timer = setTimeout(done, 6000);

    img.onload = () => {
      clearTimeout(timer);
      try {
        ctx.drawImage(img, drawX, drawY, TILE_SIZE, TILE_SIZE);
      } catch {}
      resolve();
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve();
    };

    img.src = `${TILE_URL}/${zoom}/${normX}/${normY}.png`;
  });
}

/**
 * Genera una imagen estática de la zona cercana a la propiedad.
 * - SIN marcador/pin para no revelar la dirección exacta.
 * - Usa tiles CartoDB (CORS habilitado).
 * - Devuelve PNG base64 para usar en @react-pdf/renderer.
 */
export async function generateMapImage(
  mapsUrl: string,
  municipio: string,
  estado: string,
  fallbackFullAddress: string,
  zoom = 16,
  width = 1536,
  height = 584,
): Promise<string | null> {
  // 0. Resolver URL corta (maps.app.goo.gl) → URL completa con coordenadas
  const resolvedUrl = await expandShortUrl(mapsUrl);

  // 1. Intentar extraer coordenadas de la URL directamente
  let coords = extractCoordsFromUrl(resolvedUrl);

  // 2. Si no hay coords en la URL, intentar geocodificar el texto de búsqueda
  if (!coords) {
    const urlQuery = extractQueryFromUrl(mapsUrl);
    if (urlQuery) {
      coords = await nominatim(urlQuery);
    }
  }

  // 3. Fallback: dirección completa formateada
  if (!coords && fallbackFullAddress) {
    coords = await nominatim(fallbackFullAddress);
  }

  // 4. Fallback final: solo municipio y estado (siempre existen)
  if (!coords && municipio && estado) {
    coords = await nominatim(`${municipio}, ${estado}, México`);
  }

  if (!coords) {
    console.warn("[mapImage] No se pudieron obtener coordenadas para:", mapsUrl);
    return null;
  }

  // Preparar canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Fondo gris claro mientras cargan los tiles
  ctx.fillStyle = "#f1f5f9";
  ctx.fillRect(0, 0, width, height);

  // Calcular posición de tiles
  const { x: cTileX, y: cTileY } = latLonToTileFloat(coords.lat, coords.lon, zoom);
  const cTileIntX = Math.floor(cTileX);
  const cTileIntY = Math.floor(cTileY);

  // Posición del tile central en el canvas
  const centerDrawX = width / 2 - (cTileX - cTileIntX) * TILE_SIZE;
  const centerDrawY = height / 2 - (cTileY - cTileIntY) * TILE_SIZE;

  // Rango de tiles necesarios
  const minDx = Math.floor(-centerDrawX / TILE_SIZE) - 1;
  const maxDx = Math.ceil((width - centerDrawX) / TILE_SIZE);
  const minDy = Math.floor(-centerDrawY / TILE_SIZE) - 1;
  const maxDy = Math.ceil((height - centerDrawY) / TILE_SIZE);

  // Cargar todos los tiles en paralelo
  const promises: Promise<void>[] = [];
  for (let dx = minDx; dx <= maxDx; dx++) {
    for (let dy = minDy; dy <= maxDy; dy++) {
      promises.push(
        loadTile(
          ctx,
          zoom,
          cTileIntX + dx,
          cTileIntY + dy,
          centerDrawX + dx * TILE_SIZE,
          centerDrawY + dy * TILE_SIZE,
        ),
      );
    }
  }
  await Promise.all(promises);

  // Círculo de zona — centro del canvas = coordenada de la propiedad
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.round(width * 0.171); // ~263px en canvas 1536px → ~88pt visual en PDF

  // Relleno semitransparente
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(59, 130, 246, 0.18)";
  ctx.fill();

  // Borde del círculo
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(59, 130, 246, 0.75)";
  ctx.lineWidth = 7;
  ctx.stroke();

  // Atribución requerida por OSM/CartoDB
  const attrH = Math.round(height * 0.09); // ~36px en canvas 400px
  ctx.fillStyle = "rgba(255,255,255,0.80)";
  ctx.fillRect(0, height - attrH, width, attrH);
  ctx.fillStyle = "#444444";
  ctx.font = `${Math.round(height * 0.05)}px sans-serif`; // ~20px en canvas 400px
  ctx.fillText("© OpenStreetMap contributors  © CartoDB", 8, height - Math.round(attrH * 0.28));

  try {
    return canvas.toDataURL("image/png");
  } catch (e) {
    console.warn("[mapImage] Canvas tainted (CORS en tiles):", e);
    return null;
  }
}
