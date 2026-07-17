import { downloadTableAsExcel } from "@/components/ui/excelExport";
import type { ClienteCartera } from "../services/cartera-clientes.api";

const MESES: Record<number, string> = {
  1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
  5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
  9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre",
};

function formatCumple(dia: number | null, mes: number | null): string {
  if (!dia && !mes) return "Sin fecha";
  if (!mes) return `Día ${dia}`;
  if (!dia) return MESES[mes] ?? "Sin fecha";
  return `${dia} de ${MESES[mes]}`;
}

export function downloadCarteraAsExcel(clientes: ClienteCartera[]) {
  const headers = [
    "Nombre",
    "Tipo",
    "Teléfono",
    "Cumpleaños",
    "Propiedad",
    "Ubicación",
    "Referencia",
    "Tel. Referencia",
    "SMS Post venta",
    "Fecha de registro",
  ];

  const rows = clientes.map((c) => [
    c.nombre?.trim() || "Sin nombre",
    c.tipo?.trim() || "Sin tipo",
    c.telefono?.trim() || "Sin teléfono",
    formatCumple(c.cumple_dia, c.cumple_mes),
    c.propiedad?.trim() || "Sin propiedad",
    c.ubicacion?.trim() || "Sin ubicación",
    c.referencia?.trim() || "Sin referencia",
    c.telefono_referencia?.trim() || "Sin teléfono",
    c.sms_post_venta?.trim() || "Sin mensaje",
    c.creado_en
      ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(c.creado_en))
      : "Sin fecha",
  ]);

  downloadTableAsExcel({
    title: "Cartera de Clientes",
    sheetName: "Cartera",
    fileName: "cartera-clientes.xlsx",
    headers,
    rows,
  });
}
