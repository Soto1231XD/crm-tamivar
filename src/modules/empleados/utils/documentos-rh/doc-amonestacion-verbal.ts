import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType,
} from "docx";
import { BorderStyle } from "docx";
import type { Empleado } from "../../services/empleados.api";
import type { Amonestacion } from "../../services/amonestaciones.api";
import { MESES_UP, descargar } from "./_shared";

const FONT = "Times New Roman";
const SZ   = 22; // 11 pt en half-points
const SZ_S = 20; // 10 pt

const noB = { style: BorderStyle.NONE, size: 0, color: "auto" };

const r = (text: string, bold = false, size = SZ) =>
  new TextRun({ text, font: FONT, size, bold });

const jP = (children: TextRun[], after = 200) =>
  new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after }, children });

const cP = (children: TextRun[], after = 0) =>
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after }, children });

function fechaDia(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} del mes de ${MESES_UP[m - 1].toLowerCase()} del año ${y}`;
}

const noBorders = { top: noB, left: noB, right: noB, bottom: noB };

function sigCell(label: string, sublabel = ""): TableCell {
  return new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    borders: noBorders,
    shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: "000000" } },
        children: [r(label, true, SZ_S)],
      }),
      ...(sublabel
        ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [r(sublabel, false, SZ_S)] })]
        : []),
    ],
  });
}

function dataCell(content: TextRun[], side: "left" | "right"): TableCell {
  return new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    borders: noBorders,
    shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: side === "left" ? 0 : 60, right: side === "left" ? 60 : 0 },
    children: [new Paragraph({ children: content })],
  });
}

export async function generarAmonestacionVerbal(
  empleado: Empleado,
  amon: Amonestacion,
  opts?: { onlyBlob?: boolean },
): Promise<Blob> {
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno ?? ""}`.trim().toUpperCase();
  const puesto = (empleado.puesto ?? "—").toUpperCase();
  const area   = (empleado.area ?? "—").toUpperCase();
  const fecha  = fechaDia(amon.fecha);
  const motivo = amon.descripcion ?? "conducta inapropiada en el lugar de trabajo";

  const tablaBorders = { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB };

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: FONT, size: SZ } },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1800, right: 1800 },
        },
      },
      children: [

        // ── Encabezado ──────────────────────────────────────────────────────────
        cP([r("SOLUCIONES TAMIVAR, S.A. DE C.V.", true)], 60),
        cP([r("RECURSOS HUMANOS", true)], 300),

        // ── Título ──────────────────────────────────────────────────────────────
        cP([r("CONSTANCIA DE AMONESTACIÓN VERBAL", true, 24)], 400),

        // ── Datos del empleado ───────────────────────────────────────────────────
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tablaBorders,
          rows: [
            new TableRow({
              children: [
                dataCell([r("Nombre: ", true), r(nombre)], "left"),
                dataCell([r("Puesto: ", true), r(puesto)], "right"),
              ],
            }),
            new TableRow({
              children: [
                dataCell([r("Departamento: ", true), r(area)], "left"),
                dataCell([r("Fecha: ", true), r(fecha)], "right"),
              ],
            }),
          ],
        }),
        new Paragraph({ spacing: { after: 300 }, children: [] }),

        // ── Cuerpo ───────────────────────────────────────────────────────────────
        jP([
          r("Por medio de la presente, se hace constar que con fecha "),
          r(fecha, true),
          r(", el área de Recursos Humanos de "),
          r("SOLUCIONES TAMIVAR, S.A. DE C.V.", true),
          r(" realizó una "),
          r("amonestación verbal", true),
          r(" al colaborador "),
          r(nombre, true),
          r(", quien ocupa el puesto de "),
          r(puesto, true),
          r(" en el departamento de "),
          r(area, true),
          r("."),
        ]),

        jP([
          r("Motivo de la amonestación: "),
          r(motivo, true),
          r("."),
        ]),

        jP([
          r("Se le hace saber al colaborador que la presente amonestación queda registrada en su expediente laboral. " +
            "Se le exhorta a corregir la conducta señalada con el fin de mantener un ambiente de trabajo adecuado " +
            "y en cumplimiento con el Reglamento Interior de Trabajo de la empresa."),
        ]),

        jP([
          r("El colaborador manifiesta haber sido informado verbalmente de los motivos de esta amonestación y de las " +
            "consecuencias de reincidir en la misma conducta, pudiendo derivar en una amonestación escrita o en " +
            "medidas disciplinarias más severas conforme a lo establecido en el Reglamento Interior de Trabajo."),
        ], 480),

        // ── Firmas ───────────────────────────────────────────────────────────────
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tablaBorders,
          rows: [
            new TableRow({
              height: { value: 800, rule: "atLeast" as const },
              children: [
                sigCell("EL COLABORADOR", nombre),
                sigCell("RECURSOS HUMANOS", "JENNY NOHEMI RIVERA TORRES"),
              ],
            }),
          ],
        }),
      ],
    }],
  });

  return descargar(
    doc,
    `Amonestacion_Verbal_${nombre.split(" ")[0]}_${amon.fecha.slice(0, 10)}.docx`,
    opts?.onlyBlob,
  );
}
