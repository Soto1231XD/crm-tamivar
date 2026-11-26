import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, HeightRule,
} from "docx";
import { BorderStyle } from "docx";
import type { Empleado } from "../../services/empleados.api";
import type { ActaAdministrativa } from "../../services/actas-administrativas.api";
import { MESES_UP } from "./_shared";

const FONT = "Times New Roman";
const SZ   = 22; // 11pt en half-points
const noB  = { style: BorderStyle.NONE, size: 0, color: "auto" };
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
        borders: {
          top:    noB,
          left:   noB,
          right:  noB,
          bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
        },
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

function sigCell(top: string, bottom: string) {
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
        spacing: { after: 0 },
        children: [r(bottom, true)],
      }),
    ],
  });
}

export async function generarActaAdministrativa(
  empleado: Empleado,
  acta: ActaAdministrativa,
  opts?: { onlyBlob?: boolean },
): Promise<Blob> {
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno ?? ""}`.trim().toUpperCase();
  const fechaActa   = new Date(acta.fecha_acta.slice(0, 10) + "T12:00:00");
  const fechaHechos = new Date((acta.fecha_hechos ?? acta.fecha_acta).slice(0, 10) + "T12:00:00");

  const claveIneEmp  = acta.empleado_clave_ine  ?? "___________________________";
  const claveIneTes  = acta.testigo_clave_ine    ?? "___________________________";
  const testigo      = (acta.testigo_nombre ?? "").toUpperCase();
  const puesto       = (empleado.puesto ?? "").toUpperCase();

  // Contenido de hechos
  const hechosContent: (Paragraph | Table)[] = acta.hechos?.trim()
    ? acta.hechos.trim().split("\n").map((line) => jP([r(line)], 100))
    : [tablaBlancos(12)];

  // Contenido de declaración testigo
  const declaracionContent: (Paragraph | Table)[] = acta.declaracion_testigo?.trim()
    ? acta.declaracion_testigo.trim().split("\n").map((line) => jP([r(line)], 100))
    : [tablaBlancos(8)];

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: FONT, size: SZ } },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1080, bottom: 1080, left: 1440, right: 1440 },
        },
      },
      children: [
        // ── Título ────────────────────────────────────────────────────────────
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
          children: [r("ACTA ADMINISTRATIVA DE HECHOS", true)],
        }),

        // ── Párrafo de apertura ───────────────────────────────────────────────
        jP([
          r(`En la Ciudad de Cancún, Municipio de Benito Juárez, Estado de Quintana Roo, siendo las `),
          r(acta.hora_inicio, true),
          r(` horas del día `),
          r(fechaDia(fechaActa), true),
          r(`, en las instalaciones del centro de trabajo de la empresa `),
          r("SOLUCIONES TAMIVAR, S.A. DE C.V.", true),
          r(`, ubicado en la `),
          r("CALLE PUSTUNICH, LOTE 20, MANZANA 52, REGION 97, EN ESTA CIUDAD DE CANCÚN, BENITO JUÁREZ, QUINTANA ROO", true),
          r(`, se encuentran reunidos para el levantamiento de la presente acta administrativa de hechos ocurridos el día `),
          r(fechaDia(fechaHechos), true),
          r(`, por el C. `),
          r(nombre, true),
          r(` en su calidad de colaborador adscrito al puesto de `),
          r(puesto, true),
          r(` de la empresa, quien se identifica con su Credencial para Votar debidamente expedida por el Instituto Nacional Electoral (INE) con Clave de Elector alfanumérica `),
          r(claveIneEmp, true),
          r(`, misma que se agrega en copia simple a la presente acta debidamente firmada por el colaborador como `),
          r("ANEXO 1.", true),
        ], 160),

        // ── Identificación ────────────────────────────────────────────────────
        jP([
          r("Identificado que fue el colaborador"),
          r(`, se procede a hacer constar la presencia de los siguientes asistentes:`),
        ], 160),

        // ── Testigo ───────────────────────────────────────────────────────────
        jP([
          r("C. "),
          r(testigo, true),
          r(`, colaborador de la empresa `),
          r("SOLUCIONES TAMIVAR, S.A. DE C.V.", true),
          r(`, en su calidad de `),
          r("TESTIGO", true),
          r(`, quien se identifica con su Credencial para Votar debidamente expedida por el Instituto Nacional Electoral (INE) con Clave de Elector alfanumérica `),
          r(claveIneTes, true),
          r(`, misma que se agrega en copia simple a la presente acta debidamente firmada por el colaborador como `),
          r("ANEXO 2.", true),
        ], 160),

        // ── Auxiliar RH ───────────────────────────────────────────────────────
        jP([
          r("C. "),
          r("JENNY NOHEMI RIVERA TORRES", true),
          r(`, colaborador de la empresa `),
          r("SOLUCIONES TAMIVAR, S.A. DE C.V.", true),
          r(`, en su calidad de `),
          r("AUXILIAR DE RECURSOS HUMANOS", true),
          r(`, quien se identifica con su Credencial para Votar debidamente expedida por el Instituto Nacional Electoral (INE) con Clave de Elector alfanumérica `),
          r("RITJ89022709M900", true),
          r(`, misma que se agrega en copia simple a la presente acta debidamente firmada por el colaborador como `),
          r("ANEXO 3.", true),
        ], 160),

        // ── Gerente Operaciones ───────────────────────────────────────────────
        jP([
          r("C. "),
          r("HENRY FERNANDO TAMAY SANCHEZ", true),
          r(`, `),
          r("GERENTE DE OPERACIONES", true),
          r(` de la empresa `),
          r("SOLUCIONES TAMIVAR, S.A. DE C.V.", true),
          r(`, quien se identifica con su Credencial para Votar debidamente expedida por el Instituto Nacional Electoral (INE) con Clave de Elector alfanumérica `),
          r("TMSNHN96052323H400", true),
          r(`, misma que se agrega en copia simple a la presente acta debidamente firmada por el colaborador como `),
          r("ANEXO 4.", true),
        ], 200),

        // ── Intro hechos ──────────────────────────────────────────────────────
        jP([
          r("Identificada la parte contra quien se levanta la presente acta para hacer constar que dentro del centro laboral antes citado se suscitaron los hechos que a continuación se relatan y que de conformidad a la legislación laboral vigente pueden ser considerados como faltas susceptibles de ser sancionadas, se procede con el relato de los "),
          r("HECHOS", true),
          r(` por parte del colaborador C. `),
          r(nombre, true),
          r(`, a lo que manifiesta que:`),
        ], 120),

        // ── Hechos ────────────────────────────────────────────────────────────
        ...hechosContent,

        // ── Lectura testigo ───────────────────────────────────────────────────
        jP([
          r("Siendo todo lo que se desea manifestar, se procede a su lectura en voz alta por parte del "),
          r("TESTIGO", true),
          r(" que interviene en la presente acta. Seguidamente se hace constar la declaración del testigo interviniente, a lo que manifiesta:"),
        ], 120),

        // ── Declaración testigo ───────────────────────────────────────────────
        ...declaracionContent,

        // ── Cierre legal ──────────────────────────────────────────────────────
        jP([
          r("Acto continuo, se procede a la lectura en voz alta de todo lo acontecido en la presente "),
          r("ACTA ADMINISTRATIVA DE HECHOS", true),
          r(", para todos los efectos legales a los que haya lugar. "),
          r("DEBIDAMENTE ENTERADAS LAS PARTES INTERVINIENTES DE LOS HECHOS SUSCITADOS EN LA FECHA Y HORA SEÑALADAS, SE CONCLUYE LA PRESENTE ACTA ADMINISTRATIVA SIN HABER MEDIADO ERROR, DOLO, MALA FE, VIOLENCIA O CUALQUIER OTRO VICIO DE LA VOLUNTAD QUE PUDIERA AFECTAR LA CONSTANCIA Y VALIDEZ DE LA PRESENTE ACTA", true),
          r(`, SIENDO LAS `),
          r(acta.hora_cierre, true),
          r(` HORAS DEL DÍA `),
          r(fechaDia(fechaActa).toUpperCase(), true),
          r("."),
        ], 400),

        // ── Firmas ────────────────────────────────────────────────────────────
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          rows: [
            new TableRow({
              children: [
                sigCell("C. " + nombre, nombre),
                new TableCell({
                  width: { size: 460, type: WidthType.DXA },
                  borders: { top: noB, bottom: noB, left: noB, right: noB },
                  shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                  children: [new Paragraph({ children: [] })],
                }),
                sigCell("C. " + testigo, "TESTIGO"),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  columnSpan: 3,
                  borders: { top: noB, bottom: noB, left: noB, right: noB },
                  shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                  children: [new Paragraph({ spacing: { after: 0 }, children: [] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                sigCell("JENNY NOHEMI RIVERA TORRES", "GERENTE DE RECURSOS HUMANOS"),
                new TableCell({
                  width: { size: 460, type: WidthType.DXA },
                  borders: { top: noB, bottom: noB, left: noB, right: noB },
                  shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                  children: [new Paragraph({ children: [] })],
                }),
                sigCell("HENRY FERNANDO TAMAY SANCHEZ", "GERENTE DE OPERACIONES"),
              ],
            }),
          ],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  if (!opts?.onlyBlob) {
    const url = URL.createObjectURL(blob);
    const a   = Object.assign(document.createElement("a"), {
      href: url,
      download: `Acta_Administrativa_${nombre.replace(/\s+/g, "_")}.docx`,
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  return blob;
}
