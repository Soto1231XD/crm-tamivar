import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, HeightRule,
} from "docx";
import { BorderStyle } from "docx";
import type { Empleado } from "../../services/empleados.api";
import type { ActaAdministrativa } from "../../services/actas-administrativas.api";
import { MESES_UP } from "./_shared";

const FONT  = "Times New Roman";
const SZ    = 22;
const noB   = { style: BorderStyle.NONE, size: 0, color: "auto" };
const thinB = { style: BorderStyle.SINGLE, size: 4, color: "000000" };

const ORDINALES = [
  "PRIMERO", "SEGUNDO", "TERCERO", "CUARTO", "QUINTO",
  "SEXTO", "SÉPTIMO", "OCTAVO", "NOVENO", "DÉCIMO",
];

const r = (text: string, bold = false) =>
  new TextRun({ text, font: FONT, size: SZ, bold });

const jP = (children: TextRun[], after = 120) =>
  new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after }, children });

function fechaDia(d: Date) {
  return `${d.getDate()} del mes de ${MESES_UP[d.getMonth()].toLowerCase()} del año ${d.getFullYear()}`;
}

function sigCell(top: string, sub1: string, sub2?: string) {
  return new TableCell({
    width: { size: 4700, type: WidthType.DXA },
    borders: { top: noB, bottom: noB, left: noB, right: noB },
    shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 1200, after: 80 },
        border: { bottom: thinB },
        children: [r(top)],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: sub2 ? 40 : 0 },
        children: [r(sub1, true)],
      }),
      ...(sub2
        ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [r(sub2, true)] })]
        : []),
    ],
  });
}

export async function generarActaHechos(
  empleado: Empleado,
  acta: ActaAdministrativa,
  opts?: { onlyBlob?: boolean },
): Promise<Blob> {
  const nombre    = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno ?? ""}`.trim().toUpperCase();
  const puesto    = (empleado.puesto ?? "").toUpperCase();
  const fechaActa = new Date(acta.fecha_acta.slice(0, 10) + "T12:00:00");

  let puntos: string[] = [];
  try {
    puntos = JSON.parse(acta.hechos ?? "[]") as string[];
  } catch { puntos = []; }

  // Párrafos de hechos numerados
  const hechosParrafos: Paragraph[] = puntos.flatMap((texto, i) => {
    const ordinal = ORDINALES[i] ?? `${i + 1}`;
    const lineas  = texto.trim().split("\n");
    return [
      new Paragraph({
        spacing: { before: 160, after: 60 },
        children: [r(`${ordinal}.`, true)],
      }),
      ...lineas.map((l) => jP([r(l)], 80)),
    ];
  });

  // Tabla de firmas (2 en fila 1 + Henry centrado en fila 2)
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
      // Fila 1: Empleado | spacer | Jenny (Testigo)
      new TableRow({
        children: [
          sigCell(" ", nombre, puesto || undefined),
          spacerCell,
          sigCell(
            " ",
            "JENNY NOHEMI RIVERA TORRES",
            "AUXILIAR DE RECURSOS HUMANOS / TESTIGO",
          ),
        ],
      }),
      // Fila espaciadora
      new TableRow({
        height: { value: 400, rule: HeightRule.EXACT },
        children: [
          new TableCell({
            columnSpan: 3,
            borders: { top: noB, bottom: noB, left: noB, right: noB },
            shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [] })],
          }),
        ],
      }),
      // Fila 2: Henry centrado
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 3,
            borders: { top: noB, bottom: noB, left: noB, right: noB },
            shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 1200, after: 80 },
                border: { bottom: thinB },
                children: [r(" ")],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0 },
                children: [r("HENRY FERNANDO TAMAY SANCHEZ", true)],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0 },
                children: [r("GERENTE DE OPERACIONES", true)],
              }),
            ],
          }),
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
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
          children: [r("ACTA DE HECHOS", true)],
        }),

        // Párrafo de apertura con los 3 participantes
        jP([
          r(`En la Ciudad de Cancún, Municipio de Benito Juárez, Estado de Quintana Roo, siendo las `),
          r(acta.hora_inicio, true),
          r(` horas del día `),
          r(fechaDia(fechaActa), true),
          r(`, en las instalaciones del centro de trabajo de la empresa `),
          r("SOLUCIONES TAMIVAR, S.A. DE C.V.", true),
          r(`, ubicadas en Calle Pustunich, Lote 20, Manzana 52, Región 97, en esta ciudad de Cancún, Benito Juárez, Quintana Roo, se encuentran reunidos para el levantamiento de la presente Acta de Hechos los C. `),
          r(nombre, true),
          r(`, Jenny Rivera y Henry Fernando Tamay Sánchez, en su calidad de `),
          r(puesto || "COLABORADOR", true),
          r(`, Auxiliar de Recursos Humanos y Gerente de Operaciones, respectivamente, para efecto de hacer constar los siguientes:`),
        ], 200),

        // Encabezado HECHOS
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 160 },
          children: [r("HECHOS", true)],
        }),

        // Puntos numerados
        ...hechosParrafos,

        // Cierre
        jP([
          r("No habiendo más hechos que hacer constar, se da por concluida la presente "),
          r("ACTA DE HECHOS", true),
          r(", siendo las "),
          r(acta.hora_cierre, true),
          r(` horas del día `),
          r(fechaDia(fechaActa), true),
          r(", firmando al calce quienes en ella intervinieron para la debida constancia."),
        ], 480),

        // Firmas
        firmasTable,
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  if (!opts?.onlyBlob) {
    const url = URL.createObjectURL(blob);
    const a   = Object.assign(document.createElement("a"), {
      href: url,
      download: `Acta_de_Hechos_${nombre.replace(/\s+/g, "_")}.docx`,
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  return blob;
}
