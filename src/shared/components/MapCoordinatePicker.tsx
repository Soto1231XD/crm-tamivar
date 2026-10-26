import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";

interface Props {
  lat?: number | null;
  lng?: number | null;
  onChange: (coords: { lat: number; lng: number } | null) => void;
}

const CANCUN = { lat: 21.1619, lng: -86.8515 };

const pinIcon = L.divIcon({
  className: "",
  iconSize: [30, 38],
  iconAnchor: [15, 38],
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
    <path d="M15 0C6.72 0 0 6.72 0 15c0 10.5 15 23 15 23S30 25.5 30 15C30 6.72 23.28 0 15 0z" fill="#312C85"/>
    <circle cx="15" cy="15" r="6" fill="white"/>
  </svg>`,
});

export default function MapCoordinatePicker({ lat, lng, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [hasCoords, setHasCoords] = useState(!!(lat && lng));

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: L.LatLngExpression =
      lat && lng ? [lat, lng] : [CANCUN.lat, CANCUN.lng];

    const map = L.map(containerRef.current, {
      center,
      zoom: lat && lng ? 16 : 13,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    if (lat && lng) {
      markerRef.current = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
    }

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat: newLat, lng: newLng } = e.latlng;

      if (markerRef.current) {
        markerRef.current.setLatLng([newLat, newLng]);
      } else {
        markerRef.current = L.marker([newLat, newLng], { icon: pinIcon }).addTo(map);
      }

      setHasCoords(true);
      onChange({ lat: newLat, lng: newLng });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Sync external lat/lng changes (e.g. form reset)
  useEffect(() => {
    if (!mapRef.current) return;
    if (lat && lng) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { icon: pinIcon }).addTo(mapRef.current);
      }
      mapRef.current.setView([lat, lng], 16);
      setHasCoords(true);
    } else if (!lat && !lng && markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
      setHasCoords(false);
    }
  }, [lat, lng]);

  function handleClear() {
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    setHasCoords(false);
    onChange(null);
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--muted)] leading-tight">
          {hasCoords
            ? `Pin colocado · ${lat?.toFixed(6)}, ${lng?.toFixed(6)}`
            : "Haz clic en el mapa para colocar la ubicación exacta"}
        </p>
        {hasCoords && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-red-500 hover:text-red-600 underline"
          >
            Quitar pin
          </button>
        )}
      </div>
      <div
        ref={containerRef}
        className="w-full rounded-lg overflow-hidden border border-[var(--border)]"
        style={{ height: 280 }}
      />
    </div>
  );
}
