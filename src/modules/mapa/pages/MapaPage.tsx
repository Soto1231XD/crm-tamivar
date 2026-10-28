import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import { getPropertiesByEstatus } from "@/modules/properties/services/properties.api";
import { getDevelopmentsByEstatus } from "@/modules/developments/services/developments.api";
import type { PropertyRecord } from "@/interfaces/property.interface";
import type { DevelopmentRecord } from "@/interfaces/development.interface";
import { getFullImageUrl } from "@/shared/utils/imageUrl";
import { parseGoogleMapsLink, type LatLng } from "../utils/parseGoogleMapsLink";
import { resolveMapLinks } from "../services/mapa.api";
import { formatCurrency, calculateFinalPrice } from "@/modules/properties/utils/formatters";
import { useThemeStore } from "@/shared/theme/useThemeStore";
import { useAuthStore } from "@/shared/auth/useAuthStore";
import { normalizeRoleName } from "@/shared/auth/role.utils";

// --- Custom marker icons ---
const PROPERTY_COLOR = "#312C85";
const DEVELOPMENT_COLOR = "#16A34A";

function makePin(color: string, initial: string): L.DivIcon {
  return L.divIcon({
    className: "",
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -44],
    html: `<div style="
      width:34px;height:42px;
      display:flex;align-items:center;justify-content:center;
      position:relative;
    ">
      <svg viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;">
        <path d="M17 0C7.6 0 0 7.6 0 17c0 12.8 17 25 17 25S34 29.8 34 17C34 7.6 26.4 0 17 0z" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="17" y="21" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="13" font-weight="700" font-family="sans-serif">${initial}</text>
      </svg>
    </div>`,
  });
}

const propiedadIcon = makePin(PROPERTY_COLOR, "P");
const desarrolloIcon = makePin(DEVELOPMENT_COLOR, "D");

// --- Types ---
interface PropertyMarker {
  type: "propiedad";
  id: number;
  lat: number;
  lng: number;
  titulo: string;
  tipo_inmueble: string;
  estatus: string;
  imageUrl: string | null;
  precio: string;
  operacion: string;
}

interface DevelopmentMarker {
  type: "desarrollo";
  id: number;
  lat: number;
  lng: number;
  titulo: string;
  tipo_inmueble: string;
  estatus: string;
  imageUrl: string | null;
  precio: string;
  operacion: string;
}

type MapMarker = PropertyMarker | DevelopmentMarker;

// --- Helpers ---
function getPropertyPrice(p: PropertyRecord): string {
  if (!p.esquema_comercial?.length) return "Sin precio";
  const s = p.esquema_comercial[0];
  const { finalPrice } = calculateFinalPrice(s.precio, s.descuento_cantidad);
  return formatCurrency(finalPrice);
}

function getPropertyOp(p: PropertyRecord): string {
  if (!p.esquema_comercial?.length) return "—";
  return p.esquema_comercial.map((s) => s.tipo_operacion).join(" / ");
}

function getDevPrice(d: DevelopmentRecord): string {
  const prices = (d.modelos ?? [])
    .flatMap((m) => m.esquema_comercial ?? [])
    .map((s) => Number(s.precio))
    .filter((n) => n > 0);
  if (!prices.length) return "Sin precio";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatCurrency(min) : `${formatCurrency(min)} – ${formatCurrency(max)}`;
}

function getDevOp(d: DevelopmentRecord): string {
  const ops = Array.from(
    new Set(
      (d.modelos ?? [])
        .flatMap((m) => m.esquema_comercial ?? [])
        .map((s) => s.tipo_operacion?.trim())
        .filter(Boolean),
    ),
  );
  return ops.length ? ops.join(" / ") : "—";
}

const STATUS_COLORS: Record<string, string> = {
  Disponible: "#16A34A",
  Apartado: "#CA8A04",
  Vendido: "#DC2626",
  Baja: "#64748B",
};

const DEFAULT_CENTER: [number, number] = [21.1619, -86.8515];
const DEFAULT_ZOOM = 12;

// --- ZoomTracker: notifies parent of zoom changes ---
function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  useMapEvents({
    zoomend(e) {
      onZoomChange(e.target.getZoom());
    },
  });
  return null;
}

// --- ResetMapView: flies back to the default view ---
function ResetMapView({ trigger }: { trigger: number }) {
  const map = useMap();
  useEffect(() => {
    if (trigger === 0) return;
    map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 1 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
  return null;
}

// --- FlyToMarker: component inside MapContainer that pans to a target ---
function FlyToMarker({
  target,
  onArrived,
}: {
  target: { lat: number; lng: number } | null;
  onArrived?: () => void;
}) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], 17, { duration: 1 });
    const t = setTimeout(() => onArrived?.(), 1150);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return null;
}

// Touch detection (móvil no tiene hover, mantiene comportamiento de click)
const isTouch = () =>
  typeof window !== "undefined" &&
  ("ontouchstart" in window || navigator.maxTouchPoints > 0);

export function MapaPage() {
  const navigate = useNavigate();
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === "dark";
  const user = useAuthStore((s) => s.user);
  const isAsesor = (user?.roles ?? []).length > 0 &&
    (user?.roles ?? []).every((r) => normalizeRoleName(r) === "asesor de ventas");

  // Devuelve eventHandlers para cada marker:
  // - Desktop: abre en hover, cierra al salir (con delay para poder mover al popup)
  // - Móvil:   abre en tap (comportamiento Leaflet por defecto, sin cambios)
  const markerHandlers = useCallback(() => {
    if (isTouch()) return {};
    return {
      mouseover(e: L.LeafletMouseEvent) {
        e.target.openPopup();
      },
      mouseout(e: L.LeafletMouseEvent) {
        const target = e.target as L.Marker;
        // Delay para que el usuario pueda mover el mouse al popup sin que se cierre
        setTimeout(() => {
          const container = (target.getPopup() as L.Popup | undefined)?.getElement();
          if (!container?.matches(":hover")) target.closePopup();
        }, 120);
      },
      popupopen(e: L.PopupEvent) {
        const container = e.popup.getElement();
        const target = e.target as L.Marker;
        if (container) {
          // Cuando el usuario sale del popup, lo cierra
          container.addEventListener("mouseleave", () => target.closePopup(), {
            once: true,
          });
        }
      },
    };
  }, []);

  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [developments, setDevelopments] = useState<DevelopmentRecord[]>([]);
  const [resolvedCoords, setResolvedCoords] = useState<Record<string, LatLng>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showProperties, setShowProperties] = useState(true);
  const [showDevelopments, setShowDevelopments] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [viewReset, setViewReset] = useState(0);
  const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    Promise.all([getPropertiesByEstatus("Disponible"), getDevelopmentsByEstatus("Disponible")])
      .then(async ([props, devs]) => {
        if (cancelled) return;
        setProperties(props);
        setDevelopments(devs);
        setIsLoading(false);

        // Solo resolver links de propiedades que no tienen lat/lng propio
        const shortLinks = Array.from(
          new Set([
            ...props
              .filter((p) => !p.latitud || !p.longitud)
              .map((p) => p.enlace_direccion)
              .filter((url): url is string => !!url && !parseGoogleMapsLink(url)),
            ...devs
              .filter((d) => !d.latitud || !d.longitud)
              .map((d) => d.enlace_direccion ?? "")
              .filter((url) => !!url && !parseGoogleMapsLink(url)),
          ]),
        );

        if (shortLinks.length === 0) return;

        setIsResolving(true);
        try {
          const resolved = await resolveMapLinks(shortLinks);
          if (cancelled) return;
          const validEntries = Object.entries(resolved).filter(
            (entry): entry is [string, LatLng] => entry[1] !== null,
          );
          if (validEntries.length > 0) {
            setResolvedCoords((prev) => ({
              ...prev,
              ...Object.fromEntries(validEntries),
            }));
          }
        } catch {
          // Si el resolve falla, los pins sin coordenadas simplemente no aparecen
        } finally {
          if (!cancelled) setIsResolving(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("No pudimos cargar el inventario.");
          setIsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const propertyMarkers = useMemo<PropertyMarker[]>(() => {
    if (!showProperties) return [];
    return properties
      .flatMap((p) => {
        let coords: LatLng | null = null;
        if (p.latitud && p.longitud) {
          coords = { lat: p.latitud, lng: p.longitud };
        } else {
          const url = p.enlace_direccion ?? "";
          coords = parseGoogleMapsLink(url) ?? (url ? resolvedCoords[url] ?? null : null);
        }
        if (!coords) return [];
        const img = p.imagenes?.find((i) => i.principal) ?? p.imagenes?.[0];
        return [{
          type: "propiedad" as const,
          id: p.id,
          lat: coords.lat,
          lng: coords.lng,
          titulo: p.titulo,
          tipo_inmueble: p.tipo_inmueble,
          estatus: p.estatus,
          imageUrl: img ? getFullImageUrl(img.url) : null,
          precio: getPropertyPrice(p),
          operacion: getPropertyOp(p),
        }];
      });
  }, [properties, showProperties, resolvedCoords]);

  const developmentMarkers = useMemo<DevelopmentMarker[]>(() => {
    if (!showDevelopments) return [];
    return developments
      .flatMap((d) => {
        let coords: LatLng | null = null;
        if (d.latitud && d.longitud) {
          coords = { lat: d.latitud, lng: d.longitud };
        } else {
          const url = d.enlace_direccion ?? "";
          coords = parseGoogleMapsLink(url) ?? (url ? resolvedCoords[url] ?? null : null);
        }
        if (!coords) return [];
        const img = d.imagenes?.find((i) => i.principal) ?? d.imagenes?.[0];
        return [{
          type: "desarrollo" as const,
          id: d.id,
          lat: coords.lat,
          lng: coords.lng,
          titulo: d.titulo,
          tipo_inmueble: d.tipo_inmueble,
          estatus: d.estatus,
          imageUrl: img ? getFullImageUrl(img.url) : null,
          precio: getDevPrice(d),
          operacion: getDevOp(d),
        }];
      });
  }, [developments, showDevelopments, resolvedCoords]);

  const noLocationCount = useMemo(() => {
    const hasCoords = (item: PropertyRecord | DevelopmentRecord) => {
      if (item.latitud && item.longitud) return true;
      const url = item.enlace_direccion ?? "";
      return !!(parseGoogleMapsLink(url) ?? (url ? resolvedCoords[url] : undefined));
    };
    return (
      properties.filter((p) => !hasCoords(p)).length +
      developments.filter((d) => !hasCoords(d)).length
    );
  }, [properties, developments, resolvedCoords]);

  const allMarkers: MapMarker[] = [...propertyMarkers, ...developmentMarkers];

  // Search suggestions
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allMarkers.filter((m) => m.titulo.toLowerCase().includes(q)).slice(0, 8);
  }, [searchQuery, allMarkers]);

  // Markers visible on map (all, or only the highlighted one)
  const visiblePropertyMarkers = highlightedKey
    ? propertyMarkers.filter((m) => `p-${m.id}` === highlightedKey)
    : propertyMarkers;

  const visibleDevelopmentMarkers = highlightedKey
    ? developmentMarkers.filter((m) => `d-${m.id}` === highlightedKey)
    : developmentMarkers;

  // Reset active index when the search text changes
  useEffect(() => { setActiveIndex(-1); }, [searchQuery]);

  function selectSuggestion(m: MapMarker) {
    const key = `${m.type === "propiedad" ? "p" : "d"}-${m.id}`;
    setSearchQuery(m.titulo);
    setShowSuggestions(false);
    setActiveIndex(-1);
    setHighlightedKey(key);
    setFlyTarget({ lat: m.lat, lng: m.lng });
  }

  function clearSearch() {
    setSearchQuery("");
    setHighlightedKey(null);
    setFlyTarget(null);
    setShowSuggestions(false);
    setActiveIndex(-1);
    setViewReset((n) => n + 1);
    setCurrentZoom(DEFAULT_ZOOM);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        selectSuggestion(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  }

  const handleFlyArrived = useCallback(() => {
    if (!highlightedKey) return;
    markerRefs.current.get(highlightedKey)?.openPopup();
  }, [highlightedKey]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const sinUbicacion = useMemo(() => {
    const hasCoords = (item: PropertyRecord | DevelopmentRecord) => {
      if (item.latitud && item.longitud) return true;
      const url = item.enlace_direccion ?? "";
      return !!(parseGoogleMapsLink(url) ?? (url ? resolvedCoords[url] : undefined));
    };
    const props = properties
      .filter((p) => !hasCoords(p))
      .map((p) => ({
        tipo: "Propiedad" as const,
        id: p.id,
        titulo: p.titulo,
        link: p.enlace_direccion ?? "",
        editUrl: `/modulos/propiedades/${p.id}/editar`,
      }));
    const devs = developments
      .filter((d) => !hasCoords(d))
      .map((d) => ({
        tipo: "Desarrollo" as const,
        id: d.id,
        titulo: d.titulo,
        link: d.enlace_direccion ?? "",
        editUrl: `/modulos/desarrollos/${d.id}/editar`,
      }));
    return [...props, ...devs];
  }, [properties, developments, resolvedCoords]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <header
        className={[
          "flex flex-wrap items-start justify-between gap-4 rounded-2xl border px-5 py-5 shadow-sm",
          isDark
            ? "border-slate-700 bg-slate-900"
            : "border-slate-200 bg-white",
        ].join(" ")}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Inventario geolocalizado
          </p>
          <h2
            className={[
              "mt-2 text-2xl font-bold sm:text-[2rem]",
              isDark ? "text-white" : "text-slate-900",
            ].join(" ")}
          >
            Mapa de propiedades
          </h2>
          <p
            className={[
              "mt-2 text-sm leading-6",
              isDark ? "text-slate-400" : "text-slate-600",
            ].join(" ")}
          >
            Visualiza en el mapa todas las propiedades y desarrollos con link de
            Google Maps registrado.
          </p>
        </div>
        {noLocationCount > 0 && !isAsesor && (
          <div
            className={[
              "self-start rounded-xl border px-4 py-2.5 text-sm",
              isDark
                ? "border-amber-700/40 bg-amber-950/30 text-amber-400"
                : "border-amber-200 bg-amber-50 text-amber-700",
            ].join(" ")}
          >
            <span className="font-semibold">{noLocationCount}</span>{" "}
            {noLocationCount === 1 ? "registro sin" : "registros sin"} link de
            ubicación
          </div>
        )}
      </header>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setShowProperties((v) => !v)}
          className={[
            "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition",
            showProperties
              ? "border-[#312C85] bg-[#312C85] text-white shadow-sm"
              : isDark
                ? "border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
          ].join(" ")}
        >
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ background: PROPERTY_COLOR }}
          />
          Propiedades ({propertyMarkers.length})
        </button>

        <button
          type="button"
          onClick={() => setShowDevelopments((v) => !v)}
          className={[
            "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition",
            showDevelopments
              ? "border-[#16A34A] bg-[#16A34A] text-white shadow-sm"
              : isDark
                ? "border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
          ].join(" ")}
        >
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ background: DEVELOPMENT_COLOR }}
          />
          Desarrollos ({developmentMarkers.length})
        </button>

        <span
          className={[
            "ml-auto text-sm",
            isDark ? "text-slate-400" : "text-slate-500",
          ].join(" ")}
        >
          {allMarkers.length} pin{allMarkers.length !== 1 ? "s" : ""} en el mapa
        </span>
      </div>

      {/* Search bar */}
      <div ref={searchRef} className="relative">
        <div
          className={[
            "flex items-center gap-2 rounded-xl border px-4 py-2.5 shadow-sm transition",
            isDark
              ? "border-slate-600 bg-slate-800"
              : "border-slate-200 bg-white",
          ].join(" ")}
        >
          {/* Search icon */}
          <svg
            className={isDark ? "text-slate-400" : "text-slate-400"}
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
              if (!e.target.value.trim()) {
                setHighlightedKey(null);
                setFlyTarget(null);
              }
            }}
            onFocus={() => { if (searchQuery.trim()) setShowSuggestions(true); }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Buscar propiedad o desarrollo…"
            className={[
              "flex-1 bg-transparent text-sm outline-none",
              isDark ? "text-white placeholder:text-slate-500" : "text-slate-800 placeholder:text-slate-400",
            ].join(" ")}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className={[
                "rounded-md p-0.5 transition hover:bg-slate-100",
                isDark ? "text-slate-400 hover:bg-slate-700" : "text-slate-400",
              ].join(" ")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            className={[
              "absolute left-0 right-0 top-full z-[1100] mt-1.5 overflow-hidden rounded-xl border shadow-lg",
              isDark
                ? "border-slate-600 bg-slate-800"
                : "border-slate-200 bg-white",
            ].join(" ")}
          >
            {suggestions.map((m, idx) => {
              const isP = m.type === "propiedad";
              const color = isP ? PROPERTY_COLOR : DEVELOPMENT_COLOR;
              const isActive = idx === activeIndex;
              return (
                <button
                  key={`${m.type}-${m.id}`}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); selectSuggestion(m); }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={[
                    "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition",
                    isActive
                      ? isDark ? "bg-slate-700" : "bg-slate-100"
                      : isDark ? "hover:bg-slate-700" : "hover:bg-slate-50",
                  ].join(" ")}
                >
                  <span
                    className="shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold"
                    style={{ background: color + "18", color }}
                  >
                    {isP ? "P" : "D"}
                  </span>
                  <span className={[
                    "min-w-0 flex-1 truncate font-medium",
                    isDark ? "text-slate-200" : "text-slate-800",
                  ].join(" ")}>
                    {m.titulo}
                  </span>
                  <span className={isDark ? "text-slate-500 text-xs" : "text-slate-400 text-xs"}>
                    {m.tipo_inmueble}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {showSuggestions && searchQuery.trim() && suggestions.length === 0 && (
          <div
            className={[
              "absolute left-0 right-0 top-full z-[1100] mt-1.5 rounded-xl border px-4 py-3 text-sm shadow-lg",
              isDark
                ? "border-slate-600 bg-slate-800 text-slate-400"
                : "border-slate-200 bg-white text-slate-500",
            ].join(" ")}
          >
            Sin resultados para "{searchQuery}"
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Map */}
      <div
        className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm"
        style={{ height: "calc(100vh - 20rem)", minHeight: "500px" }}
      >
        {(isLoading || isResolving) && (
          <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center gap-3 bg-white/80">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#312C85]" />
            {isResolving && (
              <p className="text-sm font-medium text-slate-600">
                Resolviendo ubicaciones…
              </p>
            )}
          </div>
        )}
        {/* Botón flotante para restablecer la vista */}
        {(highlightedKey || currentZoom > DEFAULT_ZOOM) && (
          <button
            type="button"
            onClick={clearSearch}
            className={[
              "absolute bottom-4 left-1/2 z-[1000] -translate-x-1/2 inline-flex items-center gap-2",
              "rounded-full border px-4 py-2 text-sm font-semibold shadow-lg transition",
              isDark
                ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            ].join(" ")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Ver todo el mapa
          </button>
        )}

        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            attribution=""
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ZoomTracker onZoomChange={setCurrentZoom} />
          <ResetMapView trigger={viewReset} />
          <FlyToMarker target={flyTarget} onArrived={handleFlyArrived} />

          {visiblePropertyMarkers.map((m) => (
            <Marker
              key={`p-${m.id}`}
              position={[m.lat, m.lng]}
              icon={propiedadIcon}
              eventHandlers={markerHandlers()}
              ref={(instance) => {
                if (instance) markerRefs.current.set(`p-${m.id}`, instance);
                else markerRefs.current.delete(`p-${m.id}`);
              }}
            >
              <Popup maxWidth={260}>
                <PopupCard marker={m} onDetail={() => navigate(`/modulos/propiedades/${m.id}`)} />
              </Popup>
            </Marker>
          ))}

          {visibleDevelopmentMarkers.map((m) => (
            <Marker
              key={`d-${m.id}`}
              position={[m.lat, m.lng]}
              icon={desarrolloIcon}
              eventHandlers={markerHandlers()}
              ref={(instance) => {
                if (instance) markerRefs.current.set(`d-${m.id}`, instance);
                else markerRefs.current.delete(`d-${m.id}`);
              }}
            >
              <Popup maxWidth={260}>
                <PopupCard marker={m} onDetail={() => navigate(`/modulos/desarrollos/${m.id}`)} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div
        className={[
          "flex flex-wrap items-center gap-6 rounded-2xl border px-5 py-3 text-xs",
          isDark
            ? "border-slate-700 bg-slate-900 text-slate-400"
            : "border-slate-200 bg-white text-slate-500",
        ].join(" ")}
      >
        <span className="font-semibold uppercase tracking-wide">Leyenda</span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: PROPERTY_COLOR }} />
          Propiedad individual
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: DEVELOPMENT_COLOR }} />
          Desarrollo inmobiliario
        </span>
      </div>

      {/* Sin ubicación — oculto para Asesor de Ventas */}
      {sinUbicacion.length > 0 && !isResolving && !isAsesor && (
        <div
          className={[
            "rounded-2xl border px-5 py-4",
            isDark
              ? "border-slate-700 bg-slate-900"
              : "border-slate-200 bg-white",
          ].join(" ")}
        >
          <p
            className={[
              "mb-3 text-sm font-semibold",
              isDark ? "text-slate-300" : "text-slate-700",
            ].join(" ")}
          >
            Sin ubicación en el mapa ({sinUbicacion.length})
          </p>
          <div className="flex flex-col gap-2">
            {sinUbicacion.map((item) => (
              <div
                key={`${item.tipo}-${item.id}`}
                className={[
                  "flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-sm",
                  isDark
                    ? "border-slate-700/60 bg-slate-800/50"
                    : "border-slate-100 bg-slate-50",
                ].join(" ")}
              >
                <span
                  className={[
                    "shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold",
                    item.tipo === "Propiedad"
                      ? "bg-[#312C85]/10 text-[#312C85]"
                      : "bg-[#16A34A]/10 text-[#16A34A]",
                  ].join(" ")}
                >
                  {item.tipo}
                </span>
                <span
                  className={[
                    "min-w-0 flex-1 truncate font-medium",
                    isDark ? "text-slate-200" : "text-slate-800",
                  ].join(" ")}
                >
                  {item.titulo}
                </span>
                {item.link ? (
                  <span
                    className={[
                      "hidden truncate text-xs sm:block max-w-[240px]",
                      isDark ? "text-slate-500" : "text-slate-400",
                    ].join(" ")}
                    title={item.link}
                  >
                    {item.link}
                  </span>
                ) : (
                  <span className="text-xs text-amber-500">Sin link</span>
                )}
                <button
                  type="button"
                  onClick={() => navigate(item.editUrl)}
                  className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Editar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Popup card component ---
function PopupCard({
  marker,
  onDetail,
}: {
  marker: MapMarker;
  onDetail: () => void;
}) {
  const statusColor = STATUS_COLORS[marker.estatus] ?? "#64748B";
  const accentColor = marker.type === "propiedad" ? PROPERTY_COLOR : DEVELOPMENT_COLOR;

  return (
    <div style={{ minWidth: 220, maxWidth: 260, fontFamily: "inherit" }}>
      {/* Image */}
      {marker.imageUrl && (
        <img
          src={marker.imageUrl}
          alt={marker.titulo}
          style={{
            width: "100%",
            height: 120,
            objectFit: "cover",
            borderRadius: 8,
            marginBottom: 10,
            display: "block",
          }}
        />
      )}

      {/* Type + Status badges */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        <span
          style={{
            background: accentColor + "18",
            color: accentColor,
            border: `1px solid ${accentColor}40`,
            borderRadius: 6,
            padding: "2px 8px",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {marker.tipo_inmueble}
        </span>
        <span
          style={{
            background: statusColor + "18",
            color: statusColor,
            border: `1px solid ${statusColor}40`,
            borderRadius: 6,
            padding: "2px 8px",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {marker.estatus}
        </span>
      </div>

      {/* Title */}
      <p
        style={{
          fontWeight: 700,
          fontSize: 14,
          color: "#0f172a",
          margin: "0 0 4px",
          lineHeight: 1.3,
        }}
      >
        {marker.titulo}
      </p>

      {/* Operation */}
      <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 2px" }}>
        {marker.operacion}
      </p>

      {/* Price */}
      <p
        style={{
          fontWeight: 700,
          fontSize: 13,
          color: accentColor,
          margin: "0 0 12px",
        }}
      >
        {marker.precio}
      </p>

      {/* Detail button */}
      <button
        type="button"
        onClick={onDetail}
        style={{
          width: "100%",
          background: accentColor,
          color: "white",
          border: "none",
          borderRadius: 8,
          padding: "7px 0",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Ver detalle →
      </button>
    </div>
  );
}
