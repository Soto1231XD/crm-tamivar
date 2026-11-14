import * as XLSX from "xlsx";
import type { EventoRH } from "../services/eventos.api";

function fmtDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
}

function totalGastos(e: EventoRH) {
  return e.gastos.reduce((s, g) => s + parseFloat(g.monto), 0);
}

function nombreParticipante(p: EventoRH["participantes"][number]) {
  if (p.empleado) return `${p.empleado.nombre} ${p.empleado.apellido_paterno} ${p.empleado.apellido_materno}`.trim();
  return p.nombre_externo ?? "—";
}

export function exportarReporteEventos(eventos: EventoRH[], desde: string, hasta: string) {
  const wb = XLSX.utils.book_new();

  // ── Hoja 1: Resumen de eventos ──
  const resumenRows = [
    ["Evento", "Fecha", "Participantes", "Total gastado", "Descripción"],
    ...eventos.map((e) => [
      e.nombre,
      fmtDate(e.fecha),
      e.participantes.length,
      totalGastos(e),
      e.descripcion ?? "",
    ]),
    [],
    ["", "", "", "TOTAL GENERAL", eventos.reduce((s, e) => s + totalGastos(e), 0)],
  ];
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenRows);
  wsResumen["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

  // ── Hoja 2: Detalle de gastos ──
  const gastosRows = [
    ["Evento", "Fecha", "Concepto", "Monto"],
    ...eventos.flatMap((e) =>
      e.gastos.map((g) => [e.nombre, fmtDate(e.fecha), g.concepto, parseFloat(g.monto)])
    ),
  ];
  const wsGastos = XLSX.utils.aoa_to_sheet(gastosRows);
  wsGastos["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 35 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsGastos, "Gastos");

  // ── Hoja 3: Participantes ──
  const partRows = [
    ["Evento", "Fecha", "Participante", "Tipo", "Puesto"],
    ...eventos.flatMap((e) =>
      e.participantes.map((p) => [
        e.nombre,
        fmtDate(e.fecha),
        nombreParticipante(p),
        p.empleado ? "Interno" : "Externo",
        p.empleado?.puesto ?? "—",
      ])
    ),
  ];
  const wsPart = XLSX.utils.aoa_to_sheet(partRows);
  wsPart["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 35 }, { wch: 12 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsPart, "Participantes");

  const filename = `Reporte_Eventos_${desde}_${hasta}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export function exportarEventoDetalle(evento: EventoRH) {
  const wb = XLSX.utils.book_new();
  const fecha = fmtDate(evento.fecha);

  // ── Hoja 1: Gastos ──
  const total = evento.gastos.reduce((s, g) => s + parseFloat(g.monto), 0);
  const gastosRows = [
    [`Evento: ${evento.nombre}`],
    [`Fecha: ${fecha}`],
    ...(evento.descripcion ? [[`Descripción: ${evento.descripcion}`]] : []),
    [],
    ["Concepto", "Monto"],
    ...evento.gastos.map((g) => [g.concepto, parseFloat(g.monto)]),
    [],
    ["TOTAL", total],
  ];
  const wsGastos = XLSX.utils.aoa_to_sheet(gastosRows);
  wsGastos["!cols"] = [{ wch: 40 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsGastos, "Gastos");

  // ── Hoja 2: Participantes ──
  const partRows = [
    [`Evento: ${evento.nombre}`],
    [`Fecha: ${fecha}`],
    [],
    ["Participante", "Tipo", "Puesto"],
    ...evento.participantes.map((p) => [
      nombreParticipante(p),
      p.empleado ? "Interno" : "Externo",
      p.empleado?.puesto ?? "—",
    ]),
  ];
  const wsPart = XLSX.utils.aoa_to_sheet(partRows);
  wsPart["!cols"] = [{ wch: 35 }, { wch: 12 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsPart, "Participantes");

  const safeName = evento.nombre.replace(/[/\\?%*:|"<>]/g, "-");
  XLSX.writeFile(wb, `Evento_${safeName}_${evento.fecha.slice(0, 10)}.xlsx`);
}
