import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  UnderlineType,
  TabStopType,
} from "docx";
import type { Empleado } from "../services/empleados.api";
import type { Vacacion } from "../services/vacaciones.api";
import { calcularDerechoVacaciones } from "../services/vacaciones.api";

// ── Constantes ────────────────────────────────────────────────────────────────

const FONT = "Arial";
const SIZE_BODY = 20;   // 10pt
const SIZE_TITLE = 22;  // 11pt
const SIZE_HEAD = 24;   // 12pt

const MESES_ES = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre",
];
const MESES_UP = MESES_ES.map((m) => m.toUpperCase());

// ── Helpers de texto ──────────────────────────────────────────────────────────

function fechaLarga(d: Date): string {
  return `${d.getDate()} DE ${MESES_UP[d.getMonth()]} DEL ${d.getFullYear()}`;
}

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function calcAntiguedadExacta(fechaIngreso: string) {
  const ing = parseLocalDate(fechaIngreso);
  const hoy = new Date();
  let años  = hoy.getFullYear() - ing.getFullYear();
  let meses = hoy.getMonth()    - ing.getMonth();
  let dias  = hoy.getDate()     - ing.getDate();
  if (dias < 0)  { meses--; dias  += new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate(); }
  if (meses < 0) { años--;  meses += 12; }
  return { años: Math.max(0, años), meses: Math.max(0, meses), dias: Math.max(0, dias) };
}

function enteroALetras(n: number): string {
  if (n === 0) return "CERO";
  const uns  = ["","UNO","DOS","TRES","CUATRO","CINCO","SEIS","SIETE","OCHO","NUEVE"];
  const spec = ["DIEZ","ONCE","DOCE","TRECE","CATORCE","QUINCE",
                "DIECISÉIS","DIECISIETE","DIECIOCHO","DIECINUEVE"];
  const decs = ["","","VEINTE","TREINTA","CUARENTA","CINCUENTA",
                "SESENTA","SETENTA","OCHENTA","NOVENTA"];
  const cents = ["","CIENTO","DOSCIENTOS","TRESCIENTOS","CUATROCIENTOS","QUINIENTOS",
                 "SEISCIENTOS","SETECIENTOS","OCHOCIENTOS","NOVECIENTOS"];
  if (n < 10)  return uns[n];
  if (n < 20)  return spec[n - 10];
  if (n === 20) return "VEINTE";
  if (n < 30)  return "VEINTI" + uns[n - 20].toLowerCase();
  if (n < 100) { const d = Math.floor(n/10), u = n%10; return decs[d] + (u ? " Y " + uns[u] : ""); }
  if (n === 100) return "CIEN";
  if (n < 1000) { const c = Math.floor(n/100), r = n%100; return cents[c] + (r ? " " + enteroALetras(r) : ""); }
  if (n < 2000) return "MIL" + (n%1000 ? " " + enteroALetras(n%1000) : "");
  const miles = Math.floor(n/1000), r = n%1000;
  return enteroALetras(miles) + " MIL" + (r ? " " + enteroALetras(r) : "");
}

function montoALetras(monto: number): string {
  const entero = Math.floor(monto);
  const centavos = Math.round((monto - entero) * 100);
  return `${enteroALetras(entero)} PESOS ${String(centavos).padStart(2,"0")}/100 M.N.`;
}

function formatMonto(n: number) {
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ── Helpers de docx ───────────────────────────────────────────────────────────

function run(text: string, opts: { bold?: boolean; under?: boolean; size?: number } = {}): TextRun {
  return new TextRun({
    text,
    font: FONT,
    size: opts.size ?? SIZE_BODY,
    bold: opts.bold,
    underline: opts.under ? { type: UnderlineType.SINGLE } : undefined,
  });
}

function para(
  children: TextRun[],
  align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.JUSTIFIED,
  after = 120,
): Paragraph {
  return new Paragraph({ alignment: align, spacing: { after }, children });
}

const blank = () => new Paragraph({ spacing: { after: 160 } });

async function descargar(doc: Document, nombre: string) {
  const blob = await Packer.toBlob(doc);
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: nombre });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── 1. CONSTANCIA ANUAL DE ANTIGÜEDAD ────────────────────────────────────────

export async function generarConstanciaAnual(empleado: Empleado): Promise<void> {
  const hoy   = new Date();
  const ing   = parseLocalDate(empleado.fecha_ingreso);
  const { años, meses, dias } = calcAntiguedadExacta(empleado.fecha_ingreso);
  const diasVac = calcularDerechoVacaciones(años);
  const salDiario = parseFloat(empleado.sueldo) / 30;
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno}`.trim().toUpperCase();

  const doc = new Document({
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children: [
        para([run("SOLUCIONES TAMIVAR, S.A. DE C.V.", { bold: true, size: SIZE_HEAD })], AlignmentType.CENTER, 60),
        para([run("RECURSOS HUMANOS", { bold: true })], AlignmentType.CENTER, 300),

        para([run("CONSTANCIA ANUAL DE ANTIGÜEDAD Y PERIODO VACACIONAL ESTIMADO:", { bold: true, under: true, size: SIZE_TITLE })], AlignmentType.CENTER, 60),

        para([
          run("NOMBRE: ", { bold: true }),
          run(nombre, { under: true }),
          run("          NÚMERO DE COLABORADOR: ", { bold: true }),
          run(String(empleado.id), { under: true }),
        ], AlignmentType.LEFT, 280),

        para([run("PRESENTE.", { bold: true })], AlignmentType.LEFT, 280),

        para([
          run("Por medio de la presente, con fundamento en lo dispuesto por el artículo "),
          run("78 y 81", { bold: true }),
          run(" de la Ley Federal del Trabajo, se extiende la presente "),
          run("CONSTANCIA ANUAL DE ANTIGÜEDAD", { bold: true }),
          run(" y "),
          run("PERIODO VACACIONAL CORRESPONDIENTE", { bold: true }),
          run(", por lo que considerando que su fecha de ingreso a la empresa "),
          run("SOLUCIONES TAMIVAR, SOCIEDAD ANÓNIMA DE CAPITAL VARIABLE", { bold: true }),
          run(", lo fue el día "),
          run(String(ing.getDate()), { bold: true, under: true }),
          run(", del mes de "),
          run(MESES_UP[ing.getMonth()], { bold: true, under: true }),
          run(", del año "),
          run(String(ing.getFullYear()), { bold: true, under: true }),
          run(", su antigüedad a la fecha de expedición de la presente constancia es de "),
          run(`${años} AÑOS, ${meses} MESES, CON ${dias} DÍAS`, { bold: true, under: true }),
          run("."),
        ], AlignmentType.JUSTIFIED, 200),

        para([
          run("Así mismo, atendiendo al periodo de antigüedad señalado anteriormente, el periodo de vacaciones que le corresponde para disfrutar es de "),
          run(`${diasVac} DÍAS`, { bold: true, under: true }),
          run("."),
        ], AlignmentType.JUSTIFIED, 200),

        para([
          run("Este periodo quedará sujeto a la reducción de los días que anticipadamente hubiere disfrutado de su periodo vacacional y que se acredite mediante constancias."),
        ], AlignmentType.JUSTIFIED, 200),

        para([
          run("Por último, le manifestamos que su salario diario actual es de "),
          run(`MXN $${formatMonto(salDiario)} (${montoALetras(salDiario)})`, { bold: true, under: true }),
        ], AlignmentType.JUSTIFIED, 200),

        para([
          run("Se extiende la presente constancia por duplicado para los efectos legales más amplios que en derecho procedan."),
        ], AlignmentType.JUSTIFIED, 400),

        para([
          run("En la Ciudad de Cancún, Estado de Quintana Roo, a los "),
          run(String(hoy.getDate()), { bold: true }),
          run(" días, del mes de "),
          run(MESES_UP[hoy.getMonth()], { bold: true }),
          run(`, del año ${hoy.getFullYear()}.`),
        ], AlignmentType.LEFT, 600),

        // ── Firmas laterales (sin tabla, con tab stops) ───────────────────
        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: 4860 }],
          spacing: { after: 60 },
          children: [
            new TextRun({ text: '"EL TRABAJADOR"', bold: true, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "Auxiliar de Recursos Humanos", bold: true, font: FONT, size: SIZE_BODY }),
          ],
        }),

        new Paragraph({ spacing: { after: 900 } }),

        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: 4860 }],
          spacing: { after: 400 },
          children: [
            new TextRun({ text: `C. ${nombre}`, underline: { type: UnderlineType.SINGLE }, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "C. ____________________________", font: FONT, size: SIZE_BODY }),
          ],
        }),

        blank(),
        blank(),

        // ── Firma del administrador ───────────────────────────────────────
        para([run("___________________________________")], AlignmentType.CENTER, 60),
        para([run("HENRY FERNANDO TAMAY SANCHEZ.", { bold: true })], AlignmentType.CENTER, 60),
        para([run("ADMINISTRADOR ÚNICO", { bold: true })], AlignmentType.CENTER, 60),
        para([run("SOLUCIONES TAMIVAR, S.A. DE C.V.", { bold: true })], AlignmentType.CENTER),
      ],
    }],
  });

  await descargar(doc, `Constancia_Antiguedad_${nombre.replace(/ /g, "_")}_${hoy.getFullYear()}.docx`);
}

// ── 2 & 3. SOLICITUD DE VACACIONES ───────────────────────────────────────────

export async function generarSolicitudVacaciones(
  empleado: Empleado,
  vacacion: Vacacion,
  todasVacaciones: Vacacion[],
  adelanto = false,
): Promise<void> {
  const hoy    = new Date();
  const ing    = parseLocalDate(empleado.fecha_ingreso);
  const inicio = parseLocalDate(vacacion.fecha_inicio);
  const fin    = parseLocalDate(vacacion.fecha_fin);
  const regreso = new Date(fin); regreso.setDate(regreso.getDate() + 1);

  const { años } = calcAntiguedadExacta(empleado.fecha_ingreso);
  const diasCorresponden = calcularDerechoVacaciones(Math.max(años, 1));

  const diasAcum = todasVacaciones
    .filter((v) => parseLocalDate(v.fecha_inicio) <= inicio)
    .reduce((s, v) => s + v.dias, 0);
  const diasPendientes = Math.max(0, diasCorresponden - diasAcum);

  let n = inicio.getFullYear() - ing.getFullYear();
  if (inicio < new Date(inicio.getFullYear(), ing.getMonth(), ing.getDate())) n--;
  const pInicio = new Date(ing.getFullYear() + n,     ing.getMonth(), ing.getDate());
  const pFin    = new Date(ing.getFullYear() + n + 1, ing.getMonth(), ing.getDate() - 1);

  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno}`.trim().toUpperCase();
  const titulo = adelanto
    ? "SOLICITUD DE ADELANTO Y AUTORIZACIÓN DE VACACIONES"
    : "SOLICITUD Y AUTORIZACIÓN DE VACACIONES";

  // Tab stop al 55% de la página para filas de dos columnas
  const TAB2 = 5200;
  // Tab stop para firmas (mitad derecha)
  const TAB_FIRMA = 4860;

  const row2 = (
    label1: string, val1: string,
    label2: string, val2: string,
    after = 100,
  ) => new Paragraph({
    tabStops: [{ type: TabStopType.LEFT, position: TAB2 }],
    spacing: { after },
    children: [
      new TextRun({ text: label1, bold: true, font: FONT, size: SIZE_BODY }),
      new TextRun({ text: val1, underline: { type: UnderlineType.SINGLE }, font: FONT, size: SIZE_BODY }),
      new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
      new TextRun({ text: label2, bold: true, font: FONT, size: SIZE_BODY }),
      new TextRun({ text: val2, underline: { type: UnderlineType.SINGLE }, font: FONT, size: SIZE_BODY }),
    ],
  });

  const doc = new Document({
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children: [
        para([run("SOLUCIONES TAMIVAR, S.A. DE C.V", { bold: true, size: SIZE_HEAD })], AlignmentType.CENTER, 60),
        para([run(titulo, { bold: true, under: true, size: SIZE_TITLE })], AlignmentType.CENTER, 400),

        para([run("NOMBRE DEL EMPLEADO:   ", { bold: true }), run(nombre, { under: true })], AlignmentType.LEFT, 100),
        para([run("PUESTO DE TRABAJO:   ", { bold: true }), run(empleado.puesto.toUpperCase(), { under: true })], AlignmentType.LEFT, 120),

        row2(
          "FECHA DE INGRESO:   ", fechaLarga(ing),
          "AÑOS DE SERVICIO:   ", `${años} (${enteroALetras(años)})`,
        ),
        row2(
          "DÍAS QUE CORRESPONDEN:   ", `${diasCorresponden} (${enteroALetras(diasCorresponden)} DÍAS)`,
          "DÍAS A DISFRUTAR:   ", `${vacacion.dias} (${enteroALetras(vacacion.dias)} DÍAS)`,
          120,
        ),

        para([
          run("PERIODO A DISFRUTAR DEL AÑO:   ", { bold: true }),
          run(fechaLarga(pInicio), { under: true }),
          run("   AL   ", { bold: true }),
          run(fechaLarga(pFin), { under: true }),
        ], AlignmentType.LEFT, 100),

        para([run("DEL:   ", { bold: true }), run(fechaLarga(inicio), { under: true })], AlignmentType.LEFT, 100),
        para([run("AL:   ",  { bold: true }), run(fechaLarga(fin),    { under: true })], AlignmentType.LEFT, 100),

        para([
          run("FECHA EN LA QUE DEBERÁ PRESENTARSE A LABORAR:   ", { bold: true }),
          run(fechaLarga(regreso), { under: true }),
        ], AlignmentType.LEFT, 100),

        para([
          run("DÍAS PENDIENTES DE VACACIONES:   ", { bold: true }),
          run(`${diasPendientes} DÍAS`, { under: true }),
        ], AlignmentType.LEFT, 300),

        para([
          run("OBSERVACIONES: ", { bold: true }),
          run("POR MEDIO DE LA PRESENTE EXPRESO MI CONFORMIDAD DE SOLICITAR Y GOZAR MIS VACACIONES DE ACUERDO A LO QUE ESTABLECE EL ARTÍCULO 78 DE LA LEY FEDERAL DEL TRABAJO."),
        ], AlignmentType.JUSTIFIED, 420),

        para([
          run("CANCÚN, QUINTANA ROO A LOS "),
          run(String(hoy.getDate()), { bold: true }),
          run(" DÍAS DEL MES DE "),
          run(MESES_UP[hoy.getMonth()], { bold: true }),
          run(` DEL AÑO ${hoy.getFullYear()}.`),
        ], AlignmentType.LEFT, 600),

        // ── Firmas (tab stops) ────────────────────────────────────────────
        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: TAB_FIRMA }],
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "____________________________", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "______________________________________", font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: TAB_FIRMA }],
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "FIRMA DE CONFORMIDAD DEL EMPLEADO", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "HENRY FERNANDO TAMAY SANCHEZ", bold: true, font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: TAB_FIRMA }],
          spacing: { after: 0 },
          children: [
            new TextRun({ text: "", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "GERENTE DE OPERACIONES", bold: true, font: FONT, size: SIZE_BODY }),
          ],
        }),
      ],
    }],
  });

  const prefix = adelanto ? "Adelanto_Vacaciones" : "Solicitud_Vacaciones";
  await descargar(doc, `${prefix}_${nombre.replace(/ /g, "_")}_${vacacion.fecha_inicio}.docx`);
}
