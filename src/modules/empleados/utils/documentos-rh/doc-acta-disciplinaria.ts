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

const r = (text: string, bold = false) =>
  new TextRun({ text, font: FONT, size: SZ, bold });

const jP = (children: TextRun[], after = 120) =>
  new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after }, children });

const lineRow = () =>
  new TableRow({
    height: { value: 440, rule: HeightRule.EXACT },
    children: [
      new TableCell({
        width: { size: 9360, type: WidthType.DXA },
        borders: { top: noB, left: noB, right: noB, bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" } },
        shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [] })],
      }),
    ],
  });

const tablaBlancos = (n: number): Table =>
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    borders: { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB },
    rows: Array.from({ length: n }, lineRow),
  });

function fechaDia(d: Date) {
  return `${d.getDate()} del mes de ${MESES_UP[d.getMonth()].toLowerCase()} del año ${d.getFullYear()}`;
}

function sigCell(nombre: string, puesto?: string) {
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
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: puesto ? 40 : 0 },
        children: [r(nombre, true)],
      }),
      ...(puesto
        ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [r(puesto, true)] })]
        : []),
    ],
  });
}

const spacerCell = new TableCell({
  width: { size: 460, type: WidthType.DXA },
  borders: { top: noB, bottom: noB, left: noB, right: noB },
  shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
  children: [new Paragraph({ children: [] })],
});

const spacerRow = new TableRow({
  height: { value: 400, rule: HeightRule.EXACT },
  children: [
    new TableCell({
      columnSpan: 3,
      borders: { top: noB, bottom: noB, left: noB, right: noB },
      shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
      children: [new Paragraph({ children: [] })],
    }),
  ],
});

export async function generarActaDisciplinaria(
  empleado: Empleado,
  acta: ActaAdministrativa,
  opts?: { onlyBlob?: boolean },
): Promise<Blob> {
  const nombre  = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno ?? ""}`.trim().toUpperCase();
  const puesto  = (empleado.puesto ?? "").toUpperCase();
  const area    = (empleado.area ?? "").toUpperCase();
  const fechaActa = new Date(acta.fecha_acta.slice(0, 10) + "T12:00:00");

  // Dos testigos guardados como JSON: ["Testigo 1", "Testigo 2"]
  let testigos: [string, string] = ["", ""];
  try {
    const arr = JSON.parse(acta.testigo_nombre ?? "[]") as string[];
    testigos = [arr[0] ?? "", arr[1] ?? ""];
  } catch { /* usa valores vacíos */ }

  const t1 = testigos[0].toUpperCase();
  const t2 = testigos[1].toUpperCase();

  // Hechos (texto libre)
  const hechosContent: (Paragraph | Table)[] = acta.hechos?.trim()
    ? acta.hechos.trim().split("\n").map((line) => jP([r(line)], 100))
    : [tablaBlancos(10)];

  // Manifestaciones del colaborador — siempre líneas en blanco para llenado manual
  const manifestContent: (Paragraph | Table)[] = [tablaBlancos(6)];

  // Tabla de firmas
  const firmasTable = new Table({
    width: { size: 9360, type: WidthType.DXA },
    borders: { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB },
    rows: [
      // Fila 1: Colaborador | spacer | Jenny
      new TableRow({
        children: [
          sigCell(nombre, puesto || undefined),
          spacerCell,
          sigCell("JENNY NOHEMI RIVERA TORRES", "ELABORÓ / RECURSOS HUMANOS"),
        ],
      }),
      spacerRow,
      // Fila 2: Testigo 1 | spacer | Testigo 2
      new TableRow({
        children: [
          sigCell(t1 || "TESTIGO 1", "TESTIGO"),
          spacerCell,
          sigCell(t2 || "TESTIGO 2", "TESTIGO"),
        ],
      }),
    ],
  });

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: SZ } } } },
    sections: [{
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1440, right: 1440 } } },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
          children: [r("ACTA ADMINISTRATIVA", true)],
        }),

        jP([
          r(`En la Ciudad de Cancún, Municipio de Benito Juárez, Estado de Quintana Roo, siendo las `),
          r(acta.hora_inicio, true),
          r(` horas del día `),
          r(fechaDia(fechaActa), true),
          r(`, en las instalaciones de la empresa `),
          r("SOLUCIONES TAMIVAR, S.A. DE C.V.", true),
          r(`, ubicada en Calle Pustunich, Lote 20, Manzana 52, Región 97, en esta ciudad de Cancún, Benito Juárez, Quintana Roo, se procede a levantar la presente `),
          r("ACTA ADMINISTRATIVA", true),
          r(` en contra del C. `),
          r(nombre, true),
          r(`, quien ocupa el puesto de `),
          r(puesto || "COLABORADOR", true),
          r(`, adscrito al área de `),
          r(area || "_______________", true),
          r(`.`),
        ], 200),

        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 120, after: 120 },
          children: [r("HECHOS:", true)],
        }),

        ...hechosContent,

        new Paragraph({ spacing: { after: 160 }, children: [] }),

        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 120, after: 120 },
          children: [r("MANIFESTACIONES DEL COLABORADOR:", true)],
        }),

        ...manifestContent,

        new Paragraph({ spacing: { after: 80 }, children: [] }),

        jP([
          r("(En caso de negarse a declarar, se asentará la leyenda: "),
          r('"El colaborador se negó a manifestar lo que a su derecho convenga"', true),
          r(")."),
        ], 200),

        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 120, after: 120 },
          children: [r("CONCLUSIÓN:", true)],
        }),

        jP([
          r("Por lo anterior, se hace constar la presente "),
          r("ACTA ADMINISTRATIVA", true),
          r(", la cual se integrará al expediente laboral del colaborador. Siendo las "),
          r(acta.hora_cierre, true),
          r(` horas del día `),
          r(fechaDia(fechaActa), true),
          r("."),
        ], 480),

        firmasTable,
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  if (!opts?.onlyBlob) {
    const url = URL.createObjectURL(blob);
    const a   = Object.assign(document.createElement("a"), {
      href: url,
      download: `Acta_Disciplinaria_${nombre.replace(/\s+/g, "_")}.docx`,
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  return blob;
}
