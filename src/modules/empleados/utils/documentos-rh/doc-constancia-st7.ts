import {
  Document, Paragraph, TextRun, AlignmentType, TabStopType,
  FONT, SIZE_BODY, SIZE_TITLE, SIZE_HEAD, MESES_ES,
  run, para, descargar, parseLocalDate,
} from "./_shared";
import type { Empleado } from "./_shared";
import type { Incapacidad } from "../../services/incapacidades.api";

export interface ConstanciaST7Extra {
  fecha_acta: string;
  hora_acta: string;
  hora_incidente: string;
  como_ocurrio: string;
  folio_st7: string;
  argumento_trabajador: string;
}

export async function generarConstanciaST7(
  empleado: Empleado,
  incapacidad: Incapacidad,
  extra: ConstanciaST7Extra,
): Promise<void> {
  const nombre = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno}`.trim().toUpperCase();
  const puesto  = empleado.puesto.toUpperCase();

  const fechaActa   = parseLocalDate(extra.fecha_acta);
  const fechaInicio = parseLocalDate(incapacidad.fecha_inicio.slice(0, 10));

  const diaAct = fechaActa.getDate();
  const mesAct = MESES_ES[fechaActa.getMonth()];
  const añoAct = fechaActa.getFullYear();

  const fechaIncidenteLarga = `${fechaInicio.getDate()} de ${MESES_ES[fechaInicio.getMonth()]} de ${fechaInicio.getFullYear()}`;
  const fechaInicioCorta    = `${String(fechaInicio.getDate()).padStart(2, "0")}/${String(fechaInicio.getMonth() + 1).padStart(2, "0")}/${fechaInicio.getFullYear()}`;

  const TAB_FIRMA = 5400;
  const linea     = "____________________________";

  const clauseP = (_: string, children: TextRun[]) =>
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { line: 276, lineRule: "auto", before: 0, after: 180 },
      children,
    });

  const jP = (children: TextRun[], after = 180) =>
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { line: 276, lineRule: "auto", before: 0, after },
      children,
    });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1080, right: 1440, bottom: 1080, left: 1440 },
        },
      },
      children: [

        // ── Título ───────────────────────────────────────────────────────
        para([run("CONSTANCIA DE HECHOS", { bold: true, size: SIZE_HEAD })], AlignmentType.CENTER, 300),

        // ── Apertura ─────────────────────────────────────────────────────
        jP([
          run("En la ciudad de Cancún, Quintana Roo, siendo las "),
          run(extra.hora_acta, { bold: true }),
          run(" horas del día "),
          run(String(diaAct), { bold: true }),
          run(" de "),
          run(mesAct, { bold: true }),
          run(` de ${añoAct}, en las instalaciones de la empresa `),
          run("SOLUCIONES TAMIVAR S.A. DE C.V.", { bold: true }),
          run(", ubicada en SM 97, Mz. 52, L. 20, Calle Pustunich, Benito Juárez, Quintana Roo, se encuentran reunidos los C.C. "),
          run("Joselin Tamay Sánchez", { bold: true }),
          run(" (Asistente de Gerencia / Representante de la Empresa) y el trabajador "),
          run(nombre, { bold: true }),
          run(", con el propósito de levantar constancia de los siguientes hechos:"),
        ], 240),

        // ── H E C H O S ───────────────────────────────────────────────────
        para([run("H  E  C  H  O  S:", { bold: true, size: SIZE_TITLE })], AlignmentType.CENTER, 200),

        clauseP("PRIMERO", [
          run("PRIMERO: ", { bold: true }),
          run("El trabajador "),
          run(nombre, { bold: true }),
          run(" sufrió un incidente el día "),
          run(fechaIncidenteLarga, { bold: true }),
          run(` aproximadamente a las `),
          run(extra.hora_incidente, { bold: true }),
          run(` horas, ${extra.como_ocurrio}.`),
        ]),

        clauseP("SEGUNDO", [
          run("SEGUNDO: ", { bold: true }),
          run("Derivado de lo anterior, la empresa le brindó el apoyo inmediato para su traslado a los servicios médicos del "),
          run("Instituto Mexicano del Seguro Social (IMSS)", { bold: true }),
          run(", sitio donde se le otorgó un certificado de incapacidad temporal para el trabajo por "),
          run(`${incapacidad.dias} días`, { bold: true }),
          run(` (con fecha de inicio `),
          run(fechaInicioCorta, { bold: true }),
          run(`, folio `),
          run(extra.folio_st7, { bold: true }),
          run("), así como el formato "),
          run("ST-7", { bold: true }),
          run(" (Aviso de Atención Médica Inicial y Calificación de Probable Accidente de Trabajo)."),
        ]),

        clauseP("TERCERO", [
          run("TERCERO: ", { bold: true }),
          run("La empresa "),
          run("SOLUCIONES TAMIVAR S.A. DE C.V.", { bold: true }),
          run(" cumplió en tiempo y forma con el llenado de su apartado correspondiente ("),
          run("Datos Complementarios para la Calificación de Probable Accidente de Trabajo", { bold: true }),
          run(") en el formato ST-7 y le otorgó al trabajador las facilidades de tiempo necesarias para acudir a la Unidad de Medicina Familiar (UMF) correspondiente a realizar el trámite de entrega y dictaminación en el plazo establecido por la ley (72 horas)."),
        ]),

        clauseP("CUARTO", [
          run("CUARTO: ", { bold: true }),
          run("El trabajador manifiesta libremente su negativa y omisión para acudir a entregar el documento físico a la clínica del IMSS bajo el argumento personal de \""),
          run(extra.argumento_trabajador, { bold: true }),
          run("\", desatendiendo la obligación normativa de dar continuidad a su trámite de riesgo de trabajo."),
        ]),

        // ── C O N C L U S I Ó N ──────────────────────────────────────────
        para([run("C  O  N  C  L  U  S  I  Ó  N:", { bold: true, size: SIZE_TITLE })], AlignmentType.CENTER, 200),

        jP([
          run("Se levanta la presente constancia para los efectos legales y administrativos a que haya lugar, dejando asentado que la demora u omisión en la entrega del formato ST-7 ante el IMSS es única y exclusivamente imputable al "),
          run("trabajador", { bold: true }),
          run(", deslindando a la empresa "),
          run("Soluciones Tamivar S.A. de C.V.", { bold: true }),
          run(" de cualquier sanción, multa o perjuicio derivado de la falta de presentación del trámite en mención."),
        ], 240),

        jP([run("Leída que fue la presente acta y enterados de su contenido, firman de conformidad las partes que en ella intervinieron.")], 400),

        // ── Firmas ───────────────────────────────────────────────────────
        para([run("POR LA EMPRESA", { bold: true })], AlignmentType.LEFT, 400),

        // Líneas firma
        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: TAB_FIRMA }],
          spacing: { after: 60 },
          children: [
            new TextRun({ text: linea, font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: linea, font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: TAB_FIRMA }],
          spacing: { after: 20 },
          children: [
            new TextRun({ text: "Jenny Nohemi Rivera Torres", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: nombre, font: FONT, size: SIZE_BODY }),
          ],
        }),
        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: TAB_FIRMA }],
          spacing: { after: 400 },
          children: [
            new TextRun({ text: "Encargada de RRHH", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: "\t", font: FONT, size: SIZE_BODY }),
            new TextRun({ text: puesto, font: FONT, size: SIZE_BODY }),
          ],
        }),

        // Segunda firma empresa — centrada y más abajo
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 640, after: 60 },
          children: [new TextRun({ text: linea, font: FONT, size: SIZE_BODY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 20 },
          children: [new TextRun({ text: "Joselin Tamay Sánchez", font: FONT, size: SIZE_BODY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
          children: [new TextRun({ text: "Asistente de Gerencia", font: FONT, size: SIZE_BODY })],
        }),

      ],
    }],
  });

  await descargar(
    doc,
    `Constancia_ST7_${nombre.replace(/ /g, "_")}_${extra.fecha_acta}.docx`,
  );
}
