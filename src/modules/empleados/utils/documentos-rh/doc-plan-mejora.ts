import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle,
} from "docx";
import type { Empleado } from "../../services/empleados.api";
import type { ActaAdministrativa } from "../../services/actas-administrativas.api";
import { MESES_UP } from "./_shared";

export interface PIPData {
  objetivo: string;
  duracion: string;
  fechaFin: string;
  areas: string[];
  metas: { meta: string; indicador: string }[];
  seguimiento: string;
}

const FONT = "Times New Roman";
const SZ   = 22;
const noB  = { style: BorderStyle.NONE, size: 0, color: "auto" };
const thinB = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const headerB = { style: BorderStyle.SINGLE, size: 6, color: "000000" };

const r = (text: string, bold = false) =>
  new TextRun({ text, font: FONT, size: SZ, bold });

function fechaCorta(iso: string) {
  const d = new Date(iso.slice(0, 10) + "T12:00:00");
  return `${d.getDate()} de ${MESES_UP[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
}

// Celda de la tabla de info (cabecera con fondo azul o valor)
function infoHeaderCell(text: string, width: number) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { fill: "1E3A5F", type: ShadingType.CLEAR },
    borders: { top: headerB, bottom: headerB, left: headerB, right: headerB },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 60 },
        children: [new TextRun({ text, font: FONT, size: SZ, bold: true, color: "FFFFFF" })],
      }),
    ],
  });
}

function infoValueCell(text: string, width: number, span?: number) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    ...(span ? { columnSpan: span } : {}),
    borders: { top: headerB, bottom: headerB, left: headerB, right: headerB },
    shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 60, after: 60 },
        children: [r(text)],
      }),
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

export async function generarPlanMejora(
  empleado: Empleado,
  acta: ActaAdministrativa,
  opts?: { onlyBlob?: boolean },
): Promise<Blob> {
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno ?? ""}`.trim().toUpperCase();
  const puesto = (empleado.puesto ?? "").toUpperCase();
  const area   = (empleado.area ?? "").toUpperCase();

  // Parsear PIPData desde el campo hechos
  let pip: PIPData = {
    objetivo: "",
    duracion: "",
    fechaFin: "",
    areas: [],
    metas: [],
    seguimiento: "",
  };
  try {
    pip = JSON.parse(acta.hechos ?? "{}") as PIPData;
  } catch { /* usa valores vacíos */ }

  const fechaInicio = fechaCorta(acta.fecha_acta);
  const fechaFinStr = pip.fechaFin ? fechaCorta(pip.fechaFin) : "_______________";

  // Tabla de información del colaborador
  const infoTable = new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2340, 7020],
    borders: { top: headerB, bottom: headerB, left: headerB, right: headerB, insideHorizontal: headerB, insideVertical: headerB },
    rows: [
      // Fila título
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            width: { size: 9360, type: WidthType.DXA },
            shading: { fill: "1E3A5F", type: ShadingType.CLEAR },
            borders: { top: headerB, bottom: headerB, left: headerB, right: headerB },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80, after: 80 },
                children: [new TextRun({ text: "PLAN DE MEJORA DE DESEMPEÑO (PIP)", font: FONT, size: 24, bold: true, color: "FFFFFF" })],
              }),
            ],
          }),
        ],
      }),
      // Colaborador
      new TableRow({
        children: [
          infoHeaderCell("Colaborador:", 2340),
          infoValueCell(nombre, 7020),
        ],
      }),
      // Puesto / Área
      new TableRow({
        children: [
          infoHeaderCell("Puesto:", 2340),
          infoValueCell(puesto, 3510),
          infoHeaderCell("Área:", 1170),
          infoValueCell(area, 2340),
        ],
      }),
      // Fecha inicio / Duración
      new TableRow({
        children: [
          infoHeaderCell("Fecha de inicio:", 2340),
          infoValueCell(fechaInicio, 3510),
          infoHeaderCell("Duración:", 1170),
          infoValueCell(pip.duracion || "___", 2340),
        ],
      }),
      // Fecha fin
      new TableRow({
        children: [
          infoHeaderCell("Fecha estimada de cierre:", 2340),
          infoValueCell(fechaFinStr, 7020),
        ],
      }),
      // Objetivo
      new TableRow({
        children: [
          infoHeaderCell("Objetivo del plan:", 2340),
          infoValueCell(pip.objetivo || "_______________", 7020),
        ],
      }),
    ],
  });

  // Áreas de mejora
  const areasParagraphs: Paragraph[] = pip.areas.length > 0
    ? pip.areas.map((a) =>
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 80 },
          bullet: { level: 0 },
          children: [r(a)],
        }),
      )
    : [new Paragraph({ spacing: { after: 80 }, children: [r("_______________")] })];

  // Metas / Compromisos
  const metasParagraphs: Paragraph[] = pip.metas.length > 0
    ? pip.metas.map((m, i) =>
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100 },
          children: [
            r(`${i + 1}. `, true),
            r(m.meta),
            r(" (Indicador: ", false),
            r(m.indicador, true),
            r(")"),
          ],
        }),
      )
    : [new Paragraph({ spacing: { after: 80 }, children: [r("_______________")] })];

  // Firma
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
          sigCell("JENNY NOHEMI RIVERA TORRES", "RECURSOS HUMANOS"),
        ],
      }),
    ],
  });

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: SZ } } } },
    sections: [{
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1440, right: 1440 } } },
      children: [
        infoTable,

        new Paragraph({ spacing: { after: 160 }, children: [] }),

        new Paragraph({
          spacing: { before: 120, after: 120 },
          children: [r("Áreas de mejora identificadas:", true)],
        }),
        ...areasParagraphs,

        new Paragraph({ spacing: { after: 120 }, children: [] }),

        new Paragraph({
          spacing: { before: 120, after: 120 },
          children: [r("Metas y compromisos:", true)],
        }),
        ...metasParagraphs,

        new Paragraph({ spacing: { after: 120 }, children: [] }),

        new Paragraph({
          spacing: { before: 120, after: 80 },
          children: [r("Seguimiento:", true)],
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 },
          children: [r(pip.seguimiento || "_______________")],
        }),

        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 480 },
          children: [
            r("Acepto el presente Plan de Mejora y me comprometo a cumplir con las metas establecidas en el plazo indicado."),
          ],
        }),

        firmasTable,
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  if (!opts?.onlyBlob) {
    const url = URL.createObjectURL(blob);
    const a   = Object.assign(document.createElement("a"), {
      href: url,
      download: `Plan_Mejora_${nombre.replace(/\s+/g, "_")}.docx`,
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  return blob;
}
