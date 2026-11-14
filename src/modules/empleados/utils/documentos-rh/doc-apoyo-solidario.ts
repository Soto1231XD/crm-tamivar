import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, UnderlineType,
  FONT, MESES_UP,
  descargar,
} from "./_shared";
import { BorderStyle } from "docx";
import type { Empleado } from "./_shared";
import type { ApoSolidario } from "../../services/apoyos-solidarios.api";

// 12 pt = 24 half-points; interlineado 1.15 = 276 twips
const SZ  = 24;
const LN  = 276;

function montoALetras(val: string | number): string {
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n) || n === 0) return "CERO PESOS 00/100 M.N.";
  const uns  = ["","UNO","DOS","TRES","CUATRO","CINCO","SEIS","SIETE","OCHO","NUEVE",
    "DIEZ","ONCE","DOCE","TRECE","CATORCE","QUINCE","DIECISÉIS","DIECISIETE","DIECIOCHO","DIECINUEVE"];
  const decs = ["","","VEINTE","TREINTA","CUARENTA","CINCUENTA","SESENTA","SETENTA","OCHENTA","NOVENTA"];
  const cens = ["","CIENTO","DOSCIENTOS","TRESCIENTOS","CUATROCIENTOS","QUINIENTOS",
    "SEISCIENTOS","SETECIENTOS","OCHOCIENTOS","NOVECIENTOS"];
  const entero = Math.floor(n);
  const cents  = Math.round((n - entero) * 100);
  function cv(x: number): string {
    if (x === 0) return ""; if (x === 100) return "CIEN";
    if (x < 20) return uns[x];
    if (x < 100) { const d = Math.floor(x/10), u = x%10; return d===2&&u>0?`VEINTI${uns[u]}`:`${decs[d]}${u>0?` Y ${uns[u]}`:""}` ; }
    const c = Math.floor(x/100), r = x%100; return `${cens[c]}${r>0?` ${cv(r)}`:""}`;
  }
  function cm(x: number): string {
    if (x===0) return ""; if (x<1000) return cv(x);
    const m = Math.floor(x/1000), r = x%1000;
    return `${m===1?"MIL":`${cv(m)} MIL`}${r>0?` ${cv(r)}`:""}`;
  }
  const str = entero < 1_000_000 ? cm(entero)
    : `${cm(Math.floor(entero/1_000_000))} MILLÓN${Math.floor(entero/1_000_000)>1?"ES":""} ${cm(entero%1_000_000)}`.trim();
  return `${str} PESOS ${String(cents).padStart(2,"0")}/100 M.N.`;
}

function fmtMXN(val: string | number): string {
  const n = typeof val === "string" ? parseFloat(val) : val;
  return isNaN(n) ? "—" : n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function fechaEs(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const mes = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"][m-1];
  return `${String(d).padStart(2,"0")} de ${mes} de ${y}`;
}
function fechaMay(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${String(d).padStart(2,"0")} DE ${MESES_UP[m-1]} DEL ${y}`;
}

// Helpers de texto
const r  = (text: string, bold = false) =>
  new TextRun({ text, font: FONT, size: SZ, bold });

const ru = (text: string, bold = false) =>
  new TextRun({ text, font: FONT, size: SZ, bold,
    underline: { type: UnderlineType.SINGLE } });

// Párrafo de cuerpo: justificado, sin sangría, interlineado 1.15
const bodyP = (children: TextRun[], after = 200) =>
  new Paragraph({
    alignment: AlignmentType.BOTH,
    spacing: { line: LN, lineRule: "auto", before: 0, after },
    children,
  });

// Párrafo en blanco para separación visual (sin contenido)
const gap = (after = 60) =>
  new Paragraph({ spacing: { before: 0, after }, children: [r("")] });

export async function generarApoSolidario(empleado: Empleado, apoyo: ApoSolidario) {
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno}`.toUpperCase();
  const monto  = parseFloat(apoyo.monto);
  const fmtM   = fmtMXN(monto);
  const letras = montoALetras(monto);

  // Estilo de borde delgado para tabla de firmas
  const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: "000000" };

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

        // ── Cabecera empresa ──────────────────────────────────────────────────
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: LN, lineRule: "auto", before: 0, after: 160 },
          children: [r("SOLUCIONES TAMIVAR, S.A. DE C.V.", true)],
        }),

        // ── Destinatario ──────────────────────────────────────────────────────
        new Paragraph({
          spacing: { line: LN, lineRule: "auto", before: 0, after: 0 },
          children: [r("GERENTE GENERAL Y/O REPRESENTANTE LEGAL Y/O GERENTE DE RECURSOS HUMANOS.", true)],
        }),
        new Paragraph({
          spacing: { line: LN, lineRule: "auto", before: 0, after: 200 },
          children: [r("PRESENTE.", true)],
        }),

        // ── Párrafo 1 ─────────────────────────────────────────────────────────
        bodyP([
          r(`Por medio de la presente, se hace constar que el día ${fechaEs(apoyo.fecha_incidente)}, ` +
            `aproximadamente a las ${apoyo.hora_incidente}, el colaborador `),
          r(nombre, true),
          r("."),
        ]),

        // ── Párrafo 2 — Descripción libre ────────────────────────────────────
        bodyP([r(apoyo.descripcion)]),

        // ── Párrafo 3 — Monto ────────────────────────────────────────────────
        bodyP([
          r("Derivado de la situación presentada y por autorización de Dirección General, se determinó otorgar al colaborador la cantidad de "),
          r(`${fmtM} (${letras})`, true),
          r(", como apoyo solidario por el accidente ocurrido, con la finalidad de contribuir a los gastos derivados de la situación presentada."),
        ]),

        // ── Párrafo 4 — Constancia ───────────────────────────────────────────
        bodyP([r("Se deja constancia de que el apoyo económico antes señalado fue otorgado de manera solidaria y por autorización de Dirección General, derivado de la situación particular del colaborador.")]),

        // ── Cierre ───────────────────────────────────────────────────────────
        bodyP([r("Sin otro particular, se firma la presente para constancia de los hechos y del apoyo otorgado.")], 320),

        // ── Bloque de datos (con línea en blanco entre cada item) ─────────────
        new Paragraph({
          spacing: { line: LN, lineRule: "auto", before: 0, after: 0 },
          children: [r("NÚMERO DE COLABORADOR: ", true), ru(empleado.rfc ?? empleado.curp ?? "—", true)],
        }),
        gap(),
        new Paragraph({
          spacing: { line: LN, lineRule: "auto", before: 0, after: 0 },
          children: [r("DEPARTAMENTO: ", true), ru(empleado.area.toUpperCase(), true)],
        }),
        gap(),
        new Paragraph({
          spacing: { line: LN, lineRule: "auto", before: 0, after: 480 },
          children: [r("FECHA: ", true), ru(fechaMay(apoyo.fecha_incidente), true)],
        }),

        // ── Firmas (tabla con bordes visibles, 2 columnas) ───────────────────
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top:              thinBorder,
            bottom:           thinBorder,
            left:             thinBorder,
            right:            thinBorder,
            insideHorizontal: thinBorder,
            insideVertical:   thinBorder,
          },
          rows: [
            // Fila 1: títulos
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, color: "auto", fill: "FFFFFF" },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 0, after: 0 },
                      children: [r("EL TRABAJADOR", true)],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, color: "auto", fill: "FFFFFF" },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 0, after: 0 },
                      children: [r("RECURSOS HUMANOS", true)],
                    }),
                  ],
                }),
              ],
            }),
            // Fila 2: espacio para firma + nombre RH
            new TableRow({
              height: { value: 800, rule: "atLeast" },
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, color: "auto", fill: "FFFFFF" },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 0, after: 0 },
                      children: [r(nombre, true)],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, color: "auto", fill: "FFFFFF" },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 0, after: 0 },
                      children: [r("JENNY NOHEMI RIVERA TORRES", true)],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }],
  });

  descargar(doc, `Apoyo_Solidario_${nombre.split(" ")[0]}_${apoyo.fecha_incidente.slice(0, 10)}.docx`);
}
