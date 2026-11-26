import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType,
} from "docx";
import { BorderStyle } from "docx";
import type { Empleado } from "../../services/empleados.api";
import type { Baja } from "../../services/bajas.api";
import { MESES_UP } from "./_shared";

export interface FiniquitoData {
  sueldoMensual: string;
  percepciones: { concepto: string; importe: string }[];
  descuentos: { concepto: string; importe: string }[];
  nota: string;
}

const FONT = "Times New Roman";
const SZ   = 22;
const noB  = { style: BorderStyle.NONE, size: 0, color: "auto" };
const thinB = { style: BorderStyle.SINGLE, size: 4, color: "000000" };

const r = (text: string, bold = false) =>
  new TextRun({ text, font: FONT, size: SZ, bold });

const cp = (children: TextRun[], after = 80) =>
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after }, children });

const lp = (children: TextRun[], after = 80) =>
  new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after }, children });

const jp = (children: TextRun[], after = 120) =>
  new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after }, children });

function parseMonto(val: string): number {
  return parseFloat(val.replace(/,/g, "").replace(/\$/g, "")) || 0;
}

function fmtMonto(n: number): string {
  return `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function sumarImportes(rows: { importe: string }[]): number {
  return rows.reduce((acc, row) => acc + parseMonto(row.importe), 0);
}

function fechaCorta(d: Date) {
  return `${d.getDate()} de ${MESES_UP[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
}

// ── Helpers de celdas ──────────────────────────────────────────────────────

function dataCell(text: string, widthDXA: number, bold = false, align: string = AlignmentType.LEFT, fill = "FFFFFF") {
  return new TableCell({
    width: { size: widthDXA, type: WidthType.DXA },
    borders: { top: thinB, bottom: thinB, left: thinB, right: thinB },
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ alignment: align, spacing: { after: 0 }, children: [r(text, bold)] })],
  });
}

function headerRow(titulo: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: 2,
        width: { size: 9360, type: WidthType.DXA },
        borders: { top: thinB, bottom: thinB, left: thinB, right: thinB },
        shading: { fill: "D1D5DB", type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [cp([r(titulo, true)], 0)],
      }),
    ],
  });
}

function montoRow(concepto: string, importe: string, bold = false): TableRow {
  return new TableRow({
    children: [
      dataCell(concepto, 7000, bold),
      dataCell(fmtMonto(parseMonto(importe)), 2360, bold, AlignmentType.RIGHT),
    ],
  });
}

function totalRow(total: number): TableRow {
  return new TableRow({
    children: [
      dataCell("TOTAL", 7000, true, AlignmentType.LEFT, "F3F4F6"),
      dataCell(fmtMonto(total), 2360, true, AlignmentType.RIGHT, "F3F4F6"),
    ],
  });
}

function sigCell(nombre: string, puesto: string) {
  return new TableCell({
    width: { size: 4680, type: WidthType.DXA },
    borders: { top: noB, bottom: noB, left: noB, right: noB },
    shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 1200, after: 80 },
        border: { bottom: thinB },
        children: [r(" ")],
      }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [r(nombre, true)] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [r(puesto, true)] }),
    ],
  });
}

// ── Generador principal ────────────────────────────────────────────────────

export async function generarFiniquito(
  empleado: Empleado,
  baja: Baja,
  data: FiniquitoData,
): Promise<void> {
  const nombre     = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno ?? ""}`.trim().toUpperCase();
  const puesto     = (empleado.puesto ?? "").toUpperCase();
  const fIngreso   = new Date(empleado.fecha_ingreso.slice(0, 10) + "T12:00:00");
  const fBaja      = new Date(baja.fecha_baja.slice(0, 10) + "T12:00:00");

  const tipoLabel  = baja.tipo.toUpperCase();
  const totalPerc  = sumarImportes(data.percepciones);
  const totalDesc  = sumarImportes(data.descuentos);
  const neto       = totalPerc - totalDesc;

  // ── Tabla de datos del colaborador ──────────────────────────────────────
  const infoTable = new Table({
    width: { size: 9360, type: WidthType.DXA },
    borders: { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB },
    rows: [
      // Fila 1: Colaborador (full)
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            width: { size: 9360, type: WidthType.DXA },
            borders: { top: thinB, bottom: thinB, left: thinB, right: thinB },
            shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [lp([r("Colaborador: ", true), r(nombre)], 0)],
          }),
        ],
      }),
      // Fila 2: Puesto | Fecha Ingreso
      new TableRow({
        children: [
          dataCell(`Puesto: ${puesto}`, 4680),
          dataCell(`Fecha de Ingreso: ${fechaCorta(fIngreso)}`, 4680),
        ],
      }),
      // Fila 3: Fecha Baja | Tipo
      new TableRow({
        children: [
          dataCell(`Fecha de Baja: ${fechaCorta(fBaja)}`, 4680),
          dataCell(`Tipo de Baja: ${baja.tipo}`, 4680),
        ],
      }),
      // Fila 4: Sueldo mensual (full)
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            width: { size: 9360, type: WidthType.DXA },
            borders: { top: thinB, bottom: thinB, left: thinB, right: thinB },
            shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [lp([r("Sueldo Mensual: ", true), r(fmtMonto(parseMonto(data.sueldoMensual)))], 0)],
          }),
        ],
      }),
    ],
  });

  // ── Tabla de percepciones ────────────────────────────────────────────────
  const percTable = new Table({
    width: { size: 9360, type: WidthType.DXA },
    borders: { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB },
    rows: [
      headerRow("PERCEPCIONES"),
      ...data.percepciones.map((row) => montoRow(row.concepto, row.importe)),
      totalRow(totalPerc),
    ],
  });

  // ── Tabla de descuentos ──────────────────────────────────────────────────
  const descRows = data.descuentos.length > 0
    ? data.descuentos.map((row) => montoRow(row.concepto, row.importe))
    : [montoRow("—", "0")];

  const descTable = new Table({
    width: { size: 9360, type: WidthType.DXA },
    borders: { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB },
    rows: [
      headerRow("DESCUENTOS"),
      ...descRows,
      totalRow(totalDesc),
    ],
  });

  // ── Tabla resumen ────────────────────────────────────────────────────────
  const resumenTable = new Table({
    width: { size: 9360, type: WidthType.DXA },
    borders: { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB },
    rows: [
      new TableRow({
        children: [
          dataCell("Total Percepciones", 7000),
          dataCell(fmtMonto(totalPerc), 2360, false, AlignmentType.RIGHT),
        ],
      }),
      new TableRow({
        children: [
          dataCell("Total Descuentos", 7000),
          dataCell(fmtMonto(totalDesc), 2360, false, AlignmentType.RIGHT),
        ],
      }),
      new TableRow({
        children: [
          dataCell("NETO A PAGAR", 7000, true, AlignmentType.LEFT, "D1FAE5"),
          dataCell(fmtMonto(neto), 2360, true, AlignmentType.RIGHT, "D1FAE5"),
        ],
      }),
    ],
  });

  // ── Tabla de firmas ──────────────────────────────────────────────────────
  const spacerCell = new TableCell({
    width: { size: 460, type: WidthType.DXA },
    borders: { top: noB, bottom: noB, left: noB, right: noB },
    shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
    children: [new Paragraph({ children: [] })],
  });

  const firmasTable = new Table({
    width: { size: 9360, type: WidthType.DXA },
    borders: { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB },
    rows: [
      new TableRow({
        children: [
          sigCell(nombre, puesto || "COLABORADOR"),
          spacerCell,
          sigCell("JENNY NOHEMI RIVERA TORRES", "AUXILIAR DE RECURSOS HUMANOS"),
        ],
      }),
    ],
  });

  const doc = new Document({
    styles: {
      default: { document: { run: { font: FONT, size: SZ } } },
    },
    sections: [{
      properties: {
        page: { margin: { top: 1080, bottom: 1080, left: 1440, right: 1440 } },
      },
      children: [
        // Título
        cp([r("FINIQUITO", true)], 40),
        cp([r(`POR ${tipoLabel}`, true)], 240),

        // Datos del colaborador
        infoTable,

        new Paragraph({ spacing: { after: 160 }, children: [] }),

        // Percepciones
        percTable,

        new Paragraph({ spacing: { after: 160 }, children: [] }),

        // Descuentos
        descTable,

        new Paragraph({ spacing: { after: 160 }, children: [] }),

        // Resumen
        resumenTable,

        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // Nota de cálculo (si hay)
        ...(data.nota.trim()
          ? [
              lp([r("Nota de Cálculo:", true)], 60),
              ...data.nota.trim().split("\n").map((line) => jp([r(line)], 80)),
              new Paragraph({ spacing: { after: 160 }, children: [] }),
            ]
          : []),

        // Manifestación
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [r("MANIFESTACIÓN", true)],
        }),
        jp([
          r(`El colaborador `),
          r(nombre, true),
          r(` manifiesta recibir de la empresa `),
          r("SOLUCIONES TAMIVAR, S.A. DE C.V.", true),
          r(`, la cantidad de `),
          r(fmtMonto(neto), true),
          r(` M.N., por concepto de finiquito derivado de la terminación de la relación laboral con fecha `),
          r(fechaCorta(fBaja), true),
          r(`. Con la firma del presente documento el colaborador da por liquidada en su totalidad cualquier obligación o reclamación de tipo laboral que pudiera tener en contra de la empresa, declarando no tener cargo ni reclamación alguna que formular contra la misma derivada de la relación de trabajo que los unió.`),
        ], 480),

        // Firmas
        firmasTable,
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), {
    href: url,
    download: `Finiquito_${nombre.replace(/\s+/g, "_")}.docx`,
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
