export const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

export function fullName(u: { nombres: string; apellido_paterno: string; apellido_materno?: string }) {
  return `${u.nombres} ${u.apellido_paterno}`;
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
export const META_PUBLICACIONES = 30;
export const MIN_VISITAS = 2;
export const MAX_VISITAS = 10;
