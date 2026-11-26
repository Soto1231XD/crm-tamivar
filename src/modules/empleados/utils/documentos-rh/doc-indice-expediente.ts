import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType,
  FONT, MESES_ES, descargar,
} from "./_shared";
import { BorderStyle } from "docx";
import type { Empleado } from "../../services/empleados.api";

const SZ     = 22;
const SZ_H   = 24;
const LN     = 276;
const TOTAL   = 9360; // 6.5" contenido (8.5" − 2×1" márgenes)
const COL_DOC = 7560;
const COL_CHK = TOTAL - COL_DOC; // 1800

const solidB  = { style: BorderStyle.SINGLE, size: 6,  color: "1F3864" };
const thinB   = { style: BorderStyle.SINGLE, size: 4,  color: "BBBBBB" };
const noB     = { style: BorderStyle.NONE,   size: 0,  color: "auto"   };

const DOCUMENTOS: string[] = [
  "INE",
  "CURP",
  "RFC",
  "Acta de nacimiento",
  "Comprobante de domicilio",
  "Número de Seguro Social",
  "Fotografía para expediente",
  "Solicitud de empleo",
  "Curriculum Vitae (CV)",
  "Acuse de recibo del Reglamento Interior de Trabajo",
  "Formato firmado de Uso de Imagen",
  "Responsiva firmada por equipo de Teléfono",
  "Responsiva por uso de Vehículo",
  "Responsiva por uso de Computadora",
  "Responsiva por uso de Tarjeta",
  "Art. 81 LFT – Constancia anual de antigüedad y vacaciones",
  "Constancia de uso anticipado de vacaciones",
  "Constancia de permiso de falta sin goce de sueldo",
  "Constancia de permiso de falta con goce de sueldo y recuperación de horas laborales",
  "Número de cuenta bancaria",
  "Cartas de Recomendación (2)",
  "Pruebas Psicométricas",
  "Perfil y descripción del puesto",
  "Acuse de recibo electrónico",
  "Contrato individual de trabajo",
  "Anexos – Documentación complementaria del trabajador",
];

function hdrCell(text: string, w: number, center = false): TableCell {
  const hdrShading = { type: ShadingType.CLEAR, fill: "1F3864", color: "auto" };
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    shading: hdrShading,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    borders: { top: solidB, bottom: solidB, left: solidB, right: solidB },
    children: [
      new Paragraph({
        alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { line: LN, lineRule: "auto", before: 0, after: 0 },
        children: [new TextRun({ text, font: FONT, size: SZ_H, bold: true, color: "FFFFFF" })],
      }),
    ],
  });
}

function headerRow(): TableRow {
  return new TableRow({ children: [hdrCell("DOCUMENTO", COL_DOC), hdrCell("ENTREGADO", COL_CHK, true)] });
}

function docRow(text: string, shade: boolean): TableRow {
  const fill = shade ? "EEF2F9" : "FFFFFF";
  const shading = { type: ShadingType.CLEAR, fill, color: "auto" };
  const rowB = { top: thinB, bottom: thinB, left: solidB, right: solidB };
  return new TableRow({
    children: [
      new TableCell({
        width: { size: COL_DOC, type: WidthType.DXA },
        shading,
        margins: { top: 90, bottom: 90, left: 140, right: 140 },
        borders: rowB,
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { line: LN, lineRule: "auto", before: 0, after: 0 },
            children: [new TextRun({ text, font: FONT, size: SZ })],
          }),
        ],
      }),
      new TableCell({
        width: { size: COL_CHK, type: WidthType.DXA },
        shading,
        margins: { top: 90, bottom: 90, left: 100, right: 100 },
        borders: rowB,
        children: [
          new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [],
          }),
        ],
      }),
    ],
  });
}

export function generarIndiceExpediente(empleado: Empleado): void {
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno ?? ""}`.trim().toUpperCase();
  const hoy = new Date();
  const fecha = `${hoy.getDate()} de ${MESES_ES[hoy.getMonth()]} de ${hoy.getFullYear()}`;

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: SZ } } } },
    sections: [{
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
      },
      children: [

        // Título principal
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: LN, lineRule: "auto", before: 0, after: 80 },
          children: [
            new TextRun({
              text: "EXPEDIENTE DEL TRABAJADOR",
              font: FONT, size: 32, bold: true, color: "1F3864",
            }),
          ],
        }),

        // Empresa
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: LN, lineRule: "auto", before: 0, after: 60 },
          children: [
            new TextRun({ text: "SOLUCIONES TAMIVAR, S.A. DE C.V.", font: FONT, size: SZ_H, bold: true }),
          ],
        }),

        // Separador
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F3864" } },
          children: [],
        }),

        // Nombre del trabajador
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { line: LN, lineRule: "auto", before: 0, after: 80 },
          children: [
            new TextRun({ text: "Trabajador: ", font: FONT, size: SZ_H, bold: true }),
            new TextRun({ text: nombre, font: FONT, size: SZ_H }),
          ],
        }),

        // Fecha
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { line: LN, lineRule: "auto", before: 0, after: 240 },
          children: [
            new TextRun({ text: "Fecha de elaboración: ", font: FONT, size: SZ, bold: true }),
            new TextRun({ text: fecha, font: FONT, size: SZ }),
          ],
        }),

        // Tabla de documentos
        new Table({
          width: { size: TOTAL, type: WidthType.DXA },
          columnWidths: [COL_DOC, COL_CHK],
          borders: { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB },
          rows: [
            headerRow(),
            ...DOCUMENTOS.map((doc, i) => docRow(doc, i % 2 === 0)),
          ],
        }),

        // Nota al pie
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { line: LN, lineRule: "auto", before: 300, after: 0 },
          children: [
            new TextRun({
              text: "* Marcar con ✔ una vez que el documento haya sido recibido y verificado.",
              font: FONT, size: 18, italics: true, color: "666666",
            }),
          ],
        }),

      ],
    }],
  });

  descargar(doc, `Indice_Expediente_${nombre.replace(/\s+/g, "_")}.docx`);
}
