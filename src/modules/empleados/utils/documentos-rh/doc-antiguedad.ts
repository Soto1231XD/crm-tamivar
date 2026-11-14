import {
  Document, Paragraph, TextRun, AlignmentType, UnderlineType, TabStopType,
  FONT, SIZE_BODY, SIZE_TITLE, SIZE_HEAD, MESES_UP,
  run, para, blank, descargar,
  parseLocalDate, calcAntiguedadExacta, formatMonto, montoALetras,
} from "./_shared";
import type { Empleado } from "./_shared";
import { calcularDerechoVacaciones } from "./_shared";

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

        para([run("___________________________________")], AlignmentType.CENTER, 60),
        para([run("HENRY FERNANDO TAMAY SANCHEZ.", { bold: true })], AlignmentType.CENTER, 60),
        para([run("ADMINISTRADOR ÚNICO", { bold: true })], AlignmentType.CENTER, 60),
        para([run("SOLUCIONES TAMIVAR, S.A. DE C.V.", { bold: true })], AlignmentType.CENTER),
      ],
    }],
  });

  await descargar(doc, `Constancia_Antiguedad_${nombre.replace(/ /g, "_")}_${hoy.getFullYear()}.docx`);
}
