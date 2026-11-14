import {
  Document, Paragraph, TextRun, AlignmentType, UnderlineType, TabStopType,
  FONT, SIZE_BODY, SIZE_TITLE, SIZE_HEAD, MESES_UP,
  run, para, descargar,
  parseLocalDate, calcAntiguedadExacta, enteroALetras, fechaLarga,
} from "./_shared";
import type { Empleado, Vacacion } from "./_shared";
import { calcularDerechoVacaciones } from "./_shared";

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

  const TAB2 = 5200;
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
