export interface LatLng {
  lat: number;
  lng: number;
}

export function parseGoogleMapsLink(url: string | undefined | null): LatLng | null {
  if (!url) return null;
  const s = url.trim();
  if (!s) return null;

  try {
    // !3dlat!4dlng — coordenadas exactas del lugar (SIEMPRE prioridad sobre @lat,lng)
    // El @lat,lng es solo el centro de la cámara, no la ubicación del pin
    const dataMatch = s.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
    if (dataMatch) {
      const c = { lat: parseFloat(dataMatch[1]), lng: parseFloat(dataMatch[2]) };
      if (valid(c)) return c;
    }

    // ?q=lat,lng or &q=lat,lng
    const qMatch = s.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (qMatch) {
      const c = { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
      if (valid(c)) return c;
    }

    // ll=lat,lng
    const llMatch = s.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (llMatch) {
      const c = { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
      if (valid(c)) return c;
    }

    // @lat,lng,zoom — fallback: solo cuando no hay !3d!4d (e.g. URLs de coordenadas puras)
    const atMatch = s.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atMatch) {
      const c = { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
      if (valid(c)) return c;
    }

    return null;
  } catch {
    return null;
  }
}

function valid({ lat, lng }: LatLng): boolean {
  return (
    !isNaN(lat) && !isNaN(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}
