import { downloadTableAsExcel } from "@/components/ui/excelExport";
import type { OperacionFiniquitada } from "@/interfaces/operaciones.interface";

const fmtDate = (s: string | null): string => {
  if (!s) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(s));
};

export function downloadFiniquitadasAsExcel(finiquitadas: OperacionFiniquitada[]) {
  const headers = [
    "Folio",
    "Propietario",
    "Cliente",
    "Propiedad",
    "Fecha de firma",
    "Monto de operación ($)",
    "Estatus de pago",
    "Fecha de registro",
  ];

  const rows = finiquitadas.map((f) => [
    f.folio?.trim() || "Sin folio",
    f.propietario?.trim() || "—",
    f.cliente?.trim() || "—",
    f.propiedad?.trim() || "—",
    fmtDate(f.fecha_firma),
    f.monto_operacion != null ? Number(f.monto_operacion) : "—",
    f.estatus_pago?.trim() || "—",
    fmtDate(f.creado_en),
  ]);

  downloadTableAsExcel({
    title: "Operaciones Finiquitadas",
    sheetName: "Finiquitadas",
    fileName: "operaciones-finiquitadas.xlsx",
    headers,
    rows,
  });
}
